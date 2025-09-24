from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import Optional, Any, Dict
import json

from app.db.base_class import Base


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj]), default=TaskStatus.PENDING, nullable=False)
    result_data = Column(Text, nullable=True)  # JSON string for results
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="tasks")
    
    def set_result_data(self, data: Dict[str, Any]) -> None:
        """Set result data as JSON string"""
        self.result_data = json.dumps(data)
    
    def get_result_data(self) -> Optional[Dict[str, Any]]:
        """Get result data as dictionary"""
        if self.result_data:
            return json.loads(self.result_data)
        return None


class TaskResponse(BaseModel):
    id: str
    status: TaskStatus
    error_message: Optional[str] = None
    created_at: datetime
    result_data: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }