from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum

class RequirementStatus(str, Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"
    RELEASED = "Released"

class ProjectBase(BaseModel):
    name: str
    prefix: str

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    next_number: int
    
    model_config = ConfigDict(from_attributes=True)


class TraceBase(BaseModel):
    pass

class TraceCreate(TraceBase):
    target_id: str

class TraceOut(BaseModel):
    source_id: str
    target_id: str
    
    model_config = ConfigDict(from_attributes=True)

class RequirementBase(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    rationale: Optional[str] = None
    priority: str = "Medium"
    status: RequirementStatus = RequirementStatus.DRAFT
    parent_id: Optional[str] = None
    project_id: Optional[int] = None

class RequirementCreate(RequirementBase):
    pass

class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    rationale: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[RequirementStatus] = None
    status: Optional[RequirementStatus] = None
    parent_id: Optional[str] = None
    project_id: Optional[int] = None

class RequirementOut(RequirementBase):
    project_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class RequirementNode(RequirementOut):
    # For tree structure, simplified
    children: List["RequirementNode"] = []

class RequirementDetail(RequirementOut):
    outgoing_traces: List[TraceOut] = []
    incoming_traces: List[TraceOut] = []
    children: List[RequirementOut] = []

class EARSVerificationRequest(BaseModel):
    title: str

class EARSVerificationResponse(BaseModel):
    is_compliant: bool
    pattern: Optional[str] = None
    hint: Optional[str] = None

class AuditLogOut(BaseModel):
    id: int
    req_id: Optional[str] = None
    timestamp: datetime
    author: str
    action: str
    details: str

    model_config = ConfigDict(from_attributes=True)
