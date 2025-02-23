from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import requests
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.db.session import get_db

security = HTTPBearer()

# Cache the JWKS
_jwks = None

def get_jwks():
    global _jwks
    if not _jwks:
        jwks_url = f"https://{settings.CLERK_FRONTEND_API}.clerk.accounts.dev/.well-known/jwks.json"
        response = requests.get(jwks_url)
        _jwks = response.json()
    return _jwks

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that validates the Clerk JWT token and returns the current user.
    If the user doesn't exist in the database, it creates a new user record.
    """
    try:
        token = credentials.credentials
        # Get the key ID from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header["kid"]
        
        # Find the matching public key from JWKS
        jwks = get_jwks()
        key = None
        for jwk in jwks["keys"]:
            if jwk["kid"] == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                break
        
        if not key:
            raise HTTPException(status_code=401, detail="Invalid token: Key not found")
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=settings.CLERK_FRONTEND_API,
            options={"verify_exp": True}
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

def get_or_create_user(
    db: Session,
    clerk_id: str,
    email: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None
) -> User:
    """
    Get an existing user or create a new one based on Clerk user data
    """
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    
    if not user:
        user = User(
            clerk_id=clerk_id,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info if it has changed
        update_fields = {}
        if email != user.email:
            update_fields["email"] = email
        if first_name and first_name != user.first_name:
            update_fields["first_name"] = first_name
        if last_name and last_name != user.last_name:
            update_fields["last_name"] = last_name
            
        if update_fields:
            for key, value in update_fields.items():
                setattr(user, key, value)
            db.commit()
            db.refresh(user)
    
    return user 