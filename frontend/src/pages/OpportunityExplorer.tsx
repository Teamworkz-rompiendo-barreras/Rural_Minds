
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Grid, Stack, Button,
    Skeleton, useTheme, useMediaQuery
} from '@mui/material';
import {
    ExploreOutlined, AutoAwesome, Share, FilterListOff
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import WellnessFilters from '../components/explorer/WellnessFilters';
import OpportunityCard from '../components/explorer/OpportunityCard';
import axios from '../config/api';

const OpportunityExplorer: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Filters State derived from URL
    const [filters, setFilters] = useState({
        stimulus_level: searchParams.get('stimulus') || 'low',
        environment_type: searchParams.get('env') || null,
        min_connectivity: searchParams.get('fiber') === 'true',
        has_services: searchParams.get('services') === 'true',
        min_match_score: parseInt(searchParams.get('match') || '0'),
        user_latitude: null, // To be filled by browser geolocation if allowed
        user_longitude: null
    });

    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState<any[]>([]);

    useEffect(() => {
        // Try to get geolocation
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setFilters(prev => ({
                    ...prev,
                    user_latitude: pos.coords.latitude as any,
                    user_longitude: pos.coords.longitude as any
                }));
            });
        }
    }, []);

    useEffect(() => {
        fetchOpportunities();
        updateURL();
    }, [filters]);

    const updateURL = () => {
        const params: any = {};
        if (filters.stimulus_level) params.stimulus = filters.stimulus_level;
        if (filters.environment_type) params.env = filters.environment_type;
        if (filters.min_connectivity) params.fiber = 'true';
        if (filters.has_services) params.services = 'true';
        if (filters.min_match_score > 0) params.match = filters.min_match_score.toString();
        setSearchParams(params);
    };

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/explorer/search', filters);
            setOpportunities(res.data);
        } catch (error) {
            console.error("Error fetching opportunities", error);
        } finally {
            // Artificial delay for smooth skeleton experience (demo only)
            setTimeout(() => setLoading(false), 800);
        }
    };

    const handleSurpriseMe = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/explorer/surprise-me');
            navigate(`/challenges/${res.data.id}`);
        } catch (error) {
            alert("No encontramos una sorpresa ahora mismo, ¡inténtalo en un momento!");
            setLoading(false);
        }
    };

    const copyShareURL = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("¡Enlace de búsqueda copiado al portapapeles! 🌿");
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#FAFAFA',
            pb: 10,
            fontFamily: '"Atkinson Hyperlegible", sans-serif'
        }}>
            {/* Zen Header */}
            <Box sx={{
                pt: 8, pb: 6,
                background: 'linear-gradient(180deg, #F0FFF4 0%, #FAFAFA 100%)',
                textAlign: 'center'
            }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ExploreOutlined sx={{ color: '#0F5C2E', fontSize: 32 }} />
                            <Typography variant="h3" fontWeight="900" sx={{ color: '#1A202C' }}>
                                Paz y Talento
                            </Typography>
                        </Box>
                        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 'medium' }}>
                            Encuentra el pueblo donde tu bienestar y tu carrera profesional florecen en armonía.
                        </Typography>

                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AutoAwesome />}
                                onClick={handleSurpriseMe}
                                sx={{
                                    bgcolor: '#0F5C2E',
                                    borderRadius: 3,
                                    px: 4, py: 1.5,
                                    boxShadow: '0 10px 20px rgba(15, 92, 46, 0.2)',
                                    '&:hover': { bgcolor: '#083D1F' }
                                }}
                            >
                                Sorpréndeme
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Share />}
                                onClick={copyShareURL}
                                sx={{ borderRadius: 3, border: '1px solid #CBD5E1', color: '#475569' }}
                            >
                                Compartir
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Left Panel: Filters */}
                    <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                        <Box sx={{ position: isMobile ? 'static' : 'sticky', top: 100 }}>
                            <WellnessFilters
                                filters={filters}
                                onFilterChange={setFilters}
                            />
                        </Box>
                    </Grid>

                    {/* Right Panel: Results */}
                    <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="bold" color="text.secondary">
                                {loading ? "Buscando oasis..." : `${opportunities.length} Oportunidades encontradas`}
                            </Typography>
                            {!loading && opportunities.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <FilterListOff sx={{ fontSize: 16, color: '#A0AEC0' }} />
                                    <Typography variant="caption" color="text.disabled">Ordenado por % de afinidad</Typography>
                                </Box>
                            )}
                        </Box>

                        <Grid container spacing={3}>
                            {loading ? (
                                // Skeleton Screens
                                [...Array(6)].map((_, i) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2, mb: 2 }} />
                                        <Skeleton width="60%" height={30} sx={{ mb: 1 }} />
                                        <Skeleton width="40%" height={20} />
                                    </Grid>
                                ))
                            ) : opportunities.length > 0 ? (
                                opportunities.map((opp) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={opp.id}>
                                        <OpportunityCard
                                            challenge={opp}
                                            onApply={(id) => navigate(`/challenges/${id}`)}
                                        />
                                    </Grid>
                                ))
                            ) : (
                                <Box sx={{ width: '100%', textAlign: 'center', py: 10, bgcolor: 'white', borderRadius: 4, border: '1px dashed #CBD5E1' }}>
                                    <Box sx={{ fontSize: 48, mb: 2 }}>🕯️</Box>
                                    <Typography variant="h6" fontWeight="bold" color="text.secondary">
                                        Estamos buscando el pueblo perfecto para ti...
                                    </Typography>
                                    <Typography variant="body2" color="text.disabled">
                                        Prueba a ajustar algún filtro sensorial para ver más opciones.
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default OpportunityExplorer;
