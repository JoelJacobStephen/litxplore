from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as PyJWT  # Changed from import PyJWT to import jwt as PyJWT
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError, PyJWTError  # Updated import path
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
    import logging
    logger = logging.getLogger(__name__)
    
    # Check if credentials are provided
    if not credentials:
        logger.error("No authentication credentials provided")
        raise HTTPException(status_code=401, detail="No authentication credentials provided")
    
    try:
        token = credentials.credentials
        logger.debug(f"Processing authentication token (first 10 chars): {token[:10]}...")
        
        # Get the key ID from the token header
        try:
            unverified_header = PyJWT.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                logger.error("Token header missing 'kid' field")
                raise HTTPException(status_code=401, detail="Invalid token format: Missing 'kid' field")
        except Exception as header_error:
            logger.error(f"Failed to parse token header: {str(header_error)}")
            raise HTTPException(status_code=401, detail=f"Invalid token header: {str(header_error)}")
        
        # Find the matching public key from JWKS
        try:
            jwks = get_jwks()
            logger.debug(f"JWKS retrieved with {len(jwks.get('keys', []))} keys")
            
            key = None
            for jwk in jwks.get("keys", []):
                if jwk.get("kid") == kid:
                    key = PyJWT.algorithms.RSAAlgorithm.from_jwk(jwk)
                    break
            
            if not key:
                logger.error(f"Key with kid={kid} not found in JWKS")
                raise HTTPException(status_code=401, detail="Invalid token: Key not found in JWKS")
        except Exception as jwks_error:
            logger.error(f"JWKS processing error: {str(jwks_error)}")
            raise HTTPException(status_code=401, detail=f"JWKS error: {str(jwks_error)}")
        
        # Decode and verify the token
        try:
            logger.debug(f"Decoding token with issuer: {settings.CLERK_ISSUER}")
            payload = PyJWT.decode(
                token,
                key=key,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER,
            )
            logger.debug("Token successfully decoded and verified")
        except ExpiredSignatureError as exp_error:
            logger.error(f"Token expired: {str(exp_error)}")
            raise HTTPException(status_code=401, detail="Token has expired")
        except (InvalidTokenError, PyJWTError) as token_error:
            logger.error(f"Token validation error: {str(token_error)}")
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(token_error)}")
        
        # Extract user info from token
        try:
            clerk_id = payload.get("sub")
            if not clerk_id:
                logger.error("Token payload missing 'sub' claim (user ID)")
                raise HTTPException(status_code=401, detail="Invalid token: Missing user ID")
            
            email = payload.get("email", "")
            # If email is empty, use clerk_id + placeholder domain to ensure uniqueness
            if not email:
                email = f"{clerk_id}@litxplore.generated"
                logger.debug(f"Generated email for user: {email}")
            
            first_name = payload.get("firstName", "")
            last_name = payload.get("lastName", "")
            logger.debug(f"User info extracted: clerk_id={clerk_id}, email={email}")
        except Exception as extract_error:
            logger.error(f"Failed to extract user info from token: {str(extract_error)}")
            raise HTTPException(status_code=401, detail=f"User info extraction error: {str(extract_error)}")
        
        # Get or create user in database
        try:
            logger.debug(f"Attempting to get or create user with clerk_id={clerk_id}")
            user = get_or_create_user(
                db=db,
                clerk_id=clerk_id,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            logger.debug(f"User retrieved/created successfully: id={user.id}")
            return user
        except Exception as user_error:
            logger.error(f"Database error while processing user: {str(user_error)}")
            # Include original exception details in the response
            raise HTTPException(
                status_code=401, 
                detail=f"Authentication failed: Database error: {str(user_error)}"
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions as they already have appropriate status codes
        raise
    except Exception as e:
        # Log and wrap any unexpected errors
        logger.error(f"Unexpected authentication error: {str(e)}")
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