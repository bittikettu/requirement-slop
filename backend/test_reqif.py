import asyncio
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.scripts.reqif_generator import generate_reqif
import xml.etree.ElementTree as ET

def test_reqif_relations():
    db = SessionLocal()
    try:
        xml_content = generate_reqif(db)
        print("Generated ReqIF content length:", len(xml_content))
        
        # Parse XML to check for SPEC-RELATIONS
        root = ET.fromstring(xml_content)
        
        # ReqIF namespace
        ns = {"reqif": "http://www.omg.org/spec/ReqIF/20110401/reqif.xsd"}
        
        relations = root.findall(".//reqif:SPEC-RELATION", ns)
        print(f"Found {len(relations)} SPEC-RELATION elements.")
        
        for rel in relations:
            rel_id = rel.get("IDENTIFIER")
            source = rel.find("reqif:SOURCE/reqif:SPEC-OBJECT-REF", ns).text
            target = rel.find("reqif:TARGET/reqif:SPEC-OBJECT-REF", ns).text
            print(f"Relation {rel_id}: {source} -> {target}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_reqif_relations()
