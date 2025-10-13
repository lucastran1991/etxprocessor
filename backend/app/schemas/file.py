from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import uuid

class FileBase(BaseModel):
    original_filename: str
    file_size: int
    mime_type: Optional[str] = None
    folder_path: str = "/"
    is_folder: bool = False

class FileCreate(FileBase):
    filename: str
    file_path: str
    user_id: str
    parent_id: Optional[str] = None

class FileResponse(FileBase):
    id: str
    filename: str
    file_path: str
    user_id: str
    parent_id: Optional[str] = None
    uploaded_at: datetime
    updated_at: Optional[datetime] = None
    children: Optional[List['FileResponse']] = None

    @field_validator('id', 'user_id', 'parent_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is None:
            return v
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class FolderCreate(BaseModel):
    folder_name: str
    parent_path: str = "/"

class FileTreeNode(BaseModel):
    id: str
    name: str
    type: str  # 'file' or 'folder'
    size: Optional[int] = None
    mime_type: Optional[str] = None
    path: str
    uploaded_at: datetime
    children: Optional[List['FileTreeNode']] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is None:
            return v
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

# Enable forward references
FileResponse.model_rebuild()
FileTreeNode.model_rebuild()

