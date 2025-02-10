from pydantic import BaseModel
from typing import List
from datetime import datetime

class Paper(BaseModel):
    id: str
    title: str
    authors: List[str]
    summary: str
    published: datetime
    url: str

class ChatRequest(BaseModel):
    message: str

class Source(BaseModel):
    page: int

class ChatResponse(BaseModel):
    response: str
    sources: List[Source]