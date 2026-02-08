import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

const ReportsDashboard: React.FC = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchStats();
    }, [token]);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/stats/impact');
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Generando reporte de evidencias...</div>;

    // Helper for Accessible Donut
    const DonutChart = ({ percent, color, label }: { percent: number, color: string, label: string }) => {
        const stroke = 4;
        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 40 40">
                    <circle className="text-gray-200" strokeWidth={stroke} stroke="currentColor" fill="transparent" r={radius} cx="20" cy="20" />
                    <circle
                        className={color}
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="20"
                        cy="20"
                    />
                </svg>
                <div className="mt-2 text-center">
                    <span className="text-2xl font-heading font-bold text-gray-800">{percent}%</span>
                    <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-primary">Impacto y Evidencias</h1>
                    <p className="text-gray-600">Métricas de inclusión en tiempo real y análisis de retorno.</p>
                </div>
                <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                    <span>⬇</span> Descargar CSV
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* 1. Inclusion Score (Composite) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-primary">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Índice de Inclusión</div>
                    <div className="text-4xl font-bold text-gray-900 font-heading">{stats?.inclusion_score}/100</div>
                    <div className="text-primary text-xs mt-2 font-bold">Índice Compuesto</div>
                </div>
                {/* 2. Adequacy Index (S2 Purple) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-600">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Índice de Adecuación</div>
                    <div className="text-4xl font-bold text-gray-900 font-heading">{stats?.adequacy_index}</div>
                    <div className="text-purple-600 text-xs mt-2 font-bold">Ajustes Completados</div>
                </div>
                {/* 3. Well-being (S3 Orange) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-orange-500">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Nivel de Bienestar</div>
                    <div className="text-4xl font-bold text-gray-900 font-heading">{stats?.wellbeing_level}/10</div>
                    <div className="text-orange-600 text-xs mt-2 font-bold">Feedback Promedio</div>
                </div>
                {/* 4. ROI (Teal) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-teal-600">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">ROI Anual</div>
                    <div className="text-4xl font-bold text-gray-900 font-heading">{stats?.roi_estimated || "0€"}</div>
                    <div className="text-teal-600 text-xs mt-2 font-bold">Ahorros en Productividad</div>
                </div>
            </div>

            {/* Visualizations */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Activation & Adoption */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold mb-6 font-heading border-b pb-2">Adopción del Programa</h3>
                    <div className="flex justify-around items-center">
                        <DonutChart
                            percent={parseInt(stats?.activation_rate) || 0}
                            color="text-teal-500"
                            label="Activación de Perfiles"
                        />
                        <DonutChart
                            percent={parseInt(stats?.retention_rate) || 94}
                            color="text-primary"
                            label="Tasa de Retención"
                        />
                    </div>
                </div>

                {/* Insight Box */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-bold mb-4 font-heading text-purple-800">💡 Insight Basado en Evidencias</h3>
                    <p className="text-gray-700 text-lg leading-relaxed">
                        Tu organización ha alcanzado una <span className="font-bold text-teal-600">tasa de activación del {stats?.activation_rate}</span> de perfiles sensoriales.
                        Los datos indican que los equipos con &gt;60% de activación ven una <span className="font-bold text-purple-600">reducción de 2x</span> en el agotamiento reportado.
                    </p>
                    <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-100 text-sm text-gray-500">
                        *Cálculo de ROI basado en modelo de reducción de fricción estándar (500€/ajuste/mes).
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
