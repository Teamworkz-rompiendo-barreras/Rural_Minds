
import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../../config/api';

// --- Types ---
interface Point {
    id: string;
    name: string;
    province: string;
    ccaa: string;
    lat: number;
    lng: number;
    origin_weight: number;
    target_weight: number;
}

interface Flow {
    origin_id: string;
    target_id: string;
    status: 'interest' | 'success';
    count: number;
}

interface ImpactMapData {
    points: Point[];
    flows: Flow[];
}

// --- Helper Component for Arcs ---
// Leaflet doesn't have native arcs in core. We'll use SVG paths for subtle curves.
const FlowArcs: React.FC<{ flows: Flow[], points: Point[] }> = ({ flows, points }) => {
    const map = useMap();

    // Convert points array to a map for easy lookup
    const pointsMap = useMemo(() => {
        const m = new Map<string, Point>();
        points.forEach(p => m.set(p.id, p));
        return m;
    }, [points]);

    const renderArc = (flow: Flow, index: number) => {
        const origin = pointsMap.get(flow.origin_id);
        const target = pointsMap.get(flow.target_id);

        if (!origin || !target) return null;

        const start = map.latLngToLayerPoint([origin.lat, origin.lng]);
        const end = map.latLngToLayerPoint([target.lat, target.lng]);

        // Calculate a control point for the curve (quadratic bezier)
        // We'll offset it perpendicular to the line between start and end
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Arc intensity (higher = more curved)
        const intensity = 30;
        const offsetX = -dy / dist * intensity;
        const offsetY = dx / dist * intensity;

        const cpX = midX + offsetX;
        const cpY = midY + offsetY;

        const pathData = `M ${start.x} ${start.y} Q ${cpX} ${cpY} ${end.x} ${end.y}`;

        const isSuccess = flow.status === 'success';
        const strokeColor = isSuccess ? '#0F5C2E' : '#374BA6';
        const strokeDash = isSuccess ? 'none' : '5,5';
        const strokeWidth = Math.min(6, 1 + flow.count * 0.5);

        return (
            <path
                key={`${flow.origin_id}-${flow.target_id}-${flow.status}-${index}`}
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                style={{ transition: 'all 0.5s ease', opacity: 0.6 }}
                className="hover:opacity-100 hover:stroke-yellow-500 cursor-pointer"
            >
                <title>{`${origin.name} -> ${target.name}: ${flow.count} flujos (${flow.status === 'success' ? 'Match' : 'Interés'})`}</title>
            </path>
        );
    };

    return (
        <svg
            className="leaflet-zoom-animated"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 400,
            }}
        >
            <g style={{ pointerEvents: 'auto' }}>
                {flows.map((f, i) => renderArc(f, i))}
            </g>
        </svg>
    );
};

