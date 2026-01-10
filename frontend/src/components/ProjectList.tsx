import { useState, useEffect } from 'react';
import { getProjects, createProject } from '../api';
import type { Project } from '../api';
import { FolderPlus, Save } from 'lucide-react';

export default function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProject, setNewProject] = useState({ name: '', prefix: '' });
    const [error, setError] = useState("");

    const loadProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleCreate = async () => {
        setError("");
        if (!newProject.name || !newProject.prefix) {
            setError("Name and Prefix are required");
            return;
        }
        try {
            await createProject(newProject);
            setNewProject({ name: '', prefix: '' });
            loadProjects();
        } catch (err: unknown) {
            // @ts-expect-error: Axios type
            setError(err.response?.data?.detail || "Failed to create project");
        }
    };

    return (
        <div className="main-content">
            <h1 style={{marginBottom:'1rem'}}>Projects & Namespaces</h1>
            
            <div className="req-detail-card" style={{marginBottom:'2rem'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                    <FolderPlus size={20}/> New Project
                </h3>
                {error && <div style={{color:'red', marginBottom:'1rem'}}>{error}</div>}
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'1rem', alignItems:'end'}}>
                    <div className="field-group">
                        <label className="field-label">Project Name</label>
                        <input 
                            value={newProject.name} 
                            onChange={e => setNewProject({...newProject, name: e.target.value})}
                            placeholder="My System"
                        />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Prefix (e.g. SYS-REQ-)</label>
                        <input 
                            value={newProject.prefix} 
                            onChange={e => setNewProject({...newProject, prefix: e.target.value})}
                            placeholder="SYS-REQ-"
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate} style={{marginBottom:'2px'}}>
                        <Save size={16}/> Create
                    </button>
                </div>
            </div>

            <div className="req-list" style={{background:'var(--bg-secondary)', borderRadius:'8px', padding:'1rem'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead>
                        <tr style={{textAlign:'left', borderBottom:'1px solid var(--border)'}}>
                            <th style={{padding:'0.5rem'}}>Name</th>
                            <th style={{padding:'0.5rem'}}>Prefix</th>
                            <th style={{padding:'0.5rem'}}>Next ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(p => (
                            <tr key={p.id} style={{borderBottom:'1px solid var(--border)'}}>
                                <td style={{padding:'0.5rem'}}>{p.name}</td>
                                <td style={{padding:'0.5rem'}}><span className="badge">{p.prefix}</span></td>
                                <td style={{padding:'0.5rem'}}>{p.next_number}</td>
                            </tr>
                        ))}
                        {projects.length === 0 && <tr><td colSpan={3} style={{padding:'1rem', textAlign:'center', color:'#8b949e'}}>No projects defined</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
