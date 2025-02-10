from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any
from ....models.review import ReviewRequest, ReviewResponse
from ....services.paper_service import PaperService
from ....services.langchain_service import LangChainService
from ....core.config import get_settings

settings = get_settings()
router = APIRouter()
paper_service = PaperService()
langchain_service = LangChainService()

@router.post("/generate-review", response_model=ReviewResponse)
async def generate_review(request: Request, review_request: ReviewRequest) -> ReviewResponse:
    try:
        if not review_request.paper_ids:
            raise HTTPException(
                status_code=400,
                detail="No paper IDs provided"
            )

        # Fetch papers by IDs
        papers = await paper_service.get_papers_by_ids(review_request.paper_ids)
        
        if not papers:
            raise HTTPException(
                status_code=404,
                detail="No papers found with the provided IDs"
            )
        
        # Generate review using LangChain
        review_text = await langchain_service.generate_review(
            papers=papers,
            topic=review_request.topic
        )
        
        return ReviewResponse(
            review=review_text,
            citations=papers
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating review: {str(e)}"
        )