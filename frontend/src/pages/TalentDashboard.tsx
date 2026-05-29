import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, Container, Grid, Stack, Tabs, Tab,
    Paper, Button, Avatar, Chip
} from '@mui/material';
import {
    DirectionsRun, Favorite, Public,
    ChatBubble, Handyman, EmojiEvents
} from '@mui/icons-material';
import axios from '../config/api';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ProcessTimeline from '../components/talent/ProcessTimeline';
import SensoryPassport from '../components/talent/SensoryPassport';
import TalentInbox from '../components/talent/TalentInbox';
import MunicipalityMiniCard from '../components/talent/MunicipalityMiniCard';

// Approximate coordinates for Spanish provinces
const PROVINCE_COORDS: Record<string, [number, number]> = {
    'A Coruña': [43.37, -8.40], 'Álava': [42.85, -2.68], 'Albacete': [38.99, -1.86],
    'Alicante': [38.35, -0.48], 'Almería': [36.84, -2.47], 'Asturias': [43.36, -5.84],
    'Ávila': [40.66, -4.70], 'Badajoz': [38.87, -6.97], 'Barcelona': [41.38, 2.18],
    'Burgos': [42.34, -3.70], 'Cáceres': [39.47, -6.37], 'Cádiz': [36.53, -6.30],
    'Cantabria': [43.18, -3.99], 'Castellón': [39.99, -0.05], 'Ciudad Real': [38.99, -3.92],
    'Córdoba': [37.89, -4.77], 'Cuenca': [40.07, -2.14], 'Girona': [41.98, 2.82],
    'Granada': [37.18, -3.60], 'Guadalajara': [40.63, -3.16], 'Guipúzcoa': [43.31, -1.98],
    'Huelva': [37.26, -6.95], 'Huesca': [42.14, -0.41], 'Jaén': [37.77, -3.79],
    'La Rioja': [42.47, -2.45], 'Las Palmas': [28.12, -15.43], 'León': [42.60, -5.57],
    'Lleida': [41.62, 0.62], 'Lugo': [43.01, -7.56], 'Madrid': [40.42, -3.70],
    'Málaga': [36.72, -4.42], 'Murcia': [37.98, -1.13], 'Navarra': [42.82, -1.64],
    'Ourense': [42.34, -7.86], 'Palencia': [42.01, -4.53], 'Pontevedra': [42.43, -8.65],
    'Salamanca': [40.97, -5.66], 'Santa Cruz de Tenerife': [28.47, -16.25],
    'Segovia': [40.95, -4.12], 'Sevilla': [37.39, -5.99], 'Soria': [41.77, -2.47],
    'Tarragona': [41.12, 1.25], 'Teruel': [40.34, -1.11], 'Toledo': [39.86, -4.02],
    'Valencia': [39.47, -0.38], 'Valladolid': [41.65, -4.72], 'Vizcaya': [43.26, -2.93],
    'Zamora': [41.50, -5.75], 'Zaragoza': [41.65, -0.89], 'Baleares': [39.57, 2.65],
    'Islas Baleares': [39.57, 2.65],
};

interface DashboardData {
    applications: any[];
    favorites: any[];
    profile: any;
    achievements: any[];
}

const TalentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState(0);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get('/api/talent/dashboard');
                setData(res.data);
            } catch (err) {
                console.error("Error fetching dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchDashboard();
    }, [user]);

    const handleRemoveFavorite = async (id: string) => {
        try {
            const current = data?.profile?.target_locations || [];
            const next = current.filter((l: string) => l !== id);
            await axios.put('/api/profiles/me', { target_locations: next });
            setData(prev => prev ? { ...prev, favorites: prev.favorites.filter(f => f.id !== id), profile: { ...prev.profile, target_locations: next } } : null);
        } catch (err) {
            console.error("Error removing favorite", err);
        }
    };

    if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><Typography>Cargando tu camino...</Typography></Box>;

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 10, fontFamily: '"Atkinson Hyperlegible", sans-serif' }}>
            {/* Header / Hero */}
            <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #E2E8F0', pt: 6, pb: 2 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" sx={{ mb: 4 }}>
                        <Avatar
                            sx={{ width: 100, height: 100, bgcolor: '#374BA6', fontSize: 40, border: '4px solid #E2E8F0' }}
                        >
                            {user?.full_name?.charAt(0) || 'T'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
                            <Typography variant="h4" fontWeight="900" sx={{ color: '#1A202C', mb: 1 }}>
                                ¡Hola, {user?.full_name || 'Talento'}! ✨
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Estas gestionando tu transición al mundo rural. Inspírate, conecta y arraiga.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 4, bgcolor: '#F0FFF4', border: '1px solid #C6F6D5' }}>
                                <Typography variant="caption" fontWeight="bold" color="#2F855A" sx={{ display: 'block' }}>LOGROS</Typography>
                                <Typography variant="h6" fontWeight="bold">{data?.achievements?.length || 0}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 4, bgcolor: '#EBF8FF', border: '1px solid #BEE3F8' }}>
                                <Typography variant="caption" fontWeight="bold" color="#2B6CB0" sx={{ display: 'block' }}>AFINIDAD MEDIA</Typography>
                                <Typography variant="h6" fontWeight="bold">88%</Typography>
                            </Paper>
                        </Stack>
                    </Stack>

                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0', bgcolor: '#374BA6' },
                            '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '1rem', minWidth: 120 }
                        }}
                    >
                        <Tab icon={<DirectionsRun sx={{ mr: 1 }} />} iconPosition="start" label="Mi Camino" />
                        <Tab icon={<Favorite sx={{ mr: 1 }} />} iconPosition="start" label="Muro de Inspiración" />
                        <Tab icon={<Handyman sx={{ mr: 1 }} />} iconPosition="start" label="Pasaporte Sensorial" />
                        <Tab icon={<ChatBubble sx={{ mr: 1 }} />} iconPosition="start" label="Buzón Único" />
                    </Tabs>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 6 }}>
                {/* Tab 0: Mi Camino (Active Processes) */}
                {tab === 0 && (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Procesos Activos</Typography>
                            <Stack spacing={3}>
                                {data?.applications?.map((app) => (
                                    <Paper key={app.id} sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold">{app.challenge?.title || "Proyecto Rural"}</Typography>
                                                <Typography variant="body2" color="text.secondary">{app.challenge?.tenant?.name || "Empresa"}</Typography>
                                            </Box>
                                            <Chip label={app.status} color="primary" variant="outlined" size="small" sx={{ textTransform: 'capitalize' }} />
                                        </Stack>
                                        <ProcessTimeline status={app.status} />
                                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button variant="text" size="small" endIcon={<ChatBubble />}>Ir al chat</Button>
                                        </Box>
                                    </Paper>
                                ))}
                                {data?.applications?.length === 0 && (
                                    <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, border: '2px dashed #CBD5E1', bgcolor: 'transparent' }}>
                                        <Typography variant="h6" color="text.secondary">¿Aún no has dado el primer paso?</Typography>
                                        <Button variant="contained" sx={{ mt: 2, bgcolor: '#0F5C2E' }}>Explorar Oportunidades</Button>
                                    </Paper>
                                )}
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            {/* Logros de Arraigo */}
                            <Paper sx={{ p: 4, borderRadius: 6, bgcolor: '#0F5C2E', color: 'white' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmojiEvents /> Logros de Arraigo
                                </Typography>
                                <Stack spacing={2}>
                                    {[
                                        { title: 'Primer Match', done: true, icon: '🎯' },
                                        { title: 'Pasaporte Completo', done: true, icon: '📑' },
                                        { title: 'Primera Entrevista', done: false, icon: '🤝' },
                                        { title: '¡Mudanza!', done: false, icon: '🏡' }
                                    ].map((l, i) => (
                                        <Stack key={i} direction="row" alignItems="center" spacing={2} sx={{ opacity: l.done ? 1 : 0.5 }}>
                                            <Box sx={{ fontSize: 24 }}>{l.icon}</Box>
                                            <Typography variant="body2" fontWeight={l.done ? "bold" : "normal"}>{l.title}</Typography>
                                            {l.done && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>✅</Box>}
                                        </Stack>
                                    ))}
                                </Stack>
                            </Paper>

                            <Box sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: '#EDF2F7', border: '1px solid #E2E8F0' }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Consejo del día</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    "La adecuación sensorial no es un lujo, es tu derecho al bienestar laboral. No dudes en preguntar por el ambiente sonoro."
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                )}

                {/* Tab 1: Favoritos (Muro de Inspiración) */}
                {tab === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Box>
                                <Typography variant="h5" fontWeight="900" sx={{ color: '#1A202C' }}>Tu Muro de Inspiración</Typography>
                                <Typography variant="body2" color="text.secondary">Municipios que has guardado para tu futuro proyecto de vida.</Typography>
                            </Box>
                            <Button
                                variant={showMap ? 'contained' : 'outlined'}
                                startIcon={<Public />}
                                onClick={() => setShowMap(v => !v)}
                                sx={{ bgcolor: showMap ? '#0F5C2E' : undefined, '&:hover': { bgcolor: showMap ? '#0a4523' : undefined } }}
                            >
                                {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                            </Button>
                        </Box>

                        {showMap && (
                            <Box sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', height: 400 }}>
                                <MapContainer
                                    center={[40.4, -3.7]}
                                    zoom={5}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                    />
                                    {data?.favorites?.map((m) => {
                                        const coords = PROVINCE_COORDS[m.province] ?? PROVINCE_COORDS[m.province?.split('/')[0]?.trim()];
                                        if (!coords) return null;
                                        return (
                                            <CircleMarker
                                                key={m.id}
                                                center={coords}
                                                radius={10}
                                                pathOptions={{ color: '#0F5C2E', fillColor: '#0F5C2E', fillOpacity: 0.8 }}
                                            >
                                                <Popup>
                                                    <strong>{m.municipality}</strong><br />
                                                    <span style={{ color: '#666', fontSize: 12 }}>{m.province}</span>
                                                    {m.internet_speed && <><br /><span style={{ fontSize: 12 }}>📶 {m.internet_speed}</span></>}
                                                </Popup>
                                            </CircleMarker>
                                        );
                                    })}
                                </MapContainer>
                            </Box>
                        )}

                        <Grid container spacing={3}>
                            {data?.favorites?.map((m) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.id}>
                                    <MunicipalityMiniCard municipality={m} onRemove={handleRemoveFavorite} />
                                </Grid>
                            ))}
                            {data?.favorites?.length === 0 && (
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'white', borderRadius: 6, border: '1px dashed #CBD5E1' }}>
                                        <Favorite sx={{ fontSize: 40, color: '#CBD5E1', mb: 2 }} />
                                        <Typography color="text.disabled">Tu muro está vacío. ¡Empieza a explorar pueblos!</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                )}

                {/* Tab 2: Mi Pasaporte */}
                {tab === 2 && (
                    <SensoryPassport />
                )}

                {/* Tab 3: Mensajes */}
                {tab === 3 && (
                    <TalentInbox />
                )}
            </Container>
        </Box>
    );
};

export default TalentDashboard;
