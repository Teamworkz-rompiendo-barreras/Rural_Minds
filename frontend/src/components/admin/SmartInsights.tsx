
import React, { useState, useEffect } from 'react';
import axios from '../../config/api';

interface InsightAlert {
    id: string;
    town_name: string;
    province: string;
    tr_score: number;
    phenomenon: string;
    origin: string;
    actual_volume: number;
    severity: 'blue' | 'orange' | 'red';
    reason: string;
}

const SmartInsights: React.FC = () => {
    const [insights, setInsights] = useState<InsightAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
        // Refresh every 5 minutes
        const interval = setInterval(fetchInsights, 300000);
        return () => clearInterval(interval);
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/stats/smart-insights');
            if (Array.isArray(res.data)) {
                setInsights(res.data);
            } else {
                console.error("Invalid insights data:", res.data);
                setInsights([]);
            }
        } catch (err) {
            console.error("Error fetching smart insights", err);
            setInsights([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading && insights.length === 0) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-100 rounded-2xl border border-gray-200"></div>
                ))}
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="text-3xl block mb-2">🔭</span>
                <p className="text-sm font-bold text-gray-500 font-heading">Todo en calma en el radar.</p>
                <p className="text-xs text-gray-400 mt-1">No se detectan anomalías de crecimiento hoy.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {insights.map((insight) => (
                <div
                    key={insight.id}
                    className={`p-6 rounded-2xl border-l-8 transition-all hover:shadow-md ${insight.severity === 'red' ? 'bg-red-50 border-red-500' :
                        insight.severity === 'orange' ? 'bg-orange-50 border-orange-400' :
                            'bg-blue-50 border-blue-400'
                        }`}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">
                                {insight.severity === 'red' ? '🔥' : insight.severity === 'orange' ? '⚡' : '📈'}
                            </span>
                            <h4 className="font-heading font-black text-n900 text-lg leading-tight uppercase tracking-tight">
                                {insight.town_name} <span className="text-xs font-normal text-gray-500 lowercase">({insight.province})</span>
                            </h4>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${insight.severity === 'red' ? 'bg-red-500 text-white' :
                            insight.severity === 'orange' ? 'bg-orange-400 text-white' :
                                'bg-blue-400 text-white'
                            }`}>
                            TR: +{insight.tr_score}%
                        </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-n900">Fenómeno:</span> {insight.phenomenon}
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-n900">Origen:</span> El {Math.round(insight.actual_volume > 1 ? 70 : 100)}% de las búsquedas vienen de <span className="text-p2 font-bold">{insight.origin}</span>.
                        </p>
                        <p className="text-xs text-gray-500 italic">
                            Motivo probable: {insight.reason}
                        </p>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 flex-1"
                            onClick={() => alert(`Llamando al ADL de ${insight.town_name}...`)}
                        >
                            📞 Llamar al Ayuntamiento
                        </button>
                        <button
                            className="bg-n900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-n800 flex-1"
                            onClick={() => alert(`Navegando a analíticas de ${insight.town_name}...`)}
                        >
                            📊 Ver analíticas
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SmartInsights;
