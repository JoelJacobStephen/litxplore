from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User

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