// --- Main Component ---
const ImpactMap: React.FC = () => {
    const [data, setData] = useState<ImpactMapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [ccaa, setCcaa] = useState('');
    const [skill, setSkill] = useState('');
    const [onlySuccess, setOnlySuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, [ccaa, skill, onlySuccess]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = { only_success: onlySuccess };
            if (ccaa) params.ccaa = ccaa;
            if (skill) params.skill = skill;

            const res = await axios.get('/stats/impact-map', { params });
            setData(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching map data", err);
            setError("No se pudo cargar el mapa de impacto.");
        } finally {
            setLoading(false);
        }
    };

    if (error) return <div className="p-10 bg-red-50 text-red-700 rounded-xl border border-red-100">{error}</div>;

    const summaryData = useMemo(() => {
        if (!data) return [];
        // Group by destination to show "X people want to go to Sigüenza"
        const stats = new Map<string, { name: string, province: string, interest: number, success: number }>();

        data.flows.forEach(f => {
            const dest = data.points.find(p => p.id === f.target_id);
            if (!dest) return;

            if (!stats.has(f.target_id)) {
                stats.set(f.target_id, { name: dest.name, province: dest.province, interest: 0, success: 0 });
            }

            const s = stats.get(f.target_id)!;
            if (f.status === 'success') s.success += f.count;
            else s.interest += f.count;
        });

        return Array.from(stats.values()).sort((a, b) => (b.interest + b.success) - (a.interest + a.success));
    }, [data]);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map View (Left 3/4) */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[1000] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-p2 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold text-n900 uppercase tracking-widest">Actualizando Flujos...</span>
                            </div>
                        </div>
                    )}

                    <MapContainer
                        center={[40.4168, -3.7038]}
                        zoom={6}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />

                        {data && <FlowArcs flows={data.flows} points={data.points} />}

                        {data?.points.map(p => {
                            const isTarget = p.target_weight > 0;
                            const color = isTarget ? '#0F5C2E' : '#374BA6'; // Green for Target, Blue for Origin
                            const radius = Math.min(15, 4 + Math.max(p.origin_weight, p.target_weight) * 2);

                            return (
                                <CircleMarker
                                    key={p.id}
                                    center={[p.lat, p.lng]}
                                    radius={radius}
                                    fillColor={color}
                                    color="#fff"
                                    weight={2}
                                    fillOpacity={0.8}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-bold border-b pb-1 mb-1">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.province} | {p.ccaa}</p>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                                                <div className="text-blue-600">Origen: {p.origin_weight}</div>
                                                <div className="text-green-600">Destino: {p.target_weight}</div>
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Control Panel (Right 1/4) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div>
                        <h4 className="font-heading font-bold text-n900 mb-4 flex items-center gap-2">
                            <span>🎛️</span> Panel de Control
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Filtrar por CCAA (Destino)</label>
                                <select
                                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-p2"
                                    value={ccaa}
                                    onChange={(e) => setCcaa(e.target.value)}
                                >
                                    <option value="">Todas las regiones</option>
                                    <option value="Castilla-La Mancha">Castilla-La Mancha</option>
                                    <option value="Castilla y León">Castilla y León</option>
                                    <option value="Aragón">Aragón</option>
                                    <option value="Extremadura">Extremadura</option>
                                    <option value="Andalucía">Andalucía</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Perfil de Talento</label>
                                <select
                                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-p2"
                                    value={skill}
                                    onChange={(e) => setSkill(e.target.value)}
                                >
                                    <option value="">Todos los sectores</option>
                                    <option value="IT">Tecnología (IT)</option>
                                    <option value="Artesanía">Artesanía</option>
                                    <option value="Turismo">Turismo Rural</option>
                                    <option value="Sostenibilidad">Sostenibilidad</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={onlySuccess}
                                            onChange={() => setOnlySuccess(!onlySuccess)}
                                        />
                                        <div className={`w-10 h-5 rounded-full transition-colors ${onlySuccess ? 'bg-p2' : 'bg-gray-200'}`}></div>
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${onlySuccess ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-xs font-bold text-n900 group-hover:text-p2 transition-colors">Mostrar Solo Éxitos</span>
                                </label>
                                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                    Oculta los flujos de "Preferencia" y muestra solo los matches confirmados (líneas sólidas).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="bg-p2/5 p-4 rounded-xl border border-p2/10">
                            <span className="text-xl block mb-1">🏁</span>
                            <p className="text-xs font-medium text-p2">
                                Actualmente visualizando flujos territoriales dinámicos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Table (Bottom) */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="font-heading font-bold text-lg text-n900">📊 Resumen de Impacto Territorial</h4>
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold text-gray-500 uppercase">Datos en tiempo real</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Municipio rural (Destino)</th>
                                <th className="px-6 py-4">Provincia</th>
                                <th className="px-6 py-4 text-center">Interés (Aspiración)</th>
                                <th className="px-6 py-4 text-center">Match (Éxito)</th>
                                <th className="px-6 py-4 text-right">Potencial Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {summaryData.length > 0 ? summaryData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-n900">{row.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{row.province}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-blue-600 font-bold">{row.interest}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-green-600 font-bold">{row.success}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="font-black text-n900">{row.interest + row.success}</span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-p2"
                                                    style={{ width: `${Math.min(100, (row.interest + row.success) * 10)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No hay flujos que mostrar con los filtros actuales.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default ImpactMap;
