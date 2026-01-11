from sqlalchemy.orm import Session, joinedload
from .. import models

def generate_asciidoc(db: Session, status_filter: str = None, priority_filter: str = None):
    # Eager load project to avoid N+1 and ensure we have project names
    query = db.query(models.Requirement).options(joinedload(models.Requirement.project))
    
    if status_filter:
        query = query.filter(models.Requirement.status == status_filter)
    if priority_filter:
        query = query.filter(models.Requirement.priority == priority_filter)
        
    reqs = query.all()
    req_map = {r.id: r for r in reqs}
    
    # Build tree structure
    children_map = {}
    roots = []
    
    # Note: if parent is filtered out, the node acts as a root
    for r in reqs:
        if r.parent_id and r.parent_id in req_map:
            children_map.setdefault(r.parent_id, []).append(r)
        else:
            roots.append(r)
            
    # Group roots by project
    projects_map = {} # project_name -> [roots]
    
    for r in roots:
        p_name = r.project.name if r.project else "Unassigned"
        projects_map.setdefault(p_name, []).append(r)
        
    output = []
    output.append("= Requirements Document")
    output.append(":doctype: book")
    output.append(":toc:")
    output.append("")

    def visit(r, level):
        # Header
        # Base level for projects is == (Level 1)
        # So Req Level 1 = === (Level 2)
        # Req Level N = === + N
        
        # level passed in starts at 1
        # If project is == (depth 1), then first req is === (depth 2)
        # So header length = level + 2
        
        header_marker = "=" * (level + 2)
        
        # Add anchor and header
        output.append(f"[[{r.id}]]")
        output.append(f"{header_marker} {r.id}: {r.title}")
        output.append("")
        
        # Attributes
        output.append("[horizontal]")
        output.append(f"Description::\n{r.description or 'N/A'}")
        output.append(f"Rationale::\n{r.rationale or 'N/A'}")
        output.append(f"Priority::\n{r.priority}")
        output.append(f"Status::\n{r.status}")
        
        # Traces
        if r.outgoing_traces:
            output.append("Traces to::\n")
            links = []
            for t in r.outgoing_traces:
                links.append(f"- <<{t.target_id}>>")
            output.append("\n".join(links))
        
        output.append("")
        
        # Children
        if r.id in children_map:
            for child in children_map[r.id]:
                visit(child, level + 1)

    # Sort projects and keys
    sorted_project_names = sorted(projects_map.keys())
    
    for p_name in sorted_project_names:
        project_roots = projects_map[p_name]
        
        # Project Header
        output.append(f"== {p_name}")
        output.append("")
        
        # Visit roots
        # Roots are level 1 requirements relative to the project
        for root in project_roots:
            visit(root, 1)

    # Traceability Matrix
    output.append("")
    output.append("== Traceability Matrix")
    output.append("")
    output.append("[cols=\"1,2,2,2\", options=\"header\"]")
    output.append("|===")
    output.append("| ID | Title | Traces To | Traces From")
    
    # Sort all requirements by ID for the matrix
    sorted_reqs = sorted(reqs, key=lambda x: x.id)
    
    for r in sorted_reqs:
        traces_to = ", ".join([f"<<{t.target_id}>>" for t in r.outgoing_traces]) or "N/A"
        traces_from = ", ".join([f"<<{t.source_id}>>" for t in r.incoming_traces]) or "N/A"
        
        output.append(f"| <<{r.id}>> | {r.title} | {traces_to} | {traces_from}")
    
    output.append("|===")

    return "\n".join(output)
