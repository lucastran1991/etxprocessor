from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.processing import processing_service

router = APIRouter()


@router.post("/createorg")
async def create_org(
    dataFile: str = Form(...),
    tenantName: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    try:
        msg = processing_service.createorg(dataFile=dataFile, tenantName=tenantName)
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/ingestes")
async def ingest_es(
    dataFile: Optional[str] = Form(None),
    offset: int = Form(0),
    nrows: int = Form(100000),
    db: Session = Depends(get_db),
):
    try:
        msg = processing_service.ingestes(data_file=dataFile, offset=offset, nrows=nrows)
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/ingestbar")
async def ingest_bar(
    dataFolder: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    try:
        msg = processing_service.ingestbar(data_folder=dataFolder)
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


