from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models.file import File
from app.schemas.file import FileCreate, FolderCreate, FileTreeNode
import uuid

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

        # Build a tree structure
        tree_dict = {}
        root_items = []

        # First, create all nodes
        for file in all_files:
            node = FileTreeNode(
                id=str(file.id),
                name=file.original_filename,
                type="folder" if file.is_folder else "file",
                size=file.file_size if not file.is_folder else None,
                mime_type=file.mime_type,
                path=file.folder_path,
                uploaded_at=file.uploaded_at,
                children=[] if file.is_folder else None
            )
            tree_dict[str(file.id)] = (node, file)

        # Build the tree structure
        for file_id, (node, file) in tree_dict.items():
            if file.folder_path == "/":
                root_items.append(node)
            else:
                # Find parent folder
                parent_path = "/".join(file.folder_path.rstrip("/").split("/")[:-1]) or "/"
                parent = next(
                    (f for f in all_files if f.is_folder and f.folder_path == parent_path and f.original_filename == file.folder_path.rstrip("/").split("/")[-1]),
                    None
                )
                if parent and str(parent.id) in tree_dict:
                    parent_node = tree_dict[str(parent.id)][0]
                    if parent_node.children is not None:
                        parent_node.children.append(node)
                else:
                    root_items.append(node)

        return root_items

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

        return {
            "total_size": total_size,
            "file_count": file_count
        }

