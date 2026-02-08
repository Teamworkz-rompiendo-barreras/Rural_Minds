
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Container, Grid, Stack, Button,
    useTheme, useMediaQuery, Paper,
    IconButton
} from '@mui/material';
import {
    Wifi, VolumeMute, AutoAwesome,
    HealthAndSafety, ShoppingBag,
    School, DirectionsBus,
    Star, ArrowBack, Park,
    Thermostat, Groups, Terrain, PhotoLibrary
} from '@mui/icons-material';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from '../components/municipality/WeatherWidget';
import SensoryGallery from '../components/municipality/SensoryGallery';

interface MunicipalityDetails {
    id: string;
    municipality: string;
    province: string;
    autonomous_community: string;
    latitude?: number;
    longitude?: number;
    slogan: string;
    description: string;
    population: number;
    altitude: number;
    average_climate: string;
    internet_speed: string;
    has_fiber_600: boolean;
    connectivity_info: string;
    mobile_coverage: string;
    has_coworking: boolean;
    noise_level: string;
    light_pollution: string;
    life_pace: string;
    environment_type: string;
    match_score?: number;
    services: {
        health: string;
        education: string;
        coworking: string;
        commerce: string;
        connection: string;
    };
    gallery_urls: string[];
    active_projects: any[];
}

const MunicipalityProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [details, setDetails] = useState<MunicipalityDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`/api/locations/${id}/details`);
                setDetails(res.data);

                if (user && user.talent_profile?.target_locations?.includes(id!)) {
                    setSaved(true);
                }
            } catch (err) {
                console.error("Error fetching details", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id, user]);

    const handleInterest = async () => {
        if (!user) return navigate('/login');

        // Match check logic (handle the type cast and property check)
        const isProfileComplete = user.talent_profile && (user.talent_profile as any).sensory_needs_completed;

        if (!isProfileComplete) {
            if (window.confirm("¡Nos encanta tu interés! Para asegurar el mejor match con este pueblo, necesitamos terminar tu perfil sensorial. ¿Quieres hacerlo ahora?")) {
                navigate('/sensory-profile');
            }
            return;
        }

        try {
            const profileRes = await axios.get('/api/profiles/me');
            const currentTargets = profileRes.data.target_locations || [];

            if (currentTargets.includes(id)) {
                return;
            }

            await axios.put('/api/profiles/me', {
                target_locations: [...currentTargets, id]
            });
            setSaved(true);
            alert("¡Genial! Hemos anotado tu interés. El ayuntamiento y las empresas locales pronto sabrán que un talento como tú busca su oasis.");
        } catch (err) {
            console.error("Error saving interest", err);
        }
    };

    if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><Typography>Cargando oasis...</Typography></Box>;
    if (!details) return <Box sx={{ p: 10, textAlign: 'center' }}><Typography>Municipio no encontrado</Typography></Box>;

    return (
        <Box sx={{ bgcolor: '#FAFAFA', pb: 10, fontFamily: '"Atkinson Hyperlegible", sans-serif' }}>
            {/* 1. Hero Visual */}
            <Box sx={{
                height: isMobile ? 300 : 500,
                position: 'relative',
                backgroundImage: `url(${details.gallery_urls[0] || 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=1600'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)'
                }} />

                <Container maxWidth="lg" sx={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ position: 'absolute', top: 20, left: 10, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}
                    >
                        <ArrowBack />
                    </IconButton>

                    <Stack
                        justifyContent="flex-end"
                        sx={{ height: '100%', pb: 6, flexGrow: 1 }}
                        spacing={2}
                    >
                        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                            <Typography variant={isMobile ? "h4" : "h2"} fontWeight="900" color="white">
                                {details.municipality}
                            </Typography>
                            {details.match_score && (
                                <Box sx={{
                                    width: 70, height: 70, borderRadius: '50%',
                                    bgcolor: '#0F5C2E', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column', color: 'white',
                                    border: '4px solid white',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                                }}>
                                    <Typography variant="caption" fontWeight="bold">Match</Typography>
                                    <Typography variant="body1" fontWeight="900">{details.match_score}%</Typography>
                                </Box>
                            )}
                        </Stack>

                        <Stack direction="row" spacing={3} color="white" flexWrap="wrap" gap={2}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Groups fontSize="small" /> <Typography variant="body2" fontWeight="bold">{details.population} Hab.</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Terrain fontSize="small" /> <Typography variant="body2" fontWeight="bold">{details.altitude}m</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Thermostat fontSize="small" /> <Typography variant="body2" fontWeight="bold">{details.average_climate}</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 6 }}>
                <Grid container spacing={6}>
                    {/* Left Column: Flow Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={6}>
                            {/* Intro */}
                            <Box>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#0F5C2E', mb: 2 }}>
                                    "{details.slogan}"
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#4A5568', lineHeight: 1.8, fontSize: '1.1rem', mb: 4 }}>
                                    {details.description}
                                </Typography>

                                {details.gallery_urls.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhotoLibrary fontSize="small" sx={{ color: '#374BA6' }} /> Galería del Pueblo
                                        </Typography>
                                        <SensoryGallery images={details.gallery_urls} />
                                    </Box>
                                )}
                            </Box>

                            {/* 2. Sensory Pulse */}
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <AutoAwesome sx={{ color: '#374BA6' }} /> El Pulso Sensorial
                                </Typography>
                                <Grid container spacing={2}>
                                    {[
                                        { label: 'Nivel de Ruido', value: details.noise_level, icon: <VolumeMute />, color: '#38A169' },
                                        { label: 'Luz Nocturna', value: details.light_pollution, icon: <Star />, color: '#3182CE' },
                                        { label: 'Ritmo de Vida', value: details.life_pace, icon: <Park />, color: '#D69E2E' }
                                    ].map((item, idx) => (
                                        <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                                            <Paper sx={{ p: 3, borderRadius: 4, height: '100%', bgcolor: '#f0f4ff', border: '1px solid #e0e6f0', boxShadow: 'none' }}>
                                                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                                                <Typography variant="caption" fontWeight="bold" color="text.disabled" sx={{ textTransform: 'uppercase' }}>{item.label}</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="#2D3748">{item.value}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* 3. Conectividad y Trabajo */}
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Conectividad y Trabajo</Typography>
                                <Stack spacing={2}>
                                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                                        <Grid container alignItems="center">
                                            <Grid size={{ xs: 2, sm: 1 }}>
                                                <Wifi sx={{ color: '#3182CE' }} />
                                            </Grid>
                                            <Grid size={{ xs: 10, sm: 11 }}>
                                                <Typography variant="body2" fontWeight="bold">Fibra Óptica: {details.internet_speed}</Typography>
                                                <Typography variant="caption" color="text.secondary">Velocidad real testada y estable para teletrabajo intensivo.</Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: details.has_coworking ? '#F0FFF4' : 'white', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box sx={{ fontSize: 24 }}>🏢</Box>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">Espacios Coworking</Typography>
                                                        <Typography variant="caption" color="text.secondary">{details.has_coworking ? "Adaptados sensorialmente" : "No disponible actualmente"}</Typography>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box sx={{ fontSize: 24 }}>📱</Box>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">Cobertura Móvil</Typography>
                                                        <Typography variant="caption" color="text.secondary">Calidad {details.mobile_coverage} en todo el casco urbano.</Typography>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </Box>

                            {/* 4. Active Projects */}
                            {details.active_projects.length > 0 && (
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Proyectos Activos en {details.municipality}</Typography>
                                    <Stack spacing={2}>
                                        {details.active_projects.map((proj: any) => (
                                            <Paper
                                                key={proj.id}
                                                onClick={() => navigate(`/project/${proj.id}`)}
                                                sx={{ p: 2.5, borderRadius: 4, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: '#F0FFF4', transform: 'translateX(10px)' } }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="bold">{proj.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{proj.company}</Typography>
                                                    </Box>
                                                    <Button size="small" variant="text" sx={{ color: '#0F5C2E' }}>Ver más</Button>
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Right Column: Widgets & Lead */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={4} sx={{ position: isMobile ? 'static' : 'sticky', top: 100 }}>
                            {/* Weather */}
                            <WeatherWidget municipality={details.municipality} lat={details.latitude} lon={details.longitude} />

                            {/* Action Card */}
                            <Paper sx={{ p: 4, borderRadius: 5, bgcolor: '#0F5C2E', color: 'white', boxShadow: '0 20px 40px rgba(15,92,46,0.2)' }}>
                                <Typography variant="h5" fontWeight="900" sx={{ mb: 2 }}>¿Sientes que este es tu lugar?</Typography>
                                <Typography variant="body2" sx={{ mb: 4, opacity: 0.9 }}>
                                    Al pulsar el botón, iniciaremos el proceso de conexión con el ayuntamiento para ayudarte con vivienda y servicios.
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleInterest}
                                    sx={{
                                        bgcolor: 'white', color: '#0F5C2E',
                                        fontWeight: 'bold', py: 1.5, borderRadius: 3,
                                        '&:hover': { bgcolor: '#f0f0f0' }
                                    }}
                                >
                                    {saved ? "Ya registrado" : "Me interesa vivir aquí"}
                                </Button>
                            </Paper>

                            {/* Services List */}
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DirectionsBus fontSize="small" color="primary" /> Mapa de Servicios a "Paso Humano"
                                </Typography>
                                <Stack spacing={1.5}>
                                    {[
                                        { icon: <HealthAndSafety sx={{ color: '#E53E3E' }} />, label: 'Salud', value: details.services.health },
                                        { icon: <ShoppingBag sx={{ color: '#D69E2E' }} />, label: 'Suministros', value: details.services.commerce },
                                        { icon: <School sx={{ color: '#3182CE' }} />, label: 'Educación', value: details.services.education },
                                        { icon: <DirectionsBus sx={{ color: '#4A5568' }} />, label: 'Conexión', value: details.services.connection || "Conexión a < 15 min" }
                                    ].map((s, i) => (
                                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                                            <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex' }}>{s.icon}</Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight="bold" display="block">{s.label}</Typography>
                                                <Typography variant="body2" color="text.secondary">{s.value}</Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default MunicipalityProfile;
