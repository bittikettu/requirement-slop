from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..scripts.asciidoc_generator import generate_asciidoc
from .. import database

router = APIRouter(
    prefix="/export",
    tags=["export"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/asciidoc")
def export_asciidoc(
    status_filter: str = Query(None, alias="status"),
    priority_filter: str = Query(None, alias="priority"),
    db: Session = Depends(get_db)
):
    # Logic to fetch and generate
    # We'll delegate to a helper script/function to keep router clean
    content = generate_asciidoc(db, status_filter, priority_filter)
    return {"content": content}
