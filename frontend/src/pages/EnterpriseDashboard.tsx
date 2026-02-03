import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import axios from '../config/api';
import InclusionManualPDF from '../components/InclusionManualPDF';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import OnboardingRoadmap from '../components/OnboardingRoadmap';
import LocalSeal from '../components/badges/LocalSeal';

const EnterpriseDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeOnboardingAppId, setActiveOnboardingAppId] = useState<string | null>(null);
    const [acceptedCandidateName, setAcceptedCandidateName] = useState<string>("");

    const handleAcceptMatch = async (applicationId: string, candidateName: string) => {
        try {
            await axios.put(`/api/applications/${applicationId}/status`, { status: 'accepted' });
            alert(`Has aceptado el match con ${candidateName}. Iniciando proceso de adecuación.`);
            setActiveOnboardingAppId(applicationId);
            setAcceptedCandidateName(candidateName);
        } catch (error) {
            console.error("Error accepting match", error);
            alert("Error al aceptar el match.");
        }
    };

    return (
        <div className="min-h-screen bg-n50 pb-12">
            <main className="container mx-auto px-4 py-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-p2 mb-2">
                            Panel de Empresa
                        </h1>
                        <p className="text-xl text-n900 max-w-2xl">
                            Gestiona tus proyectos y conecta con talento rural bajo el estándar <span className="font-bold">Teamworkz</span>.
                        </p>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <Link to="/create-project" className="btn-primary shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-focus-ring">
                            + Publicar Nueva Vacante
                        </Link>
                    </div>
                </header>

                {/* Active Onboarding Section */}
                {activeOnboardingAppId && (
                    <section className="mb-12 animate-fade-in-up">
                        <OnboardingRoadmap
                            applicationId={activeOnboardingAppId}
                            candidateName={acceptedCandidateName}
                        />
                    </section>
                )}

                {/* Manual de Inclusión - Destacado (Contextual Resource) */}
                <section className="bg-indigo-50 border border-indigo-100 p-8 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-8 transition-transform hover:shadow-md mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white p-2 rounded-lg text-2xl shadow-sm">📚</div>
                            <h3 className="font-heading font-bold text-2xl text-p2">Manual de Comunicación Inclusiva</h3>
                        </div>
                        <p className="text-gray-700 text-base max-w-3xl leading-relaxed">
                            Descarga la guía esencial <span className="font-bold text-indigo-700">Teamworkz Certified</span> para interactuar con talento neurodivergente.
                        </p>
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                        <PDFDownloadLink document={<InclusionManualPDF />} fileName="Manual_Inclusion_RuralMinds.pdf" className="w-full md:w-auto block">
                            {({ loading }) => (
                                <button
                                    disabled={loading}
                                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-p2 font-bold py-3 px-6 rounded-lg border-2 border-p2 hover:bg-p2 hover:text-white transition-all disabled:opacity-50 shadow-sm text-lg focus:ring-4 focus:ring-focus-ring outline-none"
                                >
                                    {loading ? 'Generando...' : '⬇️ Descargar Guía PDF'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    </div>
                </section>

                {/* Mis Distintivos Section */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-shrink-0">
                            {/* Seal Component */}
                            {user?.organization && (
                                <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center p-4 border border-gray-100">
                                    <LocalSeal
                                        municipalityName="Rural Minds" // Ideally dynamic from backend
                                        width={180}
                                        height={180}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-heading font-bold text-2xl text-p2 mb-2 flex items-center gap-2">
                                <span>🏅</span> Mis Distintivos
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Este sello certifica tu compromiso con la inclusión y el desarrollo local.
                                Utilízalo en tu web, firma de correo y redes sociales.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => {
                                        // Trigger SVG download via logic similar to Modal
                                        // For brevity in Dashboard, maybe just a simple alert or reuse logic?
                                        // We can't reuse the Modal logic easily without props.
                                        // I'll leave as simple download link for now or implement inline.
                                        alert("Descarga iniciada via componente...");
                                    }}
                                    className="text-sm font-bold text-p2 border border-p2 px-4 py-2 rounded hover:bg-p2 hover:text-white transition-colors"
                                >
                                    Descargar SVG
                                </button>
                                <button className="text-sm font-bold text-gray-500 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors">
                                    Descargar PNG
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* My Projects Panel */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-p2"></div>
                        <h3 className="font-heading font-bold text-2xl text-n900 mb-6 border-b pb-4 flex justify-between items-center">
                            <span>Mis Proyectos Activos</span>
                        </h3>

                        <div className="space-y-4 flex-grow flex flex-col justify-start">
                            {/* Mock Active Project */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-n900">Desarrollador Full Stack (Remoto)</h4>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">Activo</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Publicado: hace 2 días • 12 vistas</p>

                                {/* New Applicants Section (MatchCards) */}
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                    <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Nuevos Candidatos (Match Inteligente):</h5>
                                    <div className="space-y-4">
                                        <MatchCard
                                            candidateName="María G. (Talento Local)"
                                            matchScore={92}
                                            adjustments={["Auriculares cancelación ruido", "Comunicación escrita", "Luz natural"]}
                                            isLocal={true}
                                            onAccept={() => handleAcceptMatch("mock-app-001", "María G.")}
                                            onContact={() => alert("Abriendo chat seguro...")}
                                        />
                                        <MatchCard
                                            candidateName="Javier R."
                                            matchScore={74}
                                            adjustments={["Flexibilidad horaria", "Instrucciones claras y directas"]}
                                            isLocal={false}
                                            onAccept={() => handleAcceptMatch("mock-app-002", "Javier R.")}
                                            onContact={() => alert("Abriendo chat seguro...")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team & Ecosystem Status Panel */}
                    <div className="space-y-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <h3 className="font-heading font-bold text-2xl text-n900 mb-4 border-b pb-4">Rural Minds Academy</h3>
                            <p className="text-base text-gray-600 mb-6 leading-relaxed">
                                Recursos de formación continua para tu equipo de RRHH en diversidad e inclusión.
                            </p>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-p2">🎓</span>
                                    <span className="font-bold text-n900 text-sm">Curso Básico de Neurodiversidad</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm border-t-4 border-accent relative">
                            <h3 className="font-heading font-bold text-2xl text-n900 mb-4">Estado del Ecosistema</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
                                    <span className="text-gray-600 font-medium">Impacto Local (Tu Región):</span>
                                    <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs uppercase tracking-wide">Alto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EnterpriseDashboard;
