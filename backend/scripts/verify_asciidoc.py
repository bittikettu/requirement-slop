import sys
import os

# Add the parent directory to sys.path to import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend import models
from backend.scripts.asciidoc_generator import generate_asciidoc

# Setup an in-memory database for testing
engine = create_engine("sqlite:///:memory:")
models.Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_asciidoc_traceability():
    db = SessionLocal()
    try:
        # Create a project
        project = models.Project(id=1, name="Test Project", prefix="TP-", next_number=3)
        db.add(project)
        
        # Create requirements
        r1 = models.Requirement(id="TP-001", title="Req 1", project_id=1)
        r2 = models.Requirement(id="TP-002", title="Req 2", project_id=1)
        db.add_all([r1, r2])
        db.commit()
        
        # Create traces
        t1 = models.Trace(source_id="TP-001", target_id="TP-002")
        db.add(t1)
        db.commit()
        
        # Refresh to get relationships
        db.refresh(r1)
        db.refresh(r2)
        
        # Generate AsciiDoc
        # We need to use the actual session and ensure relationships are loaded
        # generate_asciidoc already uses joinedload for project, and we access traces
        output = generate_asciidoc(db)
        
        print("--- Generated AsciiDoc ---")
        print(output)
        print("--------------------------")
        
        # Basic validation
        assert "== Traceability Diagram" in output
        assert "[plantuml, traceability_diag, svg]" in output
        assert "rectangle \"TP-001\\nReq 1\" as TP_001 <<Draft>>" in output
        assert "TP_001 --> TP_002" in output
        assert "== Traceability Matrix" in output
        assert "| ID | Title | Traces To | Traces From" in output
        assert "| <<TP-001>> | Req 1 | <<TP-002>> | N/A" in output
        assert "| <<TP-002>> | Req 2 | N/A | <<TP-001>>" in output
        
        print("Verification Successful!")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_asciidoc_traceability()
