from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Dict, Any
import arxiv
from ....models.review import ReviewRequest, ReviewResponse
from ....services.langchain_service import LangChainService
from ....services.redis_service import RedisService
from ....core.config import get_settings

settings = get_settings()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
langchain_service = LangChainService()
redis_service = RedisService()

@router.post("/generate-review", response_model=ReviewResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_DAY}/day")
async def generate_review(request: Request, review_request: ReviewRequest) -> ReviewResponse:
    try:
        if not review_request.topic.strip():
            raise HTTPException(
                status_code=400,
                detail="Topic cannot be empty"
            )

        # Check cache first
        try:
            cached_review = await redis_service.get_cached_review(review_request.topic)
            if cached_review:
                return ReviewResponse(**cached_review)
        except Exception as redis_error:
            # Log Redis error but continue with normal flow
            print(f"Redis cache error: {str(redis_error)}")
            cached_review = None
        
        # Fetch papers from ArXiv
        papers = await langchain_service.fetch_papers(
            topic=review_request.topic,
            max_papers=review_request.max_papers
        )
        
        if not papers:
            raise HTTPException(
                status_code=404,
                detail="No relevant papers found for the given topic"
            )
        
        # Remove the documents processing step since it's not needed
        review_text = await langchain_service.generate_review(
            papers=papers,  # Pass papers directly
            topic=review_request.topic
        )
        
        # Create response
        response = ReviewResponse(
            review=review_text,
            citations=papers
        )
        
        # Cache the response
        try:
            await redis_service.cache_review(review_request.topic, response.dict())
        except Exception as redis_error:
            print(f"Redis cache error: {str(redis_error)}")
        
        return response
        
    except arxiv.arxiv.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail="ArXiv API is currently unavailable"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        if "quota exceeded" in str(e).lower():
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded for Gemini API"
            )
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )