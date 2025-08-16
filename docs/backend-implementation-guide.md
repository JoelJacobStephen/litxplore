# LitXplore Backend Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Application Entry Point](#application-entry-point)
4. [Configuration Management](#configuration-management)
5. [Database Layer](#database-layer)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Endpoints](#api-endpoints)
8. [Services Layer](#services-layer)
9. [Models & Schemas](#models--schemas)
10. [Utilities](#utilities)
11. [Middleware](#middleware)
12. [Error Handling](#error-handling)
13. [Dependencies](#dependencies)
14. [Deployment](#deployment)

## Overview

LitXplore's backend is built using **FastAPI** with **Python 3.9+**. It provides a comprehensive API for research literature exploration, allowing users to search arXiv papers, upload PDFs, generate literature reviews, and chat with papers using AI.

### Key Features
- **Paper Search**: Integration with arXiv API for academic paper discovery
- **PDF Processing**: Upload and process research papers
- **AI-Powered Reviews**: Generate comprehensive literature reviews using LangChain and Google Gemini
- **Paper Chat**: Interactive Q&A with individual papers
- **Document Generation**: Export reviews as PDF or LaTeX
- **User Management**: Clerk-based authentication with JWT tokens
- **Rate Limiting**: API protection with SlowAPI
- **Background Tasks**: Asynchronous file cleanup

## Architecture

The backend follows a **layered architecture** pattern:

```
├── app/
│   ├── main.py                 # Application entry point
│   ├── core/                   # Core configuration and auth
│   ├── api/v1/endpoints/       # API route handlers
│   ├── services/               # Business logic layer
│   ├── models/                 # Database and Pydantic models
│   ├── db/                     # Database configuration
│   └── utils/                  # Utility functions
```

### Technology Stack
- **Framework**: FastAPI (async web framework)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Clerk with JWT verification
- **AI/ML**: 
  - Google Gemini (LLM)
  - OpenAI Embeddings
  - LangChain (orchestration)
  - FAISS (vector search)
- **Caching**: Redis
- **Rate Limiting**: SlowAPI
- **Document Processing**: PyPDF, ReportLab

## Application Entry Point

### main.py
The main application file (`app/main.py`) initializes the FastAPI application with all necessary configurations:

```python
# Key components initialized:
- FastAPI app with OpenAPI documentation
- CORS middleware (conditional based on proxy settings)
- Rate limiting with SlowAPI
- Background task middleware for PDF cleanup
- Database table creation
- Static file serving for uploads
- Health check endpoints
```

**Key Features:**
- **Conditional CORS**: Only adds CORS middleware when not behind a proxy
- **Background Tasks**: Custom middleware for handling PDF cleanup after review generation
- **Static Files**: Serves uploaded PDFs from `/uploads` directory
- **Health Checks**: Multiple endpoints for service monitoring
- **Database Testing**: Built-in database connection testing

## Configuration Management

### core/config.py
Centralized configuration using Pydantic Settings:

```python
class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str
    PROJECT_NAME: str
    
    # Deployment Settings
    BEHIND_PROXY: bool = False
    PRODUCTION: bool = False
    
    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    
    # AI Services
    GEMINI_API_KEY: str
    OPENAI_API_KEY: str
    
    # Authentication
    CLERK_ISSUER: str
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str
    
    # LangChain Parameters
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int
    SIMILARITY_THRESHOLD: float
```

**Features:**
- Environment variable loading with `.env` support
- Type validation with Pydantic
- Cached settings with `@lru_cache()`
- Secure handling of API keys and secrets

## Database Layer

### Database Configuration (db/database.py)
```python
# Connection Management
- PostgreSQL connection with SQLAlchemy
- Connection pooling (pool_size=10, max_overflow=20)
- Docker environment detection
- Connection health checks
- Automatic reconnection handling
```

### Models (models/)

#### User Model (`models/user.py`)
```python
class User(Base):
    id = Column(Integer, primary_key=True)
    clerk_id = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    reviews = relationship("Review", back_populates="user")
```

#### Review Model (`models/review.py`)
```python
class Review(Base):
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="reviews")
```

#### Paper Model (`models/paper.py`)
Pydantic models for API serialization:
```python
class Paper(BaseModel):
    id: str
    title: str
    authors: List[str]
    summary: str
    published: datetime
    url: Optional[str] = None
```

## Authentication & Authorization

### JWT Authentication (`core/auth.py`)
Comprehensive Clerk integration with JWT verification:

**Key Components:**
- **JWKS Caching**: Cached JSON Web Key Sets with TTL
- **Token Validation**: Multi-step JWT verification process
- **User Synchronization**: Automatic user creation/update from JWT claims
- **Error Handling**: Detailed error responses with specific error codes

**Authentication Flow:**
1. Extract JWT token from Authorization header
2. Fetch and cache JWKS from Clerk
3. Verify token signature using appropriate key
4. Validate token claims (issuer, expiration, etc.)
5. Extract user information from token payload
6. Create or update user record in database
7. Return authenticated user object

**Security Features:**
- RSA signature verification
- Token expiration checking
- Issuer validation
- Key rotation support through JWKS caching
- Comprehensive error logging

## API Endpoints

### Review Endpoints (`api/v1/endpoints/review.py`)

#### POST `/api/v1/review/generate-review`
Generates comprehensive literature reviews from selected papers.

**Features:**
- Supports both arXiv papers and uploaded PDFs
- Background PDF cleanup to prevent storage bloat
- Comprehensive error handling with cleanup guarantees
- Integration with LangChain service for AI generation

**Process Flow:**
1. Validate paper IDs
2. Fetch arXiv papers and uploaded PDFs
3. Schedule background cleanup tasks
4. Generate review using LangChain service
5. Return review with citations
6. Clean up temporary files

#### POST `/api/v1/review/save`
Saves generated reviews to user's history.

#### GET `/api/v1/review/history`
Retrieves user's saved literature reviews.

#### DELETE `/api/v1/review/{review_id}`
Deletes a specific review from user's history.

### Papers Endpoints (`api/v1/endpoints/papers.py`)

#### GET `/api/v1/papers/search`
Searches arXiv papers with query or specific IDs.

**Features:**
- Flexible search (query-based or ID-based)
- Retry logic for arXiv API reliability
- Fallback search strategies
- Error handling with graceful degradation

#### GET `/api/v1/papers/{paper_id}`
Fetches a specific paper by ID.

#### POST `/api/v1/papers/{paper_id}/chat`
Interactive chat with papers using streaming responses.

**Features:**
- Server-Sent Events (SSE) for real-time responses
- Support for both arXiv and uploaded papers
- Automatic cleanup of temporary files
- Vector similarity search for relevant context

#### POST `/api/v1/papers/upload`
Secure PDF upload with comprehensive validation.

**Security Features:**
- File type validation (PDF headers)
- Size limits (15MB maximum)
- Content scanning for malicious patterns
- Temporary file handling with cleanup

### Documents Endpoints (`api/v1/endpoints/documents.py`)

#### POST `/api/v1/documents/generate`
Generates downloadable documents (PDF/LaTeX) from reviews.

**Features:**
- PDF generation with ReportLab
- LaTeX/text format support
- Proper citation formatting
- Academic document styling

### Users Endpoints (`api/v1/endpoints/users.py`)

#### GET `/api/v1/users/me`
Returns current user information.

#### POST `/api/v1/users/webhook/clerk`
Handles Clerk webhook events for user synchronization.

### History Endpoints (`api/v1/endpoints/history.py`)

#### POST `/api/v1/history/clear`
Clears user's literature review history.

## Services Layer

### PaperService (`services/paper_service.py`)
Core service for paper-related operations.

**Key Methods:**

#### `search_papers(query: str) -> List[Paper]`
- Searches arXiv with retry logic
- Handles API failures gracefully
- Implements fallback search strategies

#### `get_papers_by_ids(paper_ids: List[str]) -> List[Paper]`
- Fetches specific papers by ID
- Handles version suffixes in arXiv IDs
- Batch processing for efficiency

#### `chat_with_paper_stream(paper_id: str, message: str)`
- Streaming chat responses
- Vector similarity search using FAISS
- LangChain integration for Q&A
- Automatic cleanup of temporary files

#### `process_uploaded_pdf(file: UploadFile) -> Paper`
- Secure PDF processing
- Content extraction with PyPDF
- Metadata extraction using Gemini
- File storage with content-based naming

**AI Integration:**
- OpenAI embeddings for text vectorization
- Google Gemini for text generation and analysis
- FAISS for efficient similarity search
- LangChain for orchestrating AI workflows

### LangChainService (`services/langchain_service.py`)
Handles AI-powered literature review generation.

**Key Methods:**

#### `generate_review(papers: List[Paper], topic: str) -> str`
- Comprehensive literature review generation
- Academic formatting with proper citations
- Thematic organization of content
- Integration of multiple paper sources

**AI Pipeline:**
1. Paper content processing and chunking
2. Vector embeddings generation
3. Similarity-based content retrieval
4. LLM-powered synthesis and analysis
5. Academic formatting and citation integration

### DocumentService (`services/document_service.py`)
Handles document generation and formatting.

**Features:**
- PDF generation with ReportLab
- Academic document styling
- Citation formatting
- Multiple output formats (PDF, text)

## Models & Schemas

### Database Models
- **User**: User account information with Clerk integration
- **Review**: Saved literature reviews with user relationships

### Pydantic Models
- **Paper**: Paper representation for API serialization
- **ReviewRequest/Response**: Request/response schemas for review generation
- **ChatRequest/Response**: Chat interaction schemas

## Utilities

### Error Handling (`utils/error_utils.py`)
Standardized error handling system.

**Features:**
- Consistent error response format
- Application-specific error codes
- Detailed error information
- HTTP status code mapping

**Error Categories:**
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (422)
- Resource not found (404)
- Internal server errors (500)

### User Utilities (`utils/user_utils.py`)
User management helper functions.

#### `get_or_create_user()`
- Creates new users from Clerk data
- Updates existing user information
- Handles email generation for users without emails

## Middleware

### Background Task Middleware
Custom middleware for handling long-running background tasks.

**Features:**
- PDF cleanup after review generation
- Non-blocking task execution
- Error handling and logging
- Resource management

### Rate Limiting
SlowAPI integration for API protection.

**Configuration:**
- Per-IP rate limiting
- Configurable limits via environment variables
- Automatic rate limit exceeded responses

### CORS Middleware
Conditional CORS handling based on deployment environment.

## Error Handling

### Comprehensive Error System
- **Standardized Responses**: Consistent error format across all endpoints
- **Error Codes**: Application-specific codes for client handling
- **Detailed Logging**: Comprehensive error logging for debugging
- **Graceful Degradation**: Fallback behaviors for service failures

### Error Categories
1. **Authentication Errors**: Invalid tokens, expired sessions
2. **Validation Errors**: Invalid input data, file format issues
3. **Resource Errors**: Not found, already exists
4. **External Service Errors**: arXiv API failures, AI service issues
5. **Internal Errors**: Database issues, unexpected exceptions

## Dependencies

### Core Dependencies
```
fastapi                 # Web framework
uvicorn                # ASGI server
sqlalchemy             # ORM
psycopg2-binary        # PostgreSQL driver
pydantic               # Data validation
```

### AI/ML Dependencies
```
openai                 # OpenAI API client
google-generativeai    # Google Gemini API
langchain              # AI orchestration
langchain-community    # Community integrations
faiss-cpu              # Vector similarity search
```

### Document Processing
```
arxiv                  # arXiv API client
pypdf                  # PDF processing
reportlab              # PDF generation
markdown2              # Markdown processing
```

### Authentication & Security
```
pyjwt                  # JWT handling
python-jose            # JOSE implementation
cryptography           # Cryptographic functions
slowapi                # Rate limiting
```

## Deployment

### Environment Configuration
- **Development**: Local PostgreSQL, Redis optional
- **Production**: Docker containers with environment-specific settings
- **Environment Variables**: Comprehensive configuration via `.env` files

### Docker Support
- **Multi-stage builds** for optimized images
- **Health checks** for container monitoring
- **Volume mounts** for persistent data
- **Environment-specific configurations**

### Database Migrations
- **Alembic** for database schema versioning
- **Automatic migrations** on startup
- **Rollback support** for schema changes

### Monitoring & Health Checks
- **Health endpoints** for service monitoring
- **Database connectivity tests**
- **Comprehensive logging** for debugging
- **Error tracking** and alerting

## Security Considerations

### Authentication Security
- **JWT signature verification** with RSA keys
- **Token expiration enforcement**
- **JWKS caching** with rotation support
- **Secure user data handling**

### File Upload Security
- **File type validation** with header checking
- **Size limits** to prevent DoS attacks
- **Content scanning** for malicious patterns
- **Secure file storage** with content-based naming

### API Security
- **Rate limiting** to prevent abuse
- **Input validation** with Pydantic
- **SQL injection prevention** with SQLAlchemy
- **CORS configuration** for cross-origin requests

### Data Protection
- **Sensitive data encryption** in transit and at rest
- **API key management** via environment variables
- **User data privacy** with minimal data collection
- **Secure error handling** without information leakage

## Performance Optimizations

### Database Optimizations
- **Connection pooling** for efficient resource usage
- **Query optimization** with proper indexing
- **Lazy loading** for related data
- **Connection health monitoring**

### AI Service Optimizations
- **Embedding caching** for repeated queries
- **Batch processing** for multiple papers
- **Streaming responses** for real-time interaction
- **Resource cleanup** to prevent memory leaks

### File Handling Optimizations
- **Temporary file management** with automatic cleanup
- **Streaming uploads** for large files
- **Background processing** for non-blocking operations
- **Content-based caching** for uploaded files

This comprehensive backend implementation provides a robust, scalable, and secure foundation for the LitXplore research literature exploration platform.
