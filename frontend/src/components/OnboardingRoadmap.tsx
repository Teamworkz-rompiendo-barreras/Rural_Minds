import React, { useState, useEffect } from 'react';
import axios from '../config/api';

interface Task {
    id: string;
    task_text: string;
    is_completed: boolean;
}

interface OnboardingRoadmapProps {
    applicationId: string;
    candidateName: string;
}

const OnboardingRoadmap: React.FC<OnboardingRoadmapProps> = ({ applicationId, candidateName }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchTasks();
    }, [applicationId]);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`/api/applications/${applicationId}/tasks`);
            setTasks(res.data);
        } catch (err) {
            console.error("Error fetching tasks", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (task: Task) => {
        // Optimistic update
        const newStatus = !task.is_completed;
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));

        try {
            await axios.put(`/api/tasks/${task.id}`, { is_completed: newStatus });
            if (newStatus) {
                setMessage("¡Ajuste registrado! Impacto social actualizado.");
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error("Error updating task", err);
            // Revert on error
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: !newStatus } : t));
        }
    };

    if (loading) return <div className="p-4 bg-gray-50 rounded-xl animate-pulse h-40"></div>;
    if (tasks.length === 0) return null;

    const completedCount = tasks.filter(t => t.is_completed).length;
    const progress = (completedCount / tasks.length) * 100;

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="bg-n100 p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-heading font-bold text-xl text-n900 mb-1">Hoja de Ruta de Adecuación</h3>
                        <p className="text-gray-600 text-sm">
                            Prepara la llegada de <span className="font-bold text-primary">{candidateName}</span>.
                        </p>
                    </div>
                    {message && (
                        <div className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full animate-fade-in-down">
                            {message}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                        <span>Progreso de Preparación</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-accent h-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                    {tasks.map(task => (
                        <label
                            key={task.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group ${task.is_completed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-200 hover:border-accent'
                                }`}
                        >
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={task.is_completed}
                                    onChange={() => toggleTask(task)}
                                    className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-gray-300 transition-all checked:border-primary checked:bg-primary focus:ring-4 focus:ring-focus-ring"
                                />
                                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 font-bold text-sm">
                                    ✓
                                </span>
                            </div>
                            <span className={`font-medium ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {task.task_text}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-gray-50 p-4 flex gap-3 justify-end">
                <button className="text-primary font-bold text-sm hover:underline">
                    📖 Abrir Guía de Implementación
                </button>
            </div>
        </div>
    );
};

export default OnboardingRoadmap;
