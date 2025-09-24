from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.task import TaskResponse, TaskStatus
from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the status of a specific task"""
    task = await task_service.get_task_status(db, task_id, current_user)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task_service.to_response(task)


@router.get("/", response_model=List[TaskResponse])
async def get_user_tasks(
    status: Optional[TaskStatus] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks for the current user"""
    tasks = await task_service.get_user_tasks(
        db, current_user, status, limit
    )
    
    return [task_service.to_response(task) for task in tasks]


@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a running task"""
    success = await task_service.cancel_task(db, task_id, current_user)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task cannot be cancelled (not found or already completed)"
        )
    
    return {"message": "Task cancelled successfully"}
