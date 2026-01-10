from sqlalchemy.orm import Session
from .. import models

def generate_asciidoc(db: Session, status_filter: str = None, priority_filter: str = None):
    query = db.query(models.Requirement)
    
    if status_filter:
        query = query.filter(models.Requirement.status == status_filter)
    if priority_filter:
        query = query.filter(models.Requirement.priority == priority_filter)
        
    reqs = query.all()
    req_map = {r.id: r for r in reqs}
    
    # helper to find level
    def get_level(r):
        level = 1
        current = r
        # limit depth to avoid infinite loop if cyclic (though UI prevents it)
        depth = 0
        while current.parent_id and current.parent_id in req_map and depth < 10:
            current = req_map[current.parent_id]
            level += 1
            depth += 1
        return level

    # Sort checks: maybe sort by ID or Title
    # For hierarchy, we want to print parents before children usually, OR
    # AsciiDoc structure depends on `==` vs `===`.
    # If we just dump them in order with correct `=` header depth, AsciiDoc handles the nesting visually.
    
    # We need to sort by hierarchy order
    # Build a tree
    children_map = {}
    roots = []
    
    # Note: if parent is filtered out, the node acts as a root
    for r in reqs:
        if r.parent_id and r.parent_id in req_map:
            children_map.setdefault(r.parent_id, []).append(r)
        else:
            roots.append(r)
            
    output = []
    output.append("= Requirements Document")
    output.append(":toc:")
    output.append("")

    def visit(r, level):
        # Header
        # Level 1 = ==
        # Level 2 = ===
        header_marker = "=" * (level + 1)
        
        # Add anchor and header
        output.append(f"[[{r.id}]]")
        output.append(f"{header_marker} {r.id}: {r.title}")
        output.append("")
        
        # Attributes
        # Attributes
        output.append("[horizontal]")
        output.append(f"Description:: {r.description or 'N/A'}")
        output.append(f"Rationale:: {r.rationale or 'N/A'}")
        output.append(f"Priority:: {r.priority}")
        output.append(f"Status:: {r.status}")
        
        # Traces
        if r.outgoing_traces:
            output.append("*Traces to:*")
            links = []
            for t in r.outgoing_traces:
                links.append(f"<<{t.target_id}>>")
            output.append(", ".join(links))
        
        # Incoming? "Referenced by" (Skipped unless requested, keep consistent with previous logic)
        
        output.append("")
        
        # Children
        if r.id in children_map:
            for child in children_map[r.id]:
                visit(child, level + 1)

    for root in roots:
        visit(root, 1)

    return "\n".join(output)
