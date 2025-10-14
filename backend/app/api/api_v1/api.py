from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, upload, files, processing

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(processing.router, prefix="/processing", tags=["processing"])
