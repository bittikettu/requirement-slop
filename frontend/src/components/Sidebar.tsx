import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, Boxes, FileText, RefreshCw, ChevronRight, ChevronDown, History, Settings } from 'lucide-react';
import { getRequirements, getProjects } from '../api';
import type { Requirement, Project } from '../api';

interface TreeItemProps {
    req: Requirement;
    allReqs: Requirement[];
    expanded: Set<string>;
    toggleExpanded: (id: string) => void;
}

function TreeItem({ req, allReqs, expanded, toggleExpanded }: TreeItemProps) {
    const children = useMemo(() => allReqs.filter(r => r.parent_id === req.id), [allReqs, req.id]);
    const isExpanded = expanded.has(req.id);
    const hasChildren = children.length > 0;

    return (
        <div className="tree-node">
            <div className="tree-row">
                {hasChildren ? (
                    <button className="toggle-btn" onClick={() => toggleExpanded(req.id)}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <div style={{ width: 14 }}></div>
                )}
                <NavLink 
                    to={`/requirements/${req.id}`}
                    className={({isActive}) => `req-link ${isActive ? 'active' : ''}`}
                >
                    <span className="req-id">{req.id}</span>
                    <span className="req-title">{req.title}</span>
                </NavLink>
            </div>
            {hasChildren && isExpanded && (
                <div className="tree-children">
                    {children.map(child => (
                        <TreeItem 
                            key={child.id} 
                            req={child} 
                            allReqs={allReqs} 
                            expanded={expanded} 
                            toggleExpanded={toggleExpanded} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    const navigate = useNavigate();
    const [reqs, setReqs] = useState<Requirement[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [projectExpanded, setProjectExpanded] = useState<Set<number>>(new Set());

    const loadData = async () => {
        try {
            const [rData, pData] = await Promise.all([getRequirements(), getProjects()]);
            setReqs(rData);
            setProjects(pData);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [rData, pData] = await Promise.all([getRequirements(), getProjects()]);
                setReqs(rData);
                setProjects(pData);
            } catch (e) {
                console.error(e);
            }
        };

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpanded(newExpanded);
    };

    const toggleProject = (id: number) => {
        const newExpanded = new Set(projectExpanded);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setProjectExpanded(newExpanded);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>ReqTool</h2>
                <button className="btn btn-icon" onClick={loadData}><RefreshCw size={14} /></button>
            </div>

            <div className="sidebar-actions">
                <NavLink to="/requirements/new" className="btn btn-primary main-new-btn">
                    <Plus size={16} /> New
                </NavLink>
            </div>

            <nav className="nav-secondary">
                <NavLink to="/traceability" className="nav-btn"><Boxes size={16} /> Trace</NavLink>
                <NavLink to="/export" className="nav-btn"><FileText size={16} /> Doc</NavLink>
                <NavLink to="/projects" className="nav-btn"><RefreshCw size={16} /> Projects</NavLink>
                <NavLink to="/history" className="nav-btn"><History size={16} /> History</NavLink>
                <NavLink to="/settings" className="nav-btn"><Settings size={16} /> Settings</NavLink>
            </nav>

            <div className="sidebar-content">
                {projects.map(p => {
                    const projectReqs = reqs.filter(r => r.project_id === p.id);
                    const rootReqs = projectReqs.filter(r => !r.parent_id);
                    const isExpanded = projectExpanded.has(p.id);

                    return (
                        <div key={p.id} className="project-group">
                            <div className="project-header">
                                <button className="toggle-btn" onClick={() => toggleProject(p.id)}>
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <span className="project-name" onClick={() => toggleProject(p.id)}>{p.name}</span>
                                <button 
                                    className="add-btn" 
                                    title="Add requirement to project"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/requirements/new?project_id=${p.id}`);
                                    }}
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="project-children">
                                    {rootReqs.map(r => (
                                        <TreeItem 
                                            key={r.id} 
                                            req={r} 
                                            allReqs={projectReqs} 
                                            expanded={expanded} 
                                            toggleExpanded={toggleExpanded} 
                                        />
                                    ))}
                                    {projectReqs.length === 0 && (
                                        <div className="empty-msg">No requirements</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
