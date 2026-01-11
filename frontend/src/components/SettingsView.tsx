import { useState, useEffect } from 'react';
import { getAIModels } from '../api';
import { Settings, Save, RefreshCw } from 'lucide-react';

export default function SettingsView() {
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('selectedModel') || '');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let mounted = true;
        const loadModels = async () => {
             setLoading(true);
             try {
                 const data = await getAIModels();
                 if (!mounted) return;
                 setModels(data);
                 if (!selectedModel && data.length > 0) {
                     setSelectedModel(data[0]);
                 }
             } catch (err) {
                 console.error(err);
             } finally {
                 if (mounted) setLoading(false);
             }
        };
        loadModels();
        return () => { mounted = false; };
    }, [selectedModel]);

    const handleSave = () => {
        localStorage.setItem('selectedModel', selectedModel);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="main-content">
            <div className="req-detail-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Settings size={24} />
                    <h1 style={{ margin: 0 }}>Settings</h1>
                </div>

                <div className="field-group">
                    <label className="field-label">AI Generation Model (Ollama)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select 
                            value={selectedModel} 
                            onChange={e => setSelectedModel(e.target.value)}
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {models.length === 0 && !loading && <option value="">No models found</option>}
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => {
                                setLoading(true);
                                getAIModels().then(setModels).finally(() => setLoading(false));
                            }}
                            title="Refresh models"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '0.5rem' }}>
                        Choose which Ollama model to use for requirement description and rationale generation.
                    </p>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={16} /> {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
