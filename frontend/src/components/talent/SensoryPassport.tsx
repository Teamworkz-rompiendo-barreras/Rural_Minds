import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Switch, FormControlLabel,
    Slider, Divider, Button, Stack, Chip, Card, CardContent
} from '@mui/material';
import {
    Visibility, LightMode, VolumeUp,
    Psychology, NotificationsActive, Lock, Home
} from '@mui/icons-material';
import axios from '../../config/api';

const SensoryPassport: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/api/profiles/me');
                setProfile(res.data);
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (updates: any) => {
        try {
            const res = await axios.put('/api/profiles/me', { ...profile, ...updates });
            setProfile(res.data);
        } catch (err) {
            console.error("Error updating profile", err);
        }
    };

    const handleVisibilityUpdate = async (settings: any) => {
        try {
            await axios.put('/api/talent/profile/visibility', settings);
            setProfile({ ...profile, visibility_settings: settings });
        } catch (err) {
            console.error("Error updating visibility", err);
        }
    };

    if (loading) return <Typography>Cargando pasaporte...</Typography>;
    //Añadido por Andrés Barcenilla para arreglar error en el Pasaporte Sensorial (start)
    if (!profile) return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">No se pudo cargar el perfil sensorial.</Typography>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </Box>
    );
    //Añadido por Andrés Barcenilla (end)
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Stack spacing={4}>
                {/* 1. Visibilidad */}
                <Card sx={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#f8fafc' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Visibility sx={{ color: '#374BA6' }} />
                                <Typography variant="h6" fontWeight="bold">Configuración de Visibilidad</Typography>
                            </Box>
                            <Chip
                                label={profile.visibility_settings?.status === 'public' ? "Público" : "Privado"}
                                color={profile.visibility_settings?.status === 'public' ? "success" : "default"}
                                size="small"
                                variant="filled"
                            />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Controla quién puede ver tu "Pasaporte Sensorial" y tu intención de mudarte.
                        </Typography>

                        <Stack spacing={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={profile.visibility_settings?.status === 'public'}
                                        onChange={(e) => handleVisibilityUpdate({
                                            ...profile.visibility_settings,
                                            status: e.target.checked ? 'public' : 'private'
                                        })}
                                    />
                                }
                                label="Hacer perfil visible para Ayuntamientos de mis pueblos favoritos"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={profile.visibility_settings?.accessible_to?.includes('enterprise')}
                                        onChange={(e) => {
                                            const roles = profile.visibility_settings?.accessible_to || [];
                                            const newRoles = e.target.checked ? [...roles, 'enterprise'] : roles.filter((r: string) => r !== 'enterprise');
                                            handleVisibilityUpdate({ ...profile.visibility_settings, accessible_to: newRoles });
                                        }}
                                    />
                                }
                                label="Permitir que las empresas vean mis ajustes de accesibilidad antes de la entrevista"
                            />
                        </Stack>
                    </CardContent>
                </Card>

                {/* 2. Preferencias Sensoriales */}
                <Paper sx={{ p: 5, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 4, color: '#0F5C2E' }}>
                        Mi Pasaporte Sensorial
                    </Typography>

                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VolumeUp fontSize="small" color="primary" /> Ambiente Sonoro
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Tolerancia maxima al ruido ambiental</Typography>
                                <Slider
                                    defaultValue={profile.preferences?.noise_tolerance || 3}
                                    min={1} max={5} marks
                                    step={1}
                                    onChangeCommitted={(_, v) => handleUpdate({ preferences: { ...profile.preferences, noise_tolerance: v } })}
                                    sx={{ mt: 2, color: '#38A169' }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LightMode fontSize="small" color="warning" /> Iluminación
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={profile.preferences?.prefers_natural_light}
                                            onChange={(e) => handleUpdate({ preferences: { ...profile.preferences, prefers_natural_light: e.target.checked } })}
                                        />
                                    }
                                    label="Prefiero luz natural predominante"
                                />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Psychology fontSize="small" sx={{ color: '#D69E2E' }} /> Estilo de Trabajo
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                    {['Asíncrono', 'Pocas reuniones', 'Remoto 100%', 'Quiet Room'].map(tag => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onClick={() => {
                                                const current = profile.neurodivergent_traits || [];
                                                const next = current.includes(tag) ? current.filter((t: string) => t !== tag) : [...current, tag];
                                                handleUpdate({ neurodivergent_traits: next });
                                            }}
                                            color={profile.neurodivergent_traits?.includes(tag) ? "primary" : "default"}
                                            variant={profile.neurodivergent_traits?.includes(tag) ? "filled" : "outlined"}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant="text"
                            startIcon={<Lock fontSize="small" />}
                            sx={{ color: 'text.disabled', textTransform: 'none' }}
                        >
                            Tus datos están protegidos por encriptación de extremo a extremo
                        </Button>
                    </Box>
                </Paper>

                {/* 3. Notificaciones */}
                <Card sx={{ borderRadius: 6, border: '1px dashed #CBD5E1', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <NotificationsActive sx={{ color: '#E53E3E' }} />
                            <Typography variant="h6" fontWeight="bold">Centro de Bienestar Digital</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Evita la fatiga digital configurando cómo y cuándo quieres recibir avisos.
                        </Typography>

                        <Grid container spacing={2}>
                            {['Email semanal', 'Alertas Push', 'Solo en plataforma'].map(opt => (
                                <Grid size={{ xs: 12, sm: 4 }} key={opt}>
                                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                                        <Typography variant="caption" fontWeight="bold">{opt}</Typography>
                                        <Switch size="small" defaultChecked />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>

                {/* 4. Atracción Rural & Mudanza */}
                <Card sx={{ borderRadius: 6, border: '1px solid #374BA6', boxShadow: 'none', bgcolor: '#EBF8FF' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Home sx={{ color: '#2B6CB0' }} />
                            <Typography variant="h6" fontWeight="bold">Compromiso de Mudanza</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            ¿Estás listo para dar el salto? Al activar este check, los Ayuntamientos de tus pueblos favoritos recibirán una notificación y podrán contactarte para ofrecerte soporte personalizado en tu proceso de reasentamiento.
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={profile.relocation_commitment || false}
                                    onChange={(e) => handleUpdate({ relocation_commitment: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" fontWeight="bold">
                                    Me comprometo a explorar seriamente mi mudanza a un entorno rural
                                </Typography>
                            }
                        />
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
};

export default SensoryPassport;
