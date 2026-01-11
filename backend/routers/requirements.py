from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from ..scripts.ears_verifier import verify_ears
from .. import ai_service
from datetime import datetime

router = APIRouter(
    prefix="/requirements",
    tags=["requirements"]
)


@router.get("/matrix", response_model=List[schemas.RequirementDetail])
def get_traceability_matrix(db: Session = Depends(database.get_db)):
    return db.query(models.Requirement).all()

@router.get("/models", response_model=List[str])
async def list_ai_models():
    return await ai_service.list_models()

@router.post("/verify-ears", response_model=schemas.EARSVerificationResponse)
def verify_req_ears(req: schemas.EARSVerificationRequest):
    compliant, pattern, params = verify_ears(req.title)
    
    hint = None
    if not compliant:
        hint = "Try following an EARS pattern, e.g., 'The <system> shall <action>'"
    else:
        # Map pattern to a more friendly name
        friendly_names = {
            "ubiquitous": "Ubiquitous",
            "event_driven": "Event-driven",
            "state_driven": "State-driven",
            "unwanted_behavior": "Unwanted behavior",
            "optional_feature": "Optional feature"
        }
        pattern = friendly_names.get(pattern, pattern)

    return schemas.EARSVerificationResponse(
        is_compliant=compliant,
        pattern=pattern,
        hint=hint
    )

@router.post("/generate-description")
async def generate_req_description(req: schemas.AIDescriptionRequest):
    return StreamingResponse(ai_service.generate_description(req.title, req.current_description, req.model), media_type="text/plain")

@router.post("/generate-rationale")
async def generate_req_rationale(req: schemas.AIRationaleRequest):
    return StreamingResponse(ai_service.generate_rationale(req.title, req.description, req.current_rationale, req.model), media_type="text/plain")

@router.post("/", response_model=schemas.RequirementOut)
def create_requirement(req: schemas.RequirementCreate, db: Session = Depends(database.get_db)):
    # Auto-numbering logic
    if req.project_id:
        project = db.query(models.Project).filter(models.Project.id == req.project_id).with_for_update().first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate ID: PREFIX + next_number
        generated_id = f"{project.prefix}{project.next_number}"
        
        # Ensure generated ID doesn't exist (safety)
        if db.query(models.Requirement).filter(models.Requirement.id == generated_id).first():
             # Fallback/Error if manually taken?
             # For now, just raise
             raise HTTPException(status_code=400, detail=f"Auto-generated ID {generated_id} already exists. Check project counter.")
             
        req.id = generated_id
        
        # Increment counter
        project.next_number += 1
        db.add(project)
    
    # ID Uniqueness check (manual or auto)
    if db.query(models.Requirement).filter(models.Requirement.id == req.id).first():
        raise HTTPException(status_code=400, detail="Requirement ID already exists")
    
    # Parent validity
    if req.parent_id:
        if not db.query(models.Requirement).filter(models.Requirement.id == req.parent_id).first():
             raise HTTPException(status_code=400, detail="Parent Requirement ID not found")

    new_req = models.Requirement(**req.model_dump())
    db.add(new_req)
    
    # Audit Log
    audit = models.AuditLog(
        req_id=new_req.id,
        action="CREATE",
        details=f"Created requirement {new_req.id}"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(new_req)
    return new_req

@router.get("/", response_model=List[schemas.RequirementOut])
def list_requirements(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Requirement).offset(skip).limit(limit).all()

@router.get("/{req_id}", response_model=schemas.RequirementDetail)
def read_requirement(req_id: str, db: Session = Depends(database.get_db)):
    req = db.query(models.Requirement).filter(models.Requirement.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return req

@router.put("/{req_id}", response_model=schemas.RequirementOut)
def update_requirement(req_id: str, update_data: schemas.RequirementUpdate, db: Session = Depends(database.get_db)):
    req = db.query(models.Requirement).filter(models.Requirement.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Capture changes for Audit
    changes = []
    
    if update_data.title is not None and update_data.title != req.title:
        changes.append(f"Title: '{req.title}' -> '{update_data.title}'")
        req.title = update_data.title
        
    if update_data.description is not None and update_data.description != req.description:
        changes.append("Description updated")
        req.description = update_data.description

    if update_data.rationale is not None:
        req.rationale = update_data.rationale
    
    if update_data.priority is not None:
        changes.append(f"Priority: {req.priority} -> {update_data.priority}")
        req.priority = update_data.priority

    if update_data.status is not None:
        # Check if changing FROM Approved, check permissions? (Not requested, just state rule)
        # Check if changing TO Approved? 
        changes.append(f"Status: {req.status} -> {update_data.status}")
        req.status = update_data.status.value

    if update_data.parent_id is not None:
        if update_data.parent_id != req.parent_id:
             if update_data.parent_id and not db.query(models.Requirement).filter(models.Requirement.id == update_data.parent_id).first():
                 raise HTTPException(status_code=400, detail="Parent ID not found")
             req.parent_id = update_data.parent_id
             changes.append(f"Parent: {req.parent_id} -> {update_data.parent_id}")

    if not changes:
        return req # No Db update needed

    req.updated_at = datetime.utcnow()
    
    # Audit
    audit = models.AuditLog(
        req_id=req_id,
        action="UPDATE",
        details="; ".join(changes)
    )
    db.add(audit)
    
    db.commit()
    db.refresh(req)
    return req

@router.delete("/{req_id}")
def delete_requirement(req_id: str, db: Session = Depends(database.get_db)):
    req = db.query(models.Requirement).filter(models.Requirement.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    # Constraint: "While a requirement is in the “Approved” state, the application shall prevent deletion of trace links."
    # If we delete the requirement, we delete trace links (cascade). 
    # So if THIS requirement is Approved, or if it is linked to an Approved requirement?
    # REQ-TRACE-003 says "While a requirement is in the “Approved” state, the application shall prevent deletion of trace links."
    # If we delete the requirement, the links are deleted.
    # So if this req is Approved, we can't delete it (as it would delete links).
    # ALSO if it is linked to another req that is Approved, we can't delete the link.
    
    # 1. Check if self is Approved
    if req.status == models.RequirementStatus.APPROVED.value:
         if req.outgoing_traces or req.incoming_traces:
             raise HTTPException(status_code=400, detail="Cannot delete Approved requirement with active traces.")
    
    # 2. Check connected requirements for Approved status
    for trace in req.outgoing_traces:
        if trace.target.status == models.RequirementStatus.APPROVED.value:
            raise HTTPException(status_code=400, detail=f"Cannot delete: Linked to Approved requirement {trace.target_id}")

    for trace in req.incoming_traces:
        if trace.source.status == models.RequirementStatus.APPROVED.value:
             raise HTTPException(status_code=400, detail=f"Cannot delete: Linked from Approved requirement {trace.source_id}")

    db.delete(req)
    db.commit()
    return {"ok": True}
