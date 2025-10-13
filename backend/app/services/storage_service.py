"""
Unified storage service that supports both local file system and AWS S3
"""
from pathlib import Path
from typing import Optional
import uuid
import os
import shutil

from app.core.config import settings

# Only import boto3 if S3 is configured
if settings.STORAGE_TYPE == "s3":
    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        print("Warning: boto3 not installed. S3 storage will not be available.")


class StorageService:
    """
    Unified storage service that can use either local filesystem or AWS S3
    based on the STORAGE_TYPE configuration
    """
    
    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        
        if self.storage_type == "s3":
            # Initialize S3 client
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
            else:
                print("Warning: S3 credentials not configured. Falling back to local storage.")
                self.storage_type = "local"
                self.s3_client = None
        else:
            self.s3_client = None
            # Ensure local upload directory exists
            upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
            upload_dir.mkdir(parents=True, exist_ok=True)
    
    def upload_avatar(self, file_content: bytes, filename: str, content_type: str) -> Optional[str]:
        """
        Upload user avatar
        Returns: URL (for S3) or local file path (for local storage)
        """
        if self.storage_type == "s3" and self.s3_client:
            return self._upload_to_s3(file_content, filename, content_type, "avatars")
        else:
            return self._upload_to_local(file_content, filename, "avatars")
    
    def upload_file(self, file_content: bytes, filename: str, content_type: str, user_id: str) -> Optional[str]:
        """
        Upload user file
        Returns: URL (for S3) or local file path (for local storage)
        """
        if self.storage_type == "s3" and self.s3_client:
            return self._upload_to_s3(file_content, filename, content_type, f"files/{user_id}")
        else:
            return self._upload_to_local(file_content, filename, f"files/{user_id}")
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage
        """
        if self.storage_type == "s3" and self.s3_client:
            return self._delete_from_s3(file_path)
        else:
            return self._delete_from_local(file_path)
    
    def get_file_url(self, file_path: str) -> str:
        """
        Get the URL for accessing a file
        """
        if self.storage_type == "s3":
            return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{file_path}"
        else:
            # For local storage, return the path relative to upload directory
            return f"/uploads/{file_path}"
    
    def _upload_to_s3(self, file_content: bytes, filename: str, content_type: str, folder: str) -> Optional[str]:
        """Upload file to S3"""
        try:
            # Generate unique filename
            file_extension = filename.split('.')[-1] if '.' in filename else 'bin'
            unique_filename = f"{folder}/{uuid.uuid4()}.{file_extension}"
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=unique_filename,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'
            )
            
            # Return the S3 key (path)
            return unique_filename
            
        except Exception as e:
            print(f"Error uploading to S3: {e}")
            return None
    
    def _upload_to_local(self, file_content: bytes, filename: str, subfolder: str) -> Optional[str]:
        """Upload file to local filesystem"""
        try:
            # Create subfolder
            upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / subfolder
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            file_extension = filename.split('.')[-1] if '.' in filename else 'bin'
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = upload_dir / unique_filename
            
            # Save file locally
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            # Return relative path from upload directory
            return f"{subfolder}/{unique_filename}"
            
        except Exception as e:
            print(f"Error uploading to local storage: {e}")
            return None
    
    def _delete_from_s3(self, file_path: str) -> bool:
        """Delete file from S3"""
        try:
            # Extract S3 key from URL or use path directly
            if file_path.startswith('http'):
                # Extract key from URL
                key = file_path.split(f"{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/")[1]
            else:
                key = file_path
            
            self.s3_client.delete_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=key
            )
            return True
            
        except Exception as e:
            print(f"Error deleting from S3: {e}")
            return False
    
    def _delete_from_local(self, file_path: str) -> bool:
        """Delete file from local filesystem"""
        try:
            # Handle both absolute and relative paths
            if file_path.startswith('/uploads/'):
                file_path = file_path[9:]  # Remove '/uploads/' prefix
            
            full_path = Path(settings.LOCAL_UPLOAD_DIR) / file_path
            
            if full_path.exists():
                if full_path.is_file():
                    full_path.unlink()
                elif full_path.is_dir():
                    shutil.rmtree(full_path)
                return True
            return False
            
        except Exception as e:
            print(f"Error deleting from local storage: {e}")
            return False


# Global storage service instance
storage_service = StorageService()

