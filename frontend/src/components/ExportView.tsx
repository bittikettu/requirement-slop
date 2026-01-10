import { useState } from 'react';
import { getExport } from '../api';
import { Download } from 'lucide-react';

export default function ExportView() {
    const [content, setContent] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const generate = async () => {
        try {
            const data = await getExport(statusFilter || undefined, priorityFilter || undefined);
            setContent(data.content);
        } catch (e) {
            console.error(e);
        }
    }

    const download = () => {
        const blob = new Blob([content], { type: 'text/asciidoc' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'requirements.adoc';
        a.click();
    }

    return (
        <div className="main-content">
             <div className="req-detail-card" style={{maxWidth:'1000px'}}>
                <h1>Export AsciiDoc</h1>
                
                <div style={{display:'flex', gap:'1rem', marginBottom:'1rem', alignItems:'end'}}>
                    <div style={{flex:1}}>
                        <label className="field-label">Status Filter</label>
                         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="Draft">Draft</option>
                            <option value="Approved">Approved</option>
                            <option value="Released">Released</option>
                         </select>
                    </div>
                     <div style={{flex:1}}>
                        <label className="field-label">Priority Filter</label>
                         <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                             <option value="Critical">Critical</option>
                         </select>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={generate}>Generate</button>
                    </div>
                </div>
                
                {content && (
                    <>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                            <h3>Preview</h3>
                            <button className="btn" onClick={download}><Download size={16}/> Download .adoc</button>
                        </div>
                        <div className="asciidoc-preview">
                            {content}
                        </div>
                    </>
                )}
             </div>
        </div>
    );
}
