import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Paper, Stack,
    LinearProgress, Button, IconButton, Fade,
    Card, CardActionArea, CardContent
} from '@mui/material';
import {
    ArrowBack, AutoAwesome, CheckCircle,
    VolumeOff, Park, Coffee,
    Cloud, WbSunny, VisibilityOff,
    Smartphone, Phone, Event,
    Home, Diversity3, Forum
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../config/api';

interface Option {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    altText: string;
}

interface Step {
    title: string;
    question: string;
    options: Option[];
}

const steps: Step[] = [
    {
        title: "El Paisaje Sonoro 🔊",
        question: "Imagina que estás concentrado/a en una tarea importante. ¿Qué escuchas de fondo?",
        options: [
            { id: 1, title: "Silencio Absoluto", description: "Me distraigo con cualquier sonido ambiental.", icon: <VolumeOff sx={{ fontSize: 40 }} />, altText: "Icono de volumen tachado representando silencio absoluto" },
            { id: 2, title: "Naturaleza", description: "El sonido del viento o pájaros me ayuda a enfocarme.", icon: <Park sx={{ fontSize: 40 }} />, altText: "Icono de árboles representando sonidos de la naturaleza" },
            { id: 3, title: "Bruma Urbana", description: "Prefiero un ligero murmullo de fondo (cafetería, oficina).", icon: <Coffee sx={{ fontSize: 40 }} />, altText: "Icono de taza de café representando murmullo urbano" }
        ]
    },
    {
        title: "La Calidad de la Luz 💡",
        question: "¿Cómo te llevas con la iluminación de tu espacio de trabajo?",
        options: [
            { id: 1, title: "Luz Suave", description: "Prefiero luz natural indirecta o lámparas cálidas.", icon: <Cloud sx={{ fontSize: 40 }} />, altText: "Icono de nube representando luz suave e indirecta" },
            { id: 2, title: "Brillo Total", description: "Necesito mucha luz para sentirme activo/a.", icon: <WbSunny sx={{ fontSize: 40 }} />, altText: "Icono de sol brillante representando iluminación intensa" },
            { id: 3, title: "Baja Estimulación", description: "Soy sensible a los fluorescentes y reflejos.", icon: <VisibilityOff sx={{ fontSize: 40 }} />, altText: "Icono de ojo tachado representando baja estimulación visual" }
        ]
    },
    {
        title: "El Ritmo de Comunicación 📧",
        question: "¿Cómo prefieres que el equipo se coordine contigo?",
        options: [
            { id: 1, title: "Escrito Primero", description: "Emails o chats para procesar la información a mi ritmo.", icon: <Smartphone sx={{ fontSize: 40 }} />, altText: "Icono de smartphone representando comunicación escrita" },
            { id: 2, title: "Directo", description: "Prefiero llamadas rápidas o hablar cara a cara.", icon: <Phone sx={{ fontSize: 40 }} />, altText: "Icono de teléfono representando comunicación directa" },
            { id: 3, title: "Planificado", description: "Reuniones agendadas con antelación, sin sorpresas.", icon: <Event sx={{ fontSize: 40 }} />, altText: "Icono de calendario representando comunicación planificada" }
        ]
    },
    {
        title: "Interacción Social 👥",
        question: "En tu jornada ideal, ¿cuánta interacción social hay?",
        options: [
            { id: 1, title: "Refugio", description: "Trabajo mejor solo/a la mayor parte del tiempo.", icon: <Home sx={{ fontSize: 40 }} />, altText: "Icono de casa representando trabajo individual en soledad" },
            { id: 2, title: "Colaboración", description: "Me gusta tener momentos de equipo y momentos de soledad.", icon: <Diversity3 sx={{ fontSize: 40 }} />, altText: "Icono de grupo pequeño representando colaboración equilibrada" },
            { id: 3, title: "Comunidad", description: "Necesito estar rodeado/a de gente y compartir ideas.", icon: <Forum sx={{ fontSize: 40 }} />, altText: "Icono de burbujas de chat representando alta interacción social" }
        ]
    }
];

const SensoryOnboardingWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(-1); // -1 for welcome
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load progress from localStorage
    useEffect(() => {
        const savedProgress = localStorage.getItem('sensory_onboarding_progress');
        if (savedProgress) {
            const { step, answers } = JSON.parse(savedProgress);
            setCurrentStep(step);
            setAnswers(answers);
        }
    }, []);

    // Save progress to localStorage
    useEffect(() => {
        if (!isFinished) {
            localStorage.setItem('sensory_onboarding_progress', JSON.stringify({
                step: currentStep,
                answers
            }));
        }
    }, [currentStep, answers, isFinished]);

    const handleOptionSelect = (optionId: number) => {
        const stepKeys = ['sound', 'light', 'communication', 'social'];
        const newAnswers = { ...answers, [stepKeys[currentStep]]: optionId };
        setAnswers(newAnswers);

        if (currentStep < steps.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        } else {
            handleFinish(newAnswers);
        }
    };

    const handleFinish = async (finalAnswers: Record<string, number>) => {
        setLoading(true);
        try {
            await axios.put('/user/profile/accessibility', {
                sensory_needs: finalAnswers
            });
            setIsFinished(true);
            localStorage.removeItem('sensory_onboarding_progress');
        } catch (err) {
            console.error("Error saving sensory preferences", err);
        } finally {
            setLoading(false);
        }
    };

    if (isFinished) {
        return (
            <Box sx={{
                minHeight: '100vh',
                bgcolor: '#F5F7FA', // N100-ish
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3
            }}>
                <Fade in timeout={800}>
                    <Paper sx={{
                        p: { xs: 4, md: 8 },
                        borderRadius: 8,
                        maxWidth: 600,
                        textAlign: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                        border: '1px solid #E2E8F0'
                    }}>
                        <CheckCircle sx={{ fontSize: 80, color: '#0F5C2E', mb: 4 }} />
                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, fontFamily: '"Atkinson Hyperlegible", sans-serif' }}>
                            ¡Hábitat configurado! ✨
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontSize: '1.1rem', fontFamily: '"Atkinson Hyperlegible", sans-serif' }}>
                            Ahora nuestro algoritmo está buscando pueblos y empresas que hablen tu mismo idioma sensorial.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            disabled={loading}
                            onClick={() => navigate('/talent-dashboard')}
                            sx={{
                                bgcolor: '#0F5C2E',
                                px: 6,
                                py: 2,
                                borderRadius: 4,
                                fontFamily: '"Atkinson Hyperlegible", sans-serif',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#0a4020' }
                            }}
                        >
                            {loading ? 'Cargando...' : 'Ir a mi Panel'}
                        </Button>
                    </Paper>
                </Fade>
            </Box>
        );
    }

    const step = steps[currentStep];
    const progress = currentStep === -1 ? 0 : ((currentStep + 1) / steps.length) * 100;

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#F5F7FA', // N100 for comfort
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Atkinson Hyperlegible", sans-serif'
        }}>
            {/* Progress Bar */}
            <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #E2E8F0' }}>
                <Container maxWidth="md">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton
                            onClick={() => currentStep > 0 && setCurrentStep(prev => prev - 1)}
                            disabled={currentStep <= 0} // Disable if on welcome screen or first step
                        >
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                PASO {currentStep === -1 ? 0 : currentStep + 1} DE {steps.length}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: '#E2E8F0',
                                    '& .MuiLinearProgress-bar': { bgcolor: '#374BA6', borderRadius: 4 }
                                }}
                            />
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 8 }}>
                <Box sx={{ width: '100%' }}>
                    {currentStep === -1 ? (
                        <Fade in timeout={800}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{
                                    width: 120, height: 120, mx: 'auto', mb: 4,
                                    bgcolor: '#374BA6', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <AutoAwesome sx={{ fontSize: 60 }} />
                                </Box>
                                <Typography variant="h3" fontWeight="900" sx={{ mb: 2, color: '#1A202C' }}>
                                    Diseñando tu entorno ideal
                                </Typography>
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 6, maxWidth: 500, mx: 'auto' }}>
                                    Tu perfil sensorial es la brújula que nos ayudará a encontrar el pueblo y el equipo perfecto para ti.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => setCurrentStep(0)}
                                    sx={{
                                        bgcolor: '#374BA6', px: 6, py: 2, borderRadius: 4,
                                        fontWeight: 'bold', '&:hover': { bgcolor: '#2A3A8A' }
                                    }}
                                >
                                    Comenzar viaje →
                                </Button>
                            </Box>
                        </Fade>
                    ) : (
                        <Fade in key={currentStep} timeout={500}>
                            <Box>
                                <Typography
                                    variant="overline"
                                    fontWeight="bold"
                                    sx={{ color: '#0F5C2E', letterSpacing: 1.5, mb: 1, display: 'block' }}
                                >
                                    {step.title}
                                </Typography>
                                <Typography
                                    variant="h4"
                                    fontWeight="900"
                                    sx={{
                                        mb: 6,
                                        color: '#1A202C',
                                        fontSize: { xs: '22px', md: '32px' }, // Atkinson 22-32
                                        lineHeight: 1.2
                                    }}
                                >
                                    {step.question}
                                </Typography>

                                <Stack spacing={3}> {/* 24px vertical spacing */}
                                    {step.options.map((option) => (
                                        <Card
                                            key={option.id}
                                            sx={{
                                                borderRadius: 6,
                                                border: '2px solid transparent',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: '#374BA6',
                                                    bgcolor: '#F0F4FF',
                                                    transform: 'translateY(-2px)'
                                                },
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            <CardActionArea
                                                onClick={() => handleOptionSelect(option.id)}
                                                sx={{ p: 1 }}
                                                aria-label={option.altText}
                                            >
                                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                                                    <Box sx={{
                                                        p: 2,
                                                        borderRadius: 4,
                                                        bgcolor: '#F1F5F9',
                                                        color: '#374BA6',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {option.icon}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>
                                                            {option.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {option.description}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    ))}
                                </Stack>
                            </Box>
                        </Fade>
                    )}
                </Box>
            </Container>

            {/* Footer Wit */}
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <AutoAwesome fontSize="small" /> Diseñando tu entorno ideal
                </Typography>
            </Box>
        </Box>
    );
};

export default SensoryOnboardingWizard;
