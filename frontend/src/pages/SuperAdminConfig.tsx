
import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useNavigate } from 'react-router-dom';

// Types
interface Candidate {
    id: string;
    name: string;
    email: string;
    location: { province: string; municipality: string } | null;
    skills: string[];
    is_willing_to_move: boolean;
}

interface Offer {
    id: string;
    title: string;
    company: string;
    location: { province: string; municipality: string } | null;
    sector: string | null;
    applications_count: number;
}

interface AuditItem {
    id: string;
    type: string;
    name: string;
    created_at: string;
    status: string;
    issues: string[];
    preview_image: string | null;
}

interface SuccessStory {
    id: string;
    title: string;
    description: string;
    image_url: string;
    municipality_name: string;
    created_at: string;
}

const SuperAdminConfig: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'matching' | 'audit' | 'stories' | 'resources' | 'emails' | 'system'>('matching');

    // Matching State
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
    const [linkMessage, setLinkMessage] = useState<string>('');

    // Audit State
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);

    // Stories State
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [newStory, setNewStory] = useState({ title: '', description: '', image_url: '', municipality_name: '' });

    // Config State (existing)
    const [resources, setResources] = useState<any[]>([]);
    const [emails, setEmails] = useState<any[]>([]);
    const [systemConfig, setSystemConfig] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'matching') fetchMatching();
        if (activeTab === 'audit') fetchAudit();
        if (activeTab === 'stories') fetchStories();
        if (activeTab === 'resources') fetchResources();
        if (activeTab === 'emails') fetchEmails();
        if (activeTab === 'system') fetchSystemConfig();
    }, [activeTab]);

    // === MATCHING ===
    const fetchMatching = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/matching');
            setCandidates(res.data.candidates || []);
            setOffers(res.data.offers || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleLink = async () => {
        if (!selectedCandidate || !selectedOffer) {
            setLinkMessage('Selecciona un candidato y una oferta');
            return;
        }
        try {
            await axios.post('/admin/matching/link', {
                user_id: selectedCandidate,
                challenge_id: selectedOffer
            });
            setLinkMessage('✅ Candidato vinculado correctamente');
            setSelectedCandidate(null);
            setSelectedOffer(null);
            fetchMatching();
        } catch (err: any) {
            setLinkMessage(`❌ ${err.response?.data?.detail || 'Error al vincular'}`);
        }
    };

    // === AUDIT ===
    const fetchAudit = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/quality-audit');
            setAuditItems(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleApprove = async (orgId: string) => {
        try {
            await axios.post(`/admin/audit/approve/${orgId}`);
            fetchAudit();
            alert('Sello aprobado');
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.detail || 'Error'}`);
        }
    };

    const handleReject = async (orgId: string) => {
        const reason = prompt('Motivo del rechazo:');
        if (!reason) return;
        try {
            await axios.post(`/admin/audit/reject/${orgId}?reason=${encodeURIComponent(reason)}`);
            fetchAudit();
            alert('Sello rechazado');
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.detail || 'Error'}`);
        }
    };

    // === STORIES ===
    const fetchStories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/stories');
            setStories(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateStory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/admin/stories', newStory);
            setNewStory({ title: '', description: '', image_url: '', municipality_name: '' });
            fetchStories();
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.detail || 'Error al crear historia'}`);
        }
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!confirm('¿Eliminar esta historia?')) return;
        try {
            await axios.delete(`/admin/stories/${storyId}`);
            fetchStories();
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.detail || 'Error'}`);
        }
    };

    // === EXISTING CONFIG FUNCTIONS ===
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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('resource_type', 'generic');

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

    const handleConfigUpdate = async (key: string, value: string) => {
        try {
            await axios.put(`/config/system/${key}`, { value });
            alert('Configuración guardada');
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        }
    };

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
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#F3F4F6' }}>
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{ '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                        >
                            ← Volver
                        </button>
                        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', fontFamily: 'Futura, sans-serif' }}>
                            🧠 Cerebro Operativo
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b overflow-x-auto" style={{ borderColor: '#D1D5DB' }}>
                    <TabButton active={activeTab === 'matching'} onClick={() => setActiveTab('matching')} label="🔗 Motor de Matching" />
                    <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} label="✅ Auditoría de Calidad" />
                    <TabButton active={activeTab === 'stories'} onClick={() => setActiveTab('stories')} label="📖 Historias de Éxito" />
                    <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} label="📂 Recursos" />
                    <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} label="📧 Comunicaciones" />
                    <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} label="⚙️ Sistema" />
                </div>

                {loading && <div className="text-center py-10" style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}>Cargando...</div>}

                {/* ===================== MATCHING PANEL ===================== */}
                {!loading && activeTab === 'matching' && (
                    <div className="space-y-6">
                        {candidates.length === 0 && offers.length === 0 ? (
                            <EmptyState
                                icon="🔗"
                                title="Sin datos de matching"
                                description="Aún no hay candidatos o ofertas para cruzar. Los datos aparecerán cuando haya talento y retos publicados."
                            />
                        ) : (
                            <>
                                {/* Link Action Area */}
                                <div className="bg-white p-6 rounded-xl shadow-sm" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                                    <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Futura, sans-serif' }}>Vincular Candidato a Oferta</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Candidato</label>
                                            <select
                                                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                                                style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                                                value={selectedCandidate || ''}
                                                onChange={e => setSelectedCandidate(e.target.value || null)}
                                            >
                                                <option value="">Selecciona un candidato</option>
                                                {candidates.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} - {c.location?.municipality || 'Sin ubicación'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Oferta</label>
                                            <select
                                                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                                                style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                                                value={selectedOffer || ''}
                                                onChange={e => setSelectedOffer(e.target.value || null)}
                                            >
                                                <option value="">Selecciona una oferta</option>
                                                {offers.map(o => (
                                                    <option key={o.id} value={o.id}>
                                                        {o.title} - {o.company}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLink}
                                        className="px-6 py-3 text-white font-bold rounded-lg transition-colors focus:outline-none"
                                        style={{
                                            backgroundColor: '#374BA6',
                                            outline: '3px solid transparent'
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#5063BA')}
                                        onMouseOut={e => (e.currentTarget.style.backgroundColor = '#374BA6')}
                                        onMouseDown={e => (e.currentTarget.style.backgroundColor = '#2E418F')}
                                        onMouseUp={e => (e.currentTarget.style.backgroundColor = '#5063BA')}
                                        onFocus={e => (e.currentTarget.style.outline = '3px solid #8095F2')}
                                        onBlur={e => (e.currentTarget.style.outline = '3px solid transparent')}
                                    >
                                        Vincular
                                    </button>
                                    {linkMessage && (
                                        <p className="mt-3 text-sm" role="status" aria-live="polite">{linkMessage}</p>
                                    )}
                                </div>

                                {/* Candidates Table */}
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                                    <h3 className="font-bold text-lg p-4 border-b" style={{ fontFamily: 'Futura, sans-serif', borderColor: '#D1D5DB' }}>
                                        Candidatos ({candidates.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y" style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}>
                                            <thead style={{ backgroundColor: '#F9FAFB' }}>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ubicación</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Habilidades</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Movilidad</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {candidates.map(c => (
                                                    <tr key={c.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{c.location?.municipality || '-'}, {c.location?.province || '-'}</td>
                                                        <td className="px-6 py-4">{(c.skills || []).slice(0, 3).join(', ')}</td>
                                                        <td className="px-6 py-4">{c.is_willing_to_move ? '✅ Sí' : '❌ No'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Offers Table */}
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                                    <h3 className="font-bold text-lg p-4 border-b" style={{ fontFamily: 'Futura, sans-serif', borderColor: '#D1D5DB' }}>
                                        Ofertas ({offers.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y" style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}>
                                            <thead style={{ backgroundColor: '#F9FAFB' }}>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Puesto</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Empresa</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ubicación</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Candidaturas</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {offers.map(o => (
                                                    <tr key={o.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{o.title}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{o.company}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{o.location?.municipality || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{o.applications_count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ===================== AUDIT PANEL ===================== */}
                {!loading && activeTab === 'audit' && (
                    <div className="space-y-6">
                        {auditItems.length === 0 ? (
                            <EmptyState
                                icon="✅"
                                title="Sin revisiones pendientes"
                                description="Todas las organizaciones están al día. ¡Buen trabajo!"
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {auditItems.map(item => (
                                    <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm flex flex-col" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                                        <div className="flex items-center gap-3 mb-3">
                                            {item.preview_image ? (
                                                <img src={item.preview_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xl">
                                                    {item.type === 'municipality' ? '🏛️' : '🏢'}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-sm">{item.name}</h4>
                                                <p className="text-xs text-gray-500">{item.type === 'municipality' ? 'Ayuntamiento' : 'Empresa'}</p>
                                            </div>
                                        </div>

                                        <StatusBadge status={item.status} />

                                        {item.issues.length > 0 && (
                                            <div className="mt-3 text-xs text-orange-600">
                                                ⚠️ {item.issues.join(', ')}
                                            </div>
                                        )}

                                        <div className="mt-auto pt-4 flex gap-2">
                                            <button
                                                onClick={() => handleApprove(item.id)}
                                                className="flex-1 py-2 rounded-lg font-bold text-white text-sm transition-colors"
                                                style={{ backgroundColor: '#10B981' }}
                                            >
                                                ✅ Aprobar Sello
                                            </button>
                                            <button
                                                onClick={() => handleReject(item.id)}
                                                className="flex-1 py-2 rounded-lg font-bold text-white text-sm transition-colors"
                                                style={{ backgroundColor: '#EF4444' }}
                                            >
                                                ❌ Rechazar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===================== STORIES PANEL ===================== */}
                {!loading && activeTab === 'stories' && (
                    <div className="space-y-6">
                        {/* Create Story Form */}
                        <div className="bg-white p-6 rounded-xl shadow-sm" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                            <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Futura, sans-serif' }}>Nueva Historia de Éxito</h3>
                            <form onSubmit={handleCreateStory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Título (máx. 18 palabras)</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                                        value={newStory.title}
                                        onChange={e => setNewStory({ ...newStory, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Municipio</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                                        value={newStory.municipality_name}
                                        onChange={e => setNewStory({ ...newStory, municipality_name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Descripción</label>
                                    <textarea
                                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                                        rows={3}
                                        value={newStory.description}
                                        onChange={e => setNewStory({ ...newStory, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">URL de Imagen</label>
                                    <input
                                        type="url"
                                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                                        value={newStory.image_url}
                                        onChange={e => setNewStory({ ...newStory, image_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-3 text-white font-bold rounded-lg transition-colors focus:outline-none"
                                        style={{ backgroundColor: '#374BA6' }}
                                    >
                                        Publicar Historia
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Stories List */}
                        {stories.length === 0 ? (
                            <EmptyState
                                icon="📖"
                                title="Sin historias de éxito"
                                description="Publica la primera historia de éxito rural usando el formulario de arriba."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stories.map(story => (
                                    <div key={story.id} className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                                        {story.image_url && (
                                            <img src={story.image_url} alt="" className="w-full h-40 object-cover" />
                                        )}
                                        <div className="p-4">
                                            <h4 className="font-bold text-sm mb-2">{story.title}</h4>
                                            <p className="text-xs text-gray-600 mb-2">{story.description}</p>
                                            <div className="flex justify-between items-center text-xs text-gray-400">
                                                <span>📍 {story.municipality_name || 'Sin municipio'}</span>
                                                <button
                                                    onClick={() => handleDeleteStory(story.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===================== RESOURCES PANEL (existing) ===================== */}
                {!loading && activeTab === 'resources' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                            <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Futura, sans-serif' }}>Subir Nuevo Recurso</h3>
                            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative" style={{ borderColor: '#D1D5DB' }}>
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleUpload} />
                                <span className="text-4xl block mb-2">📤</span>
                                <p className="font-medium text-gray-600">Arrastra archivos aquí o haz clic para subir</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, Imágenes, ZIP (Máx 10MB)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {resources.map((res: any) => (
                                <div key={res.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">📄</span>
                                            <h4 className="font-bold text-sm truncate" title={res.name}>{res.name}</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">ID: <span className="font-mono">{res.id.substring(0, 8)}...</span></p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: '#D1D5DB' }}>
                                        <span className="text-gray-400">{new Date(res.updated_at).toLocaleDateString()}</span>
                                        <a href={res.public_url} target="_blank" rel="noreferrer" className="font-bold hover:underline" style={{ color: '#374BA6' }}>Ver / Descargar</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===================== EMAILS PANEL (existing) ===================== */}
                {!loading && activeTab === 'emails' && (
                    <div className="space-y-6">
                        {emails.length === 0 && <p className="text-gray-500">No hay plantillas editadas. Se usan las predeterminadas.</p>}
                        {emails.map((tmpl: any) => (
                            <EmailEditor key={tmpl.key} tmpl={tmpl} onSave={handleEmailUpdate} />
                        ))}
                    </div>
                )}

                {/* ===================== SYSTEM PANEL (existing) ===================== */}
                {!loading && activeTab === 'system' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead style={{ backgroundColor: '#F9FAFB' }}>
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

// === UI COMPONENTS ===

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`pb-4 px-2 font-medium text-sm transition-colors relative whitespace-nowrap focus:outline-none`}
        style={{
            color: active ? '#374BA6' : '#6B7280',
            fontFamily: 'Atkinson Hyperlegible, sans-serif'
        }}
        onFocus={e => (e.currentTarget.style.outline = '3px solid #8095F2')}
        onBlur={e => (e.currentTarget.style.outline = 'none')}
    >
        {label}
        {active && <span className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: '#374BA6' }}></span>}
    </button>
);

const EmptyState: React.FC<{ icon: string, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
        <span className="text-6xl block mb-4">{icon}</span>
        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Futura, sans-serif' }}>{title}</h3>
        <p className="text-gray-500" style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}>{description}</p>
    </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        pending: '#FCD34D',
        validated: '#10B981',
        rejected: '#EF4444'
    };
    const labels: Record<string, string> = {
        pending: 'Pendiente',
        validated: 'Validado',
        rejected: 'Rechazado'
    };
    return (
        <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: colors[status] || '#9CA3AF', color: status === 'pending' ? '#1F2937' : 'white' }}
        >
            {labels[status] || status}
        </span>
    );
};

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
                    className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D1D5DB', '--tw-ring-color': '#8095F2' } as React.CSSProperties}
                    value={val}
                    onChange={handleChange}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {dirty && (
                    <button onClick={() => { onSave(config.key, val); setDirty(false); }} className="font-bold" style={{ color: '#374BA6' }}>Guardar</button>
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
        <div className="bg-white overflow-hidden" style={{ border: '1px solid #D1D5DB', borderRadius: '12px' }}>
            <div className="p-4 flex justify-between items-center cursor-pointer" style={{ backgroundColor: '#F9FAFB' }} onClick={() => setExpanded(!expanded)}>
                <h4 className="font-bold" style={{ color: '#1F2937' }}>{tmpl.key}</h4>
                <span className="text-xs text-gray-500">{expanded ? '▲' : '▼'}</span>
            </div>
            {expanded && (
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Asunto</label>
                        <input className="w-full border rounded p-2" style={{ borderColor: '#D1D5DB' }} value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">HTML Body</label>
                        <textarea className="w-full border rounded p-2 font-mono text-xs h-64" style={{ borderColor: '#D1D5DB' }} value={body} onChange={e => setBody(e.target.value)} />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => onSave(tmpl.key, subject, body)}
                            className="px-6 py-2 text-white font-bold rounded-lg"
                            style={{ backgroundColor: '#374BA6' }}
                        >
                            Guardar Plantilla
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperAdminConfig;
