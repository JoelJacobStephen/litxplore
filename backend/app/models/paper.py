from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class Source(BaseModel):
    page: int

class Paper(BaseModel):
    id: str
    title: str
    authors: List[str]
    summary: str
    published: datetime
    url: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: List[Source]

class ReviewContent(BaseModel):
    content: str
    citations: List[Paper]
    topic: str