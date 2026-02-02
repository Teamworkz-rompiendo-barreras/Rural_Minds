import React, { useEffect, useState } from 'react';
import axios from '../config/api';

interface DashboardMetrics {
    inclusion_score: number;
    adequacy_index: string;
    wellbeing_level: number;
    activation_rate: string;
    roi_estimated: string;
    retention_rate: string;
    activation_metrics: {
        brand_setup: boolean;
        sensory_adoption: number;
        accessibility_health: number;
        learning_usage: number;
    };
}

const MainDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await axios.get('/stats/impact');
                setMetrics(res.data);
            } catch (err) {
                console.error("Failed to fetch dashboard metrics", err);
                // Fallback mock
                setMetrics({
                    inclusion_score: 85,
                    adequacy_index: "78%",
                    wellbeing_level: 8.4,
                    activation_rate: "65%",
                    roi_estimated: "$42,000",
                    retention_rate: "94%",
                    activation_metrics: {
                        brand_setup: true,
                        sensory_adoption: 65,
                        accessibility_health: 78,
                        learning_usage: 124
                    }
                });
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    const handleDownloadReport = async (format: 'pdf' | 'txt') => {
        setDownloading(true);
        try {
            const response = await axios.get(`/reports/impact/download/${format}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `twz_reporte_impacto.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("No se pudo descargar el reporte. Inténtalo más tarde.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="p-8">Calculando métricas...</div>;
    if (!metrics) return <div>Error loading dashboard</div>;

    const activation_metrics = metrics.activation_metrics || {
        brand_setup: false,
        sensory_adoption: 0,
        accessibility_health: 0,
        learning_usage: 0
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-900">Activation Dashboard</h1>
                    <p className="text-gray-500">Monitoriza cómo la neurodiversidad se convierte en ventaja competitiva.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => handleDownloadReport('pdf')}
                        disabled={downloading}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {downloading ? 'Generando...' : '📥 Reporte PDF'}
                    </button>
                </div>
            </header>

            {!activation_metrics.brand_setup && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm animate-pulse">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 font-bold">
                                No se ha enviado la configuración inicial de marca.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Critical Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* 1. Setup de Marca */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div> {/* S1 Color */}
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Setup de Marca</h3>
                    <div className="flex items-center gap-3">
                        <span className={`text-4xl font-bold font-mono ${activation_metrics.brand_setup ? 'text-teal-600' : 'text-gray-300'}`}>
                            {activation_metrics.brand_setup ? 'Ready' : 'Pending'}
                        </span>
                        {activation_metrics.brand_setup && (
                            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">AA Compliant</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Identidad visual accesible</p>
                </div>

                {/* 2. Adopción del Perfil Sensorial */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div> {/* S2 Color */}
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Adopción Perfil</h3>
                    <div className="text-4xl font-bold text-gray-900 font-mono">
                        {activation_metrics.sensory_adoption}%
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Empleados con preferencias definidas</p>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${activation_metrics.sensory_adoption}%` }}></div>
                    </div>
                </div>

                {/* 3. Salud de la Accesibilidad */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div> {/* S3 Color */}
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Salud Accesibilidad</h3>
                    <div className="text-4xl font-bold text-gray-900 font-mono">
                        {activation_metrics.accessibility_health}/100
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Ajustes implementados vs solicitados</p>
                </div>

                {/* 4. Uso del Centro de Formación */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Micro-learning</h3>
                    <div className="text-4xl font-bold text-gray-900 font-mono">
                        {activation_metrics.learning_usage}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Píldoras consumidas</p>
                </div>
            </div>

            {/* Impact Logs Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 font-heading">Logs de Impacto & Bienestar</h3>
                    <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-gray-200 pb-2">
                        {/* Mock Chart Visualization using CSS */}
                        {[40, 65, 55, 80, 75, 90, 85].map((h, i) => (
                            <div key={i} className="w-full bg-purple-50 mx-1 rounded-t hover:bg-purple-100 transition-colors relative group">
                                <div
                                    className="absolute bottom-0 w-full bg-purple-500 rounded-t opacity-80 group-hover:opacity-100 transition-all"
                                    style={{ height: `${h}%` }}
                                ></div>
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 font-heading">ROI Estimado</h3>
                    <div className="text-center py-8">
                        <div className="text-5xl font-bold text-teal-600 font-mono mb-2">{metrics.roi_estimated}</div>
                        <p className="text-sm text-gray-500">Ahorro anual proyectado por retención</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg">
                        <p className="text-xs text-teal-800 italic">
                            "Invertir en accesibilidad ha mejorado nuestra retención un {metrics.retention_rate} este trimestre."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainDashboard;
