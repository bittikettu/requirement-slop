from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter(
    prefix="/traces",
    tags=["traces"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.TraceOut)
def create_trace(trace: schemas.TraceCreate, db: Session = Depends(get_db)):
    # Check if link exists
    existing = db.query(models.Trace).filter(
        models.Trace.source_id == trace.source_id,
        models.Trace.target_id == trace.target_id
    ).first()
    
    if existing:
        return existing
    
    # Check reverse link existence (if we want to normalize or allow both)
    # If A->B exists, do we allow B->A? 
    # Usually traceability is directed (A satisfies B, or A derives from B).
    # REQ-TRACE-002 says "automatically create a bidirectional trace link".
    # This might mean logic "If user says A refs B, system ensures relation A<->B exists".
    # Since I am using a single table, the relation IS the record.
    # But if it's strictly directed implementation-wise, "bidirectional" often means the semantic capability to traverse both ways.
    # I will allow `source->target` and rely on traversal for bidirectionality.
    
    # Check reqs exist
    source = db.query(models.Requirement).filter(models.Requirement.id == trace.source_id).first()
    target = db.query(models.Requirement).filter(models.Requirement.id == trace.target_id).first()
    if not source or not target:
        raise HTTPException(status_code=404, detail="Source or Target Requirement not found")

    new_trace = models.Trace(**trace.model_dump())
    db.add(new_trace)
    
    # Audit logic?
    # Maybe add audit to both requirements?
    db.add(models.AuditLog(req_id=source.id, action="LINK", details=f"Linked to {target.id}"))
    db.add(models.AuditLog(req_id=target.id, action="LINK", details=f"Linked from {source.id}"))
    
    db.commit()
    db.refresh(new_trace)
    return new_trace

@router.delete("/", status_code=204)
def delete_trace(source_id: str, target_id: str, db: Session = Depends(get_db)):
    trace = db.query(models.Trace).filter(
        models.Trace.source_id == source_id,
        models.Trace.target_id == target_id
    ).first()
    
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

    # REQ-TRACE-003: Prevent deletion if Approved
    source = trace.source
    target = trace.target
    
    if source.status == models.RequirementStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail=f"Cannot delete trace: Source {source.id} is Approved")
        
    if target.status == models.RequirementStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail=f"Cannot delete trace: Target {target.id} is Approved")

    db.delete(trace)
    
    # Audit
    db.add(models.AuditLog(req_id=source.id, action="UNLINK", details=f"Unlinked from {target.id}"))
    db.add(models.AuditLog(req_id=target.id, action="UNLINK", details=f"Unlinked from {source.id}"))
    
    db.commit()
    return
