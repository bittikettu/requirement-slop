import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import type { RequirementDetail } from '../api';

export default function TraceabilityMatrix() {
    const [reqs, setReqs] = useState<RequirementDetail[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
             try {
                 const res = await axios.get<RequirementDetail[]>('http://localhost:8000/requirements/matrix');
                 setReqs(res.data);
             } catch(e) { console.error(e) }
        };
        load();
    }, []);

    return (
        <div className="main-content">
             <div className="req-detail-card" style={{maxWidth:'100%'}}>
                 <h1>Traceability Matrix</h1>
                 
                 <table style={{width:'100%', borderCollapse:'collapse', marginTop:'1rem'}}>
                     <thead>
                         <tr style={{borderBottom:'2px solid #30363d', textAlign:'left'}}>
                             <th style={{padding:'8px'}}>ID</th>
                             <th style={{padding:'8px'}}>Title</th>
                             <th style={{padding:'8px'}}>Traces To (Outgoing)</th>
                             <th style={{padding:'8px'}}>Referenced By (Incoming)</th>
                         </tr>
                     </thead>
                     <tbody>
                         {reqs.map(r => (
                             <tr key={r.id} style={{borderBottom:'1px solid #30363d'}}>
                                 <td style={{padding:'8px', color:'var(--accent-color)', cursor:'pointer'}} onClick={() => navigate(`/requirements/${r.id}`)}>{r.id}</td>
                                 <td style={{padding:'8px'}}>{r.title}</td>
                                 <td style={{padding:'8px'}}>
                                     {r.outgoing_traces.map(t => (
                                         <span key={t.target_id} style={{display:'inline-block', background:'rgba(56,139,253,0.1)', padding:'2px 6px', borderRadius:'4px', marginRight:'4px', fontSize:'0.9em'}}>
                                             {t.target_id}
                                         </span>
                                     ))}
                                 </td>
                                 <td style={{padding:'8px'}}>
                                     {r.incoming_traces.map(t => (
                                         <span key={t.source_id} style={{display:'inline-block', background:'rgba(56,139,253,0.1)', padding:'2px 6px', borderRadius:'4px', marginRight:'4px', fontSize:'0.9em'}}>
                                             {t.source_id}
                                         </span>
                                     ))}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            </div>
        </div>
    );
}
