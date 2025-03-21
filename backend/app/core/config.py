from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str
    PROJECT_NAME: str
    
    # Deployment Settings
    BEHIND_PROXY: bool = False
    PRODUCTION: bool = False
    
    # CORS Settings
    CORS_ORIGINS: List[str]
    CORS_ALLOW_CREDENTIALS: bool
    CORS_ALLOW_METHODS: List[str]
    CORS_ALLOW_HEADERS: List[str]
    
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
    
    # Rate Limiting
    RATE_LIMIT_PER_DAY: int
    
    # LangChain Settings
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int
    SIMILARITY_THRESHOLD: float
    MAX_PAPERS: int

    # Clerk Settings
    CLERK_ISSUER: str
    CLERK_FRONTEND_API: str
    # CLERK_AUDIENCE: List[str]
    CLERK_SECRET_KEY: str
    CLERK_PUBLISHABLE_KEY: str
    CLERK_JWKS_URL: str
    JWT_ALGORITHM: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra attributes


@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()