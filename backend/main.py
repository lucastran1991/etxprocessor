from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.api_v1.api import api_router
from pathlib import Path
import shutil

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ETX Processor API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

def _seed_avatars_if_needed(upload_root: Path) -> None:
    """Copy bundled avatar images to uploads/avatars if directory is empty.

    This enables serving default avatars from /uploads/avatars/* via StaticFiles.
    """
    avatars_dest = upload_root / settings.AVATAR_UPLOAD_SUBDIR
    avatars_dest.mkdir(parents=True, exist_ok=True)

    # If already has files, skip seeding
    has_files = any(avatars_dest.iterdir())
    if has_files:
        return

    source_dir = Path(settings.AVATAR_SOURCE_DIR)
    if not source_dir.exists() or not source_dir.is_dir():
        return

    for item in source_dir.iterdir():
        if item.is_file() and item.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            shutil.copy2(item, avatars_dest / item.name)


# Mount static files for local uploads (only if using local storage)
if settings.STORAGE_TYPE == "local":
    upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    # Ensure avatar assets are available under uploads
    _seed_avatars_if_needed(upload_dir)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

@app.get("/")
async def root():
    return {"message": "ETX Processor API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
