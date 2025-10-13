from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.storage_service import storage_service
from app.services.file_service import FileService
from app.schemas.file import FileResponse, FileCreate, FolderCreate, FileTreeNode
from app.models.user import User
import os

router = APIRouter()

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB per file

@router.post("/upload", response_model=List[FileResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    folder_path: str = Form("/"),
    relative_paths: Optional[str] = Form(None),  # JSON stringified array of relative paths matching files order
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload one or multiple files"""
    
    file_service = FileService(db)
    uploaded_files = []
    
    # Parse optional relative paths from the browser (webkitRelativePath)
    rel_paths_list: Optional[List[str]] = None
    if relative_paths:
        try:
            import json
            parsed = json.loads(relative_paths)
            if isinstance(parsed, list):
                rel_paths_list = [str(p) for p in parsed]
        except Exception:
            rel_paths_list = None

    for index, file in enumerate(files):
        # Validate file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} is too large. Maximum size: 100MB"
            )
        
        # Determine target folder path (preserve client hierarchy if provided)
        target_folder = folder_path
        if rel_paths_list and index < len(rel_paths_list):
            rp = rel_paths_list[index]
            # Drop the filename from the relative path and join with base folder_path
            rp_dir = os.path.dirname(rp).replace('\\', '/')
            if rp_dir and rp_dir != '.':
                # Normalize to "/parent/..."
                rp_dir_norm = '/' + rp_dir.strip('/')
                base_norm = '/' + (folder_path or '/').strip('/') if folder_path != '/' else '/'
                target_folder = base_norm if rp_dir_norm == '/' else (base_norm.rstrip('/') + rp_dir_norm)

        # Ensure folder hierarchy records exist in DB
        FileService(db).ensure_folder_hierarchy(str(current_user.id), target_folder)

        # Upload file to storage
        file_path = storage_service.upload_file(
            file_content=file_content,
            filename=file.filename or "unnamed",
            content_type=file.content_type or "application/octet-stream",
            user_id=str(current_user.id)
        )
        
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file {file.filename}"
            )
        
        # Create file record
        file_data = FileCreate(
            filename=os.path.basename(file_path),
            original_filename=file.filename or "unnamed",
            file_path=file_path,
            file_size=len(file_content),
            mime_type=file.content_type,
            folder_path=target_folder or "/",
            user_id=str(current_user.id),
            is_folder=False
        )
        
        db_file = file_service.create_file(file_data)
        uploaded_files.append(db_file)
    
    return uploaded_files

@router.post("/folder", response_model=FileResponse)
async def create_folder(
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new folder"""
    file_service = FileService(db)
    folder = file_service.create_folder(str(current_user.id), folder_data)
    return folder

@router.get("/list", response_model=List[FileResponse])
async def list_files(
    folder_path: str = "/",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files in a specific folder"""
    file_service = FileService(db)
    files = file_service.get_user_files(str(current_user.id), folder_path)
    return files

@router.get("/tree", response_model=List[FileTreeNode])
async def get_file_tree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the complete file tree structure"""
    file_service = FileService(db)
    tree = file_service.get_file_tree(str(current_user.id))
    return tree

@router.get("/search", response_model=List[FileResponse])
async def search_files(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search files by name"""
    file_service = FileService(db)
    files = file_service.search_files(str(current_user.id), q)
    return files

@router.get("/storage")
async def get_storage_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get storage usage statistics"""
    file_service = FileService(db)
    usage = file_service.get_storage_usage(str(current_user.id))
    return usage

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file or folder"""
    file_service = FileService(db)
    success = file_service.delete_file(file_id, str(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return {"message": "File deleted successfully"}

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file details"""
    file_service = FileService(db)
    file = file_service.get_file_by_id(file_id, str(current_user.id))
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return file

