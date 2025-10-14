from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models.file import File
from app.schemas.file import FileCreate, FolderCreate, FileTreeNode
import uuid
import os
from app.services.storage_service import storage_service

class FileService:
    def __init__(self, db: Session):
        self.db = db

    def create_file(self, file_data: FileCreate) -> File:
        """Create a new file record"""
        db_file = File(
            id=uuid.uuid4(),
            user_id=file_data.user_id,
            filename=file_data.filename,
            original_filename=file_data.original_filename,
            file_path=file_data.file_path,
            file_size=file_data.file_size,
            mime_type=file_data.mime_type,
            folder_path=file_data.folder_path,
            is_folder=file_data.is_folder,
            parent_id=file_data.parent_id
        )
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def create_folder(self, user_id: str, folder_data: FolderCreate) -> File:
        """Create a new folder"""
        folder_path = f"{folder_data.parent_path.rstrip('/')}/{folder_data.folder_name}"
        
        db_folder = File(
            id=uuid.uuid4(),
            user_id=user_id,
            filename=folder_data.folder_name,
            original_filename=folder_data.folder_name,
            file_path=folder_path,
            file_size=0,
            mime_type=None,
            folder_path=folder_path,
            is_folder=True
        )
        self.db.add(db_folder)
        self.db.commit()
        self.db.refresh(db_folder)
        return db_folder

    def get_user_files(self, user_id: str, folder_path: str = "/") -> List[File]:
        """Get all files in a specific folder for a user"""
        return self.db.query(File).filter(
            and_(
                File.user_id == user_id,
                File.folder_path == folder_path
            )
        ).order_by(File.is_folder.desc(), File.original_filename).all()

    def get_file_by_id(self, file_id: str, user_id: str) -> Optional[File]:
        """Get a specific file by ID"""
        return self.db.query(File).filter(
            and_(
                File.id == file_id,
                File.user_id == user_id
            )
        ).first()

    def get_file_content(self, file_id: str, user_id: str) -> Optional[bytes]:
        """Return file content as bytes for a user's file_id. None if not found or is a folder."""
        f = self.get_file_by_id(file_id, user_id)
        if not f or f.is_folder:
            return None
        return storage_service.read_file_bytes(f.file_path)

    def get_file_path(self, file_id: str, user_id: str) -> Optional[str]:
        """Return file path for a user's file_id. None if not found or is a folder."""
        f = self.get_file_by_id(file_id, user_id)
        if not f or f.is_folder:
            return None
        return f.file_path

    def get_file_name_and_extension(self, file_id: str, user_id: str) -> Optional[tuple[str, str]]:
        """Get the file base name and extension (including leading dot) for a user's file.
        Returns (None, None) if not found or is a folder.
        """
        f = self.get_file_by_id(file_id, user_id)
        if not f or f.is_folder:
            return (None, None)
        if not f.filename:
            return (None, None)
        fname, ext = os.path.splitext(os.path.basename(f.filename))
        return (fname, ext if ext else None)

    def get_file_name(self, file_id: str, user_id: str) -> Optional[str]:
        """Get the file name for a user's file. Returns None if not found or is a folder."""
        f = self.get_file_by_id(file_id, user_id)
        if not f or f.is_folder:
            return None
        if not f.filename:
            return None
        fname, _ = os.path.splitext(os.path.basename(f.filename))
        return fname or None
    
    def ensure_folder_hierarchy(self, user_id: str, folder_path: str) -> None:
        """Ensure that all folders in the given folder_path exist for the user."""
        if not folder_path or folder_path == '/':
            return

        # Normalize path (no trailing slash, always starts with '/')
        normalized = '/' + folder_path.strip('/')
        parts = [p for p in normalized.split('/') if p]

        current_path = ''
        for idx, part in enumerate(parts):
            current_path = f"{current_path}/{part}" if current_path else f"/{part}"

            # Does this folder exist?
            existing = self.db.query(File).filter(
                and_(
                    File.user_id == user_id,
                    File.is_folder == True,
                    File.folder_path == current_path
                )
            ).first()

            if not existing:
                folder = File(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    filename=part,
                    original_filename=part,
                    file_path=current_path,
                    file_size=0,
                    mime_type=None,
                    folder_path=current_path,
                    is_folder=True,
                    parent_id=None
                )
                self.db.add(folder)
                self.db.commit()
                self.db.refresh(folder)

    def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete a file or folder (and all its contents)"""
        file = self.get_file_by_id(file_id, user_id)
        if not file:
            return False

        if file.is_folder:
            # Delete all files in this folder recursively
            self._delete_folder_contents(file.folder_path, user_id)

        self.db.delete(file)
        self.db.commit()
        return True

    def _delete_folder_contents(self, folder_path: str, user_id: str):
        """Recursively delete all contents of a folder"""
        files = self.db.query(File).filter(
            and_(
                File.user_id == user_id,
                File.folder_path.like(f"{folder_path}%")
            )
        ).all()
        
        for file in files:
            self.db.delete(file)

    def get_file_tree(self, user_id: str) -> List[FileTreeNode]:
        """Get the complete file tree structure for a user"""
        all_files = self.db.query(File).filter(
            File.user_id == user_id
        ).order_by(File.folder_path, File.is_folder.desc(), File.original_filename).all()

        if not all_files:
            return []

        # Create a mapping of folder_path -> folder node
        folder_map = {}
        
        # Separate folders and files
        folders = [f for f in all_files if f.is_folder]
        files = [f for f in all_files if not f.is_folder]
        
        # First pass: Create all folder nodes
        for folder in folders:
            node = FileTreeNode(
                id=str(folder.id),
                name=folder.original_filename,
                type="folder",
                size=None,
                mime_type=None,
                path=folder.folder_path,
                uploaded_at=folder.uploaded_at,
                children=[]
            )
            # Map the full path of this folder for easy lookup
            full_path = folder.folder_path.rstrip('/') if folder.folder_path != '/' else '/'
            folder_map[full_path] = node
        
        # Second pass: Build folder hierarchy
        root_folders = []
        orphaned_folders = []
        
        for folder in folders:
            full_path = folder.folder_path.rstrip('/') if folder.folder_path != '/' else '/'
            node = folder_map[full_path]
            
            if folder.folder_path == '/':
                # Root level folder
                root_folders.append(node)
            else:
                # Find parent folder path
                parent_path = '/'.join(folder.folder_path.rstrip('/').split('/')[:-1])
                if not parent_path:
                    parent_path = '/'
                
                # Try to find parent in folder_map
                if parent_path in folder_map:
                    folder_map[parent_path].children.append(node)
                else:
                    # Parent doesn't exist, this is an orphaned folder
                    orphaned_folders.append(node)
        
        # Third pass: Add files to their respective folders
        root_files = []
        orphaned_files = []
        
        for file in files:
            node = FileTreeNode(
                id=str(file.id),
                name=file.original_filename,
                type="file",
                size=file.file_size,
                mime_type=file.mime_type,
                # Use the stored file path so the frontend can resolve a direct URL
                # For local storage this is a path under uploads/, for S3 this is the key
                path=file.file_path,
                uploaded_at=file.uploaded_at,
                children=None
            )
            
            if file.folder_path == '/':
                # Root level file
                root_files.append(node)
            else:
                # Try to find parent folder
                parent_path = file.folder_path.rstrip('/')
                if parent_path in folder_map:
                    folder_map[parent_path].children.append(node)
                else:
                    # Parent folder doesn't exist, this is an orphaned file
                    orphaned_files.append(node)
        
        # Sort children of each folder: folders first, then files, alphabetically
        for folder_node in folder_map.values():
            if folder_node.children:
                folder_node.children.sort(key=lambda x: (x.type == 'file', x.name.lower()))
        
        # Build final result: root folders, root files, orphaned folders, orphaned files
        result = []
        
        # Add root folders (sorted)
        root_folders.sort(key=lambda x: x.name.lower())
        result.extend(root_folders)
        
        # Add root files (sorted)
        root_files.sort(key=lambda x: x.name.lower())
        result.extend(root_files)
        
        # Add orphaned folders at the bottom (sorted)
        orphaned_folders.sort(key=lambda x: x.name.lower())
        result.extend(orphaned_folders)
        
        # Add orphaned files at the bottom (sorted)
        orphaned_files.sort(key=lambda x: x.name.lower())
        result.extend(orphaned_files)
        
        return result

    def search_files(self, user_id: str, query: str) -> List[File]:
        """Search files by name"""
        return self.db.query(File).filter(
            and_(
                File.user_id == user_id,
                File.original_filename.ilike(f"%{query}%")
            )
        ).all()

    def get_storage_usage(self, user_id: str) -> dict:
        """Get total storage usage for a user"""
        total_size = self.db.query(func.sum(File.file_size)).filter(
            and_(
                File.user_id == user_id,
                File.is_folder == False
            )
        ).scalar() or 0

        file_count = self.db.query(File).filter(
            and_(
                File.user_id == user_id,
                File.is_folder == False
            )
        ).count()
        # Category counts
        images_count = self.db.query(func.count()).filter(
            and_(
                File.user_id == user_id,
                File.is_folder == False,
                File.mime_type.isnot(None),
                File.mime_type.like('image/%')
            )
        ).scalar() or 0
        pdf_count = self.db.query(func.count()).filter(
            and_(
                File.user_id == user_id,
                File.is_folder == False,
                File.mime_type == 'application/pdf'
            )
        ).scalar() or 0
        csv_count = self.db.query(func.count()).filter(
            and_(
                File.user_id == user_id,
                File.is_folder == False,
                or_(
                    File.mime_type == 'text/csv',
                    File.mime_type == 'application/vnd.ms-excel'
                )
            )
        ).scalar() or 0
        others_count = max(file_count - (images_count + pdf_count + csv_count), 0)

        return {
            "total_size": total_size,
            "file_count": file_count,
            "by_type": {
                "images": images_count,
                "pdf": pdf_count,
                "csv": csv_count,
                "others": others_count
            }
        }

