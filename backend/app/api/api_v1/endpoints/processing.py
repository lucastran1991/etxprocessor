from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.processing import processing_service
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/createorg")
async def create_org(
    data_file: str = Form(...),
    tenant_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        msg = processing_service.createorg(
            data_file=data_file,
            tenant_name=tenant_name,
            db=db,
            user=current_user,
        )
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/ingestes")
async def ingest_es(
    data_file: Optional[str] = Form(None),
    offset: int = Form(0),
    nrows: int = Form(100000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        msg = processing_service.ingestes(data_file=data_file, offset=offset, nrows=nrows, db=db, user=current_user)
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/ingestbar")
async def ingest_bar(
    data_folder: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        msg = processing_service.ingestbar(data_folder=data_folder, db=db, user=current_user)
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


