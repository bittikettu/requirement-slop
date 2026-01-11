import { useState, useMemo } from 'react';
import { getExport, getReqIFExport } from '../api';
import { Download, FileCode, Eye, Code } from 'lucide-react';
import Asciidoctor from '@asciidoctor/core';
import kroki from 'asciidoctor-kroki';

const asciidoctor = Asciidoctor();
kroki.register(asciidoctor.Extensions);

export default function ExportView() {
    const [content, setContent] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [previewMode, setPreviewMode] = useState<'rendered' | 'raw'>('rendered');

    const generate = async () => {
        try {
            const data = await getExport(statusFilter || undefined, priorityFilter || undefined);
            setContent(data.content);
        } catch (e) {
            console.error(e);
        }
    }

    const renderedHtml = useMemo(() => {
        if (!content) return "";
        try {
            return asciidoctor.convert(content, { attributes: { showtitle: true } }) as string;
        } catch (e) {
            console.error("AsciiDoc conversion failed", e);
            return "Failed to render AsciiDoc";
        }
    }, [content]);

    const download = () => {
        const blob = new Blob([content], { type: 'text/asciidoc' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'requirements.adoc';
        a.click();
    }
    
    const downloadReqIF = async () => {
        try {
            const xml = await getReqIFExport();
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'requirements.reqif';
            a.click();
        } catch (e) {
            console.error(e);
            alert("Failed to export ReqIF");
        }
    }

    return (
        <div className="main-content">
             <div className="req-detail-card" style={{maxWidth:'1000px'}}>
                <h1>Export</h1>
                
                <div style={{display:'flex', gap:'1rem', marginBottom:'1rem', alignItems:'end', borderBottom: '1px solid #333', paddingBottom: '1rem'}}>
                    <div style={{flex:1}}>
                        <label className="field-label">Status Filter (AsciiDoc)</label>
                         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="Draft">Draft</option>
                            <option value="Approved">Approved</option>
                            <option value="Released">Released</option>
                         </select>
                    </div>
                     <div style={{flex:1}}>
                        <label className="field-label">Priority Filter (AsciiDoc)</label>
                         <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                             <option value="Critical">Critical</option>
                         </select>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={generate}>Generate AsciiDoc</button>
                    </div>
                </div>
                
                <div style={{marginBottom:'2rem'}}>
                    <button className="btn" onClick={downloadReqIF} style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                        <FileCode size={16}/> Export ReqIF XML
                    </button>
                </div>
                
                {content && (
                    <>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                            <div style={{display:'flex', gap:'0.5rem', background:'var(--bg-color)', padding:'3px', borderRadius:'6px'}}>
                                <button 
                                    className={`btn ${previewMode === 'rendered' ? 'btn-primary' : ''}`}
                                    style={{padding:'0.3rem 0.8rem', fontSize:'0.85rem'}}
                                    onClick={() => setPreviewMode('rendered')}
                                >
                                    <Eye size={14}/> Rendered
                                </button>
                                <button 
                                    className={`btn ${previewMode === 'raw' ? 'btn-primary' : ''}`}
                                    style={{padding:'0.3rem 0.8rem', fontSize:'0.85rem'}}
                                    onClick={() => setPreviewMode('raw')}
                                >
                                    <Code size={14}/> Raw Source
                                </button>
                            </div>
                            <button className="btn" onClick={download}><Download size={16}/> Download .adoc</button>
                        </div>

                        {previewMode === 'raw' ? (
                            <div className="asciidoc-preview">
                                {content}
                            </div>
                        ) : (
                            <div 
                                className="asciidoc-rendered-view"
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        )}
                    </>
                )}
             </div>
        </div>
    );
}
