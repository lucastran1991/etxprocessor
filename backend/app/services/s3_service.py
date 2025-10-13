import boto3
from botocore.exceptions import ClientError
from typing import Optional
import uuid
from app.core.config import settings

class S3Service:
    def __init__(self):
        self.s3_client = None
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
    
    def upload_file(self, file_content: bytes, filename: str, content_type: str) -> Optional[str]:
        """
        Upload a file to S3 and return the URL
        """
        if not self.s3_client or not settings.AWS_S3_BUCKET:
            # S3 not configured, return None
            return None
        
        try:
            # Generate unique filename
            file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
            unique_filename = f"avatars/{uuid.uuid4()}.{file_extension}"
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=unique_filename,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'
            )
            
            # Return the URL
            url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
            return url
            
        except ClientError as e:
            print(f"Error uploading to S3: {e}")
            return None
    
    def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from S3 given its URL
        """
        if not self.s3_client or not settings.AWS_S3_BUCKET:
            return False
        
        try:
            # Extract the key from the URL
            key = file_url.split(f"{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
            
            self.s3_client.delete_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=key
            )
            return True
            
        except ClientError as e:
            print(f"Error deleting from S3: {e}")
            return False

