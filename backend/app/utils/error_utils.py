from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class ErrorCode:
    """Error code constants for the application."""
    # Authentication errors
    UNAUTHORIZED = "UNAUTHORIZED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    MISSING_TOKEN = "MISSING_TOKEN"
    JWKS_ERROR = "JWKS_ERROR"
    
    # Authorization errors
    FORBIDDEN = "FORBIDDEN"
    
    # Resource errors
    NOT_FOUND = "NOT_FOUND"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    
    # Server errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response format.
    
    Args:
        status_code: HTTP status code
        error_code: Application-specific error code
        message: Human-readable error message
        details: Additional error details
        
    Returns:
        Standardized error response dictionary
    """
    response = {
        "status": "error",
        "error": {
            "code": error_code,
            "message": message,
            "status_code": status_code
        }
    }
    
    if details:
        response["error"]["details"] = details
        
    return response


def raise_http_exception(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """
    Raise an HTTPException with a standardized error response.
    
    Args:
        status_code: HTTP status code
        error_code: Application-specific error code
        message: Human-readable error message
        details: Additional error details
        
    Raises:
        HTTPException: with standardized error content
    """
    error_response = create_error_response(
        status_code=status_code,
        error_code=error_code,
        message=message,
        details=details
    )
    
    raise HTTPException(
        status_code=status_code,
        detail=error_response
    )


# Common error raising functions
def raise_unauthorized(
    message: str = "Not authenticated",
    error_code: str = ErrorCode.UNAUTHORIZED,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Raise a 401 Unauthorized error."""
    raise_http_exception(
        status_code=status.HTTP_401_UNAUTHORIZED,
        error_code=error_code,
        message=message,
        details=details
    )


def raise_forbidden(
    message: str = "Permission denied",
    error_code: str = ErrorCode.FORBIDDEN,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Raise a 403 Forbidden error."""
    raise_http_exception(
        status_code=status.HTTP_403_FORBIDDEN,
        error_code=error_code,
        message=message,
        details=details
    )


def raise_not_found(
    message: str = "Resource not found",
    error_code: str = ErrorCode.NOT_FOUND,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Raise a 404 Not Found error."""
    raise_http_exception(
        status_code=status.HTTP_404_NOT_FOUND,
        error_code=error_code,
        message=message,
        details=details
    )


def raise_validation_error(
    message: str = "Validation error",
    error_code: str = ErrorCode.VALIDATION_ERROR,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Raise a 422 Validation Error."""
    raise_http_exception(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code=error_code,
        message=message,
        details=details
    )


def raise_internal_error(
    message: str = "Internal server error",
    error_code: str = ErrorCode.INTERNAL_ERROR,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Raise a 500 Internal Server Error."""
    raise_http_exception(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code=error_code,
        message=message,
        details=details
    )
