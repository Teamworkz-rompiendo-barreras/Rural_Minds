
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Paper, Button, Stack,
    Radio, RadioGroup, FormControlLabel, CircularProgress, Card, CardContent,
    Alert
} from '@mui/material';
import {
    Lightbulb, VolumeUp, Forum,
    CheckCircle, SupportAgent
} from '@mui/icons-material';
import axios from '../config/api';

const COLOR_P2 = "#374BA6";

const SensoryVerificationSheet: React.FC = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [envLighting, setEnvLighting] = useState('');
    const [envAcoustics, setEnvAcoustics] = useState('');
    const [dynInstructions, setDynInstructions] = useState('');
    const [dynSocial, setDynSocial] = useState('');
    const [adjustments, setAdjustments] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId]);

    const fetchData = async () => {
        try {
            const [appRes, tasksRes] = await Promise.all([
                axios.get(`/applications/${applicationId}`),
                axios.get(`/api/certification/seal/tasks`)
            ]);
            setApplication(appRes.data);
            // Filter tasks for this application
            setTasks(tasksRes.data.filter((t: any) => t.application_id === applicationId));
        } catch (error) {
            console.error("Error fetching verification data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!envLighting || !envAcoustics || !dynInstructions || !dynSocial) {
            alert("Por favor, completa todas las secciones principales.");
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/certification/verify/submit', {
                application_id: applicationId,
                lighting_feedback: envLighting,
                acoustics_feedback: envAcoustics,
                instructions_feedback: dynInstructions,
                social_feedback: dynSocial,
                adjustments_results: adjustments,
                needs_mediation: false
            });
            setSuccess(true);
        } catch (error) {
            alert("Error al enviar la verificación.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    if (success) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 3 }} />
                <Typography variant="h4" fontWeight="bold" gutterBottom>¡Gracias por tu honestidad!</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Tu feedback nos ayuda a asegurar que Rural Minds sea un espacio de seguridad real para todos.
                </Typography>
                <Button variant="contained" size="large" onClick={() => navigate('/talent-dashboard')} sx={{ bgcolor: COLOR_P2, borderRadius: 3 }}>
                    Volver a mi Panel
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 6, border: '1px solid #E0E0E0' }}>
                <Stack spacing={4}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" color={COLOR_P2} sx={{ mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
                            Queremos saber cómo te va
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Test de Algodón en <strong>{application?.challenge?.tenant?.name}</strong>
                        </Typography>
                    </Box>

                    <Alert severity="info" sx={{ borderRadius: 4 }}>
                        Este espacio es para ti. Tus respuestas nos ayudan a validar si lo prometido por la empresa se está cumpliendo en tu día a día.
                    </Alert>

                    {/* Section 1: Entorno Físico */}
                    <Box>
                        <Typography variant="h5" fontWeight="black" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            1. Tu Entorno Físico 🏢
                        </Typography>

                        <Stack spacing={3}>
                            <Box>
                                <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Lightbulb sx={{ color: COLOR_P2 }} /> ¿Cómo te sientes con la iluminación?
                                </Typography>
                                <RadioGroup value={envLighting} onChange={(e) => setEnvLighting(e.target.value)}>
                                    <BigOption value="perfect" label="Es perfecta, tal como acordamos." icon="✨" />
                                    <BigOption value="too_bright" label="Hay demasiada luz / reflejos." icon="☀️" />
                                    <BigOption value="no_natural" label="Falta luz natural." icon="☁️" />
                                </RadioGroup>
                            </Box>

                            <Box>
                                <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VolumeUp sx={{ color: COLOR_P2 }} /> ¿Qué tal la acústica y el ruido?
                                </Typography>
                                <RadioGroup value={envAcoustics} onChange={(e) => setEnvAcoustics(e.target.value)}>
                                    <BigOption value="adequate" label="El nivel de ruido es el adecuado." icon="✅" />
                                    <BigOption value="noises" label="Hay ruidos imprevistos que me distraen." icon="🔊" />
                                    <BigOption value="needs_panels" label="Necesito mejores protectores o paneles." icon="🎧" />
                                </RadioGroup>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Section 2: Dinámicas */}
                    <Box sx={{ pt: 4, borderTop: '1px solid #EEE' }}>
                        <Typography variant="h5" fontWeight="black" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            2. La Dinámica de Trabajo 🤝
                        </Typography>

                        <Stack spacing={3}>
                            <Box>
                                <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Forum sx={{ color: COLOR_P2 }} /> ¿Se respetan los acuerdos de comunicación?
                                </Typography>
                                <RadioGroup value={dynInstructions} onChange={(e) => setDynInstructions(e.target.value)}>
                                    <BigOption value="clear_written" label="Recibo las tareas por escrito de forma clara." icon="📝" />
                                    <BigOption value="too_verbal" label="Hay demasiada comunicación verbal/improvisada." icon="🗣️" />
                                </RadioGroup>
                            </Box>

                            <Box>
                                <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SupportAgent sx={{ color: COLOR_P2 }} /> ¿Cómo te sientes socialmente?
                                </Typography>
                                <RadioGroup value={dynSocial} onChange={(e) => setDynSocial(e.target.value)}>
                                    <BigOption value="respectful" label="Respetan mi necesidad de concentración." icon="🧘" />
                                    <BigOption value="overstimulated" label="Me siento sobreestimulado socialmente." icon="🌀" />
                                </RadioGroup>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Section 3: Workplace Adjustments Check */}
                    {tasks.length > 0 && (
                        <Box sx={{ pt: 4, borderTop: '1px solid #EEE' }}>
                            <Typography variant="h5" fontWeight="black" sx={{ mb: 3 }}>
                                3. Validación de Mejoras Específicas ✨
                            </Typography>
                            <Typography sx={{ mb: 3, color: 'text.secondary' }}>
                                La empresa dice haber realizado lo siguiente. ¿Es correcto?
                            </Typography>

                            <Stack spacing={3}>
                                {tasks.map((task) => (
                                    <Card key={task.id} variant="outlined" sx={{ borderRadius: 4, bgcolor: '#FAFAFA' }}>
                                        <CardContent>
                                            <Typography fontWeight="bold" sx={{ mb: 2 }}>{task.task_description}</Typography>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                <VerifButton
                                                    active={adjustments[task.id] === 'yes'}
                                                    color="#4CAF50"
                                                    label="SÍ"
                                                    icon="✅"
                                                    onClick={() => setAdjustments({ ...adjustments, [task.id]: 'yes' })}
                                                />
                                                <VerifButton
                                                    active={adjustments[task.id] === 'no'}
                                                    color="#F44336"
                                                    label="NO"
                                                    icon="❌"
                                                    onClick={() => setAdjustments({ ...adjustments, [task.id]: 'no' })}
                                                />
                                                <VerifButton
                                                    active={adjustments[task.id] === 'adjust'}
                                                    color="#FF9800"
                                                    label="AJUSTES"
                                                    icon="🔧"
                                                    onClick={() => setAdjustments({ ...adjustments, [task.id]: 'adjust' })}
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Help Button */}
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Button
                            startIcon={<SupportAgent />}
                            sx={{ color: '#D32F2F', fontWeight: 'black', textTransform: 'none' }}
                            onClick={() => alert("Mediación Teamworkz solicitada. Nos pondremos en contacto contigo.")}
                        >
                            Hablar con mi enlace en Teamworkz
                        </Button>
                    </Box>

                    {/* Submit */}
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={submitting}
                        onClick={handleSubmit}
                        sx={{
                            height: 70,
                            borderRadius: 4,
                            bgcolor: COLOR_P2,
                            fontSize: '1.25rem',
                            fontWeight: 'black',
                            boxShadow: '0 8px 24px rgba(55, 75, 166, 0.3)',
                            '&:hover': { bgcolor: '#2A3A85' }
                        }}
                    >
                        {submitting ? 'Enviando...' : 'Finalizar Verificación'}
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
};

// Helper for large accessible radio options
const BigOption = ({ value, label, icon }: { value: string, label: string, icon: string }) => (
    <Card
        sx={{
            mb: 2,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'transparent',
            bgcolor: '#F8F9FF',
            transition: 'all 0.2s',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#F0F3FF' }
        }}
    >
        <FormControlLabel
            value={value}
            control={<Radio sx={{ ml: 2 }} />}
            label={
                <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2, pr: 2 }}>
                    <span style={{ fontSize: '28px' }}>{icon}</span>
                    <Typography fontWeight="bold" sx={{ color: '#444' }}>{label}</Typography>
                </Stack>
            }
            sx={{ m: 0, width: '100%' }}
        />
    </Card>
);

// Helper for the Yes/No/Adjust buttons
const VerifButton = ({ active, color, label, icon, onClick }: any) => (
    <Button
        variant={active ? 'contained' : 'outlined'}
        onClick={onClick}
        sx={{
            flex: 1,
            height: 56,
            borderRadius: 3,
            fontWeight: 'black',
            fontSize: '1rem',
            bgcolor: active ? color : 'transparent',
            borderColor: color,
            color: active ? '#FFF' : color,
            '&:hover': { bgcolor: active ? color : color + '10', borderColor: color }
        }}
    >
        {icon} {label}
    </Button>
);

export default SensoryVerificationSheet;
