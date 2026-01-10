import { useState, useEffect } from 'react';
import { getAuditLogs } from '../api';
import type { AuditLog } from '../api';
import { History as HistoryIcon, Clock, User, Tag, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryView() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditLogs().then(data => {
            setLogs(data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="main-content">Loading history...</div>;

    return (
        <div className="main-content">
            <div className="history-container" style={{maxWidth: '1000px', margin: '0 auto'}}>
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2rem'}}>
                    <HistoryIcon size={28} color="var(--accent-color)" />
                    <h1 style={{margin:0}}>System History</h1>
                </div>

                <div className="audit-timeline">
                    {logs.length === 0 && <div className="empty-msg">No history found.</div>}
                    {logs.map(log => (
                        <div key={log.id} className="audit-card" style={{
                            background: 'var(--panel-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                                    <Tag size={16} color="var(--accent-color)" />
                                    <span style={{fontWeight: 600, color: 'var(--accent-color)'}}>{log.action}</span>
                                    {log.req_id && (
                                        <a href={`/requirements/${log.req_id}`} style={{
                                            fontSize: '0.9rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            {log.req_id}
                                        </a>
                                    )}
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.85rem', color:'#8b949e'}}>
                                    <Clock size={14} />
                                    <span>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.9rem'}}>
                                <User size={16} color="#8b949e" />
                                <span style={{color: '#8b949e'}}>Changed by:</span>
                                <span style={{fontWeight: 500}}>{log.author}</span>
                            </div>

                            <div style={{
                                padding: '0.75rem',
                                background: '#0d1117',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                borderLeft: '3px solid var(--border-color)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                <div style={{display:'flex', alignItems: 'start', gap: '0.5rem'}}>
                                    <Info size={16} style={{marginTop: '2px', flexShrink: 0}} />
                                    <span>{log.details}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
