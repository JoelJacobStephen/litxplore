from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.review import Review

router = APIRouter()

@router.post("/history/clear")
async def clear_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear the user's literature review history
    """
    try:
        db.query(Review).filter(Review.user_id == current_user.id).delete()
        db.commit()
        return {"message": "History cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))