from fastapi import APIRouter, Depends, Request, HTTPException
from typing import Dict, Any, List
import os
import logging
from app.models.review import ReviewRequest, ReviewResponse, Review
from app.services.paper_service import PaperService
from app.services.langchain_service import LangChainService
from app.core.config import get_settings
from app.core.auth import get_current_user
from app.models.user import User
from app.db.database import get_db
from app.utils.error_utils import raise_validation_error, raise_not_found, raise_internal_error, ErrorCode
from sqlalchemy.orm import Session

settings = get_settings()
router = APIRouter()
paper_service = PaperService()
langchain_service = LangChainService()

@router.post("/generate-review", response_model=ReviewResponse)
async def generate_review(request: Request, review_request: ReviewRequest) -> ReviewResponse:
    # Extract uploaded file IDs immediately to ensure they can be cleaned up in any case
    uploaded_ids = [pid for pid in review_request.paper_ids if pid.startswith('upload_')] if review_request.paper_ids else []
    review_text = None
    papers = []
    
    try:
        if not review_request.paper_ids:
            raise_validation_error(
                message="No paper IDs provided",
                error_code=ErrorCode.VALIDATION_ERROR
            )
        
        # Separate uploaded files from arXiv papers
        arxiv_ids = [pid for pid in review_request.paper_ids if not pid.startswith('upload_')]
        
        # Process papers first - this happens while the token is still valid
        # Fetch arxiv papers
        if arxiv_ids:
            arxiv_papers = await paper_service.get_papers_by_ids(arxiv_ids)
            papers.extend(arxiv_papers)
            
        # Get uploaded papers
        if uploaded_ids:
            uploaded_papers = await paper_service.get_uploaded_papers(uploaded_ids)
            papers.extend(uploaded_papers)
            
        if not papers:
            raise_not_found(
                message="No papers found with the provided IDs",
                details={"paper_ids": review_request.paper_ids}
            )
        
        # Schedule the cleanup to happen regardless of token validity
        # This creates a background task that doesn't require the token to be valid
        if not hasattr(request.state, 'background_tasks'):
            request.state.background_tasks = []
            
        request.state.background_tasks.append({
            'task': 'cleanup_pdfs',
            'paper_ids': uploaded_ids
        })
        
        # Generate review using LangChain - might take a long time
        review_text = await langchain_service.generate_review(
            papers=papers,
            topic=review_request.topic
        )
        
        # Clean up PDFs immediately - don't wait for background task
        # This might fail if token expired, but we have the background task as backup
        if uploaded_ids:
            try:
                await cleanup_uploaded_pdfs(uploaded_ids)
            except Exception as cleanup_error:
                logging.error(f"Initial cleanup failed, will retry in background: {str(cleanup_error)}")
            
        return ReviewResponse(
            review=review_text,
            citations=papers,
            topic=review_request.topic
        )
        
    except HTTPException as he:
        # Re-raise HTTP exceptions but ensure cleanup is attempted
        if uploaded_ids:
            try:
                await cleanup_uploaded_pdfs(uploaded_ids)
            except Exception as cleanup_error:
                logging.error(f"Cleanup failed during HTTP exception: {str(cleanup_error)}")
        raise he
    except Exception as e:
        logging.exception("Failed to generate review")
        if uploaded_ids:
            try:
                await cleanup_uploaded_pdfs(uploaded_ids)
            except Exception as cleanup_error:
                logging.error(f"Cleanup failed during exception: {str(cleanup_error)}")
        raise_internal_error(
            message=f"Error generating review: {str(e)}",
            error_code=ErrorCode.INTERNAL_ERROR
        )
    finally:
        # One last attempt at cleanup if all else failed
        if uploaded_ids:
            try:
                await cleanup_uploaded_pdfs(uploaded_ids)
            except Exception as final_error:
                logging.error(f"Final cleanup attempt failed: {str(final_error)}")

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
        logging.exception("Failed to save review")
        raise_internal_error(
            message=f"Failed to save review: {str(e)}",
            error_code=ErrorCode.DATABASE_ERROR
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
                "created_at": review.created_at.isoformat() if review.created_at else None,
                "updated_at": review.updated_at.isoformat() if review.updated_at else None
            }
            for review in reviews
        ]
        
    except Exception as e:
        logging.exception("Failed to fetch review history")
        raise_internal_error(
            message=f"Failed to fetch review history: {str(e)}",
            error_code=ErrorCode.DATABASE_ERROR
        )

@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific review"""
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == current_user.id
    ).first()
    
    if not review:
        raise_not_found(
            message="Review not found",
            details={"review_id": review_id}
        )
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}

async def cleanup_uploaded_pdfs(paper_ids: List[str]):
    """Delete uploaded PDF files to free up space.
    This function is intentionally not dependent on user authentication to allow
    cleanup even when tokens expire during long-running operations.
    """
    try:
        upload_dir = "uploads"
        for paper_id in paper_ids:
            if paper_id.startswith('upload_'):
                content_hash = paper_id.replace('upload_', '')
                pdf_path = os.path.join(upload_dir, f"{content_hash}.pdf")
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
                    print(f"Deleted PDF file: {pdf_path}")
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Error cleaning up PDF files: {str(e)}")
        logging.error(f"Error cleaning up PDF files: {str(e)}")
    return {"cleanup_status": "completed"}