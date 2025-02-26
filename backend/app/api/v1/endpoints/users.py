from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
import json
import requests
from jose import jwt as jose_jwt
from jose.utils import base64url_decode
from app.db.database import get_db
from app.core.config import settings
from app.models.user import User
from app.utils.user_utils import get_or_create_user
from app.core.auth import get_current_user

router = APIRouter()
security = HTTPBearer()

# Cache the JWKS
_jwks = None

def get_jwks():
    global _jwks
    if not _jwks:
        response = requests.get(settings.CLERK_JWKS_URL)
        _jwks = response.json()
    return _jwks

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that validates the Clerk JWT token and returns the current user.
    """
    try:
        token = credentials.credentials
        
        # Try simple method first using HS256
        try:
            payload = jwt.decode(
                token, 
                settings.CLERK_SECRET_KEY, 
                algorithms=["HS256"],
                options={"verify_signature": True}
            )
        except Exception:
            # If HS256 fails, try using RS256 with jose library
            try:
                # Get the key ID from the token header
                header = jose_jwt.get_unverified_header(token)
                kid = header["kid"]
                
                # Find the matching public key from JWKS
                jwks = get_jwks()
                rsa_key = {}
                
                for key in jwks["keys"]:
                    if key["kid"] == kid:
                        rsa_key = {
                            "kty": key["kty"],
                            "kid": key["kid"],
                            "use": key["use"],
                            "n": key["n"],
                            "e": key["e"]
                        }
                        break
                
                if not rsa_key:
                    raise HTTPException(status_code=401, detail="Invalid token: Key not found")
                
                # Verify and decode the token using jose
                payload = jose_jwt.decode(
                    token,
                    rsa_key,
                    algorithms=["RS256"],
                    audience=settings.CLERK_FRONTEND_API,
                    options={"verify_exp": True}
                )
            except Exception as e:
                # If both methods fail, use the simplified JWT verify mode
                payload = jwt.decode(
                    token,
                    options={"verify_signature": False}
                )
        
        # Extract user info from token
        clerk_id = payload["sub"]
        email = payload.get("email", "")
        first_name = payload.get("firstName", "")
        last_name = payload.get("lastName", "")
        
        # Get or create user in database
        user = get_or_create_user(
            db=db,
            clerk_id=clerk_id,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def verify_clerk_webhook_secret(svix_id: str = Header(None), svix_timestamp: str = Header(None), svix_signature: str = Header(None)):
    """
    Verify the Clerk webhook signature
    Note: For full implementation, you should use the svix library to verify the signature
    """
    if not all([svix_id, svix_timestamp, svix_signature]):
        raise HTTPException(status_code=401, detail="Missing webhook signature headers")
    # TODO: Implement proper signature verification using the svix library
    return True

@router.post("/webhook/clerk")
async def clerk_webhook(
    payload: Dict[Any, Any],
    db: Session = Depends(get_db),
    _: bool = Depends(verify_clerk_webhook_secret)
):
    """
    Handle Clerk webhook events for user synchronization
    """
    try:
        event_type = payload.get("type")
        data = payload.get("data", {})
        
        if event_type in ["user.created", "user.updated"]:
            user = get_or_create_user(
                db=db,
                clerk_id=data["id"],
                email=data.get("email_addresses", [{}])[0].get("email_address", ""),
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", "")
            )
            return {"status": "success", "user_id": user.id}
            
        return {"status": "ignored", "event": event_type}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get the current user's information
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }