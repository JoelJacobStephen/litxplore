from typing import Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as PyJWT
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError, PyJWTError
import requests
import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.db.database import get_db
from app.utils.user_utils import get_or_create_user
from app.utils.error_utils import raise_unauthorized, raise_internal_error, ErrorCode

# Setup logging
logger = logging.getLogger(__name__)

security = HTTPBearer()

# JWKS Cache with expiration
class JWKSCache:
    """Cache for JWKS with expiration time"""
    def __init__(self, ttl_seconds: int = 3600):
        self.jwks: Optional[Dict[str, Any]] = None
        self.last_updated: Optional[datetime] = None
        self.ttl = timedelta(seconds=ttl_seconds)
    
    def is_valid(self) -> bool:
        """Check if cached JWKS is still valid"""
        if not self.jwks or not self.last_updated:
            return False
        return datetime.utcnow() - self.last_updated < self.ttl
    
    def update(self, jwks: Dict[str, Any]) -> None:
        """Update the cache with new JWKS"""
        self.jwks = jwks
        self.last_updated = datetime.utcnow()
    
    def get(self) -> Optional[Dict[str, Any]]:
        """Get the cached JWKS if valid"""
        if self.is_valid():
            return self.jwks
        return None

# Initialize the JWKS cache
jwks_cache = JWKSCache()

def get_jwks() -> Dict[str, Any]:
    """Get JWKS from cache or fetch from Clerk if not cached or expired"""
    cached_jwks = jwks_cache.get()
    if cached_jwks:
        logger.debug("Using cached JWKS")
        return cached_jwks
    
    logger.debug("Fetching fresh JWKS from Clerk")
    try:
        response = requests.get(settings.CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        jwks = response.json()
        jwks_cache.update(jwks)  # Update the cache
        return jwks
    except requests.RequestException as e:
        logger.error(f"Failed to fetch JWKS: {str(e)}")
        raise_internal_error(
            message=f"Failed to fetch JWKS: {str(e)}", 
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that validates the Clerk JWT token and returns the current user.
    If the user doesn't exist in the database, it creates a new user record.
    """
    # Check if credentials are provided
    if not credentials:
        logger.error("No authentication credentials provided")
        raise_unauthorized(
            message="No authentication credentials provided",
            error_code=ErrorCode.MISSING_TOKEN
        )
    
    try:
        token = credentials.credentials
        logger.debug(f"Processing authentication token (first 10 chars): {token[:10]}...")
        
        # Get the key ID from the token header
        try:
            unverified_header = PyJWT.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                logger.error("Token header missing 'kid' field")
                raise_unauthorized(
                    message="Invalid token format: Missing 'kid' field",
                    error_code=ErrorCode.INVALID_TOKEN
                )
        except Exception as header_error:
            logger.error(f"Failed to parse token header: {str(header_error)}")
            raise_unauthorized(
                message=f"Invalid token header: {str(header_error)}",
                error_code=ErrorCode.INVALID_TOKEN,
                details={"error_type": "header_parsing_error"}
            )
        
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
                raise_unauthorized(
                    message="Invalid token: Key not found in JWKS",
                    error_code=ErrorCode.JWKS_ERROR,
                    details={"kid": kid}
                )
        except Exception as jwks_error:
            if isinstance(jwks_error, PyJWTError):
                raise
            logger.error(f"JWKS processing error: {str(jwks_error)}")
            raise_unauthorized(
                message=f"JWKS error: {str(jwks_error)}",
                error_code=ErrorCode.JWKS_ERROR
            )
        
        # Decode and verify the token
        try:
            logger.debug(f"Decoding token with issuer: {settings.CLERK_ISSUER}")
            payload = PyJWT.decode(
                token,
                key=key,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": False,  # Set to True if you want to verify audience
                    "verify_iss": True,
                    "require_exp": True,
                    "require_iat": True,
                    "require_nbf": False
                }
            )
            logger.debug("Token successfully decoded and verified")
        except ExpiredSignatureError as exp_error:
            logger.error(f"Token expired: {str(exp_error)}")
            raise_unauthorized(
                message="Token has expired",
                error_code=ErrorCode.TOKEN_EXPIRED
            )
        except (InvalidTokenError, PyJWTError) as token_error:
            logger.error(f"Token validation error: {str(token_error)}")
            raise_unauthorized(
                message=f"Invalid token: {str(token_error)}",
                error_code=ErrorCode.INVALID_TOKEN
            )
        
        # Validate required claims
        validate_token_claims(payload)
        
        # Extract user info from token
        try:
            clerk_id = payload.get("sub")
            if not clerk_id:
                logger.error("Token payload missing 'sub' claim (user ID)")
                raise_unauthorized(
                    message="Invalid token: Missing user ID",
                    error_code=ErrorCode.INVALID_TOKEN,
                    details={"missing_claim": "sub"}
                )
            
            # Extract user data
            user_data = extract_user_data_from_token(payload)
            logger.debug(f"User info extracted: clerk_id={clerk_id}, email={user_data['email']}")
            
            # Get or create user in database
            user = get_or_create_user(
                db=db,
                clerk_id=clerk_id,
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"]
            )
            logger.debug(f"User retrieved/created successfully: id={user.id}")
            
            return user
        except Exception as user_error:
            if hasattr(user_error, "status_code"):
                # Re-raise if it's already an HTTP exception
                raise
            logger.error(f"User processing error: {str(user_error)}")
            raise_unauthorized(
                message=f"Authentication failed: {str(user_error)}",
                error_code=ErrorCode.INTERNAL_ERROR,
                details={"error_type": "user_processing"}
            )
        
    except Exception as e:
        if hasattr(e, "status_code"):
            # Re-raise HTTP exceptions as they already have appropriate status codes
            raise
        # Log and wrap any unexpected errors
        logger.error(f"Unexpected authentication error: {str(e)}")
        raise_unauthorized(
            message=f"Authentication failed: {str(e)}",
            error_code=ErrorCode.INTERNAL_ERROR
        )

def validate_token_claims(payload: Dict[str, Any]) -> None:
    """
    Validate that the token contains required claims.
    Can be extended to validate custom claims for role-based access control.
    
    Args:
        payload: The decoded JWT payload
        
    Raises:
        HTTPException: If validation fails
    """
    required_claims = ["sub", "exp", "iat"]
    missing_claims = [claim for claim in required_claims if claim not in payload]
    
    if missing_claims:
        logger.error(f"Token missing required claims: {missing_claims}")
        raise_unauthorized(
            message=f"Invalid token: Missing required claims: {', '.join(missing_claims)}",
            error_code=ErrorCode.INVALID_TOKEN,
            details={"missing_claims": missing_claims}
        )
    
    # Example of role-based validation (commented out for now)
    # if settings.REQUIRE_ROLES and "roles" in payload:
    #     user_roles = payload.get("roles", [])
    #     if not set(user_roles).intersection(set(settings.ALLOWED_ROLES)):
    #         logger.error(f"User does not have required roles. User roles: {user_roles}")
    #         raise_forbidden(
    #             message="User does not have the required roles",
    #             details={"user_roles": user_roles, "required_roles": settings.ALLOWED_ROLES}
    #         )


def extract_user_data_from_token(payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Extract user data from token payload.
    
    Args:
        payload: The decoded JWT payload
        
    Returns:
        Dictionary containing user data
    """
    email = payload.get("email", "")
    clerk_id = payload.get("sub")
    
    # If email is empty, use clerk_id + placeholder domain to ensure uniqueness
    if not email:
        email = f"{clerk_id}@litxplore.generated"
        logger.debug(f"Generated email for user: {email}")
    
    # Extract name information - handle different formats from Clerk
    first_name = payload.get("given_name", "")  # OpenID standard
    if not first_name:
        first_name = payload.get("firstName", "")  # Clerk specific
    
    last_name = payload.get("family_name", "")  # OpenID standard
    if not last_name:
        last_name = payload.get("lastName", "")  # Clerk specific
    
    return {
        "email": email,
        "first_name": first_name,
        "last_name": last_name
    }