
import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useNavigate } from 'react-router-dom';

const SuperAdminConfig: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'resources' | 'emails' | 'system'>('resources');

    // State
    const [resources, setResources] = useState<any[]>([]);
    const [emails, setEmails] = useState<any[]>([]);
    const [systemConfig, setSystemConfig] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'resources') fetchResources();
        if (activeTab === 'emails') fetchEmails();
        if (activeTab === 'system') fetchSystemConfig();
    }, [activeTab]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/config/resources');
            setResources(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/config/emails');
            setEmails(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSystemConfig = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/config/system');
            setSystemConfig(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // --- Resources Handlers ---
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name); // Default name
        formData.append('resource_type', 'generic'); // Default type

        try {
            await axios.post('/config/resources/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchResources();
            alert('Recurso subido correctamente');
        } catch (err) {
            console.error(err);
            alert('Error al subir recurso');
        }
    };

    // --- System Handlers ---
    const handleConfigUpdate = async (key: string, value: string) => {
        try {
            await axios.put(`/config/system/${key}`, { value });
            alert('Configuración guardada');
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        }
    };

    // --- Email Handlers ---
    const handleEmailUpdate = async (key: string, subject: string, body: string) => {
        try {
            await axios.put(`/config/emails/${key}`, { subject, body_html: body });
            alert('Plantilla guardada');
        } catch (err) {
            console.error(err);
            alert('Error al guardar plantilla');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-900">
                            ← Volver
                        </button>
                        <h1 className="text-2xl font-bold text-n900">🧠 Cerebro Operativo</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} label="📂 Recursos Maestros" />
                    <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} label="📧 Comunicaciones" />
                    <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} label="⚙️ Parámetros del Sistema" />
                </div>

                {loading && <div className="text-center py-10">Cargando...</div>}

                {/* Resources Panel */}
                {!loading && activeTab === 'resources' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg mb-4">Subir Nuevo Recurso</h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleUpload} />
                                <span className="text-4xl block mb-2">📤</span>
                                <p className="font-medium text-gray-600">Arrastra archivos aquí o haz clic para subir</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, Imagenes, ZIP (Max 10MB)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {resources.map((res: any) => (
                                <div key={res.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">📄</span>
                                            <h4 className="font-bold text-sm truncate" title={res.name}>{res.name}</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">ID: <span className="font-mono">{res.id.substring(0, 8)}...</span></p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                                        <span className="text-gray-400">{new Date(res.updated_at).toLocaleDateString()}</span>
                                        <a href={res.public_url} target="_blank" rel="noreferrer" className="text-p2 font-bold hover:underline">Ver / Descargar</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Emails Panel */}
                {!loading && activeTab === 'emails' && (
                    <div className="space-y-6">
                        {emails.length === 0 && <p className="text-gray-500">No hay plantillas editadas. Se usan las predeterminadas.</p>}
                        {emails.map((tmpl: any) => (
                            <EmailEditor key={tmpl.key} tmpl={tmpl} onSave={handleEmailUpdate} />
                        ))}
                        {/* Fallback mock if empty for dev visualization? No, simple empty state is fine */}

                    </div>
                )}

                {/* System Panel */}
                {!loading && activeTab === 'system' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parámetro</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Valor</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Descripción</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {systemConfig.map((conf: any) => (
                                    <ConfigRow key={conf.key} config={conf} onSave={handleConfigUpdate} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${active ? 'text-p2' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {label}
        {active && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-p2"></span>}
    </button>
);

const ConfigRow: React.FC<{ config: any, onSave: (k: string, v: string) => void }> = ({ config, onSave }) => {
    const [val, setVal] = useState(config.value);
    const [dirty, setDirty] = useState(false);

    const handleChange = (e: any) => {
        setVal(e.target.value);
        setDirty(true);
    }

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{config.key}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input
                    className="border rounded px-2 py-1 w-full"
                    value={val}
                    onChange={handleChange}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {dirty && (
                    <button onClick={() => { onSave(config.key, val); setDirty(false); }} className="text-p2 hover:text-p1 font-bold">Guardar</button>
                )}
            </td>
        </tr>
    )
}

const EmailEditor: React.FC<{ tmpl: any, onSave: (k: string, s: string, b: string) => void }> = ({ tmpl, onSave }) => {
    const [subject, setSubject] = useState(tmpl.subject_template);
    const [body, setBody] = useState(tmpl.body_html_template);
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <h4 className="font-bold text-n900">{tmpl.key}</h4>
                <span className="text-xs text-gray-500">{expanded ? '▲' : '▼'}</span>
            </div>
            {expanded && (
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Asunto</label>
                        <input className="w-full border rounded p-2" value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">HTML Body</label>
                        <textarea className="w-full border rounded p-2 font-mono text-xs h-64" value={body} onChange={e => setBody(e.target.value)} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => onSave(tmpl.key, subject, body)} className="btn-primary">Guardar Plantilla</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperAdminConfig;
