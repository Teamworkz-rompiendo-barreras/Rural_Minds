
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import InclusionManualPDF from '../components/InclusionManualPDF';
import MunicipalityReportPDF from '../components/pdf/MunicipalityReportPDF';
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
        impactScore: 0,
        fixedPopulation: 0,
        newResidents: 0,
        jobsGeneratedQuarter: 0
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
    const [showContactModal, setShowContactModal] = useState(false);

    // Profile Editor State
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profileData, setProfileData] = useState<any>({
        slogan: '',
        description: '',
        internet_speed: '',
        connectivity_info: '',
        climate_co2: '',
        services: { health: '', education: '', coworking: '', commerce: '' },
        gallery_urls: [],
        status: 'draft'
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const logoUrl = React.useMemo(() => {
        const rawUrl = (user?.organization as any)?.branding_logo_url;
        if (!rawUrl) return null;
        if (rawUrl.startsWith('http') || rawUrl.startsWith('data:')) return rawUrl;
        return `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }, [(user?.organization as any)?.branding_logo_url]);

    const reportDocument = React.useMemo(() => (
        <MunicipalityReportPDF
            municipalityName={user?.organization?.name || 'Municipio'}
            municipalityLogo={logoUrl}
            stats={metrics}
            month={new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        />
    ), [user?.organization?.name, logoUrl, metrics]);

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

    const fetchProfileData = async () => {
        try {
            const res = await axios.get('/municipality/profile/details');
            setProfileData(res.data);
        } catch (err) {
            console.error("Error fetching profile details", err);
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await axios.put('/municipality/profile/details', profileData);
            alert("Configuración de ficha municipal guardada.");
            setShowProfileEditor(false);
        } catch (err) {
            alert("Error al guardar la configuración.");
        } finally {
            setSavingProfile(false);
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

    const handleContactTalent = async (talentId: string) => {
        try {
            await axios.post(`/municipality/talent/${talentId}/contact`);
            alert("Mensaje de apoyo enviado al talento interesado.");
        } catch (err) {
            alert("Error al contactar.");
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
        <div className="min-h-screen bg-n100 font-sans">
            <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto">
                {/* Fixed Sidebar Navigation */}
                <aside className="lg:w-64 lg:sticky lg:top-0 lg:h-screen bg-white border-r border-gray-200 z-30 flex flex-col pt-8">
                    <div className="px-6 mb-10">
                        <h2 className="text-xl font-heading font-extrabold text-p2 flex items-center gap-2">
                            Rural Minds
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Panel de Control</p>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        {[
                            { id: 'invites', label: 'Gestión de Invitaciones', icon: '✉️' },
                            { id: 'companies', label: 'Gestión de Tejido', icon: '🏢' },
                            { id: 'monitor', label: 'Monitor de Ofertas', icon: '📊' },
                            { id: 'talent', label: 'Gestión del Talento', icon: '👥' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all text-left ${activeTab === item.id
                                    ? 'bg-p2 text-white shadow-lg shadow-p2/20'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="p-6 border-t border-gray-50">
                        <button
                            onClick={() => { fetchProfileData(); setShowProfileEditor(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <span>⚙️</span>
                            <span>Ajustes Municipio</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
                    {/* Header */}
                    <header className="border-b border-gray-100 pb-6 mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
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
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="bg-p2 text-white px-5 py-3 rounded-xl font-bold hover:bg-p2/90 transition-all flex items-center gap-2 text-xs shadow-md"
                                >
                                    ➕ Invitar Empresa
                                </button>
                                <button
                                    onClick={() => { fetchTalentData(); setShowContactModal(true); }}
                                    className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 text-xs shadow-md"
                                >
                                    🧭 Contactar Talento Entrante
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const blob = await pdf(reportDocument).toBlob();
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `Reporte_Impacto_${(user?.organization?.name || 'Municipio').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            URL.revokeObjectURL(url);
                                        } catch (error) {
                                            console.error("Error generating PDF:", error);
                                            alert("Hubo un error al generar el reporte. Por favor, inténtalo de nuevo.");
                                        }
                                    }}
                                    className="bg-n900 text-white px-5 py-3 rounded-xl font-bold hover:bg-n900/90 transition-all flex items-center gap-2 text-xs shadow-md"
                                >
                                    📄 Generar Reporte de Impacto
                                </button>
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

                    {/* Impact Pride Section */}
                    <section className="mb-12 bg-p2 rounded-2xl p-8 text-white shadow-xl shadow-p2/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <span className="text-9xl">🌟</span>
                        </div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-3xl font-heading font-extrabold mb-2">Impacto Social Directo (Orgullo Local)</h2>
                                <p className="text-p1 font-bold uppercase tracking-widest text-xs">Resultados tangibles logrados a través de Rural Minds</p>
                            </div>
                        </div>
                        <div className="relative z-10">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                    <p className="text-sm font-bold text-p1 mb-2 uppercase tracking-wide italic">🏠 Población Fijada (KM 0)</p>
                                    <p className="text-5xl font-extrabold">{metrics.fixedPopulation}</p>
                                    <p className="text-[10px] text-white/60 mt-4 leading-relaxed">
                                        Vecinos que han encontrado oportunidades en el municipio y han decidido mantener su proyecto de vida aquí.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                    <p className="text-sm font-bold text-p1 mb-2 uppercase tracking-wide italic">🧭 Nuevos Vecinos Atraídos</p>
                                    <p className="text-5xl font-extrabold">{metrics.newResidents}</p>
                                    <p className="text-[10px] text-white/60 mt-4 leading-relaxed">
                                        Talento externo que ha marcado el municipio como destino y ha logrado integrarse laboralmente.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                    <p className="text-sm font-bold text-p1 mb-2 uppercase tracking-wide italic">💼 Empleos Creados (Trimestre)</p>
                                    <p className="text-5xl font-extrabold">{metrics.jobsGeneratedQuarter}</p>
                                    <p className="text-[10px] text-white/60 mt-4 leading-relaxed">
                                        Dinamización económica medida por el número de contrataciones efectivas en los últimos 90 días.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>


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
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                            <div>
                                                <h2 className="text-2xl font-heading font-bold text-n900 flex items-center gap-2">
                                                    👥 Gestión de Talento (Vista Ayuntamiento)
                                                </h2>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Clasificación Arraigo vs Atracción</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-p2/10 text-p2 text-[10px] font-bold rounded-full uppercase border border-p2/20">Arraigo: {localTalent.length}</span>
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase border border-emerald-100">Atracción: {attractionTalent.length}</span>
                                            </div>
                                        </div>

                                        {(localTalent.length > 0 || attractionTalent.length > 0) && (
                                            <div className="overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Perfil (Seudónimo)</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Origen / Estado</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Match Promedio</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Necesidades Clave</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acción Recomendada</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {/* Arraigo Talent */}
                                                        {localTalent.map((_t, i) => (
                                                            <tr key={`local-${i}`} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-n900 text-sm">RM-{429 + i}</span>
                                                                        <span className="text-[9px] bg-p2 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Local</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                                                        <span className="text-p2">📍</span> Municipio
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-p2" style={{ width: '85%' }}></div>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-n900">85%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-help" title="Preferencia Sensorial Detectada">
                                                                        <span className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded-lg text-xs">🔇</span>
                                                                        Baja acústica
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button className="text-[10px] font-bold bg-white border border-p2 text-p2 px-4 py-2 rounded-xl hover:bg-p2 hover:text-white transition-all shadow-sm">
                                                                        Validar Residencia
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Atracción Talent */}
                                                        {attractionTalent.map((t, i) => (
                                                            <tr key={`attr-${i}`} className="hover:bg-emerald-50/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-n900 text-sm">RM-{102 + i}</span>
                                                                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Externo</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                                                        <span className="text-emerald-500">🏙️</span> {t.from_location || 'Madrid'} -&gt; Mudanza
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-emerald-600" style={{ width: '92%' }}></div>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-n900">92%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-help" title="Necesidad de Accesibilidad">
                                                                        <span className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded-lg text-xs">💡</span>
                                                                        Luz Natural
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end gap-2 text-[10px] font-black uppercase tracking-tighter">
                                                                        <button
                                                                            onClick={() => handleContactTalent(t.id)}
                                                                            className="text-gray-400 hover:text-n900 underline decoration-gray-200 transition-colors"
                                                                        >
                                                                            Contactar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSendWelcome(t.id)}
                                                                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                                                                        >
                                                                            Enviar Guía Acogida
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {(localTalent.length === 0 && attractionTalent.length === 0) && (
                                            <div className="p-16 text-center text-gray-400 italic">
                                                <span className="text-4xl block mb-4 opacity-20">👤</span>
                                                No hay registros de talento disponibles todavía.
                                            </div>
                                        )}
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

                        {/* Profile Editor Modal */}
                        {showProfileEditor && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-n900/40 backdrop-blur-sm animate-in fade-in duration-300">
                                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 slide-in-from-bottom-8 animate-in duration-500">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-heading font-bold text-n900">Configuración de la Ficha Municipal</h3>
                                        <button onClick={() => setShowProfileEditor(false)} className="text-gray-400 hover:text-n900 text-xl">✕</button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Eslogan Publicitario</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-p2 focus:border-transparent outline-none"
                                                value={profileData.slogan}
                                                onChange={(e) => setProfileData({ ...profileData, slogan: e.target.value })}
                                                placeholder="Ej. El paraíso del teletrabajo"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Descripción del Municipio</label>
                                            <textarea
                                                rows={4}
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-p2 focus:border-transparent outline-none"
                                                value={profileData.description}
                                                onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                                                placeholder="Describe por qué el talento debería elegir tu municipio..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Internet / Fibra</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none"
                                                    value={profileData.internet_speed}
                                                    onChange={(e) => setProfileData({ ...profileData, internet_speed: e.target.value })}
                                                    placeholder="Ej. 1Gbps Simétrico"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Transporte / Distancia</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none"
                                                    value={profileData.connectivity_info}
                                                    onChange={(e) => setProfileData({ ...profileData, connectivity_info: e.target.value })}
                                                    placeholder="Ej. 45 min de la capital"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                            <h4 className="font-bold text-orange-800 text-sm mb-4 uppercase tracking-wider">Servicios Esenciales</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { key: 'health', label: 'Salud' },
                                                    { key: 'education', label: 'Educación' },
                                                    { key: 'coworking', label: 'Coworking' },
                                                    { key: 'commerce', label: 'Comercio' }
                                                ].map(s => (
                                                    <div key={s.key}>
                                                        <label className="block text-[10px] font-bold text-orange-700 mb-1 uppercase tracking-widest">{s.label}</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 bg-white border border-orange-100 rounded-lg outline-none text-sm"
                                                            value={profileData.services[s.key]}
                                                            onChange={(e) => setProfileData({
                                                                ...profileData,
                                                                services: { ...profileData.services, [s.key]: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Galería de Imágenes (URLs separadas por comas)</label>
                                            <textarea
                                                rows={2}
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none"
                                                value={profileData.gallery_urls?.join(', ')}
                                                onChange={(e) => setProfileData({
                                                    ...profileData,
                                                    gallery_urls: e.target.value.split(',').map(u => u.trim())
                                                })}
                                                placeholder="https://image1.jpg, https://image2.jpg"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 mt-8">
                                            <button onClick={() => setShowProfileEditor(false)} className="px-6 py-3 font-bold text-gray-500">Cancelar</button>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={savingProfile}
                                                className="px-8 py-3 bg-p2 text-white rounded-xl font-bold shadow-lg shadow-p2/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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

                    {/* Contact Talent Modal */}
                    {showContactModal && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-n900/40 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl p-8 slide-in-from-bottom-8 animate-in duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-heading font-bold text-n900">🧭 Contactar Talento Entrante</h3>
                                    <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-n900 text-2xl">✕</button>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">Esta lista muestra a las personas interesadas en mudarse a {user?.organization?.name}. Puedes enviarles un mensaje de apoyo y recursos municipales.</p>

                                <div className="space-y-4">
                                    {attractionTalent.length > 0 ? (
                                        attractionTalent.map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                                        {t.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-n900">{t.full_name}</p>
                                                        <p className="text-xs text-gray-500">Origen: {t.from_location}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleContactTalent(t.id)}
                                                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all font-bold"
                                                >
                                                    Contactar 📩
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400 italic border-2 border-dashed rounded-xl">
                                            No hay solicitudes de atracción pendientes en este momento.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button onClick={() => setShowContactModal(false)} className="btn-secondary px-6">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-n900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in duration-300">
                        <h3 className="text-2xl font-bold text-n900 mb-2">Validar Empresa</h3>
                        <p className="text-gray-500 mb-6">Confirma si esta empresa cumple con los requisitos de impacto social para operar en tu municipio.</p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => confirmValidation()}
                                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all"
                            >
                                ✅ Validar
                            </button>
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInviteModal && (
                <div className="fixed inset-0 bg-n900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in zoom-in duration-300">
                        <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                        <h3 className="text-2xl font-bold text-n900 mb-2">Invitar Colaboradores</h3>
                        <p className="text-gray-500 mb-6">Envía una invitación personalizada a empresas para que se unan a tu ecosistema rural.</p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Lista de Emails (uno por línea)</label>
                            <textarea
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-p2 outline-none text-sm"
                                placeholder="ejemplo@empresa.com"
                                value={inviteEmails}
                                onChange={(e) => setInviteEmails(e.target.value)}
                            />
                        </div>

                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl mb-6">
                            <p className="text-xs text-orange-800 leading-relaxed font-medium">
                                💡 Se enviará un email con el sello oficial de <strong>{user?.organization?.name}</strong>.
                            </p>
                        </div>

                        <button
                            onClick={handleSendInvites}
                            disabled={inviting || !inviteEmails}
                            className="w-full bg-p2 text-white font-bold py-4 rounded-xl hover:bg-p2/90 disabled:opacity-50 transition-all shadow-lg shadow-p2/20"
                        >
                            {inviting ? 'Enviando...' : 'Enviar Invitaciones masivas 🚀'}
                        </button>
                    </div>
                </div>
            )}

            {showContactModal && (
                <div className="fixed inset-0 bg-n900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full p-8 lg:p-12 my-8 relative animate-in zoom-in duration-300">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-n900 transition-all font-bold"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl text-2xl">🧭</div>
                            <div>
                                <h3 className="text-3xl font-heading font-extrabold text-n900">Talento Entrante</h3>
                                <p className="text-gray-500">Personas interesadas en mudarse a {user?.organization?.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {attractionTalent.length > 0 ? (
                                attractionTalent.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                                {t.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-n900">{t.full_name}</p>
                                                <p className="text-xs text-gray-500">Origen: {t.from_location}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleContactTalent(t.id)}
                                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all font-bold"
                                        >
                                            Contactar 📩
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-400 italic border-2 border-dashed rounded-xl">
                                    No hay solicitudes de atracción pendientes en este momento.
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowContactModal(false)} className="btn-secondary px-6">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Editor Modal */}
            {showProfileEditor && (
                <div className="fixed inset-0 bg-n900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full p-8 lg:p-12 my-8 relative animate-in zoom-in duration-300">
                        <button
                            onClick={() => setShowProfileEditor(false)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-n900 transition-all font-bold"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-p2/10 text-p2 p-3 rounded-2xl text-2xl">⚙️</div>
                            <div>
                                <h3 className="text-3xl font-heading font-extrabold text-n900">Configuración del Municipio</h3>
                                <p className="text-gray-500">Define cómo se presenta tu municipio al mundo</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Eslogan de Atracción</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-p2 outline-none"
                                        placeholder="Ej: El corazón verde de la comarca"
                                        value={profileData.slogan}
                                        onChange={(e) => setProfileData({ ...profileData, slogan: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción General</label>
                                    <textarea
                                        className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-p2 outline-none text-sm"
                                        placeholder="Describe la calidad de vida, los servicios y el ambiente..."
                                        value={profileData.description}
                                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Velocidad Internet</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm"
                                            placeholder="Ej: Fibra 1Gbps"
                                            value={profileData.internet_speed}
                                            onChange={(e) => setProfileData({ ...profileData, internet_speed: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CO2 / Clima</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm"
                                            placeholder="Ej: Aire Puro / Continental"
                                            value={profileData.climate_co2}
                                            onChange={(e) => setProfileData({ ...profileData, climate_co2: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                    <h4 className="font-bold text-orange-800 text-sm mb-4 uppercase tracking-wider">Servicios Esenciales</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { key: 'health', label: 'Salud' },
                                            { key: 'education', label: 'Educación' },
                                            { key: 'coworking', label: 'Coworking' },
                                            { key: 'commerce', label: 'Comercio' }
                                        ].map(s => (
                                            <div key={s.key}>
                                                <label className="block text-[10px] font-bold text-orange-700 mb-1 uppercase tracking-widest">{s.label}</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 bg-white border border-orange-100 rounded-lg outline-none text-sm"
                                                    value={profileData.services[s.key]}
                                                    onChange={(e) => setProfileData({
                                                        ...profileData,
                                                        services: { ...profileData.services, [s.key]: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URLs de la Galería (coma sep.)</label>
                                    <textarea
                                        className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-p2 outline-none text-xs"
                                        placeholder="https://imagen1.jpg, https://imagen2.jpg"
                                        value={profileData.gallery_urls?.join(', ')}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            gallery_urls: e.target.value.split(',').map(u => u.trim()).filter(u => u)
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="flex-1 bg-p2 text-white font-bold py-4 rounded-xl hover:bg-p2/90 disabled:opacity-50 transition-all shadow-lg shadow-p2/20"
                            >
                                {savingProfile ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                            <button
                                onClick={() => setShowProfileEditor(false)}
                                className="px-8 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityDashboard;
