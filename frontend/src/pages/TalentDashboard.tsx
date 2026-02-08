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
import ProcessTimeline from '../components/talent/ProcessTimeline';
import SensoryPassport from '../components/talent/SensoryPassport';
import TalentInbox from '../components/talent/TalentInbox';
import MunicipalityMiniCard from '../components/talent/MunicipalityMiniCard';

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
                            <Button variant="outlined" startIcon={<Public />}>Ver Mapa</Button>
                        </Box>

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
