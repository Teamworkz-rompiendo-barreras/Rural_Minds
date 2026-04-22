import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';
import ImpactMap from '../components/admin/ImpactMap';
import IncidentAlerts from '../components/IncidentAlerts';
import SmartInsights from '../components/admin/SmartInsights';

interface KPI {
    rooting_index: number;
    attraction_rate: number;
    sealed_companies: number;
    active_municipalities: number;
    kindness_counter: number;
}


interface Invitation {
    id: string;
    email: string;
    entity_name: string;
    role: string;
    status: 'pending' | 'active' | 'expired';
    created_at: string;
    expires_at: string;
}

interface AuditItem {
    id: string;
    type: string;
    name: string;
    status: string;
    issues: string[];
    preview_image: string | null;
    created_at: string;
}

interface SuccessStory {
    id: string;
    candidate_name: string;
    job_title: string;
    company_name: string;
    date: string;
}

interface MunicipalityRank {
    id: string;
    name: string;
    logo: string | null;
    msgs_sent: number;
    matches: number;
    score: number;
    is_star: boolean;
}

const SuperAdminDashboard: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Data State
    const [kpis, setKPIs] = useState<KPI | null>(null);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
    const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
    const [ranking, setRanking] = useState<MunicipalityRank[]>([]);

    // UI State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', entity_name: '', role: 'municipality' });
    const [sendingInvite, setSendingInvite] = useState(false);

    useEffect(() => {
        console.log("AdminDashboard loaded - Build Time: " + new Date().toISOString());
        fetchAllData();
    }, [token]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, auditRes, matchesRes, invitesRes, rankingRes] = await Promise.all([
                axios.get('/admin/stats/global'),
                axios.get('/admin/quality-audit'),
                axios.get('/admin/latest-matches'),
                axios.get('/admin/invitations'),
                axios.get('/admin/analytics/municipality-ranking')
            ]);

            setKPIs(statsRes.data.kpis);
            setAuditItems(auditRes.data);
            setSuccessStories(matchesRes.data);
            setInvitations(invitesRes.data);
            setRanking(rankingRes.data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingInvite(true);
        try {
            await axios.post('/admin/invite', inviteForm);
            alert("Invitación enviada correctamente.");
            setShowInviteModal(false);
            setInviteForm({ email: '', entity_name: '', role: 'municipality' });
            // Refresh invites
            const res = await axios.get('/admin/invitations');
            setInvitations(res.data);
        } catch (err) {
            alert("Error al enviar invitación.");
            console.error(err);
        } finally {
            setSendingInvite(false);
        }
    };

    const handleResend = async (email: string) => {
        // Logic to resend (reuse invite endpoint logic potentially)
        // For now, simpler to explain.
        alert(`Reenviando invitación a ${email}... (Simulación)`);
    };

    if (loading) return <div className="p-10 text-center">Cargando Centro de Mando...</div>;

    return (
        <div className="flex flex-col gap-8 min-h-screen pb-20">
            {/* Header */}
            <header className="mb-0 border-b border-gray-200 pb-6 bg-white -mx-4 -mt-4 px-8 pt-6 shadow-sm sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold rounded uppercase tracking-wider">Teamworkz Admin</span>
                            <h1 className="text-3xl font-heading font-bold text-n900">Visión Global</h1>
                        </div>
                        <p className="text-gray-500 text-sm">Monitorización estratégica del ecosistema Rural Minds España.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                const section = document.getElementById('mapa-flujo');
                                section?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-100 flex items-center gap-2"
                        >
                            <span>📊</span> Mapa de Flujo
                        </button>
                        <button
                            onClick={() => navigate('/admin/config')}
                            className="bg-white border border-gray-300 text-n700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <span>🧠</span> Cerebro Operativo
                        </button>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="btn-primary shadow-lg flex items-center gap-2"
                        >
                            <span>📨</span> Nueva Invitación
                        </button>
                    </div>
                </div>
            </header>

            <IncidentAlerts />

            {/* 1. The 5 Grandes (KPIs) */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <KpiCard
                    title="Índice de Arraigo"
                    value={`${kpis?.rooting_index || 0}%`}
                    subtitle="Empleo local conseguido"
                    icon="🌱"
                    color="green"
                />
                <KpiCard
                    title="Tasa de Atracción"
                    value={`${kpis?.attraction_rate || 0}%`}
                    subtitle="Nuevos residentes captados"
                    icon="🧳"
                    color="blue"
                />
                <KpiCard
                    title="Empresas con Sello"
                    value={kpis?.sealed_companies || 0}
                    subtitle="Excelencia validada"
                    icon="🏅"
                    color="yellow"
                />
                <KpiCard
                    title="Municipios Activos"
                    value={kpis?.active_municipalities || 0}
                    subtitle="Ayuntamientos conectados"
                    icon="🏛️"
                    color="purple"
                />
                <KpiCard
                    title="Contador de Amabilidad"
                    value={kpis?.kindness_counter || 0}
                    subtitle="Apoyos proactivos enviados"
                    icon="🤝"
                    color="pink"
                />
            </section>

            {/* 2. Impact Map & Audit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8" id="mapa-flujo">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-heading font-bold text-2xl text-n900">🗺️ Mapa de Impacto: "De la Ciudad al Campo"</h3>
                            <p className="text-sm text-gray-500 mt-1">Visualiza los flujos de talento y el éxito de la repoblación rural en tiempo real.</p>
                        </div>
                    </div>
                    <div className="mt-6 h-[500px] w-full rounded-lg overflow-hidden border border-gray-100">
                            <ImpactMap />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Smart Insights (2/3) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-heading font-bold text-2xl text-n900 flex items-center gap-3">
                                <span>🔥</span> Smart Insights: Radar de Tendencias
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Detección algorítmica de picos de interés en municipios rurales.</p>
                        </div>
                    </div>
                    <SmartInsights />
                </div>

                {/* Audit Feed (1/3) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col max-h-[500px]">
                    <h3 className="font-heading font-bold text-xl text-n900 mb-4 flex items-center gap-2">
                        <span>🛡️</span> Auditoría de Calidad
                        <span className="text-xs bg-red-700 text-white px-3 py-1 rounded-full ml-auto font-bold flex items-center justify-center text-center leading-tight">Revisión pendiente</span>
                    </h3>
                    <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {auditItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-10">Todo en orden ✅</p>
                        ) : (
                            auditItems.map((item) => (
                                <div key={item.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-l-red-400 hover:bg-gray-100 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold uppercase text-gray-500">{item.type}</span>
                                        <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-n900 text-sm">{item.name}</h4>
                                    {item.issues.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {item.issues.map((issue, idx) => (
                                                <span key={idx} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">⚠️ {issue}</span>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => navigate(`/admin/config?tab=audit&audit_org_id=${item.id}`)}
                                        className="text-xs text-p2 font-bold mt-2 hover:underline"
                                    >
                                        Revisar Ficha →
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Invitation Management (Sales Funnel) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-heading font-bold text-xl text-n900">📡 Gestión de Invitaciones</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Entidad</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Enviada</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {invitations.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-n900">{inv.entity_name}</td>
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{inv.email}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={inv.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.status === 'expired' && (
                                            <button
                                                onClick={() => handleResend(inv.email)}
                                                className="text-p2 font-bold hover:underline"
                                            >
                                                ↻ Reenviar
                                            </button>
                                        )}
                                        {inv.status === 'pending' && <span className="text-gray-400 text-xs italic">Esperando...</span>}
                                        {inv.status === 'active' && <span className="text-green-600 text-xs font-bold">✔ Completado</span>}
                                    </td>
                                </tr>
                            ))}
                            {invitations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        No hay invitaciones recientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 4. Success Stories (Denominación de Origen) */}
            <section className="bg-gradient-to-r from-p2 to-p1 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <h3 className="font-heading font-bold text-2xl mb-6 relative z-10">🌟 Historias de Éxito Rural</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {successStories.length > 0 ? successStories.map((story) => (
                        <div key={story.id} className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20 hover:bg-white/20 transition-all cursor-crosshair">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-white text-p2 flex items-center justify-center font-bold text-lg">
                                    {story.candidate_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{story.candidate_name}</p>
                                    <p className="text-xs text-white/80">Contratado/a</p>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10">
                                <p className="text-sm font-bold">💼 {story.job_title}</p>
                                <p className="text-xs">en {story.company_name}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-center py-8 opacity-80">
                            <p className="text-lg">Aún no hay historias de éxito registradas... ¡pero pronto llegarán!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 5. Star Municipalities Ranking (Gamification) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
                    <div>
                        <h3 className="font-heading font-bold text-2xl text-n900 flex items-center gap-3">
                            🏆 Tabla de Honor: Municipios Estrella
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 font-medium">Reconocimiento a la proactividad en la conexión de talento.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                    {ranking.slice(0, 6).map((muni, index) => (
                        <div key={muni.id} className={`p-6 rounded-2xl border-2 transition-all hover:shadow-xl ${index === 0 ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-50 hover:border-indigo-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
                                        {muni.logo ? <img src={muni.logo} className="w-8 h-8 object-contain" alt={muni.name} /> : <span className="text-xl">🏛️</span>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-n900 leading-tight">{muni.name}</h4>
                                        <div className="flex items-center gap-1 mt-1">
                                            {muni.is_star && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Gold Star</span>}
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Puesto #{index + 1}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-indigo-600 block">{muni.score}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Puntos</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100/50">
                                <div className="bg-white p-2 rounded-lg border border-gray-50">
                                    <span className="block text-xl font-bold text-n900">{muni.msgs_sent}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter text-center line-clamp-2">Msgs Enviados</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-gray-50">
                                    <span className="block text-xl font-bold text-emerald-600">{muni.matches}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter text-center line-clamp-2">Matches Logrados</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {ranking.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 italic">Analizando proactividad municipal...</div>
                    )}
                </div>
            </section>

            {/* Invitation Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-n900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
                        <h3 className="text-xl font-bold mb-4">Enviar Invitación</h3>
                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Nombre Entidad</label>
                                <input
                                    className="w-full p-2 border rounded"
                                    required
                                    value={inviteForm.entity_name}
                                    onChange={e => setInviteForm({ ...inviteForm, entity_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Email Responsable</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border rounded"
                                    required
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Rol</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                >
                                    <option value="municipality">Ayuntamiento</option>
                                    <option value="enterprise">Empresa</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancelar</button>
                                <button type="submit" disabled={sendingInvite} className="flex-1 py-2 bg-p2 text-white rounded font-bold hover:bg-p2/90">
                                    {sendingInvite ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// UI Components
const KpiCard: React.FC<{ title: string, value: string | number, subtitle: string, icon: string, color: string }> = ({ title, value, subtitle, icon, color }) => {
    const colors: { [key: string]: string } = {
        green: 'border-green-500 text-green-600',
        blue: 'border-blue-500 text-blue-600',
        yellow: 'border-yellow-500 text-yellow-600',
        purple: 'border-purple-500 text-purple-600',
        pink: 'border-pink-500 text-pink-600',
    };

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border-t-4 ${colors[color] || 'border-gray-500'} flex flex-col`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h4>
                <span className="text-2xl" aria-hidden="true">{icon}</span>
            </div>
            <span className="text-4xl font-heading font-bold text-n900 mb-1">{value}</span>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'active') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Activo</span>;
    if (status === 'pending') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pendiente</span>;
    if (status === 'expired') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Expirado</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
}

export default SuperAdminDashboard;
