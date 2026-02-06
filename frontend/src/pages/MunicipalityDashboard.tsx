
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InclusionManualPDF from '../components/InclusionManualPDF';
import axios from '../config/api';

// Mock data for fallback
const mockMetrics = {
    insertionRate: 85,
    companiesValidated: 12,
    activeProjects: 5,
    localCandidates: 34,
    attractionCount: 0, // Attraction metric (new residents)
    pendingValidations: 2,
    impactScore: 92
};

const mockCompanies = [
    { id: '1', name: 'Cooperativa Agroalimentaria del Valle', status: 'validated', vacancies: 3, lastActivity: '2026-01-28' },
    { id: '2', name: 'Artesanía Sierra Norte S.L.', status: 'validated', vacancies: 1, lastActivity: '2026-01-30' },
    { id: '3', name: 'TechRural Soluciones', status: 'pending', vacancies: 0, lastActivity: '2026-01-29' },
];



const MunicipalityDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    // Data State (Mocked for now, but stateful)
    const [metrics, setMetrics] = useState(mockMetrics);
    const [companies, setCompanies] = useState<any[]>(mockCompanies);

    // Invitation State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmails, setInviteEmails] = useState('');
    const [invitationStatus, setInvitationStatus] = useState<{ pending: any[], active: any[] }>({ pending: [], active: [] });
    const [inviting, setInviting] = useState(false);

    const handleValidate = (id: string) => {
        setSelectedCompany(id);
        setShowValidationModal(true);
    };

    const confirmValidation = () => {
        if (selectedCompany) {
            setCompanies(prev => prev.map(c =>
                c.id === selectedCompany ? { ...c, status: 'validated' } : c
            ));
            alert("Empresa validada correctamente.");
        }
        setShowValidationModal(false);
        setSelectedCompany(null);
    };

    // Fetch Invite Status & Stats
    useEffect(() => {
        if (user?.organization?.id) {
            const fetchData = async () => {
                try {
                    const [statusRes, statsRes] = await Promise.all([
                        axios.get('/municipality/companies-status'),
                        axios.get('/municipality/stats')
                    ]);
                    setInvitationStatus(statusRes.data);
                    setMetrics(statsRes.data);
                } catch (err) {
                    console.error("Error fetching dashboard data", err);
                }
            };
            fetchData();
        }
    }, [user]);

    const handleSendInvites = async () => {
        setInviting(true);
        const emailList = inviteEmails.split('\n').map(e => e.trim()).filter(e => e);
        try {
            await axios.post('/municipality/invite-companies', {
                emails: emailList,
                signature: `Ayuntamiento de ${user?.organization?.name || 'municipio'}`
            });
            alert('Invitaciones enviadas correctamente');
            setShowInviteModal(false);
            setInviteEmails('');
            // Refresh status
            const res = await axios.get('/municipality/companies-status');
            setInvitationStatus(res.data);

        } catch (err) {
            alert('Error al enviar invitaciones');
            console.error(err);
        } finally {
            setInviting(false);
        }
    };

    const getRefLink = () => {
        // In real app, use window.location.origin or env var
        const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5173' : 'https://rural-minds.vercel.app';
        return `${baseUrl}/register/company?ref=${user?.organization?.id}`;
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse">Cargando datos del municipio...</div>;
    }

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-6 font-body">

            {/* Header ... (same as before) */}
            {/* Header */}
            <header className="border-b border-gray-100 pb-6 mb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-heading font-bold text-p2">
                                Panel del Ayuntamiento
                            </h1>
                            {/* Identity Badge */}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user?.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                {user?.role === 'super_admin' ? '👀 Modo Superadmin' : `Admin: ${user?.full_name || 'Desconocido'}`}
                            </span>
                        </div>
                        <p className="text-xl text-n900">
                            {user?.organization?.name || "Tu Municipio"} — Gestión de Impacto Social
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-accent/10 border border-accent/40 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                            <span className="text-sm font-extrabold text-p2 italic">
                                "Innovación con Denominación de Origen"
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Campaign Kit Section */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-p2 mb-2">📢 Campaña de Adhesión</h2>
                        <p className="text-gray-700 max-w-2xl">
                            Invita a las empresas de tu localidad a unirse a la red. Envía invitaciones masivas o comparte tu enlace de afiliación oficial.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="btn-primary shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>✉️</span> Enviar Invitaciones Masivas
                        </button>
                        <div className="bg-white p-2 rounded border border-blue-200 text-xs flex items-center gap-2">
                            <code className="text-gray-500 truncate max-w-[200px]">{getRefLink()}</code>
                            <button
                                onClick={() => navigator.clipboard.writeText(getRefLink())}
                                className="text-p2 font-bold hover:underline"
                            >
                                Copiar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="mt-6 flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                        <span className="font-bold">{invitationStatus.pending.length} Pendientes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-bold">{invitationStatus.active.length} Activas (En red)</span>
                    </div>
                </div>
            </section>

            {/* Key Metrics ... (Existing) */}
            <section>
                <h2 className="font-heading font-bold text-2xl text-n900 mb-4 flex items-center gap-2">
                    <span>📊</span> Métricas de Impacto Social
                </h2>
                {/* ... Metrics Grid (Leaving as is or simplified logic) ... */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-green-600 mb-1">{metrics.insertionRate}%</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Inserción Laboral</p>
                    </div>
                    {/* ... Other metrics ... */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{metrics.companiesValidated}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Empresas Validadas</p>
                    </div>
                </div>
            </section>

            {/* Main Content Grid (Companies List) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-2xl font-heading font-bold text-n900">Gestión de Empresas</h2>
                    </div>
                    {/* Existing Company List Logic */}
                    <ul className="space-y-4">
                        {companies.map((company) => (
                            <li key={company.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border bg-gray-50 border-gray-100">
                                <div className="flex-1 mb-3 md:mb-0">
                                    <h4 className="font-bold text-n900 text-lg">{company.name}</h4>
                                    <p className="text-sm text-gray-500">Status: {company.status}</p>
                                </div>
                                {company.status !== 'validated' && (
                                    <button onClick={() => handleValidate(company.id)} className="text-sm font-bold text-orange-600 border border-orange-200 px-3 py-1 rounded hover:bg-orange-50">
                                        Validar
                                    </button>
                                )}
                            </li>
                        ))}
                        {companies.length === 0 && <p className="text-gray-500 text-center py-4">No hay empresas asignadas aún.</p>}
                    </ul>
                </div>

                {/* Resources Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-heading font-bold text-lg text-n900 mb-4 pb-3 border-b">
                            📚 Centro de Recursos
                        </h3>

                        {/* Landing Guide Management */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Mi Guía de Aterrizaje (URL)</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    className="input-field text-sm flex-1"
                                    placeholder="https://ejemplo.es/guia.pdf"
                                    value={(invitationStatus as any).landing_guide_url || ''}
                                    onChange={(e) => {
                                        // Simplified local state update for demo or use a dedicated state
                                        setInvitationStatus((prev: any) => ({ ...prev, landing_guide_url: e.target.value }));
                                    }}
                                />
                                <button
                                    onClick={async () => {
                                        try {
                                            await axios.put('/org/municipalities/me/details', {
                                                landing_guide_url: (invitationStatus as any).landing_guide_url
                                            });
                                            alert("Guía de aterrizaje actualizada.");
                                        } catch (err) {
                                            alert("Error al guardar la guía.");
                                        }
                                    }}
                                    className="bg-accent text-white px-3 py-1 rounded text-sm font-bold hover:bg-accent/90"
                                    aria-label="Guardar URL de la guía"
                                >
                                    💾
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Este enlace se enviará automáticamente a los nuevos talentos interesados.</p>
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-sm font-bold text-gray-700 mb-3 text-center">Manual de Inclusión Municipal</p>
                            <PDFDownloadLink document={<InclusionManualPDF municipalityName={user?.organization?.name} />} fileName="Manual_Inclusion_RuralMinds.pdf">
                                {({ loading }) => (
                                    <button
                                        disabled={loading}
                                        className="w-full bg-p2/10 text-p2 border-2 border-p2 font-bold py-3 px-4 rounded-lg hover:bg-p2 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        aria-label={loading ? "Generando PDF" : "Descargar Manual de Inclusión en PDF"}
                                    >
                                        {loading ? 'Generando...' : '📄 Descargar Manual PDF'}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Companies Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-heading font-bold text-n900">📨 Invitar Empresas Locales</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-sm text-gray-700 mb-2">Vista Previa del Mensaje:</h4>
                            <div className="text-sm text-gray-600 italic border-l-4 border-p2 pl-3">
                                "Estimado responsable... Desde el Ayuntamiento de <strong>{user?.organization?.name}</strong>, estamos impulsando Rural Minds... Unirse es gratuito..."
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block font-bold text-n900 mb-2">Correos Electrónicos (uno por línea)</label>
                            <textarea
                                className="input-field w-full h-40 font-mono text-sm"
                                placeholder="empresa1@local.com&#10;taller@pueblo.es&#10;cooperativa@agro.com"
                                value={inviteEmails}
                                onChange={e => setInviteEmails(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-2">Se enviará una invitación personalizada a cada dirección.</p>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowInviteModal(false)} className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-600">Cancelar</button>
                            <button
                                onClick={handleSendInvites}
                                disabled={inviting || !inviteEmails.trim()}
                                className="btn-primary px-8 py-3 flex items-center gap-2"
                            >
                                {inviting ? 'Enviando...' : 'Enviar Invitaciones 🚀'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Modal (Existing) */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="font-heading font-bold text-2xl text-n900 mb-4">Confirmar Validación</h3>
                        <p className="text-gray-600 mb-6">¿Certificar a esta empresa como parte de la red Rural Minds?</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowValidationModal(false)} className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-gray-600">Cancelar</button>
                            <button onClick={confirmValidation} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold">Validar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityDashboard;
