
import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// --- Types ---
interface FunnelItem {
    label: string;
    value: number;
    icon: string;
}

interface MatchLink {
    id: string;
    type: 'attraction' | 'rooting' | 'local';
    origin: { name: string; province: string };
    target: { name: string; province: string };
    status: string;
    is_local?: boolean;
}

interface MatchDetail {
    municipality: string;
    talent_id: string;
    type: string;
    status: string;
    last_move: string;
    is_cold: boolean;
    is_local?: boolean;
}

// --- Status Badge ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const isSuccess = status.includes('✅') || status.includes('match');
    const isActive = status.includes('💬') || status.includes('conversation');

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSuccess ? 'bg-emerald-100 text-emerald-700' :
            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
            {status}
        </span>
    );
};

// --- PDF Report Component ---
const styles = StyleSheet.create({
    page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    header: { marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#374BA6', paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { fontSize: 12, color: '#6B7280', marginTop: 5 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374BA6', marginBottom: 10 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 8 },
    cell: { flex: 1, fontSize: 10 },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    kpiCard: { width: '48%', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#374BA6' },
    kpiLabel: { fontSize: 8, color: '#6B7280', textTransform: 'uppercase' },
    kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' }
});

const ImpactReport: React.FC<{ funnel: FunnelItem[], links: MatchLink[] }> = ({ funnel, links }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Rural Minds - Informe de Impacto</Text>
                <Text style={styles.subtitle}>Generado el {new Date().toLocaleDateString()} | Seguimiento Estratégico de Matches</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Embudo de Conversión (KPIs)</Text>
                <View style={styles.kpiGrid}>
                    {funnel.map((item, i) => (
                        <View key={i} style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>{item.label}</Text>
                            <Text style={styles.kpiValue}>{item.value}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Últimos Vínculos Generados</Text>
                <View style={styles.row}>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Origen (Provincia)</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Destino (Pueblo)</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Tipo</Text>
                </View>
                {links.slice(0, 10).map((link) => (
                    <View key={link.id} style={styles.row}>
                        <Text style={styles.cell}>{link.origin.province}</Text>
                        <Text style={styles.cell}>{link.target.name}</Text>
                        <Text style={[styles.cell, { color: link.type === 'local' ? '#4F46E5' : (link.type === 'attraction' ? '#059669' : '#374BA6') }]}>
                            {link.type === 'local' ? 'Local (Arraigo)' : (link.type === 'attraction' ? 'Atracción' : 'Arraigo')}
                        </Text>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

const SuperadminMatchesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [funnel, setFunnel] = useState<FunnelItem[]>([]);
    const [links, setLinks] = useState<MatchLink[]>([]);
    const [details, setDetails] = useState<MatchDetail[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [funnelRes, linksRes, detailRes] = await Promise.all([
                axios.get('/admin/analytics/match-funnel'),
                axios.get('/admin/analytics/match-map-links'),
                axios.get('/admin/analytics/match-details')
            ]);
            setFunnel(funnelRes.data.funnel);
            setLinks(linksRes.data);
            setDetails(detailRes.data);
        } catch (err) {
            console.error("Error fetching match analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">Analizando ecosistema...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-8 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-gray-900 transition-all font-bold">← Dashboard</button>
                        <div>
                            <h1 className="text-3xl font-heading font-black text-n900 tracking-tight">Seguimiento de Matches</h1>
                            <p className="text-sm text-gray-500 font-medium">Transformando conversaciones en datos estratégicos.</p>
                        </div>
                    </div>

                    <PDFDownloadLink
                        document={<ImpactReport funnel={funnel} links={links} />}
                        fileName={`RuralMindsImpacto_${new Date().toISOString().split('T')[0]}.pdf`}
                        className="bg-p2 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-p2/90 transition-all shadow-lg shadow-p2/20 no-underline"
                    >
                        {/* @ts-ignore */}
                        {({ loading }) => loading ? 'Generando...' : '📄 Generar Informe Impacto'}
                    </PDFDownloadLink>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-10 space-y-12">
                {/* 1. Conversion Funnel */}
                <section>
                    <h2 className="font-heading font-bold text-xl text-n900 mb-6 flex items-center gap-2">
                        📊 Embudo de Éxito Rural
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">Pipeline Real</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {funnel.map((item, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-indigo-50"></div>
                                <span className="text-4xl block mb-4 relative z-10">{item.icon}</span>
                                <h3 className="text-4xl font-black text-n900 mb-1 relative z-10">{item.value.toLocaleString()}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest relative z-10">{item.label}</p>
                                {idx < funnel.length - 1 && (
                                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                                        <span className="text-2xl text-gray-200">→</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Hot Nodes Map & Relationship Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Hot Nodes Feed (Visual representation of map link data) */}
                    <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h2 className="font-heading font-bold text-xl text-n900 mb-6 flex items-center gap-2">
                            🧭 Mapa de Vínculos
                        </h2>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {links.length > 0 ? (
                                links.map((link) => (
                                    <div key={link.id} className={`p-4 rounded-2xl border-l-[6px] transition-all hover:translate-x-1 ${link.type === 'local' ? 'bg-indigo-50/50 border-indigo-500' : (link.type === 'attraction' ? 'bg-emerald-50/50 border-emerald-500' : 'bg-blue-50/50 border-blue-500')
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${link.type === 'local' ? 'bg-indigo-100 text-indigo-700' : (link.type === 'attraction' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')
                                                }`}>
                                                {link.type === 'local' ? '📍 Local' : (link.type === 'attraction' ? 'Atracción' : 'Arraigo')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">#{link.status}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-bold text-n900">{link.origin.province}</span>
                                            <span className="text-gray-300">──▶</span>
                                            <span className="font-bold text-p2">{link.target.name}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-20 text-gray-400 italic">No hay vínculos detectados.</p>
                            )}
                        </div>
                    </div>

                    {/* Real-time Table */}
                    <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="font-heading font-bold text-xl text-n900">🕒 Relaciones en Tiempo Real</h2>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span> Alertas "Match Frío" activas
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Municipio</th>
                                        <th className="px-8 py-4">Talento</th>
                                        <th className="px-8 py-4">Tipo</th>
                                        <th className="px-8 py-4">Estado Match</th>
                                        <th className="px-8 py-4">Últ. Movimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {details.map((d, i) => (
                                        <tr key={i} className={`hover:bg-gray-50/80 transition-all ${d.is_cold ? 'bg-orange-50/30' : ''}`}>
                                            <td className="px-8 py-5 font-bold text-n900">{d.municipality}</td>
                                            <td className="px-8 py-5 font-mono text-xs text-gray-500 relative">
                                                {d.talent_id}
                                                {d.is_cold && (
                                                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] title='Match Frío (>7 días sin respuesta)'">⚠️</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center gap-1 font-bold ${d.is_local ? 'text-indigo-600' : 'text-gray-600'}`}>
                                                    {d.is_local && <span>📍</span>} {d.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge status={d.status} />
                                            </td>
                                            <td className="px-8 py-5 text-gray-400 font-medium text-xs">
                                                {new Date(d.last_move).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {details.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">Esperando actividad de matching...</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperadminMatchesDashboard;
