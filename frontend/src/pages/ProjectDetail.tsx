
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

interface Challenge {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    skills_needed: string[];
    location_type: string;
    compensation: string;
    deadline?: string;
    status: string;
    created_at: string;
    tenant?: {
        name: string;
        location?: {
            municipality: string;
            province: string;
        }
    };
    // Detailed Info
    exact_address?: string;
    environment_info?: string;
    accessibility_info?: string;
    sensory_environment?: {
        light?: string;
        sound?: string;
        communication?: string;
    };
    // Matching Info (from backend)
    match_score?: number;
    adjustments?: string[];
}

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [willingToRelocate, setWillingToRelocate] = useState(false);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const response = await axios.get(`/api/challenges/${id}`);
                setChallenge(response.data);
            } catch (error) {
                console.error("Error fetching project details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchChallenge();
    }, [id]);

    const handleApply = async () => {
        if (!challenge) return;

        // Check for accessibility profile completeness (heuristic)
        if (!user?.talent_profile?.skills || user.talent_profile.skills.length === 0) {
            navigate('/sensory-profile', { state: { returnTo: `/project/${id}`, message: "Para postularte con éxito, primero configura tu perfil sensorial." } });
            return;
        }

        if (window.confirm("Al postularte, compartirás tu Perfil de Accesibilidad con la empresa para facilitar tu incorporación. ¿Continuar?")) {
            setApplying(true);
            try {
                await axios.post('/api/applications', {
                    challenge_id: challenge.id,
                    cover_letter: "Postulación automática desde perfil sensorial.",
                    willing_to_relocate: willingToRelocate
                });
                setSuccessMessage(`Postulación enviada correctamente a ${challenge.tenant?.name || 'la empresa'}.`);
                setTimeout(() => navigate('/talent-dashboard'), 3000);
            } catch (error: any) {
                console.error("Error applying:", error);
                if (error.response?.status === 400 && error.response?.data?.detail?.includes("already applied")) {
                    setSuccessMessage("Ya te has postulado a este proyecto anteriormente.");
                } else {
                    alert("Hubo un error al conectar con el servidor.");
                }
            } finally {
                setApplying(false);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-sans animate-pulse">Cargando experiencia...</div>;
    if (!challenge) return <div className="p-8 text-center text-red-500 font-bold">Proyecto no accesible o no encontrado.</div>;

    if (successMessage) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-green-50 rounded-xl border border-green-200 text-center shadow-xl animate-in zoom-in duration-300" role="status" aria-live="polite">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-3xl font-heading font-bold text-n900 mb-4">¡En camino!</h2>
                <p className="text-xl text-n900 mb-2">{successMessage}</p>
                <div className="mt-8 h-2 w-full bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 animate-progress"></div>
                </div>
            </div>
        );
    }

    // Logic for Comparison
    const userMuni = user?.talent_profile?.residence_location?.municipality;
    const projectMuni = challenge.tenant?.location?.municipality;
    const isLocalProject = userMuni && projectMuni && userMuni === projectMuni;

    return (
        <div className="max-w-6xl mx-auto py-10 px-6 font-sans">
            <header className="mb-12 border-b border-gray-100 pb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-gray-400 hover:text-p2 mb-8 text-sm font-bold transition-all"
                >
                    <span className="text-xl">←</span> Volver al listado
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="bg-p1 text-p2 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-sm">
                                Innovación Rural
                            </span>
                            {isLocalProject && (
                                <span className="bg-emerald-600 text-white font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-1">
                                    📍 Proyecto de Arraigo (KM 0)
                                </span>
                            )}
                        </div>
                        <h1 className="text-5xl font-heading font-black text-n900 leading-[1.1] tracking-tight">
                            {challenge.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-gray-500 text-lg">
                            <span className="flex items-center gap-2 font-bold"><span className="text-2xl">🏢</span> {challenge.tenant?.name}</span>
                            <span className="w-1.5 h-1.5 bg-gray-200 rounded-full hidden md:block"></span>
                            <span className="font-medium bg-gray-100 px-3 py-1 rounded-lg text-sm uppercase">{challenge.location_type}</span>
                            <span className="w-1.5 h-1.5 bg-gray-200 rounded-full hidden md:block"></span>
                            <span className="font-bold text-p2">{challenge.compensation}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-16">
                    {/* SECTION 1: UBICACIÓN Y ENTORNO */}
                    <section className="space-y-8">
                        <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                            <h2 className="text-3xl font-heading font-black text-n900">1. Ubicación y Entorno</h2>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inmersión Territorial</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Dirección Exacta</p>
                                        <p className="text-lg font-bold text-n900 leading-snug">
                                            {challenge.exact_address || `Calle Mayor, S/N, ${challenge.tenant?.location?.municipality || 'El Municipio'}`}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl mt-1">🌳</span>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5 tracking-widest">Entorno</p>
                                            <p className="text-sm text-gray-600 font-medium">{challenge.environment_info || "Ubicado en zona tranquila, rodeada de espacios naturales."}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl mt-1">♿</span>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5 tracking-widest">Accesibilidad</p>
                                            <p className="text-sm text-gray-600 font-medium">{challenge.accessibility_info || "Oficina accesible en planta baja, adaptada sensorialmente."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner group relative">
                                <iframe
                                    title="Mapa Ubicación"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=-10,35,5,45&layer=mapnik&marker=40.4168,-3.7038`}
                                    className="grayscale hover:grayscale-0 transition-all duration-700 pointer-events-none"
                                ></iframe>
                                <div className="absolute inset-0 bg-n900/5 group-hover:bg-transparent transition-colors"></div>
                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 shadow-sm border border-gray-100">
                                    OpenStreetMap Atlas
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: COMPATIBILIDAD SENSORIAL */}
                    <section className="space-y-8">
                        <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                            <h2 className="text-3xl font-heading font-black text-n900">2. Compatibilidad Sensorial</h2>
                            <span className="text-xs font-bold text-p2 uppercase tracking-widest">Matching Algorítmico</span>
                        </div>

                        <div className="bg-gradient-to-br from-p2 to-blue-900 rounded-[2rem] p-8 lg:p-12 text-white shadow-2xl shadow-p2/20 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                                <div className="text-center md:text-left">
                                    <p className="text-xs font-black text-p1 uppercase mb-2 tracking-[0.2em] opacity-80">Índice de Afinidad</p>
                                    <div className="text-7xl font-black mb-2 flex items-baseline gap-1 justify-center md:justify-start">
                                        {challenge.match_score || 88}<span className="text-3xl opacity-50">%</span>
                                    </div>
                                    <p className="text-sm font-medium text-white/80 leading-relaxed max-w-[200px]">
                                        Este entorno es <span className="text-p1 font-bold">altamente recomendable</span> para tu perfil.
                                    </p>
                                </div>

                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: '💡', label: 'Iluminación', val: challenge.sensory_environment?.light || 'Natural Regulable', color: 'bg-yellow-400' },
                                        { icon: '🔇', label: 'Ruido', val: challenge.sensory_environment?.sound || 'Baja Estimulación', color: 'bg-blue-400' },
                                        { icon: '📧', label: 'Comunicación', val: challenge.sensory_environment?.communication || 'Escrita / Asíncrona', color: 'bg-emerald-400' }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.icon}</span>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-wider mb-0.5">{item.label}</p>
                                                    <p className="text-sm font-bold tracking-tight">{item.val}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {challenge.adjustments && challenge.adjustments.map((adj, i) => (
                                        <div key={i} className="sm:col-span-2 bg-p1/20 border border-p1/30 rounded-xl p-3 text-[11px] font-bold text-p1 flex items-center gap-2">
                                            <span>✨</span> Ajuste Sugerido: {adj}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Description Section */}
                    <section className="space-y-6">
                        <h3 className="text-2xl font-black text-n900 border-l-4 border-p1 pl-4">Habilidades y Reto</h3>
                        <div className="prose prose-lg text-gray-600 max-w-none font-sans leading-relaxed">
                            <p className="whitespace-pre-wrap">{challenge.description}</p>
                        </div>
                        {challenge.skills_needed && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {challenge.skills_needed.map(sk => (
                                    <span key={sk} className="bg-n100 text-n900 font-bold text-xs px-4 py-2 rounded-full border border-gray-200 uppercase tracking-tighter shadow-sm">
                                        {sk}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                    <div className="sticky top-12 space-y-6">
                        {/* THE TRIGGER BOX */}
                        {!isLocalProject && (
                            <div className="bg-[#F2D680] p-1 rounded-[2.5rem] shadow-xl shadow-p1/20 transform hover:-rotate-1 transition-transform">
                                <div className="bg-white p-8 rounded-[2.3rem] space-y-6">
                                    <div className="text-center">
                                        <span className="text-5xl block mb-4">🏠</span>
                                        <h4 className="text-2xl font-black text-n900 leading-tight">
                                            ¿Te imaginas viviendo en <span className="text-p2">{challenge.tenant?.location?.municipality || 'este paraíso'}</span>?
                                        </h4>
                                        <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-widest">
                                            Actualmente vives en {user?.talent_profile?.residence_location?.municipality || 'tu ciudad'}
                                        </p>
                                    </div>

                                    <label className="block p-5 bg-n100 rounded-3xl border-2 border-transparent hover:border-p2/20 cursor-pointer transition-all group overflow-hidden relative">
                                        <div className="flex gap-4 items-start relative z-10">
                                            <input
                                                type="checkbox"
                                                checked={willingToRelocate}
                                                onChange={(e) => setWillingToRelocate(e.target.checked)}
                                                className="w-7 h-7 mt-1 cursor-pointer appearance-none border-2 border-gray-300 rounded-xl checked:bg-p2 checked:border-p2 transition-all transition-bounce"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-n900 mb-1">Sí, estoy dispuesto a mudarme</p>
                                                <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                                                    "Si el proyecto laboral encaja con mi propósito."
                                                </p>
                                            </div>
                                        </div>
                                        {willingToRelocate && (
                                            <div className="absolute inset-0 bg-p2/5 animate-in slide-in-from-top duration-300"></div>
                                        )}
                                    </label>

                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] text-blue-800 leading-relaxed font-bold">
                                            💡 Nota: Al marcar esta casilla, el Ayuntamiento de {challenge.tenant?.location?.municipality} recibirá una notificación para apoyarte en tu llegada.
                                        </p>
                                    </div>

                                    <p className="text-center text-[11px] font-bold text-p2 italic animate-bounce">
                                        "Siguiente parada: Una vida con menos prisas y más aire puro" 🌿
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-n900 text-white p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-p2/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-p2/40 transition-colors"></div>

                            <h3 className="text-3xl font-heading font-black mb-4">¿Encajamos?</h3>
                            <p className="text-white/60 text-sm mb-10 leading-relaxed px-4">
                                Tu talento es el motor que los pueblos necesitan. Envía tu perfil ahora.
                            </p>

                            <button
                                onClick={handleApply}
                                disabled={applying}
                                className="w-full bg-p1 text-p2 py-5 rounded-2xl text-xl font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-xl hover:shadow-p1/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {applying ? 'Tramitando...' : 'Me interesa este proyecto'}
                            </button>

                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-8">
                                Atkinsons Hyperlegible 16px Optimized
                            </p>
                        </div>

                        <div className="text-center">
                            <button onClick={() => navigate(-1)} className="text-xs font-bold text-gray-400 hover:text-n900 transition-colors uppercase tracking-widest">
                                ← Cancelar y seguir explorando
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ProjectDetail;
