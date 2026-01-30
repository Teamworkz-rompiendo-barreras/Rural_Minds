
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InclusionManualPDF from '../components/InclusionManualPDF';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const EnterpriseDashboard: React.FC = () => {
    // Auth context available if needed for role checks
    useAuth();

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4 py-8">
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

            {/* Manual de Inclusión - Destacado (Contextual Resource) */}
            <section className="bg-indigo-50 border border-indigo-100 p-8 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-8 transition-transform hover:shadow-md">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white p-2 rounded-lg text-2xl shadow-sm">📚</div>
                        <h3 className="font-heading font-bold text-2xl text-p2">Manual de Comunicación Inclusiva</h3>
                    </div>
                    <p className="text-gray-700 text-base max-w-3xl leading-relaxed">
                        Descarga la guía esencial <span className="font-bold text-indigo-700">Teamworkz Certified</span> para interactuar con talento neurodivergente.
                        Aprende protocolos de comunicación asíncrona, definiciones de ajustes razonables como la hipersensibilidad lumínica y estrategias prácticas para reducir la ansiedad en entrevistas.
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                    <PDFDownloadLink document={<InclusionManualPDF />} fileName="Manual_Inclusion_RuralMinds.pdf" className="w-full md:w-auto block">
                        {({ loading }) => (
                            <button
                                disabled={loading}
                                className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-p2 font-bold py-3 px-6 rounded-lg border-2 border-p2 hover:bg-p2 hover:text-white transition-all disabled:opacity-50 shadow-sm text-lg focus:ring-4 focus:ring-focus-ring outline-none"
                            >
                                {loading ? (
                                    <span>Generando documento...</span>
                                ) : (
                                    <>
                                        <span aria-hidden="true" className="text-xl">⬇️</span> Descargar Guía PDF
                                    </>
                                )}
                            </button>
                        )}
                    </PDFDownloadLink>
                    <p className="text-xs text-center mt-2 text-gray-500">Formato Accesible • Lectura Fácil</p>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* My Projects Panel */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-p2"></div>
                    <h3 className="font-heading font-bold text-2xl text-n900 mb-6 border-b pb-4 flex justify-between items-center">
                        <span>Mis Proyectos Activos</span>
                        <Link to="#" className="text-sm font-normal text-gray-500 hover:text-p2 flex items-center gap-1">Ver historial <span>→</span></Link>
                    </h3>

                    {/* Placeholder content - In real app, map over fetched projects */}
                    <div className="space-y-4 flex-grow flex flex-col justify-center">
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center flex flex-col items-center justify-center min-h-[200px] group-hover:border-p2/30 transition-colors">
                            <div className="text-4xl mb-4 text-gray-300">📂</div>
                            <p className="text-gray-600 font-medium mb-4 text-lg">No tienes proyectos activos aún.</p>
                            <Link to="/create-project" className="text-p2 font-bold text-base underline hover:no-underline decoration-2 underline-offset-4">
                                Crear mi primera vacante inclusiva
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Team & Ecosystem Status Panel */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full -mr-10 -mt-10"></div>
                        <h3 className="font-heading font-bold text-2xl text-n900 mb-4 border-b pb-4">Rural Minds Academy</h3>
                        <p className="text-base text-gray-600 mb-6 leading-relaxed">
                            Recursos de formación continua para tu equipo de RRHH en diversidad e inclusión.
                        </p>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-p2">🎓</span>
                                <span className="font-bold text-n900 text-sm">Curso Básico de Neurodiversidad</span>
                                <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Nuevo</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-p2">⚖️</span>
                                <span className="font-bold text-n900 text-sm">Marco Legal y Ajustes</span>
                            </div>
                        </div>
                        <button className="text-p2 font-bold text-sm hover:underline flex items-center gap-1 group">Ver catálogo completo <span className="group-hover:translate-x-1 transition-transform">→</span></button>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm border-t-4 border-accent relative">
                        <h3 className="font-heading font-bold text-2xl text-n900 mb-4">Estado del Ecosistema</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
                                <span className="text-gray-600 font-medium">Impacto Local (Tu Región):</span>
                                <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs uppercase tracking-wide">Alto</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pb-1">
                                <span className="text-gray-600 font-medium">Talento Disponible:</span>
                                <span className="font-bold text-n900 text-lg">12 perfiles</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Match Potencial:</span>
                                <span className="font-bold text-p2 text-lg">85%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseDashboard;
