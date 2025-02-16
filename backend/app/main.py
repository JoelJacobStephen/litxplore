from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from .api.v1.endpoints import review, papers, documents  # Add documents import
from .core.config import get_settings

settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=["*"]
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Setup rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Include routers
app.include_router(
    review.router,
    prefix=f"{settings.API_V1_STR}/review",
    tags=["review"]
)

# Add papers router
app.include_router(
    papers.router,
    prefix=f"{settings.API_V1_STR}/papers",
    tags=["papers"]
)

# Add documents router
app.include_router(
    documents.router, 
    prefix=f"{settings.API_V1_STR}/documents",
    tags=["documents"]
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    pass

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown."""
    pass