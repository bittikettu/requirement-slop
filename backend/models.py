from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship, backref
from datetime import datetime
import enum
from .database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    prefix = Column(String, unique=True, index=True) # e.g. "KAS-REQ-"
    next_number = Column(Integer, default=1)
    
    requirements = relationship("Requirement", back_populates="project")

class RequirementStatus(str, enum.Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"
    RELEASED = "Released"

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(String, primary_key=True, index=True) # Manual ID like REQ-001
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    rationale = Column(String, nullable=True)
    priority = Column(String, default="Medium")
    status = Column(String, default=RequirementStatus.DRAFT.value)
    parent_id = Column(String, ForeignKey("requirements.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="requirements")

    # Self-referential relationship for hierarchy
    # Self-referential relationship for hierarchy
    children = relationship("Requirement", 
                            backref=backref("parent", remote_side=[id]), 
                            cascade="all")

    # Traces
    outgoing_traces = relationship("Trace", foreign_keys="[Trace.source_id]", back_populates="source", cascade="all, delete-orphan")
    incoming_traces = relationship("Trace", foreign_keys="[Trace.target_id]", back_populates="target", cascade="all, delete-orphan")

class Trace(Base):
    __tablename__ = "traces"

    source_id = Column(String, ForeignKey("requirements.id"), primary_key=True)
    target_id = Column(String, ForeignKey("requirements.id"), primary_key=True)
    
    source = relationship("Requirement", foreign_keys=[source_id], back_populates="outgoing_traces")
    target = relationship("Requirement", foreign_keys=[target_id], back_populates="incoming_traces")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    req_id = Column(String, ForeignKey("requirements.id"), nullable=True) # Nullable if global action
    timestamp = Column(DateTime, default=datetime.utcnow)
    author = Column(String, default="System")
    action = Column(String) # CREATE, UPDATE, DELETE, LINK, UNLINK
    details = Column(String) # JSON or text diff
