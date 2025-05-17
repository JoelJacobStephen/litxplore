# LitXplore Backend Overview

## Tech Stack

LitXplore's backend is built with a modern Python-based stack:

- **FastAPI** - Modern, high-performance web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM for database interactions
- **Alembic** - Database migration tool
- **PostgreSQL** - Relational database
- **Pydantic** - Data validation and settings management
- **Uvicorn** - ASGI server for FastAPI
- **LangChain** - Framework for LLM applications
- **Google Generative AI (Gemini)** - AI model for text generation
- **OpenAI** - Alternative AI model for text generation
- **FAISS** - Vector database for similarity search
- **Clerk** - Authentication and user management
- **Redis** - In-memory data store for caching
- **Docker** - Containerization for deployment

## Project Structure

The backend follows a well-organized structure:

```
backend/
├── alembic/                # Database migration scripts
│   └── versions/           # Migration version files
├── app/                    # Main application code
│   ├── api/                # API endpoints
│   │   └── v1/             # API version 1
│   │       └── endpoints/  # API route handlers
│   ├── core/               # Core functionality and config
│   ├── db/                 # Database setup and session management
│   ├── middleware/         # Middleware components
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic schemas for validation
│   ├── services/           # Business logic services
│   ├── templates/          # Template files
│   └── utils/              # Utility functions
├── scripts/                # Utility scripts
├── uploads/                # File upload directory
└── requirements.txt        # Python dependencies
```

## Core Components

### Configuration (app/core/config.py)

The application uses Pydantic settings management to handle configuration from environment variables:

```python
class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str
    PROJECT_NAME: str

    # Deployment Settings
    BEHIND_PROXY: bool = False
    PRODUCTION: bool = False

    # CORS Settings
    CORS_ORIGINS: List[str]

    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # API Keys
    GEMINI_API_KEY: str
    OPENAI_API_KEY: str

    # Redis Settings
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str

    # LangChain Settings
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int

    # Clerk Settings
    CLERK_ISSUER: str
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str
```

### Authentication (app/core/auth.py)

Authentication is implemented using Clerk with JWT token validation:

1. JWT tokens are verified using Clerk's JWKS (JSON Web Key Set)
2. The system validates token signatures and expiration
3. User information is extracted from the token's payload
4. Users are automatically created or updated in the database

Key authentication functions:

- `get_current_user` - FastAPI dependency that validates JWT tokens
- `get_or_create_user` - Creates or updates user records based on Clerk data

## Database

### Database Configuration (app/db/database.py)

The application uses PostgreSQL with SQLAlchemy ORM:

```python
# Create the connection URL
SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{postgres_host}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

# Configure engine with a larger pool_size and longer timeout
engine_args = {
    "pool_pre_ping": True,  # Verify connections before using them
    "pool_size": 10,       # Larger connection pool
    "max_overflow": 20,
    "pool_recycle": 3600,  # Recycle connections after an hour
}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### Database Models

#### User Model (app/models/user.py)

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews = relationship("Review", back_populates="user")
```

#### Review Model (app/models/review.py)

```python
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
```

### Database Migrations

Alembic is used for database migrations:

- Migration scripts are stored in `alembic/versions/`
- `alembic.ini` contains configuration for migrations
- `alembic/env.py` sets up the migration environment

## API Endpoints

The API is organized under `/api/v1/` with the following main routes:

### Papers API (app/api/v1/endpoints/papers.py)

Endpoints for paper search and paper-specific operations:

- `GET /api/v1/papers/search` - Search for academic papers
- `POST /api/v1/papers/{paper_id}/chat` - Chat with a specific paper

### Review API (app/api/v1/endpoints/review.py)

Endpoints for literature review generation:

- `POST /api/v1/review/generate-review` - Generate literature reviews from papers
- `GET /api/v1/review/{review_id}` - Retrieve a generated review

### Documents API (app/api/v1/endpoints/documents.py)

Endpoints for document upload and processing:

- `POST /api/v1/documents/upload` - Upload document files
- `GET /api/v1/documents/{document_id}` - Get document details

### Users API (app/api/v1/endpoints/users.py)

Endpoints for user management:

- `GET /api/v1/users/me` - Get current user information
- `GET /api/v1/users/{user_id}` - Get specific user information

### History API (app/api/v1/endpoints/history.py)

Endpoints for user history:

- `GET /api/v1/history/reviews` - Get user's review history
- `GET /api/v1/history/chat-sessions` - Get user's chat history

## Service Layer

### LangChain Service (app/services/langchain_service.py)

This service handles interactions with LLMs for text generation and analysis:

```python
class LangChainService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7
        )
```

Key methods:

- `fetch_papers` - Retrieves papers from ArXiv
- `process_papers` - Prepares paper content for analysis
- `generate_review` - Creates literature reviews from papers

### Paper Service (app/services/paper_service.py)

Handles paper search, retrieval, and paper-based chat functionality:

- Integrates with ArXiv API
- Processes paper content
- Manages vector embeddings for semantic search

### Document Service (app/services/document_service.py)

Manages document upload and processing:

- Handles file uploads
- Extracts and processes text from PDFs
- Manages document storage

## Middleware

The application uses several middleware components:

### CORS Middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

### Rate Limiting Middleware

```python
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
```

## Deployment

The application is containerized using Docker:

- `Dockerfile` defines the container build
- `docker-compose.yml` defines local development environment
- `docker-compose.prod.yml` defines production deployment
- `docker-entrypoint.sh` contains startup logic

Key deployment configurations:

1. PostgreSQL database service
2. Redis for caching and rate limiting
3. FastAPI application

## Key Features

1. **Academic Paper Search**: Search for relevant academic papers
2. **Literature Review Generation**: AI-powered literature review creation from multiple papers
3. **Chat with Papers**: Interactive chat interface to query specific papers
4. **Document Processing**: Upload and process PDF documents
5. **Authentication**: Secure user authentication with Clerk
6. **Rate Limiting**: Prevents abuse with request rate limiting
7. **Database Integration**: Persistent storage of user data and reviews
8. **Vector Search**: Semantic search using embeddings

## Environment Variables

The application requires several environment variables defined in `.env`:

- Database credentials
- API keys for Gemini and OpenAI
- Clerk authentication settings
- Redis configuration
- Application settings

## Conclusion

The LitXplore backend is a modern, well-structured Python application built with FastAPI. It leverages AI capabilities through LangChain and Google's Gemini models to provide academic paper search and literature review generation. The system is designed with a clear separation of concerns, following best practices for API development, authentication, and database management.
