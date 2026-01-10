from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/audit",
    tags=["audit"]
)

@router.get("/", response_model=List[schemas.AuditLogOut])
def get_global_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/requirements/{req_id}", response_model=List[schemas.AuditLogOut])
def get_requirement_audit_logs(req_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.AuditLog).filter(models.AuditLog.req_id == req_id).order_by(models.AuditLog.timestamp.desc()).all()
