from pydantic import BaseModel, Field
from typing import List
from .paper import Paper


class ReviewRequest(BaseModel):
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