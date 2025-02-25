from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import InvalidTokenError, ExpiredSignatureError, PyJWTError  # Update imports
import jwt
import requests
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.db.database import get_db  # Changed from session to database
from app.utils.user_utils import get_or_create_user
import os
from dotenv import load_dotenv
# from backend.app.core.auth import get_or_create_user

security = HTTPBearer()

# Cache the JWKS
_jwks = None

def get_jwks():
    global _jwks
    if not _jwks:
        response = requests.get(settings.CLERK_JWKS_URL)  # Use settings instead of env var
        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch JWKS: {response.status_code}"
            )
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
        
        # Update token verification with correct audience handling
        payload = jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
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
        
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except (InvalidTokenError, PyJWTError) as e:
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