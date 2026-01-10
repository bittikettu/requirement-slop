import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Boxes, FileText, RefreshCw } from 'lucide-react';
import { getRequirements } from '../api';
import type { Requirement } from '../api';

export default function Sidebar() {
  const [reqs, setReqs] = useState<Requirement[]>([]);

  useEffect(() => {
    const loadReqs = async () => {
        try {
          const data = await getRequirements();
          setReqs(data);
        } catch (e) {
            console.error(e);
        }
    };
    loadReqs();
    // Poll or event bus would be better, but simple interval for refreshing list
    const interval = setInterval(loadReqs, 5000); 
    return () => clearInterval(interval);
  }, []);
  
  // Also expose manual reload if needed, but for now button can just re-trigger or we extract function
  const manualReload = async () => {
      try {
        const data = await getRequirements();
        setReqs(data);
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="sidebar">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
          <h2 style={{margin:0, fontSize:'1.2rem'}}>ReqTool</h2>
          <button className="btn" onClick={manualReload} style={{padding:'4px'}}><RefreshCw size={14}/></button>
      </div>

      <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
          <NavLink to="/requirements/new" className="btn btn-primary" style={{flex:1, justifyContent:'center'}}>
              <Plus size={16} /> New
          </NavLink>
      </div>
      
       <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
          <NavLink to="/traceability" className="btn" style={{flex:1, justifyContent:'center'}}>
              <Boxes size={16} /> Trace
          </NavLink>
            <NavLink to="/export" className="btn" style={{flex:1, justifyContent:'center'}}>
              <FileText size={16} /> Doc
          </NavLink>
      </div>

      <div style={{marginBottom:'1rem'}}>
          <NavLink to="/projects" className="btn" style={{display:'flex', justifyContent:'center', width:'100%'}}>
             <RefreshCw size={16} style={{marginRight: '6px'}}/> Projects
          </NavLink>
      </div>

      <div className="req-list">
          {reqs.map(r => (
              <NavLink 
                key={r.id} 
                to={`/requirements/${r.id}`}
                className={({isActive}) => `req-item ${isActive ? 'active' : ''}`}
                style={{display:'block'}}
              >
                  <div style={{fontWeight:600}}>{r.id}</div>
                  <div style={{fontSize:'0.85em', color:'#8b949e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                      {r.title}
                  </div>
              </NavLink>
          ))}
      </div>
    </div>
  );
}
