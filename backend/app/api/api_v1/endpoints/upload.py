from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.s3_service import S3Service
from app.services.user_service import UserService
from app.models.user import User
from typing import Dict

router = APIRouter()

# Allowed image types
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check content type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Upload user avatar image"""
    
    # Validate the image
    validate_image(file)
    
    # Read file content
    file_content = await file.read()
    
    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )
    
    # Upload to S3 or save locally
    s3_service = S3Service()
    avatar_url = s3_service.upload_file(
        file_content=file_content,
        filename=file.filename,
        content_type=file.content_type
    )
    
    if not avatar_url:
        # If S3 is not configured, use a placeholder or local storage
        # For now, we'll use a gravatar-style URL based on user email
        import hashlib
        email_hash = hashlib.md5(current_user.email.lower().encode()).hexdigest()
        avatar_url = f"https://www.gravatar.com/avatar/{email_hash}?d=identicon&s=200"
    
    # Update user's avatar URL
    user_service = UserService(db)
    
    # Delete old avatar from S3 if it exists and is not a gravatar
    if current_user.avatar_url and 'gravatar.com' not in current_user.avatar_url:
        s3_service.delete_file(current_user.avatar_url)
    
    # Update user
    from app.schemas.user import UserUpdate
    updated_user = user_service.update_user(
        str(current_user.id),
        UserUpdate(avatar_url=avatar_url)
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user avatar"
        )
    
    return {
        "avatar_url": avatar_url,
        "message": "Avatar uploaded successfully"
    }

@router.delete("/avatar")
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Delete user avatar image"""
    
    if not current_user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No avatar to delete"
        )
    
    # Delete from S3 if it's an S3 URL
    s3_service = S3Service()
    if 'gravatar.com' not in current_user.avatar_url:
        s3_service.delete_file(current_user.avatar_url)
    
    # Update user to remove avatar
    user_service = UserService(db)
    from app.schemas.user import UserUpdate
    updated_user = user_service.update_user(
        str(current_user.id),
        UserUpdate(avatar_url=None)
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user avatar"
        )
    
    return {"message": "Avatar deleted successfully"}

