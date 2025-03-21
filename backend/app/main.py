from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from app.api.v1.endpoints import review, papers, documents, history, users  # Change from relative to absolute import
from .core.config import get_settings
from app.db.database import engine, Base, get_db
from sqlalchemy.orm import Session

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup CORS
# Only add CORS middleware when not behind a reverse proxy that handles CORS
if not settings.BEHIND_PROXY:
    print("Adding CORS middleware (not running behind proxy)")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"]
    )
else:
    print("Skipping CORS middleware (running behind proxy that handles CORS)")

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

# Add users router
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])

# Fix the history router path
app.include_router(history.router, prefix=f"{settings.API_V1_STR}", tags=["history"])

# Health check endpoints
@app.get("/health")
@app.get(f"{settings.API_V1_STR}/healthcheck")
def health_check():
    return {"status": "healthy", "service": "LitXplore API"}

# Database test endpoint
@app.get("/db-test")
@app.get(f"{settings.API_V1_STR}/db-test")
def test_db(db: Session = Depends(get_db)):
    try:
        # Try to execute a simple query
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "Database connection successful"}
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        return {"status": "Database connection failed", "error": str(e), "trace": trace}

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    pass

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown."""
    pass

# Add host and port settings
HOST = "0.0.0.0"  # Allow connections from any IP
PORT = int(os.getenv("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True
    )