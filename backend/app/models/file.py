from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Path in S3 or local storage
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    folder_path = Column(String(1000), default="/")  # Virtual folder path
    is_folder = Column(Boolean, default=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    user = relationship("User", backref="files")
    parent = relationship("File", remote_side=[id], backref="children")

    def __repr__(self):
        return f"<File {self.original_filename}>"

