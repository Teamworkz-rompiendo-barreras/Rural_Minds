import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import {
    Box, Paper, Typography, Button, Stack, Chip,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { CheckCircle, QuestionAnswer } from '@mui/icons-material';

const CertValidationTasks: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [selectedTask, setSelectedTask] = useState<any>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get('/api/certification/seal/tasks');
            // Filter only those ready for validation or verified recently
            setTasks(res.data.filter((t: any) => t.status === 'ready_for_validation' || t.status === 'pending'));
        } catch (error) {
            console.error("Error fetching validation tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (taskId: string, status: string) => {
        try {
            await axios.post(`/api/certification/seal/tasks/${taskId}/validate`, {
                status: status,
                talent_feedback: feedback
            });
            setSelectedTask(null);
            setFeedback('');
            fetchTasks();
        } catch (error) {
            alert("Error al validar la tarea.");
        }
    };

    if (loading) return null;
    if (tasks.length === 0) return null;

    return (
        <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>✨</span> Validación de tu Entorno de Trabajo
            </Typography>
            <Stack spacing={2}>
                {tasks.map((task) => (
                    <Paper key={task.id} sx={{ p: 3, borderRadius: 3, border: '1px solid #E0E0E0' }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {task.task_description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tu empresa ha marcado esta adecuación como {task.status === 'ready_for_validation' ? 'REALIZADA' : 'EN PROCESO'}.
                                </Typography>
                                {task.evidence_url && (
                                    <Button
                                        size="small"
                                        href={task.evidence_url}
                                        target="_blank"
                                        startIcon={<QuestionAnswer />}
                                        sx={{ mt: 1, textTransform: 'none' }}
                                    >
                                        Ver Evidencia/Foto
                                    </Button>
                                )}
                            </Box>
                            <Box>
                                {task.status === 'ready_for_validation' ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => setSelectedTask(task)}
                                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                                    >
                                        Revisar y Validar
                                    </Button>
                                ) : (
                                    <Chip label="Pendiente de empresa" size="small" variant="outlined" />
                                )}
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            {/* Validation Dialog */}
            <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Validar Adecuación</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        ¿Confirmas que la mejora de <strong>{selectedTask?.task_description}</strong> es adecuada para tus necesidades?
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Comentarios opcionales (feedback)"
                        variant="outlined"
                        value={feedback}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeedback(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => handleValidate(selectedTask.id, 'rejected')} color="error">
                        No es adecuado
                    </Button>
                    <Button
                        onClick={() => handleValidate(selectedTask.id, 'verified')}
                        color="primary"
                        variant="contained"
                        startIcon={<CheckCircle />}
                    >
                        Confirmar y Validar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CertValidationTasks;
