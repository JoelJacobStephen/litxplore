from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db.base_class import Base
from .paper import Paper

# SQLAlchemy Model
class Review(Base):
    __tablename__ = "literature_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reviews")

# Pydantic Models
class ReviewRequest(BaseModel):
    paper_ids: List[str]
    topic: str = Field(..., min_length=3, max_length=500, description="Research topic for literature review")
    max_papers: int = Field(default=10, ge=1, le=20, description="Maximum number of papers to analyze")
    
    class Config:
        json_schema_extra = {
            "example": {
                "topic": "Recent advances in transformer architectures for natural language processing",
                "max_papers": 10
            }
        }


class ReviewResponse(BaseModel):
    review: str = Field(..., description="Generated literature review text")
    citations: List[Paper] = Field(..., description="List of papers cited in the review")
    
    class Config:
        json_schema_extra = {
            "example": {
                "review": "This literature review explores recent developments...",
                "citations": [
                    {
                        "id": "2307.12345",
                        "title": "Advances in Language Models",
                        "authors": ["John Doe", "Jane Smith"],
                        "published": "2023-07-01T00:00:00",
                        "summary": "Key findings in language model development...",
                        "url": "https://arxiv.org/abs/2307.12345"
                    }
                ]
            }
        }