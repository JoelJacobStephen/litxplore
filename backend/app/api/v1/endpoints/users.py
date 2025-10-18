from typing import Dict, Any
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.utils.user_utils import get_or_create_user
from app.utils.error_utils import raise_unauthorized, raise_internal_error, ErrorCode
from app.core.auth import get_current_user

router = APIRouter()

def verify_clerk_webhook_secret(svix_id: str = Header(None), svix_timestamp: str = Header(None), svix_signature: str = Header(None)):
    """
    Verify the Clerk webhook signature
    Note: For full implementation, you should use the svix library to verify the signature
    """
    if not all([svix_id, svix_timestamp, svix_signature]):
        raise_unauthorized(
            message="Missing webhook signature headers",
            error_code=ErrorCode.UNAUTHORIZED
        )
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
        raise_internal_error(
            message=str(e),
            error_code=ErrorCode.INTERNAL_ERROR
        )

@router.get("/me", operation_id="getCurrentUser")
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