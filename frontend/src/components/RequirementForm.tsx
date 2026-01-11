import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRequirement, getProjects, verifyEARS, generateAIDescription, generateAIRationale } from '../api';
import type { Requirement, Project, EARSResponse } from '../api';
import { Save, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function RequirementForm() {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [earsResult, setEarsResult] = useState<EARSResponse | null>(null);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isGeneratingRat, setIsGeneratingRat] = useState(false);

    useEffect(() => {
        getProjects().then(data => {
            setProjects(data);
            const params = new URLSearchParams(location.search);
            const pId = params.get('project_id');
            if (pId) {
                setSelectedProject(pId);
                setForm(prev => ({ ...prev, id: "Auto-generated" }));
            }
        }).catch(console.error);
    }, [location.search]);

    useEffect(() => {
        const title = form.title;
        const timer = setTimeout(async () => {
            if (!title) {
                setEarsResult(null);
                return;
            }
            try {
                const res = await verifyEARS(title);
                setEarsResult(res);
            } catch (err) {
                console.error("EARS verify failed", err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [form.title]);

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

    const handleGenerateDescription = async () => {
        if (!form.title) {
            setError("Please enter a title first");
            return;
        }
        setIsGeneratingDesc(true);
        setError("");
        try {
            const res = await generateAIDescription(form.title);
            setForm(prev => ({ ...prev, description: res.generated_text }));
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to generate description");
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleGenerateRationale = async () => {
        if (!form.title || !form.description) {
            setError("Please enter title and description first");
            return;
        }
        setIsGeneratingRat(true);
        setError("");
        try {
            const res = await generateAIRationale(form.title, form.description);
            setForm(prev => ({ ...prev, rationale: res.generated_text }));
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to generate rationale");
        } finally {
            setIsGeneratingRat(false);
        }
    };

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
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Requirement title..." />
                    <div style={{marginTop:'0.5rem', fontSize:'0.75rem', color:'#8b949e', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px'}}>
                        <strong>EARS Patterns:</strong>
                        <ul style={{margin: '4px 0 0 1rem', padding: 0}}>
                            <li><strong>Ubiquitous:</strong> The &lt;system&gt; shall &lt;action&gt;.</li>
                            <li><strong>Event-driven:</strong> When &lt;event&gt;, the &lt;system&gt; shall &lt;action&gt;.</li>
                            <li><strong>State-driven:</strong> While &lt;state&gt;, the &lt;system&gt; shall &lt;action&gt;.</li>
                            <li><strong>Unwanted behavior:</strong> If &lt;condition&gt;, then the &lt;system&gt; shall &lt;action&gt;.</li>
                            <li><strong>Optional feature:</strong> Where &lt;feature is included&gt;, the &lt;system&gt; shall &lt;action&gt;.</li>
                        </ul>
                    </div>
                    {form.title && (
                        <div style={{marginTop:'0.5rem', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.4rem'}}>
                            {earsResult?.is_compliant ? (
                                <>
                                    <CheckCircle size={14} color="#3fb950" />
                                    <span style={{color:'#3fb950'}}>EARS Compliant ({earsResult.pattern})</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={14} color="#db6d28" />
                                    <span style={{color:'#db6d28'}}>{earsResult?.hint || "Checking EARS..."}</span>
                                </>
                            )}
                        </div>
                    )}
               </div>

               <div className="field-group">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '4px'}}>
                        <label className="field-label" style={{marginBottom:0}}>Description</label>
                        <button 
                            className="btn btn-secondary" 
                            style={{padding: '2px 8px', fontSize: '0.75rem', display:'flex', alignItems:'center', gap:'4px'}}
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc || !form.title}
                        >
                            {isGeneratingDesc ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Generate
                        </button>
                    </div>
                    <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>

                 <div className="field-group">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '4px'}}>
                        <label className="field-label" style={{marginBottom:0}}>Rationale</label>
                        <button 
                            className="btn btn-secondary" 
                            style={{padding: '2px 8px', fontSize: '0.75rem', display:'flex', alignItems:'center', gap:'4px'}}
                            onClick={handleGenerateRationale}
                            disabled={isGeneratingRat || !form.title || !form.description}
                        >
                            {isGeneratingRat ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Generate
                        </button>
                    </div>
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
