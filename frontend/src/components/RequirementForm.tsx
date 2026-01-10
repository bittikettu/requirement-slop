import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequirement, getProjects } from '../api';
import type { Requirement, Project } from '../api';
import { Save } from 'lucide-react';

export default function RequirementForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<Requirement>>({
        id: "",
        title: "",
        description: "",
        rationale: "",
        priority: "Medium",
        status: "Draft",
        parent_id: ""
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>(""); 
    const [error, setError] = useState("");

    useEffect(() => {
        getProjects().then(setProjects).catch(console.error);
    }, []);

    const handleSave = async () => {
        if(!form.title) {
             setError("Title is required");
             return;
        }
        if (!selectedProject && !form.id) {
            setError("ID is required (or select a Project for auto-ID)");
            return;
        }
        try {
            const reqData = { ...form };
            if (selectedProject) {
                reqData.project_id = parseInt(selectedProject);
                // ID will be ignored/overwritten by backend, but let's ensure it's not empty string if validation requires it?
                // Actually backend req.id is required in schema?
                // RequirementBase has id: str. So we must send *something*.
                // But backend create_requirement reassigns it.
                // However, Pydantic validation happens BEFORE function body.
                // So we must send a dummy ID if it's empty.
                if (!reqData.id) reqData.id = "generate"; 
            }
            const created = await createRequirement(reqData);
            navigate(`/requirements/${created.id}`);
            // Force reload sidebar? it polls.
        } catch (err: unknown) {
            // @ts-expect-error: Axios error type handling needs refinement
            setError(err.response?.data?.detail || "Failed to create");
        }
    }

    return (
        <div className="main-content">
            <div className="req-detail-card">
                 <h1 style={{marginBottom:'1rem'}}>New Requirement</h1>
                 
                 {error && <div style={{background:'rgba(248,81,73,0.15)', color:'#ff7b72', padding:'1rem', borderRadius:'6px', marginBottom:'1rem'}}>
                    {error}
                </div>}

                 <div className="field-group">
                    <label className="field-label">Project (Auto-Numbering)</label>
                    <select 
                        value={selectedProject} 
                        onChange={e => {
                            setSelectedProject(e.target.value);
                            if(e.target.value) setForm({...form, id: "Auto-generated"});
                            else setForm({...form, id: ""});
                        }}
                    >
                        <option value="">-- Manual ID --</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.prefix})</option>)}
                    </select>
                </div>

                 <div className="field-group">
                    <label className="field-label">Unique ID (e.g. REQ-001)</label>
                    <input 
                        value={form.id} 
                        onChange={e => setForm({...form, id: e.target.value})} 
                        placeholder="REQ-XXXX"
                        disabled={!!selectedProject}
                        style={selectedProject ? {background:'var(--bg-tertiary)', color:'var(--text-secondary)'} : {}}
                    />
                </div>

                <div className="field-group">
                    <label className="field-label">Title</label>
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
               </div>

               <div className="field-group">
                    <label className="field-label">Description</label>
                    <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>

                 <div className="field-group">
                    <label className="field-label">Rationale</label>
                    <textarea rows={2} value={form.rationale} onChange={e => setForm({...form, rationale: e.target.value})} />
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                    <div className="field-group">
                        <label className="field-label">Priority</label>
                         <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                     <div className="field-group">
                        <label className="field-label">Parent ID (Optional)</label>
                        <input value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})} />
                    </div>
                </div>

                <button className="btn btn-primary" onClick={handleSave}><Save size={16}/> Create</button>
            </div>
        </div>
    );
}
