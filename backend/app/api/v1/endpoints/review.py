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
        
        # Separate uploaded files from arXiv papers
        uploaded_ids = [pid for pid in review_request.paper_ids if pid.startswith('upload_')]
        arxiv_ids = [pid for pid in review_request.paper_ids if not pid.startswith('upload_')]
        
        papers = []
        
        # Fetch arxiv papers
        if arxiv_ids:
            arxiv_papers = await paper_service.get_papers_by_ids(arxiv_ids)
            papers.extend(arxiv_papers)
            
        # Get uploaded papers
        if uploaded_ids:
            uploaded_papers = await paper_service.get_uploaded_papers(uploaded_ids)
            papers.extend(uploaded_papers)
            
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
            citations=papers,
            topic=review_request.topic
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating review: {str(e)}"
        )