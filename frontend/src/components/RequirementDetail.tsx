import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequirement, updateRequirement, deleteRequirement, createTrace, deleteTrace, verifyEARS, getAuditLogsForRequirement } from '../api';
import type { RequirementDetail as ReqDetailType, EARSResponse, AuditLog } from '../api'
import { Trash2, Edit3, Save, X, Link as LinkIcon, AlertTriangle, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

export default function RequirementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [req, setReq] = useState<ReqDetailType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ReqDetailType>>({});
    const [linkTarget, setLinkTarget] = useState("");
    const [error, setError] = useState("");
    const [earsResult, setEarsResult] = useState<EARSResponse | null>(null);
    const [editEarsResult, setEditEarsResult] = useState<EARSResponse | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    const load = useCallback(async () => {
        if(!id) return;
        try {
            const [data, logs] = await Promise.all([
                getRequirement(id),
                getAuditLogsForRequirement(id)
            ]);
            setReq(data);
            setEditForm(data);
            setAuditLogs(logs);
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
        const trigger = async () => {
            if(id) await load();
        };
        trigger();
    }, [id, load]);

    useEffect(() => {
        const title = editForm.title;
        const timer = setTimeout(async () => {
            if (!isEditing || !title) {
                setEditEarsResult(null);
                return;
            }
            try {
                const res = await verifyEARS(title);
                setEditEarsResult(res);
            } catch (err) {
                console.error("EARS verify failed", err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [isEditing, editForm.title]);

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
                                {editForm.title && (
                                    <div style={{marginTop:'0.5rem', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.4rem'}}>
                                        {editEarsResult?.is_compliant ? (
                                            <>
                                                <CheckCircle size={14} color="#3fb950" />
                                                <span style={{color:'#3fb950'}}>EARS Compliant ({editEarsResult.pattern})</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={14} color="#db6d28" />
                                                <span style={{color:'#db6d28'}}>{editEarsResult?.hint || "Checking EARS..."}</span>
                                            </>
                                        )}
                                    </div>
                                )}
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
                        <pre className="field-value pre-text">{req.description || "No description"}</pre>
                    )}
                </div>

                 <div className="field-group">
                    <label className="field-label">Rationale</label>
                    {isEditing ? (
                        <textarea rows={2} value={editForm.rationale || ""} onChange={e => setEditForm({...editForm, rationale: e.target.value})} />
                    ) : (
                        <pre className="field-value pre-text">{req.rationale || "No rationale"}</pre>
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

                <hr style={{borderColor:'var(--border-color)', margin:'2rem 0'}}/>
                
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.5rem'}}>
                    <Clock size={20} color="var(--accent-color)" />
                    <h3 style={{margin:0}}>Change History</h3>
                </div>

                <div className="audit-timeline-mini">
                    {auditLogs.length === 0 && <div className="empty-msg">No history recorded yet.</div>}
                    {auditLogs.map(log => (
                        <div key={log.id} style={{
                            padding: '0.75rem',
                            borderLeft: '2px solid var(--border-color)',
                            marginLeft: '10px',
                            position: 'relative',
                            marginBottom: '0.5rem'
                        }}>
                             <div style={{
                                width: '10px',
                                height: '10px',
                                background: 'var(--accent-color)',
                                borderRadius: '50%',
                                position: 'absolute',
                                left: '-6px',
                                top: '12px'
                            }}></div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:'0.25rem'}}>
                                <span style={{fontWeight:600}}>{log.action}</span>
                                <span style={{color:'#8b949e'}}>
                                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm')}
                                </span>
                            </div>
                            <div style={{fontSize: '0.85rem', color:'#8b949e', display:'flex', alignItems:'center', gap: '4px', marginBottom:'0.4rem'}}>
                                <User size={12} /> {log.author}
                            </div>
                            <div style={{fontSize:'0.85rem', background:'rgba(255,255,255,0.03)', padding:'0.5rem', borderRadius:'4px', color: '#c9d1d9', whiteSpace: 'pre-wrap'}}>
                                {log.details}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
