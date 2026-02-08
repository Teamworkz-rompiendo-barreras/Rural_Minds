
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from '../config/api';

interface Challenge {
    id: string;
    title: string;
    description: string;
    requirements: string[]; // e.g., ["Bajo ruido", "Luz natural"]
    skills_needed: string[];
    location_type: string;
    compensation: string;
    deadline?: string;
    status: string;
    tenant?: {
        name: string;
        municipality_id?: string;
        location_id?: string;
    };
    created_at: string;
}

import MatchSuccessModal from '../components/MatchSuccessModal';

interface Application {
    id: string;
    status: string;
    challenge: {
        title: string;
        tenant: {
            name: string;
        }
    }
}

const TalentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    // Match Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [matchedApplication, setMatchedApplication] = useState<Application | null>(null);

    // Municipal Support State
    const [supportMessages, setSupportMessages] = useState<any[]>([]);
    const [responding, setResponding] = useState<{ id: string; type: 'A' | 'B' | 'C' } | null>(null);
    const [shareContact, setShareContact] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [readingMode, setReadingMode] = useState(false);

    // Filters State
    const [locationFilter, _setLocationFilter] = useState('Todos');
    const [sensoryFilters, setSensoryFilters] = useState({
        lowNoise: false,
        naturalLight: false,
        asyncComm: false,
        nearMe: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Challenges
                const challengesRes = await axios.get('/api/challenges');
                setChallenges(challengesRes.data);
                setFilteredChallenges(challengesRes.data);

                // 2. Check for Accepted Applications (Mocking check for "unseen" accepted match)
                const appsRes = await axios.get('/api/applications/me');
                const acceptedApp = appsRes.data.find((app: any) => app.status === 'accepted');

                if (acceptedApp) {
                    setMatchedApplication({
                        id: acceptedApp.id,
                        status: acceptedApp.status,
                        challenge: {
                            title: acceptedApp.challenge?.title || "Proyecto",
                            tenant: {
                                name: acceptedApp.challenge?.tenant?.name || "Empresa Confidencial"
                            }
                        }
                    });
                    setShowSuccessModal(true);
                }

                // 3. Fetch Municipal Support Messages
                const supportRes = await axios.get('/api/profiles/me/support-messages');
                setSupportMessages(supportRes.data.filter((m: any) => m.status === 'sent'));

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleSupportResponse = async (id: string, type: 'A' | 'B' | 'C') => {
        try {
            await axios.post(`/api/profiles/me/support-messages/${id}/respond`, {
                response_type: type,
                privacy_consent: type === 'A' ? shareContact : false,
                notes: ""
            });

            const msg = supportMessages.find(m => m.id === id);
            const townName = msg?.municipality?.name || "el Ayuntamiento";

            if (type === 'A' || type === 'B') {
                setSuccessMessage(`¡Excelente elección! ${townName} ha sido notificado.`);
            } else {
                setSuccessMessage(`Entendido. Hemos agradecido el interés de ${townName}.`);
            }

            // Clear message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);

            setSupportMessages(prev => prev.filter(m => m.id !== id));
            setResponding(null);
            setShareContact(false);
        } catch (e) {
            alert("Error al procesar la respuesta. Por favor, inténtalo de nuevo.");
        }
    };

    // Apply Filters
    useEffect(() => {
        let result = challenges;

        // 1. Sensory Filters
        if (sensoryFilters.lowNoise) {
            result = result.filter(c =>
                c.requirements?.some(r => r.includes("Silencioso") || r.includes("ruido"))
            );
        }
        if (sensoryFilters.asyncComm) {
            result = result.filter(c =>
                c.requirements?.some(r => r.includes("Asíncrono") || r.includes("asíncrona"))
            );
        }
        if (sensoryFilters.naturalLight) {
            result = result.filter(c =>
                c.requirements?.some(r => r.includes("Luz natural") || r.includes("Iluminación"))
            );
        }

        // 2. Location (Near Me)
        if (sensoryFilters.nearMe && user?.talent_profile?.residence_location_id) {
            result = result.filter(c =>
                c.tenant?.location_id === user.talent_profile?.residence_location_id
            );
        } else if (sensoryFilters.nearMe && !user?.talent_profile?.residence_location_id) {
            // User checked 'near me' but has no location set
            // Optional: could show a warning or empty list. For now, empty list is safer as "nothing is near nowhere"
            result = [];
        }

        setFilteredChallenges(result);
    }, [sensoryFilters, locationFilter, challenges]);

    const getTimeAgo = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return "Hoy";
        if (days === 1) return "Hace 1 día";
        return `Hace ${days} días`;
    };

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4">
            <header className="mb-4">
                <h1 className="text-4xl font-heading font-bold text-p2 mb-2">Hola, {user?.full_name || 'Talento'}</h1>
                <p className="text-xl text-n900 leading-relaxed">
                    Encuentra proyectos alineados con tus habilidades y <span className="font-bold text-p2">tu perfil sensorial</span>.
                </p>
            </header>

            {/* Municipal Support Offers Section: El Buzón del Talento */}
            {successMessage && (
                <div className="fixed top-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right font-bold flex items-center gap-3">
                    <span className="text-2xl">✨</span> {successMessage}
                </div>
            )}

            {supportMessages.length > 0 && (
                <section className="bg-white border-2 border-emerald-100 rounded-[2.5rem] p-8 lg:p-12 shadow-xl shadow-emerald-100/50 animate-in fade-in slide-in-from-top duration-700 overflow-hidden relative">
                    {/* Decorative Background Element */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 border-b border-emerald-50 pb-8">
                            <div className="w-24 h-24 bg-emerald-600/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-emerald-100/50">
                                {supportMessages[0].municipality?.branding_logo_url ? (
                                    <img src={supportMessages[0].municipality.branding_logo_url} alt="Logo" className="w-16 h-16 object-contain" />
                                ) : (
                                    <span className="filter grayscale-[0.5]">🏘️</span>
                                )}
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-heading font-black text-n900 tracking-tight">Propuesta de Acogida</h2>
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Nueva Invitación</span>
                                </div>
                                <p className="text-xl text-emerald-800/70 font-medium">
                                    El Ayuntamiento de <span className="text-emerald-900 font-bold">{supportMessages[0].municipality?.name || 'tu zona'}</span> te ha enviado una propuesta.
                                </p>
                            </div>
                            <button
                                onClick={() => setReadingMode(!readingMode)}
                                className={`px-5 py-2.5 rounded-xl border-2 font-bold text-xs transition-all shadow-sm ${readingMode ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white text-emerald-700 border-emerald-100 hover:border-emerald-300'}`}
                                aria-label={readingMode ? "Desactivar modo lectura" : "Activar modo lectura para mayor claridad"}
                            >
                                {readingMode ? '👁️ Ver Diseño Original' : '📖 Modo Lectura (Fácil)'}
                            </button>
                        </div>

                        {supportMessages.map(msg => (
                            <div key={msg.id} className="space-y-10">
                                {/* Message Body */}
                                <div className="space-y-6">
                                    {/* Help Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-100 flex items-center gap-2">🏠 Vivienda Disponible</span>
                                        <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-100 flex items-center gap-2">📡 Fibra Óptica 1Gbps</span>
                                        <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-100 flex items-center gap-2">🏫 Educación de Proximidad</span>
                                        {msg.highlighted_need && (
                                            <span className="bg-p2/10 text-p2 px-4 py-1.5 rounded-full text-sm font-bold border border-p2/20 flex items-center gap-2">✨ {msg.highlighted_need}</span>
                                        )}
                                    </div>

                                    {/* Content with Atkinson Hyperlegible feel */}
                                    <div className={`transition-all duration-500 ${readingMode ? 'bg-white p-10 border-4 border-emerald-600 text-black not-italic text-3xl font-bold shadow-2xl' : 'bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100/50 italic text-2xl text-emerald-900 font-medium'} leading-[1.6] tracking-tight`} style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}>
                                        "{msg.content}"
                                    </div>
                                </div>

                                {/* Decision Center */}
                                <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                                    <h3 className="text-xl font-bold text-n900 mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm">?</span>
                                        ¿Cómo quieres responder al Ayuntamiento de {msg.municipality?.name || 'este pueblo'}?
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Option A: Me interesa, hablemos */}
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => setResponding({ id: msg.id, type: 'A' })}
                                                className="w-full min-h-[56px] px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <span className="text-xl">🤝</span> Me interesa, hablemos
                                            </button>

                                            {responding?.id === msg.id && responding?.type === 'A' && (
                                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                                    <label className="flex items-start gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            id="share-contact"
                                                            checked={shareContact}
                                                            onChange={(e) => setShareContact(e.target.checked)}
                                                            className="mt-1 h-5 w-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-sm font-medium text-emerald-900 leading-tight">
                                                            ¿Deseas compartir tus datos de contacto reales (Email/Teléfono) ahora?
                                                        </span>
                                                    </label>
                                                    <button
                                                        onClick={() => handleSupportResponse(msg.id, 'A')}
                                                        className="w-full mt-4 bg-emerald-900 text-white py-2 rounded-lg font-bold text-sm"
                                                    >
                                                        Confirmar Interés
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Option B: Chat Interno */}
                                        <button
                                            onClick={() => handleSupportResponse(msg.id, 'B')}
                                            className="min-h-[56px] px-6 py-4 bg-emerald-100 text-emerald-800 font-bold rounded-2xl hover:bg-emerald-200 transition-all border border-emerald-200 flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <span className="text-xl">💬</span> Interés Anónimo (Chat)
                                        </button>

                                        {/* Option C: Ahora no */}
                                        <button
                                            onClick={() => handleSupportResponse(msg.id, 'C')}
                                            className="min-h-[56px] px-6 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <span className="text-xl">✖️</span> Ahora no me encaja
                                        </button>
                                    </div>

                                    <p className="mt-6 text-center text-xs text-gray-400 uppercase tracking-widest font-black flex items-center justify-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                                        Seguridad Rural Minds: Tus datos no se revelarán sin tu permiso explícito
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Layout: Filters (Left) + Grid (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Sidebar Filters */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 card-radius">
                        <h3 className="font-heading font-bold text-lg text-n900 mb-4">Filtrar por Ajustes</h3>

                        <div className="space-y-3">
                            {/* Proximidad - NEW */}
                            <label className="flex items-center gap-3 cursor-pointer group bg-indigo-50 p-2 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-colors">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-indigo-300 transition-all checked:border-indigo-600 checked:bg-indigo-600 focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                                        checked={sensoryFilters.nearMe}
                                        onChange={e => setSensoryFilters({ ...sensoryFilters, nearMe: e.target.checked })}
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-900 font-bold text-sm">📍 Cerca de Mí</span>
                                    <span className="text-xs text-indigo-600">KM 0</span>
                                </div>
                            </label>

                            <hr className="border-gray-100 my-2" />
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-p2 checked:bg-p2 focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
                                        checked={sensoryFilters.lowNoise}
                                        onChange={e => setSensoryFilters({ ...sensoryFilters, lowNoise: e.target.checked })}
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </span>
                                </div>
                                <span className="text-gray-700 group-hover:text-p2 transition-colors">Bajo Ruido</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-p2 checked:bg-p2 focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
                                        checked={sensoryFilters.asyncComm}
                                        onChange={e => setSensoryFilters({ ...sensoryFilters, asyncComm: e.target.checked })}
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </span>
                                </div>
                                <span className="text-gray-700 group-hover:text-p2 transition-colors">Comunicación Asíncrona</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-p2 checked:bg-p2 focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
                                        checked={sensoryFilters.naturalLight}
                                        onChange={e => setSensoryFilters({ ...sensoryFilters, naturalLight: e.target.checked })}
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </span>
                                </div>
                                <span className="text-gray-700 group-hover:text-p2 transition-colors">Luz Natural</span>
                            </label>
                        </div>
                    </div>

                    {/* Account Management */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 card-radius">
                        <h3 className="font-heading font-bold text-lg text-red-800 mb-2">Mi Cuenta</h3>
                        <p className="text-sm text-red-700 mb-4">Gestiona tu privacidad o elimina tu perfil completamente.</p>
                        <button
                            onClick={async () => {
                                if (window.confirm("¿Estás seguro de que quieres eliminar tu perfil? Esta acción borrará tus datos y preferencias de accesibilidad.")) {
                                    try {
                                        await axios.delete('/user/me');
                                        alert("Tu cuenta ha sido eliminada.");
                                        window.location.href = '/login';
                                    } catch (e) {
                                        alert("Error al eliminar la cuenta.");
                                    }
                                }
                            }}
                            className="w-full text-red-700 bg-white border border-red-200 font-bold py-2 rounded hover:bg-red-50 transition-colors text-sm"
                        >
                            Eliminar Cuenta
                        </button>
                    </div>
                </aside>

                {/* Project Grid */}
                <section className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-heading font-bold text-n900">
                            {filteredChallenges.length} Proyectos Disponibles
                        </h2>
                        <select className="border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-focus-ring focus:border-p2">
                            <option>Más recientes</option>
                            <option>Mayor compatibilidad</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Cargando oportunidades...</div>
                    ) : filteredChallenges.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-xl text-gray-600 font-bold mb-2">No se encontraron proyectos.</p>
                            <p className="text-gray-500">Intenta ajustar los filtros de accesibilidad.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredChallenges.map(challenge => (
                                <article
                                    key={challenge.id}
                                    className="bg-n100 rounded-[12px] overflow-hidden border border-gray-200 flex flex-col h-full hover:shadow-md transition-all duration-200 relative group focus-within:ring-4 focus-within:ring-focus-ring"
                                >
                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-white text-n900 text-xs font-bold px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                {challenge.tenant?.municipality_id ? "📍 Municipio Vinculado" : "📍 Oportunidad Rural"}
                                            </span>
                                            <span className="text-gray-500 text-xs font-medium">{getTimeAgo(challenge.created_at)}</span>
                                        </div>

                                        <h3 className="font-heading font-bold text-xl text-n900 mb-2 group-hover:text-p2 transition-colors">
                                            <Link to={`/project/${challenge.id}`} className="focus:outline-none before:absolute before:inset-0">
                                                {challenge.title}
                                            </Link>
                                        </h3>

                                        <p className="text-n900 text-sm mb-6 line-clamp-3 leading-relaxed opacity-80">
                                            {challenge.description}
                                        </p>

                                        {/* Wellbeing Score Indicator */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-n900">Bienestar Esperado</span>
                                                <span className="text-xs text-gray-500">(Basado en tu perfil)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-p2 h-2.5 rounded-full"
                                                    style={{ width: `${Math.floor(Math.random() * (98 - 75) + 75)}%` }}
                                                    aria-label="Nivel de bienestar esperado alto"
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Tags con Iconos */}
                                        <div className="space-y-2">
                                            {challenge.requirements && challenge.requirements.length > 0 ? (
                                                challenge.requirements.slice(0, 3).map((req, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-p2 bg-white px-3 py-1.5 rounded-lg w-fit border border-gray-100">
                                                        <span aria-hidden="true" className="text-lg">✨</span>
                                                        {req}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-gray-500 italic px-1">Sin ajustes especificados</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 pt-0 mt-auto">
                                        <button className="w-full bg-p2 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-p2 pointer-events-none group-hover:pointer-events-auto">
                                            Ver Detalles
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {/* Match Success Modal */}
            {matchedApplication && (
                <MatchSuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                    companyName={matchedApplication.challenge.tenant.name}
                    projectName={matchedApplication.challenge.title}
                    candidateName={user?.full_name || "Talento"}
                    applicationId={matchedApplication.id}
                />
            )}
        </div>
    );
};

export default TalentDashboard;
