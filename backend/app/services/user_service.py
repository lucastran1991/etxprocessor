from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from typing import Optional, List
import os
import random
from app.core.config import settings

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def create_user(self, user_data: UserCreate) -> User:
        hashed_password = get_password_hash(user_data.password)
        # Assign a default avatar from uploads/avatars if none provided
        default_avatar_url = None
        try:
            if settings.STORAGE_TYPE == "local":
                avatars_dir = os.path.join(settings.LOCAL_UPLOAD_DIR, settings.AVATAR_UPLOAD_SUBDIR)
                if os.path.isdir(avatars_dir):
                    candidates = [
                        f for f in os.listdir(avatars_dir)
                        if os.path.isfile(os.path.join(avatars_dir, f)) and f.lower().split('.')[-1] in {"jpg","jpeg","png","webp"}
                    ]
                    if candidates:
                        chosen = random.choice(candidates)
                        # Public URL path under /uploads
                        default_avatar_url = f"/uploads/{settings.AVATAR_UPLOAD_SUBDIR}/{chosen}"
        except Exception:
            # Non-fatal; leave as None if any error occurs
            default_avatar_url = None

        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password=hashed_password,
            role=user_data.role or 'user',
            avatar_url=default_avatar_url
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def reset_password_by_email(self, email: str, new_password: str) -> Optional[User]:
        user = self.get_user_by_email(email)
        if not user:
            return None
        user.password = get_password_hash(new_password)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).offset(skip).limit(limit).all()
