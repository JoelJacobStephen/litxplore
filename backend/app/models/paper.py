from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class Paper(BaseModel):
    id: str
    title: str
    authors: List[str]
    summary: str
    published: datetime
    url: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ReviewContent(BaseModel):
    content: str
    citations: List[Paper]
    topic: str