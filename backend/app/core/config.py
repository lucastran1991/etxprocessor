from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "ETX Processor"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/etxprocessor"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:8888",
        "http://localhost:8000",
        "http://veoliaint.atomiton.com",
        "http://veoliaint.atomiton.com:8888",
    ]
    
    # Storage Configuration
    STORAGE_TYPE: str = "local"  # "local" or "s3"
    LOCAL_UPLOAD_DIR: str = "uploads"  # Directory for local file storage
    # Avatar assets
    AVATAR_SOURCE_DIR: str = "avatar"  # Directory containing seed avatars (relative to backend working dir)
    AVATAR_UPLOAD_SUBDIR: str = "avatars"  # Subdirectory under LOCAL_UPLOAD_DIR where avatars are served
    
    # AWS S3 (only used when STORAGE_TYPE="s3")
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
