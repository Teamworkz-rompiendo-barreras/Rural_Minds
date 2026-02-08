
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, Stack, Button,
    Collapse, IconButton
} from '@mui/material';
import {
    Error as ErrorIcon,
    KeyboardArrowDown, KeyboardArrowUp,
    Phone, Chat, PauseCircle, CheckCircle
} from '@mui/icons-material';
import axios from '../config/api';

const COLOR_CRITICAL = "#E53E3E";
const COLOR_MODERATE = "#DD6B20";

const IncidentAlerts: React.FC = () => {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        try {
            const res = await axios.get('/certification/verify/incidents');
            // Filter to show only open ones
            const data = Array.isArray(res.data) ? res.data : [];
            setIncidents(data.filter((i: any) => i.status !== 'resolved'));
        } catch (error) {
            console.error("Error fetching incidents", error);
        }
    };

    if (incidents.length === 0) return null;

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon color="error" /> Incidencias Críticas de Certificación
            </Typography>
            <Stack spacing={2}>
                {incidents.map((incident) => (
                    <IncidentCard
                        key={incident.id}
                        incident={incident}
                        isExpanded={expanded === incident.id}
                        onToggle={() => setExpanded(expanded === incident.id ? null : incident.id)}
                    />
                ))}
            </Stack>
        </Box>
    );
};

const IncidentCard = ({ incident, isExpanded, onToggle }: any) => {
    const isCritical = incident.priority === 'critical';
    const accentColor = isCritical ? COLOR_CRITICAL : COLOR_MODERATE;

    return (
        <Card sx={{
            borderLeft: `6px solid ${accentColor}`,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                            label={isCritical ? "CRÍTICO 🔴" : "MODERADO 🟠"}
                            sx={{
                                bgcolor: isCritical ? '#FFF5F5' : '#FFFAF0',
                                color: accentColor,
                                fontWeight: 'bold',
                                border: `1px solid ${accentColor}`
                            }}
                        />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Fallo en {incident.category}: {incident.organization_id.substring(0, 8)}...
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Detectado hace {Math.round((new Date().getTime() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60 * 24))} días
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onToggle}>
                        {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </Stack>

                <Collapse in={isExpanded}>
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #EEE' }}>
                        <Stack spacing={3}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                        Versión de la Empresa 🏢
                                    </Typography>
                                    <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2, mt: 1 }}>
                                        {incident.enterprise_version || "Adecuación instalada según checklist técnico."}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                        Versión del Talento 👤
                                    </Typography>
                                    <Typography variant="body2" sx={{ p: 1.5, bgcolor: isCritical ? '#FFF5F5' : '#FFFAF0', borderRadius: 2, mt: 1 }}>
                                        {incident.talent_version || "El talento reporta que la medida es insuficiente."}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Phone />}
                                    sx={{ color: '#444', borderColor: '#CCC' }}
                                    onClick={() => alert("Llamada programada con la empresa.")}
                                >
                                    Contactar Empresa
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Chat />}
                                    sx={{ color: '#444', borderColor: '#CCC' }}
                                    onClick={() => alert("Abriendo chat tripartito de mediación...")}
                                >
                                    Abrir Chat
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PauseCircle />}
                                    sx={{ bgcolor: '#444', '&:hover': { bgcolor: '#222' } }}
                                    onClick={() => alert("Sello de Excelencia pausado temporalmente.")}
                                >
                                    Pausar Sello
                                </Button>
                                <Box sx={{ flexGrow: 1 }} />
                                <Button
                                    variant="contained"
                                    startIcon={<CheckCircle />}
                                    sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
                                    onClick={() => alert("Incidencia resuelta. Sello reactivado.")}
                                >
                                    Resolver
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default IncidentAlerts;
