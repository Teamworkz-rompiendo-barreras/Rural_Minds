
import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Grid, Card, CardContent,
    Button, LinearProgress, Stack, Chip, Alert, AlertTitle
} from '@mui/material';
import {
    EmojiEvents, CheckCircle, CloudUpload,
    Lightbulb, VolumeUp, DirectionsBus, Forum, Info
} from '@mui/icons-material';

const COLOR_P1 = "#F2D680";
const COLOR_P2 = "#374BA6";

const CaminoExcelencia: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);
    const [sealStatus, setSealStatus] = useState<any>(null);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth_data') || '{}');
            const token = auth.access_token;

            const [statusRes, tasksRes] = await Promise.all([
                fetch('/api/certification/seal/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/certification/seal/tasks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (statusRes.ok && tasksRes.ok) {
                setSealStatus(await statusRes.json());
                setTasks(await tasksRes.json());
            }
        } catch (error) {
            console.error("Error fetching certification data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadEvidence = async (taskId: string) => {
        setUploading(taskId);
        try {
            const auth = JSON.parse(localStorage.getItem('auth_data') || '{}');
            const token = auth.access_token;

            const response = await fetch(`/api/certification/seal/tasks/${taskId}/evidence?evidence_type=photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchData(); // Refresh
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setUploading(null);
        }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'lighting': return <Lightbulb sx={{ color: COLOR_P2 }} />;
            case 'noise': return <VolumeUp sx={{ color: COLOR_P2 }} />;
            case 'physical': return <DirectionsBus sx={{ color: COLOR_P2 }} />; // Closest to env
            case 'communication': return <Forum sx={{ color: COLOR_P2 }} />;
            default: return <Info sx={{ color: COLOR_P2 }} />;
        }
    };

    if (loading) return <LinearProgress />;

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Stack spacing={4}>
                {/* Header Section */}
                <Box sx={{ textAlign: 'center' }}>
                    <EmojiEvents sx={{ fontSize: 60, color: COLOR_P1, mb: 2 }} />
                    <Typography variant="h3" fontWeight="bold" color={COLOR_P2}>
                        Mi Camino a la Excelencia
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Certificando el bienestar sensorial en tu empresa
                    </Typography>
                </Box>

                {/* Progress Bar */}
                <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#FAFAFA' }}>
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold">Progreso de Certificación</Typography>
                            <Typography variant="h5" fontWeight="bold" color={COLOR_P2}>
                                {sealStatus?.progress_percentage || 0}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={sealStatus?.progress_percentage || 0}
                            sx={{
                                height: 12,
                                borderRadius: 6,
                                bgcolor: '#E0E0E0',
                                '& .MuiLinearProgress-bar': { bgcolor: COLOR_P2 }
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {sealStatus?.completed_tasks} de {sealStatus?.total_tasks} adecuaciones verificadas.
                        </Typography>
                    </Stack>
                </Paper>

                {/* Info Alert */}
                <Alert icon={<CheckCircle fontSize="inherit" />} severity="info" sx={{ borderRadius: 3 }}>
                    <AlertTitle>¿Cómo funciona?</AlertTitle>
                    Subes una prueba de la mejora (foto o factura) y el talento contratado validará si el entorno es el adecuado. Cuando todas estén listas, recibirás el <strong>Sello de Excelencia</strong>.
                </Alert>

                {/* Tasks List */}
                <Typography variant="h5" fontWeight="bold">Adecuaciones Pendientes</Typography>
                <Grid container spacing={3}>
                    {tasks.map((task) => (
                        <Grid size={12} key={task.id}>
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                borderLeft: `6px solid ${task.status === 'verified' ? '#4CAF50' : COLOR_P1}`
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Grid container alignItems="center" spacing={2}>
                                        <Grid>
                                            <Box sx={{ p: 1.5, bgcolor: '#F0F4FF', borderRadius: 3 }}>
                                                {getIcon(task.category)}
                                            </Box>
                                        </Grid>
                                        <Grid size="grow">
                                            <Typography variant="h6" fontWeight="bold">
                                                {task.task_description}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                <Chip
                                                    label={task.category.toUpperCase()}
                                                    size="small"
                                                    sx={{ bgcolor: '#EEEEEE', fontWeight: 'bold' }}
                                                />
                                                <Chip
                                                    label={task.status.replace('_', ' ')}
                                                    size="small"
                                                    color={task.status === 'verified' ? 'success' : 'warning'}
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </Grid>
                                        <Grid>
                                            {task.status === 'pending' && (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<CloudUpload />}
                                                    onClick={() => handleUploadEvidence(task.id)}
                                                    disabled={uploading === task.id}
                                                    sx={{
                                                        bgcolor: COLOR_P2,
                                                        '&:hover': { bgcolor: '#2A3A85' },
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    Subir Evidencia
                                                </Button>
                                            )}
                                            {task.status === 'ready_for_validation' && (
                                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                    Esperando validación del talento... ⏳
                                                </Typography>
                                            )}
                                            {task.status === 'verified' && (
                                                <CheckCircle sx={{ color: '#4CAF50', fontSize: 32 }} />
                                            )}
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {tasks.length === 0 && (
                        <Grid size={12}>
                            <Paper sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
                                <Typography>No hay tareas de excelencia activas por ahora. ¡Haz un match para empezar!</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                {/* Footer/Seal Badge */}
                {sealStatus?.progress_percentage === 100 && (
                    <Paper sx={{ p: 4, textAlign: 'center', border: `2px dashed ${COLOR_P1}`, borderRadius: 4, bgcolor: '#FFFDF0' }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_P2} gutterBottom>
                            ¡Felicidades! 🎉
                        </Typography>
                        <Typography variant="body1">
                            Has completado el camino. Tu empresa ahora cuenta con el <strong>Sello de Excelencia de Rural Minds</strong>.
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <img src="/static/wellness-seal-badge.png" alt="Sello Excelencia" style={{ height: 120 }} />
                        </Box>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
};

export default CaminoExcelencia;
