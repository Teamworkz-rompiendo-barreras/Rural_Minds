import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { Link } from 'react-router-dom';

// --- Types ---
interface SystemConfig {
    key: string;
    value: string;
    description: string;
    data_type: string;
}

interface EmailTemplate {
    key: string;
    subject_template: string;
    body_html_template: string;
}

interface MasterResource {
    id: string;
    name: string;
    resource_type: string;
    public_url: string;
    updated_at: string;
}

export default function SuperAdminConfig() {
    const [activeTab, setActiveTab] = useState<'resources' | 'comms' | 'system'>('resources');

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Link to="/admin" className="text-gray-500 hover:text-gray-700 text-sm mb-2 flex items-center gap-1">
                    ← Volver al Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Configuración Global</h1>
                <p className="text-gray-500 mt-1">El Cerebro Operativo de Rural Minds</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <TabButton
                    active={activeTab === 'resources'}
                    onClick={() => setActiveTab('resources')}
                    label="📚 Recursos Maestros"
                />
                <TabButton
                    active={activeTab === 'comms'}
                    onClick={() => setActiveTab('comms')}
                    label="📨 Comunicaciones"
                />
                <TabButton
                    active={activeTab === 'system'}
                    onClick={() => setActiveTab('system')}
                    label="⚙️ Parámetros del Sistema"
                />
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === 'resources' && <ResourcesTab />}
                {activeTab === 'comms' && <CommunicationsTab />}
                {activeTab === 'system' && <SystemTab />}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 font-medium text-sm focus:outline-none transition-colors ${active
                ? 'border-b-2 border-primary-600 text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
                }`}
        >
            {label}
        </button>
    );
}

// --- Resources Tab ---
function ResourcesTab() {
    const [resources, setResources] = useState<MasterResource[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        try {
            const res = await api.get('/config/resources');
            setResources(res.data);
        } catch (e) {
            console.error("Failed to load resources", e);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name); // Default name
        formData.append('resource_type', 'file'); // Default type

        try {
            await api.post('/config/resources/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            loadResources(); // Refresh
            alert("Recurso subido con éxito");
        } catch (err) {
            alert("Error al subir archivo");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
            >
                <div className="text-4xl mb-4">📤</div>
                <h3 className="text-lg font-semibold text-gray-700">Arrastra archivos aquí o haz clic</h3>
                <p className="text-sm text-gray-500 mt-2">PDFs, Sellos (SVG/PNG), Guías</p>
                <input
                    type="file"
                    className="hidden"
                    id="fileInput"
                    onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                />
                <label
                    htmlFor="fileInput"
                    className="mt-4 inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
                >
                    Seleccionar Archivo
                </label>
                {uploading && <p className="text-primary-600 mt-2 font-medium">Subiendo...</p>}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((res) => (
                    <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-2xl">{res.resource_type === 'pdf' ? '📄' : '🖼️'}</span>
                            <a
                                href={api.defaults.baseURL?.replace('/api', '') + res.public_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                                Ver
                            </a>
                        </div>
                        <h4 className="font-semibold text-gray-800 truncate" title={res.name}>{res.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">Actualizado: {new Date(res.updated_at).toLocaleDateString()}</p>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <code className="text-xs bg-gray-50 p-1 rounded text-gray-600 break-all select-all">
                                {res.public_url}
                            </code>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Communications Tab ---
function CommunicationsTab() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const res = await api.get('/config/emails');
            setTemplates(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        try {
            await api.put(`/config/emails/${selectedTemplate.key}`, {
                subject: selectedTemplate.subject_template,
                body_html: selectedTemplate.body_html_template
            });
            alert("Plantilla guardada");
            loadTemplates();
        } catch (e) {
            alert("Error al guardar");
        }
    };

    return (
        <div className="flex h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-1/4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-700">Plantillas</h3>
                </div>
                <ul>
                    {templates.map(t => (
                        <li
                            key={t.key}
                            onClick={() => setSelectedTemplate(t)}
                            className={`p-3 cursor-pointer hover:bg-white border-b border-gray-100 text-sm ${selectedTemplate?.key === t.key ? 'bg-white border-l-4 border-l-primary-600 font-medium' : 'text-gray-600'}`}
                        >
                            {t.key}
                        </li>
                    ))}
                    {templates.length === 0 && <li className="p-4 text-sm text-gray-400">Cargando o sin plantillas...</li>}
                </ul>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col p-6">
                {selectedTemplate ? (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                            <input
                                value={selectedTemplate.subject_template}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject_template: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex-1 flex flex-col mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">HTML Body</label>
                            <textarea
                                value={selectedTemplate.body_html_template}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body_html_template: e.target.value })}
                                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => alert("Previsualización WIP")}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Prueba
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Selecciona una plantilla para editar
                    </div>
                )}
            </div>
        </div>
    );
}

// --- System Tab ---
function SystemTab() {
    const [config, setConfig] = useState<SystemConfig[]>([]);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await api.get('/config/system');
            setConfig(res.data);
        } catch (e) { console.error(e); }
    };

    const handleChange = (key: string, val: string) => {
        setConfig(prev => prev.map(c => c.key === key ? { ...c, value: val } : c));
    };

    const handleSave = async (key: string) => {
        const item = config.find(c => c.key === key);
        if (!item) return;
        try {
            await api.put(`/config/system/${key}`, {
                value: item.value,
                description: item.description,
                data_type: item.data_type
            });
            alert("Guardado");
        } catch (e) {
            alert("Error");
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parámetro</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {config.map((item) => (
                        <tr key={item.key}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.key}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <input
                                    value={item.value}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleSave(item.key)}
                                    className="text-primary-600 hover:text-primary-900 font-semibold"
                                >
                                    Guardar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
