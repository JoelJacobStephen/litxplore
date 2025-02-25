from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any, List
from app.models.review import ReviewRequest, ReviewResponse, Review
from app.services.paper_service import PaperService
from app.services.langchain_service import LangChainService
from app.core.config import get_settings
from app.core.auth import get_current_user
from app.models.user import User
from app.db.database import get_db
from sqlalchemy.orm import Session

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

@router.post("/save")
async def save_review(
    request: Request,
    review_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    try:
        new_review = Review(
            user_id=current_user.id,
            title=review_data.get("title", "Untitled Review"),
            topic=review_data["topic"],
            content=review_data["content"],
            citations=review_data.get("citations")
        )
        
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        
        return {"message": "Review saved successfully", "review_id": new_review.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save review: {str(e)}"
        )

@router.get("/history")
async def get_review_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    try:
        reviews = db.query(Review).filter(
            Review.user_id == current_user.id
        ).order_by(Review.created_at.desc()).all()
        
        return [
            {
                "id": review.id,
                "title": review.title,
                "topic": review.topic,
                "content": review.content,
                "citations": review.citations,
                "created_at": str(review.created_at),
                "updated_at": str(review.updated_at)
            }
            for review in reviews
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch review history: {str(e)}"
        )