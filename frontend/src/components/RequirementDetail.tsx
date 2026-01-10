import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequirement, updateRequirement, deleteRequirement, createTrace, deleteTrace, verifyEARS } from '../api';
import type { RequirementDetail as ReqDetailType, EARSResponse } from '../api'
import { Trash2, Edit3, Save, X, Link as LinkIcon, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export default function RequirementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [req, setReq] = useState<ReqDetailType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ReqDetailType>>({});
    const [linkTarget, setLinkTarget] = useState("");
    const [error, setError] = useState("");
    const [earsResult, setEarsResult] = useState<EARSResponse | null>(null);

    const load = useCallback(async () => {
        if(!id) return;
        try {
            const data = await getRequirement(id);
            setReq(data);
            setEditForm(data);
            setIsEditing(false);
            setError("");
            
            // Verify EARS
            const ears = await verifyEARS(data.title);
            setEarsResult(ears);
        } catch (err: unknown) {
            // @ts-expect-error: Axios error type handling needs refinement
            setError(err.response?.data?.detail || "Failed to load");
        }
    }, [id]);

    useEffect(() => {
        if(id) load();
    }, [id, load]);

    const handleSave = async () => {
        if(!id || !editForm) return;
        try {
            await updateRequirement(id, editForm);
            load();
        } catch (err: unknown) {
            // @ts-expect-error: Axios error type handling needs refinement
            setError(err.response?.data?.detail || "Failed to update");
        }
    }

    const handleDelete = async () => {
        if(!id) return;
        if(!confirm("Are you sure?")) return;
        try {
            await deleteRequirement(id);
            navigate("/");
        } catch (err: unknown) {
            // @ts-expect-error: Axios error type handling needs refinement
            setError(err.response?.data?.detail || "Failed to delete");
        }
    }

    const handleAddTrace = async () => {
        if(!id || !linkTarget) return;
        try {
            await createTrace(id, linkTarget);
            setLinkTarget("");
            load();
        } catch (err: unknown) {
             // @ts-expect-error: Axios error type handling needs refinement
             setError(err.response?.data?.detail || "Failed to link");
        }
    }

    const handleRemoveTrace = async (targetId: string, isIncoming: boolean) => {
        if(!id) return;
        try {
            // If incoming, it means source=targetId, target=id
            // If outgoing, source=id, target=targetId
            const s = isIncoming ? targetId : id;
            const t = isIncoming ? id : targetId;
            await deleteTrace(s, t);
            load();
        } catch (err: unknown) {
            // @ts-expect-error: Axios error type handling needs refinement
            setError(err.response?.data?.detail || "Failed to unlink");
        }
    }

    if (!req) return <div className="main-content">Select a requirement or create new.</div>;

    return (
        <div className="main-content">
            <div className="req-detail-card">
                {error && <div style={{background:'rgba(248,81,73,0.15)', color:'#ff7b72', padding:'1rem', borderRadius:'6px', marginBottom:'1rem', display:'flex', gap:'0.5rem'}}>
                    <AlertTriangle size={20}/> {error}
                </div>}

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'1rem'}}>
                    {isEditing ? (
                        <div style={{flex:1}}>
                           <div className="field-group">
                                <label className="field-label">Title</label>
                                <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                           </div>
                        </div>
                    ) : (
                        <h1 style={{margin:0}}>{req.id}: {req.title}</h1>
                    )}
                    
                    <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                        {earsResult && (
                             <div style={{fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.4rem', marginRight:'1rem', padding:'0.3rem 0.6rem', background:'var(--bg-secondary)', borderRadius:'4px'}}>
                                {earsResult.is_compliant ? (
                                    <>
                                        <CheckCircle size={14} color="#3fb950" />
                                        <span style={{color:'#3fb950'}}>EARS ({earsResult.pattern})</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} color="#db6d28" />
                                        <span style={{color:'#db6d28'}}>Non-EARS</span>
                                    </>
                                )}
                            </div>
                        )}
                        {isEditing ? (
                            <>
                                <button className="btn btn-primary" onClick={handleSave}><Save size={16}/> Save</button>
                                <button className="btn" onClick={() => {setIsEditing(false); setEditForm(req);}}><X size={16}/> Cancel</button>
                            </>
                        ) : (
                            <>
                                <button className="btn" onClick={() => setIsEditing(true)}><Edit3 size={16}/> Edit</button>
                                <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16}/> Delete</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">Description</label>
                    {isEditing ? (
                        <textarea rows={4} value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                    ) : (
                        <div className="field-value">{req.description || "No description"}</div>
                    )}
                </div>

                 <div className="field-group">
                    <label className="field-label">Rationale</label>
                    {isEditing ? (
                        <textarea rows={2} value={editForm.rationale || ""} onChange={e => setEditForm({...editForm, rationale: e.target.value})} />
                    ) : (
                        <div className="field-value">{req.rationale || "No rationale"}</div>
                    )}
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                    <div className="field-group">
                        <label className="field-label">Status</label>
                        {isEditing ? (
                             <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                 <option>Draft</option>
                                 <option>Approved</option>
                                 <option>Released</option>
                             </select>
                        ) : (
                            <span className={`field-value status-${req.status.toLowerCase()}`}>{req.status}</span>
                        )}
                    </div>
                     <div className="field-group">
                        <label className="field-label">Priority</label>
                         {isEditing ? (
                             <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})}>
                                 <option>Low</option>
                                 <option>Medium</option>
                                 <option>High</option>
                                 <option>Critical</option>
                             </select>
                        ) : (
                            <div className="field-value">{req.priority}</div>
                        )}
                    </div>
                </div>
                
                 <div className="field-group">
                    <label className="field-label">Parent ID</label>
                    {isEditing ? (
                         <input value={editForm.parent_id || ""} onChange={e => setEditForm({...editForm, parent_id: e.target.value})} placeholder="Parent ID (Optional)"/>
                    ) : (
                        <div className="field-value">{req.parent_id ? <a href={`/requirements/${req.parent_id}`}>{req.parent_id}</a> : "None"}</div>
                    )}
                </div>

                <hr style={{borderColor:'var(--border-color)', margin:'2rem 0'}}/>
                
                <h3>Traceability</h3>
                
                <div style={{marginBottom:'1rem'}}>
                    <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}>
                        <input 
                            placeholder="Link to Requirement ID..." 
                            value={linkTarget} 
                            onChange={e => setLinkTarget(e.target.value)}
                            style={{maxWidth:'200px'}}
                        />
                        <button className="btn" onClick={handleAddTrace}><LinkIcon size={14}/> Link</button>
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">Outgoing (Traces To)</label>
                    <div>
                        {req.outgoing_traces.length === 0 && <span style={{color:'#666', fontStyle:'italic'}}>None</span>}
                        {req.outgoing_traces.map(t => (
                            <span key={t.target_id} className="trace-badge" onClick={() => navigate(`/requirements/${t.target_id}`)}>
                                {t.target_id} <X size={12} style={{marginLeft:4, verticalAlign:'middle'}} onClick={(e) => {e.stopPropagation(); handleRemoveTrace(t.target_id, false)}}/>
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="field-group">
                    <label className="field-label">Incoming (Referenced By)</label>
                     <div>
                        {req.incoming_traces.length === 0 && <span style={{color:'#666', fontStyle:'italic'}}>None</span>}
                        {req.incoming_traces.map(t => (
                            <span key={t.source_id} className="trace-badge" onClick={() => navigate(`/requirements/${t.source_id}`)}>
                                {t.source_id} <X size={12} style={{marginLeft:4, verticalAlign:'middle'}} onClick={(e) => {e.stopPropagation(); handleRemoveTrace(t.source_id, true)}}/>
                            </span>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
