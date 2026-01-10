import uuid
import datetime
from xml.etree.ElementTree import Element, SubElement, tostring
from sqlalchemy.orm import Session, joinedload
from .. import models

NS = "http://www.omg.org/spec/ReqIF/20110401/reqif.xsd"
XSI = "http://www.w3.org/2001/XMLSchema-instance"
REQIF_SCHEMA_LOC = "http://www.omg.org/spec/ReqIF/20110401/reqif.xsd reqif.xsd"

def generate_reqif(db: Session):
    # Fetch all requirements eager loading projects
    reqs = db.query(models.Requirement).options(joinedload(models.Requirement.project)).all()
    
    # Generate UUIDs for standard types
    dt_string_id = f"_{uuid.uuid4()}"
    spec_object_type_id = f"_{uuid.uuid4()}" 
    spec_type_id = f"_{uuid.uuid4()}"
    
    # Attribute Definitions IDs
    attr_title_id = f"_{uuid.uuid4()}"
    attr_desc_id = f"_{uuid.uuid4()}"
    attr_status_id = f"_{uuid.uuid4()}"
    attr_priority_id = f"_{uuid.uuid4()}"

    # Root
    root = Element("REQ-IF", {
        "xmlns": NS,
        "xmlns:xsi": XSI,
        "xsi:schemaLocation": REQIF_SCHEMA_LOC
    })
    
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"

    # HEADER
    # Error fix: REQ-IF-HEADER must have IDENTIFIER attribute and specific sub-elements
    header_container = SubElement(root, "THE-HEADER")
    header = SubElement(header_container, "REQ-IF-HEADER", {
        "IDENTIFIER": str(uuid.uuid4())
    })
    SubElement(header, "CREATION-TIME").text = now_iso
    SubElement(header, "REQ-IF-TOOL-ID").text = "ReqTool"
    SubElement(header, "REQ-IF-VERSION").text = "1.0"
    SubElement(header, "SOURCE-TOOL-ID").text = "ReqTool"
    SubElement(header, "TITLE").text = "Exported Requirements"
    
    # CORE CONTENT
    core_content = SubElement(root, "CORE-CONTENT")
    req_if_content = SubElement(core_content, "REQ-IF-CONTENT")
    
    # 1. DATATYPES
    datatypes = SubElement(req_if_content, "DATATYPES")
    # String Type
    dt_string = SubElement(datatypes, "DATATYPE-DEFINITION-STRING", {
        "IDENTIFIER": dt_string_id,
        "LAST-CHANGE": now_iso,
        "LONG-NAME": "String",
        "MAX-LENGTH": "32000"
    })
    
    # 2. SPEC-TYPES
    spec_types = SubElement(req_if_content, "SPEC-TYPES")
    
    # SpecObjectType (Requirement Type)
    spec_obj_type = SubElement(spec_types, "SPEC-OBJECT-TYPE", {
        "IDENTIFIER": spec_object_type_id,
        "LAST-CHANGE": now_iso,
        "LONG-NAME": "Requirement Type"
    })
    spec_obj_attrs = SubElement(spec_obj_type, "SPEC-ATTRIBUTES")
    
    def add_attr_def(parent, ident, name):
        attr = SubElement(parent, "ATTRIBUTE-DEFINITION-STRING", {
            "IDENTIFIER": ident,
            "LAST-CHANGE": now_iso,
            "LONG-NAME": name
        })
        type_ref = SubElement(attr, "TYPE")
        SubElement(type_ref, "DATATYPE-DEFINITION-STRING-REF").text = dt_string_id

    add_attr_def(spec_obj_attrs, attr_title_id, "Title")
    add_attr_def(spec_obj_attrs, attr_desc_id, "Description")
    add_attr_def(spec_obj_attrs, attr_status_id, "Status")
    add_attr_def(spec_obj_attrs, attr_priority_id, "Priority")
    
    # SpecificationType (Document Type)
    spec_type = SubElement(spec_types, "SPECIFICATION-TYPE", {
        "IDENTIFIER": spec_type_id,
        "LAST-CHANGE": now_iso,
        "LONG-NAME": "Specification Type"
    })
    
    # 3. SPEC-OBJECTS (The actual requirements)
    spec_objects_container = SubElement(req_if_content, "SPEC-OBJECTS")
    
    req_uuid_map = {} # ReqID -> UUID (ReqIF Identifier)
    
    for r in reqs:
        r_uuid = f"_{uuid.uuid4()}"
        req_uuid_map[r.id] = r_uuid
        
        # Use requirement's update time if available, else now
        r_time = r.updated_at.isoformat() + "Z" if r.updated_at else now_iso
        
        so = SubElement(spec_objects_container, "SPEC-OBJECT", {
            "IDENTIFIER": r_uuid,
            "LAST-CHANGE": r_time,
            "LONG-NAME": r.id
        })
        
        # Link to Type
        type_ref = SubElement(so, "TYPE")
        SubElement(type_ref, "SPEC-OBJECT-TYPE-REF").text = spec_object_type_id
        
        # Values
        values = SubElement(so, "VALUES")
        
        def add_val(attr_id, val):
            v_attr = SubElement(values, "ATTRIBUTE-VALUE-STRING", {
                "THE-VALUE": str(val) if val else ""
            })
            d_ref = SubElement(v_attr, "DEFINITION")
            SubElement(d_ref, "ATTRIBUTE-DEFINITION-STRING-REF").text = attr_id

        add_val(attr_title_id, r.title)
        add_val(attr_desc_id, r.description)
        add_val(attr_status_id, r.status)
        add_val(attr_priority_id, r.priority)
        
    # 4. SPECIFICATIONS (Hierarchy)
    specifications = SubElement(req_if_content, "SPECIFICATIONS")
    
    # Group by project for Specifications?
    # Or just one big Specification? User wanted organized by project.
    # Let's create one Specification per Project.
    
    projects_map = {}
    roots_map = {} # project_name -> [roots]
    child_map = {} # parent_id -> [children]
    
    for r in reqs:
        p_name = r.project.name if r.project else "Unassigned"
        if p_name not in projects_map:
            projects_map[p_name] = []
        projects_map[p_name].append(r)
        
        if r.parent_id:
            child_map.setdefault(r.parent_id, []).append(r)
        else:
            roots_map.setdefault(p_name, []).append(r)
            
    sorted_p_names = sorted(projects_map.keys())
    
    for p_name in sorted_p_names:
        spec_id = f"_{uuid.uuid4()}"
        spec = SubElement(specifications, "SPECIFICATION", {
            "IDENTIFIER": spec_id,
            "LAST-CHANGE": now_iso,
            "LONG-NAME": p_name
        })
        
        type_ref = SubElement(spec, "TYPE")
        SubElement(type_ref, "SPECIFICATION-TYPE-REF").text = spec_type_id
        
        children_container = SubElement(spec, "CHILDREN")
        
        def add_hierarchy(parent_element, req):
            hierarchy_id = f"_{uuid.uuid4()}"
            r_time = req.updated_at.isoformat() + "Z" if req.updated_at else now_iso
            
            hierarchy = SubElement(parent_element, "SPEC-HIERARCHY", {
                "IDENTIFIER": hierarchy_id,
                "LAST-CHANGE": r_time
            })
            
            obj_ref = SubElement(hierarchy, "OBJECT")
            SubElement(obj_ref, "SPEC-OBJECT-REF").text = req_uuid_map[req.id]
            
            # Children
            if req.id in child_map:
                h_children_container = SubElement(hierarchy, "CHILDREN")
                for child in child_map[req.id]:
                    # Check if child is in same project (should be due to domain logic usually)
                    # currently we just strictly follow parent links
                    add_hierarchy(h_children_container, child)

        roots = roots_map.get(p_name, [])
        for root_req in roots:
            add_hierarchy(children_container, root_req)

    # 5. SPEC-RELATIONS (Traces) - TODO for later if needed, but simplest start is just objects and tree
    
    from xml.dom import minidom
    xmlstr = minidom.parseString(tostring(root)).toprettyxml(indent="  ")
    return xmlstr
