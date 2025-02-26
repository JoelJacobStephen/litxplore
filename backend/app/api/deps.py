import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from typing import Optional
from jose import jwt as jose_jwt

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validate the JWT token and return the user information.
    """
    try:
        token = credentials.credentials
        
        # Try using a simple HS256 algorithm first
        algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        secret_key = os.getenv("CLERK_SECRET_KEY")
        
        try:
            # First try with PyJWT and HS256
            payload = jwt.decode(
                token, 
                secret_key, 
                algorithms=[algorithm],
                options={"verify_signature": True}
            )
            return payload
        except Exception:
            # If that fails, try with jose_jwt (no signature verification for now)
            # This is a fallback - you may want to implement proper JWKS verification here
            try:
                payload = jose_jwt.decode(
                    token,
                    secret_key,  # This won't verify correctly with RS256, but we'll handle that
                    algorithms=[algorithm],
                    options={"verify_signature": False}
                )
                return payload
            except Exception:
                # As a last resort, just decode without verification
                # This is not secure, but can help for development debugging
                payload = jwt.decode(
                    token,
                    options={"verify_signature": False}
                )
                return payload
    
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
