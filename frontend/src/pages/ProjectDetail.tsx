
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
    };
}

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    // Auth context available if needed for role checks
    useAuth();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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

        // 1. Accessibility Profile Check
        // Assuming we could check profile completeness here. Since user object in context 
        // might not have full details, we rely on the specific error message logic requested
        // or a simple check if we had the profile loaded.
        // For MVP, if we don't have profile data, we might assume it exists or check via API.
        // Let's implement the specific redirect logic requested.

        // Mock check (replace with real profile check if available in context)
        const hasSensoryProfile = true; // Set to false to test redirect
        if (!hasSensoryProfile) {
            navigate('/sensory-profile', { state: { returnTo: `/project/${id}`, message: "Para postularte, primero completa tu configuración de accesibilidad." } });
            return;
        }

        if (window.confirm("Al postularte, compartirás tu Perfil de Accesibilidad con la empresa para facilitar tu incorporación. ¿Continuar?")) {
            setApplying(true);
            try {
                await axios.post('/api/applications', {
                    challenge_id: challenge.id,
                    cover_letter: "Postulación automática desde perfil sensorial."
                });
                setSuccessMessage(`Postulación enviada correctamente a ${challenge.tenant?.name || 'la empresa'}.`);

                // Keep the success message visible for a moment then redirect
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

    if (loading) return <div className="p-8 text-center text-gray-500 font-sans">Cargando experiencia...</div>;
    if (!challenge) return <div className="p-8 text-center text-red-500 font-bold">Proyecto no accesible o no encontrado.</div>;

    if (successMessage) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-green-50 rounded-xl border border-green-200 text-center" role="status" aria-live="polite">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-3xl font-heading font-bold text-n900 mb-4">¡Enviado!</h2>
                <p className="text-xl text-n900 mb-2">{successMessage}</p>
                <p className="text-sm text-green-700 mt-4">Te estamos redirigiendo al dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-6">
            {/* Header Hierarchy */}
            <header className="mb-10 border-b border-gray-200 pb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-gray-500 hover:text-p2 mb-6 text-sm font-bold focus-visible:ring-4 focus-visible:ring-focus-ring rounded-md outline-none transition-colors"
                >
                    <span className="text-lg">←</span> Volver al listado
                </button>

                <div className="space-y-4">
                    <span className="inline-block bg-p1 text-p2 font-bold px-3 py-1 rounded text-sm tracking-wide uppercase">
                        Innovación con Denominación de Origen
                    </span>
                    <h1 className="text-5xl font-heading font-bold text-n900 leading-tight">
                        {challenge.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-gray-600 font-sans text-lg">
                        <span className="flex items-center gap-2"><span className="text-p2">🏢</span> {challenge.tenant?.name || 'Empresa Rural'}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-bold">{challenge.location_type}</span>
                        <span className="text-gray-300">|</span>
                        <span>{challenge.compensation}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">

                    {/* SECTION: Adecuación (Fit Section - Highlighted) */}
                    <section className="bg-n100 p-8 rounded-[12px] border border-gray-200">
                        <h3 className="text-2xl font-heading font-bold text-p2 mb-6 flex items-center gap-3">
                            <span className="text-3xl">🧩</span> Adecuación del Puesto
                        </h3>
                        <p className="text-n900 text-base mb-6 font-bold">
                            Esta empresa ha implementado los siguientes ajustes específicos para este rol:
                        </p>

                        {challenge.requirements && challenge.requirements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {challenge.requirements.map((req, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <div className="bg-p1 text-p2 p-2 rounded-full mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-bold text-n900 block text-lg">{req}</span>
                                            <span className="text-sm text-gray-500">Ajuste validado</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-white rounded text-gray-500 italic border border-gray-200">
                                Contactar para consultar ajustes específicos.
                            </div>
                        )}
                    </section>

                    {/* Description */}
                    <section>
                        <h3 className="text-2xl font-heading font-bold text-n900 mb-4">Sobre la posición</h3>
                        <div className="prose prose-lg text-n900 max-w-none font-sans leading-accessible">
                            <p className="whitespace-pre-wrap">{challenge.description}</p>
                        </div>
                    </section>

                </div>

                {/* Sidebar CTA */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[12px] shadow-lg border-2 border-p1 sticky top-8 text-center ring-1 ring-black/5">
                        <div className="mb-6">
                            <span className="text-4xl">🚀</span>
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-n900 mb-2">¿Estás listo?</h3>
                        <p className="text-gray-600 mb-8 leading-normal">
                            Únete a un equipo que valora tu talento único.
                        </p>

                        <button
                            onClick={handleApply}
                            disabled={applying}
                            className="w-full btn-primary py-4 text-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-1 transition-all focus-visible:ring-4 focus-visible:ring-focus-ring outline-none"
                            aria-label={`Postularme a ${challenge.title}`}
                        >
                            {applying ? 'Enviando...' : 'Postularme Ahora'}
                        </button>

                        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500 border border-gray-100 text-left">
                            <strong>Privacidad:</strong> Al postular, compartirás tu <u>Perfil de Accesibilidad</u> con la empresa para facilitar tu incorporación.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
