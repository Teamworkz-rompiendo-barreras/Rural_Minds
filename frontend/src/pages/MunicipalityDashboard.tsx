
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InclusionManualPDF from '../components/InclusionManualPDF';

// Mock data for demonstration - In production, fetch from API
const mockMetrics = {
    insertionRate: 85,
    companiesValidated: 12,
    activeProjects: 5,
    localCandidates: 34,
    pendingValidations: 2,
    impactScore: 92
};

const mockCompanies = [
    { id: '1', name: 'Cooperativa Agroalimentaria del Valle', status: 'validated', vacancies: 3, lastActivity: '2026-01-28' },
    { id: '2', name: 'Artesanía Sierra Norte S.L.', status: 'validated', vacancies: 1, lastActivity: '2026-01-30' },
    { id: '3', name: 'TechRural Soluciones', status: 'pending', vacancies: 0, lastActivity: '2026-01-29' },
];

const mockProjects = [
    { id: '1', title: 'Técnico Agrícola con Ajustes', company: 'Cooperativa Agroalimentaria', applicants: 5, status: 'open' },
    { id: '2', title: 'Diseñador Web Remoto', company: 'TechRural Soluciones', applicants: 8, status: 'open' },
];

const MunicipalityDashboard: React.FC = () => {
    const { user } = useAuth();
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    const handleValidate = (companyId: string) => {
        setSelectedCompany(companyId);
        setShowValidationModal(true);
    };

    const confirmValidation = () => {
        // In production: call API to validate company
        console.log('Validating company:', selectedCompany);
        setShowValidationModal(false);
        setSelectedCompany(null);
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-6">

            {/* Header with Slogan */}
            <header className="border-b border-gray-100 pb-6 mb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-p2 mb-2">
                            Panel del Ayuntamiento
                        </h1>
                        <p className="text-xl text-n900">
                            {user?.organization?.name || "Tu Municipio"} — Gestión de Impacto Social
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Slogan Badge */}
                        <div className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 px-4 py-2 rounded-full">
                            <span className="text-sm font-bold text-accent italic">
                                "Innovación con Denominación de Origen"
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Key Metrics - Social Impact */}
            <section>
                <h2 className="font-heading font-bold text-2xl text-n900 mb-4 flex items-center gap-2">
                    <span>📊</span> Métricas de Impacto Social
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-green-600 mb-1">{mockMetrics.insertionRate}%</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Inserción Laboral</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{mockMetrics.impactScore}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Puntuación Impacto</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{mockMetrics.companiesValidated}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Empresas Validadas</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{mockMetrics.activeProjects}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Proyectos Activos</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-bold text-p2 mb-1">{mockMetrics.localCandidates}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Talento Local</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center relative">
                        <p className="text-3xl font-bold text-orange-500 mb-1">{mockMetrics.pendingValidations}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pendientes</p>
                        {mockMetrics.pendingValidations > 0 && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Enterprise Validation Panel */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-2xl font-heading font-bold text-n900">Gestión de Empresas</h2>
                        <span className="text-sm text-gray-500">Validar empresas locales</span>
                    </div>

                    <div className="space-y-4">
                        {mockCompanies.map((company) => (
                            <div
                                key={company.id}
                                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border transition-all ${company.status === 'pending'
                                        ? 'bg-orange-50 border-orange-200'
                                        : 'bg-gray-50 border-gray-100'
                                    }`}
                            >
                                <div className="flex-1 mb-3 md:mb-0">
                                    <h4 className="font-bold text-n900 text-lg">{company.name}</h4>
                                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                        <span>{company.vacancies} vacantes activas</span>
                                        <span>•</span>
                                        <span>Última actividad: {new Date(company.lastActivity).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {company.status === 'validated' ? (
                                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold flex items-center gap-1">
                                            <span>✓</span> Validada
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleValidate(company.id)}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors focus:ring-4 focus:ring-orange-200 outline-none"
                                        >
                                            Validar Ahora
                                        </button>
                                    )}
                                    <button className="text-p2 text-sm underline hover:no-underline">
                                        Ver Detalle
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <button className="text-p2 font-bold text-sm hover:underline">
                            Ver historial completo de empresas →
                        </button>
                    </div>
                </div>

                {/* Resources Sidebar */}
                <div className="space-y-6">
                    {/* Training Resources for Enterprises */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-heading font-bold text-lg text-n900 mb-4 pb-3 border-b">
                            📚 Recursos para Empresas
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            Descarga y distribuye el Manual de Inclusión a las empresas de tu territorio para formarlas en comunicación accesible.
                        </p>

                        <PDFDownloadLink document={<InclusionManualPDF />} fileName="Manual_Inclusion_RuralMinds.pdf">
                            {({ loading }) => (
                                <button
                                    disabled={loading}
                                    className="w-full bg-p2 text-white font-bold py-3 px-4 rounded-lg hover:bg-p2/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-4 focus:ring-focus-ring outline-none"
                                >
                                    {loading ? 'Generando...' : (
                                        <>
                                            <span>⬇️</span> Descargar Manual PDF
                                        </>
                                    )}
                                </button>
                            )}
                        </PDFDownloadLink>

                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Formato Accesible • Teamworkz Certified
                        </p>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-gradient-to-br from-p2 to-indigo-700 text-white p-6 rounded-xl shadow-md">
                        <h3 className="font-heading font-bold text-lg mb-4">
                            Resumen Territorial
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-white/80">Tasa de Empleo Inclusivo</span>
                                <span className="font-bold text-lg">{mockMetrics.insertionRate}%</span>
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-white h-full rounded-full transition-all"
                                    style={{ width: `${mockMetrics.insertionRate}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-white/70 mt-2">
                                Por encima de la media nacional (72%)
                            </p>
                        </div>
                    </div>

                    {/* Local Projects Overview */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-heading font-bold text-lg text-n900 mb-4 pb-3 border-b flex justify-between items-center">
                            <span>🎯 Proyectos Activos</span>
                            <span className="text-sm font-normal text-gray-500">{mockProjects.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {mockProjects.map((project) => (
                                <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                                    <h4 className="font-bold text-n900 text-sm">{project.title}</h4>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                        <span>{project.company}</span>
                                        <span className="text-p2 font-bold">{project.applicants} postulaciones</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="#" className="block mt-4 text-center text-p2 font-bold text-sm hover:underline">
                            Ver todos los proyectos →
                        </Link>
                    </div>
                </div>
            </div>

            {/* CTA for Talent Repository */}
            <section className="bg-gradient-to-r from-p2 via-indigo-600 to-p2 text-white p-8 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-heading font-bold mb-2">Repositorio de Talento Local</h2>
                    <p className="max-w-xl text-white/90 leading-relaxed">
                        Accede al listado anonimizado de talento en tu territorio. Conecta perfiles con empresas validadas para fomentar la empleabilidad inclusiva.
                    </p>
                    <p className="text-xs text-white/60 mt-2">
                        Nota: Los datos sensoriales individuales están protegidos. Solo verás métricas agregadas.
                    </p>
                </div>
                <button className="bg-white text-p2 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-md shrink-0 focus:ring-4 focus:ring-white/30 outline-none">
                    Explorar Talento Disponible
                </button>
            </section>

            {/* Validation Confirmation Modal */}
            {showValidationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl" role="dialog" aria-modal="true">
                        <h3 className="font-heading font-bold text-2xl text-n900 mb-4">Confirmar Validación</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Al validar esta empresa, certificas que cumple con los requisitos para participar en el programa
                            <strong> Rural Minds</strong> de tu municipio. Esta acción quedará registrada en el historial de auditoría.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmValidation}
                                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors focus:ring-4 focus:ring-green-200 outline-none"
                            >
                                Confirmar Validación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityDashboard;
