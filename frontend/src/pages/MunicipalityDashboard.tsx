
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InclusionManualPDF from '../components/InclusionManualPDF';
import axios from '../config/api';

const MunicipalityDashboard: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({
        insertionRate: 0,
        companiesValidated: 0,
        activeProjects: 0,
        localCandidates: 0,
        attractionCount: 0,
        pendingValidations: 0,
        impactScore: 0
    });
    const [companies, setCompanies] = useState<any[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Invitation State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmails, setInviteEmails] = useState('');
    const [invitationStatus, setInvitationStatus] = useState<{ pending: any[], active: any[] }>({ pending: [], active: [] });
    const [inviting, setInviting] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'invites' | 'companies' | 'monitor' | 'talent'>('invites');
    const [vacancies, setVacancies] = useState<any[]>([]);
    const [excellenceCompanies, setExcellenceCompanies] = useState<any[]>([]);

    // Talent Management Sub-states
    const [localTalent, setLocalTalent] = useState<any[]>([]);
    const [attractionTalent, setAttractionTalent] = useState<any[]>([]);
    const [sensoryStats, setSensoryStats] = useState<any>({});

    const [loadingTabs, setLoadingTabs] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        if (user && activeTab === 'monitor') {
            fetchVacancies();
        } else if (user && activeTab === 'companies') {
            fetchExcellence();
        } else if (user && activeTab === 'talent') {
            fetchTalentData();
        }
    }, [user, activeTab]);

    const fetchData = async () => {
        try {
            const [statsRes, statusRes] = await Promise.all([
                axios.get('/municipality/stats'),
                axios.get('/municipality/companies-status')
            ]);
            setMetrics(statsRes.data);
            setInvitationStatus(statusRes.data);
            setCompanies(statusRes.data.active || []);
        } catch (err) {
            console.error("Error fetching Dashboard data", err);
        }
    };

    const fetchVacancies = async () => {
        setLoadingTabs(true);
        try {
            const res = await axios.get('/municipality/vacancies');
            setVacancies(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTabs(false);
        }
    };

    const fetchExcellence = async () => {
        setLoadingTabs(true);
        try {
            const res = await axios.get('/municipality/excellence-companies');
            setExcellenceCompanies(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTabs(false);
        }
    };

    const fetchTalentData = async () => {
        setLoadingTabs(true);
        try {
            const [localRes, attractionRes, statsRes] = await Promise.all([
                axios.get('/municipality/talent/local'),
                axios.get('/municipality/talent/attraction'),
                axios.get('/municipality/talent/sensory-stats')
            ]);
            setLocalTalent(localRes.data);
            setAttractionTalent(attractionRes.data);
            setSensoryStats(statsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTabs(false);
        }
    };

    const handleSendWelcome = async (talentId: string) => {
        try {
            await axios.post(`/municipality/talent/${talentId}/welcome`);
            alert("Guía de bienvenida enviada correctamente.");
        } catch (err) {
            alert("Error al enviar la bienvenida.");
        }
    };

    const handleValidate = (id: string) => {
        setSelectedCompanyId(id);
        setShowValidationModal(true);
    };

    const confirmValidation = async () => {
        if (!selectedCompanyId) return;
        try {
            await axios.put(`/admin/organizations/${selectedCompanyId}/validate`);
            alert("Empresa validada correctamente.");
            setShowValidationModal(false);
            fetchData();
        } catch (err) {
            alert("Error al validar la empresa.");
        }
    };

    const handleSendInvites = async () => {
        setInviting(true);
        const emailList = inviteEmails.split('\n').map(e => e.trim()).filter(e => e);
        try {
            await axios.post('/municipality/invite-companies', {
                emails: emailList,
                signature: `${user?.organization?.name || 'Ayuntamiento'}`
            });
            alert('Invitaciones enviadas correctamente');
            setShowInviteModal(false);
            setInviteEmails('');
            fetchData();
        } catch (err) {
            alert('Error al enviar invitaciones');
            console.error(err);
        } finally {
            setInviting(false);
        }
    };

    const getRefLink = () => {
        const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5173' : 'https://rural-minds.vercel.app';
        return `${baseUrl}/register/company?ref=${user?.organization?.id}`;
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="border-b border-gray-100 pb-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-heading font-bold text-p2">
                                Panel del Ayuntamiento
                            </h1>
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

            {/* Metrics Overview */}
            <section className="mb-10">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-green-600 mb-1">{metrics.insertionRate}%</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Inserción Laboral</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{metrics.companiesValidated}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Empresas Validadas</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{metrics.activeProjects}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Ofertas Activas</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{metrics.localCandidates}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Talento Local</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-orange-600 mb-1">{metrics.pendingValidations}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Pendientes</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center ring-2 ring-accent ring-inset">
                        <p className="text-3xl font-bold text-accent mb-1">{metrics.impactScore}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Social Score</p>
                    </div>
                </div>
            </section>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b pb-px">
                <button
                    onClick={() => setActiveTab('invites')}
                    className={`pb-4 px-2 font-bold transition-all border-b-2 ${activeTab === 'invites' ? 'border-p2 text-p2' : 'border-transparent text-gray-400 opacity-60'}`}
                >
                    ✉️ Centro de Invitaciones
                </button>
                <button
                    onClick={() => setActiveTab('companies')}
                    className={`pb-4 px-2 font-bold transition-all border-b-2 ${activeTab === 'companies' ? 'border-p2 text-p2' : 'border-transparent text-gray-400 opacity-60'}`}
                >
                    🏢 Gestión de Tejido
                </button>
                <button
                    onClick={() => setActiveTab('monitor')}
                    className={`pb-4 px-2 font-bold transition-all border-b-2 ${activeTab === 'monitor' ? 'border-p2 text-p2' : 'border-transparent text-gray-400 opacity-60'}`}
                >
                    📊 Monitor de Ofertas
                </button>
                <button
                    onClick={() => setActiveTab('talent')}
                    className={`pb-4 px-2 font-bold transition-all border-b-2 ${activeTab === 'talent' ? 'border-p2 text-p2' : 'border-transparent text-gray-400 opacity-60'}`}
                >
                    👥 Gestión del Talento
                </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2">
                    {activeTab === 'invites' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-heading font-bold text-n900">Seguimiento de Invitaciones</h2>
                                <button onClick={() => setShowInviteModal(true)} className="btn-primary py-2 text-sm">Nuevas Invitaciones 📨</button>
                            </div>
                            <div className="space-y-4">
                                {(invitationStatus as any).pending?.length > 0 ? (
                                    (invitationStatus as any).pending.map((inv: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-p2/10 rounded-full flex items-center justify-center text-p2 font-bold text-xs">
                                                    ?
                                                </div>
                                                <div>
                                                    <p className="font-bold text-n900 text-sm">{inv.email}</p>
                                                    <p className="text-xs text-gray-500">Invitado el {new Date(inv.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase">Pendiente</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-8 text-gray-500 italic">No hay invitaciones pendientes.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'companies' && (
                        <div className="space-y-6">
                            {/* Validation Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="text-2xl font-heading font-bold text-n900 mb-6 border-b pb-4">Validación "Denominación de Origen"</h2>
                                <ul className="space-y-4">
                                    {companies.filter(c => c.validation_status !== 'validated').length > 0 ? (
                                        companies.filter(c => c.validation_status !== 'validated').map((company) => (
                                            <li key={company.id} className="flex items-center justify-between p-4 rounded-xl border bg-orange-50/30 border-orange-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white p-2 rounded-lg border flex items-center justify-center">
                                                        {company.logo ? <img src={company.logo} alt="" className="max-h-full max-w-full" /> : <span>🏢</span>}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-n900 text-lg">{company.name}</h4>
                                                        <span className="text-xs font-bold text-orange-600 uppercase">Esperando Validación</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleValidate(company.id)} className="bg-orange-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm text-sm">
                                                    Otorgar Sello 📜
                                                </button>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4 italic">Todas las empresas están validadas.</p>
                                    )}
                                </ul>
                            </div>

                            {/* Excellence Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-p1/30 bg-gradient-to-br from-white to-p1/5">
                                <h2 className="text-2xl font-heading font-bold text-n900 mb-6 flex items-center gap-2">
                                    🌟 Sello de Excelencia
                                    <span className="text-xs bg-p1 text-n900 px-2 py-0.5 rounded-full font-bold">Premium</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {excellenceCompanies.length > 0 ? (
                                        excellenceCompanies.map((c, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-p1/40 rounded-xl shadow-sm">
                                                <img src={c.logo || '/logo.png'} className="w-10 h-10 object-contain" alt="" />
                                                <div>
                                                    <p className="font-bold text-sm text-n900">{c.name}</p>
                                                    <p className="text-[10px] text-green-600 font-bold uppercase">Contratación Verificada</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-8 text-gray-500 border-2 border-dashed border-p1/20 rounded-xl">
                                            Aún no hay empresas con Sello de Excelencia.
                                            <p className="text-xs mt-1">Se otorga tras la primera contratación y adaptación exitosa.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'monitor' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-heading font-bold text-n900 mb-6 border-b pb-4">Monitor de Vacantes Locales</h2>
                            {loadingTabs ? (
                                <p className="text-center py-8">Cargando ofertas...</p>
                            ) : (
                                <div className="space-y-4">
                                    {vacancies.length > 0 ? (
                                        vacancies.map((v, i) => (
                                            <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${v.is_difficult_to_fill ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-n900 text-sm">{v.title}</h4>
                                                        {v.is_difficult_to_fill && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse uppercase">DIFÍCIL DE CUBRIR</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium">{v.company_name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{v.applications_count} aplicaciones recibidas</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                        {v.status === 'open' ? 'Abierta' : 'Cerrada'}
                                                    </span>
                                                    {v.is_difficult_to_fill && <p className="text-[10px] text-red-600 font-bold mt-2 italic">Acción Sugerida ADL</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-12 text-gray-500 italic">No hay vacantes publicadas en el municipio actualmente.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'talent' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Radar KM 0 */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-heading font-bold text-n900">📍 Radar de Talento Local (KM 0)</h2>
                                    <span className="text-xs bg-p2/10 text-p2 px-3 py-1 rounded-full font-bold">Residencial</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-p2/5 p-4 rounded-xl border border-p2/10 text-center">
                                        <p className="text-4xl font-bold text-p2 mb-1">{localTalent.length}</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Vecinos Registrados</p>
                                    </div>
                                    <div className="bg-accent/5 p-4 rounded-xl border border-accent/10 text-center">
                                        <p className="text-4xl font-bold text-accent mb-1">{[...new Set(localTalent.flatMap(t => t.skills))].length}</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Habilidades en el Municipio</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Composición del Pool Académico/Profesional:</h4>
                                    {localTalent.slice(0, 5).map((t, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                            <span className="text-xl">👤</span>
                                            <div>
                                                <p className="font-bold text-n900">Perfil Anónimo #{i + 1}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {t.skills.map((s: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-white border text-[10px] rounded-full text-gray-500">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {localTalent.length > 5 && <p className="text-xs text-gray-400 text-center py-2">+ {localTalent.length - 5} perfiles adicionales</p>}
                                </div>
                            </div>

                            {/* Attraction Management */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-heading font-bold text-n900">🧭 Gestor de "Nuevos Residentes"</h2>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">Atracción</span>
                                </div>
                                <div className="space-y-4">
                                    {attractionTalent.length > 0 ? (
                                        attractionTalent.map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                                        {t.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-n900">{t.full_name}</p>
                                                        <p className="text-xs text-gray-500">Actualmente en: <span className="font-bold text-emerald-600">{t.from_location}</span></p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleSendWelcome(t.id)}
                                                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                >
                                                    🚀 Enviar Bienvenida
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                            No hay personas de fuera interesadas en mudarse hoy.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sensory Needs Analysis */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
                                <h2 className="text-2xl font-heading font-bold text-n900 mb-2">🧠 Perfiles Sensoriales Agregados</h2>
                                <p className="text-xs text-gray-500 mb-6 uppercase font-bold tracking-widest">Inteligencia para Espacios Públicos y Coworkings</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-4 rounded-xl border border-orange-100 text-center shadow-sm">
                                        <p className="text-sm font-bold text-gray-600 mb-4">Luz Tenue</p>
                                        <div className="relative w-20 h-20 mx-auto">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-orange-50" />
                                                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={220} strokeDashoffset={220 - (220 * (sensoryStats.low_lighting_pct || 0) / 100)} className="text-orange-500" />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center font-bold text-orange-600">{sensoryStats.low_lighting_pct || 0}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-orange-100 text-center shadow-sm">
                                        <p className="text-sm font-bold text-gray-600 mb-4">Silencio Absoluto</p>
                                        <div className="relative w-20 h-20 mx-auto">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-orange-50" />
                                                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={220} strokeDashoffset={220 - (220 * (sensoryStats.quiet_environment_pct || 0) / 100)} className="text-blue-500" />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center font-bold text-blue-600">{sensoryStats.quiet_environment_pct || 0}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-orange-100 text-center shadow-sm">
                                        <p className="text-sm font-bold text-gray-600 mb-4">Teletrabajo</p>
                                        <div className="relative w-20 h-20 mx-auto">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-orange-50" />
                                                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={220} strokeDashoffset={220 - (220 * (sensoryStats.flexible_hours_pct || 0) / 100)} className="text-green-500" />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center font-bold text-green-600">{sensoryStats.flexible_hours_pct || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-6 italic text-center">
                                    * Estos datos agregados permiten al ayuntamiento adaptar infraestructuras municipales y planes de ADL.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shared Resources Sidebar */}
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
                                        className="w-full bg-p2/10 text-p2 border-2 border-p2 font-bold py-3 px-4 rounded-lg hover:bg-p2 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                        aria-label={loading ? "Generando PDF" : "Descargar Manual de Inclusión en PDF"}
                                    >
                                        {loading ? 'Generando...' : '📄 Descargar Manual PDF'}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>

                    <div className="bg-p2/5 p-6 rounded-xl border border-p2/20">
                        <h4 className="font-bold text-p2 mb-2">Enlace de Registro Local</h4>
                        <p className="text-[10px] text-gray-600 mb-3 leading-relaxed">Usa este enlace para atraer empresas directamente a tu municipio:</p>
                        <div className="bg-white p-3 rounded border border-p2/30 text-[9px] font-mono break-all text-p2 mb-3 shadow-inner">
                            {getRefLink()}
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(getRefLink()); alert("Enlace copiado"); }}
                            className="w-full bg-p2 text-white text-xs font-bold py-2.5 rounded-lg active:scale-95 transition-transform"
                        >
                            Copiar Enlace para Difusión 🔗
                        </button>
                    </div>
                </div>
            </div>

            {/* Invite Companies Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-heading font-bold text-n900">📨 Invitar Empresas Locales</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl">×</button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-2">Vista Previa del Mensaje</h4>
                            <div className="text-sm text-gray-600 italic border-l-4 border-p2 pl-3">
                                "Estimado responsable... Desde el <strong>{user?.organization?.name}</strong>, estamos impulsando Rural Minds... Unirse es gratuito..."
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block font-bold text-n900 mb-2 text-sm">Correos Electrónicos (uno por línea)</label>
                            <textarea
                                className="input-field w-full h-40 font-mono text-xs p-3 leading-relaxed"
                                placeholder="empresa1@local.com&#10;taller@pueblo.es&#10;cooperativa@agro.com"
                                value={inviteEmails}
                                onChange={e => setInviteEmails(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-500 mt-2">Cada empresa recibirá un acceso personalizado a la plataforma.</p>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowInviteModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
                            <button
                                onClick={handleSendInvites}
                                disabled={inviting || !inviteEmails.trim()}
                                className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-p2/30 disabled:shadow-none"
                            >
                                {inviting ? 'Enviando...' : 'Enviar Invitaciones 🚀'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Modal */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                            📜
                        </div>
                        <h3 className="font-heading font-bold text-2xl text-n900 mb-4 text-center">Denominación de Origen</h3>
                        <p className="text-gray-600 mb-6 text-center text-sm">¿Certificar que esta empresa opera formalmente en el municipio para otorgarle el sello oficial?</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowValidationModal(false)} className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
                            <button onClick={confirmValidation} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 text-sm">Aprobar Sello</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityDashboard;
