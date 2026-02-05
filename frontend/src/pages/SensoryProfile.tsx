import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

interface SensoryPreferences {
    light_sensitivity: string; // "low", "medium", "high"
    sound_sensitivity: string;
    social_interaction: string; // "async", "minimal", "collaborative"
    break_frequency: number; // minutes
}

const SensoryProfile: React.FC = () => {
    const { token } = useAuth();
    const [preferences, setPreferences] = useState<SensoryPreferences>({
        light_sensitivity: 'medium',
        sound_sensitivity: 'medium',
        social_interaction: 'minimal',
        break_frequency: 60
    });
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetchProfile();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/user/profile/accessibility');
            if (res.data.sensory_needs) {
                // Merge default with fetched
                setPreferences({
                    ...preferences,
                    ...res.data.sensory_needs
                });
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await axios.put('/user/profile/accessibility', {
                sensory_needs: preferences
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Failed to save", err);
        }
    };

    if (loading) return <div className="p-8">Cargando perfil...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">Perfil Sensorial y Accesibilidad</h1>
            <p className="text-gray-600 mb-8">Personaliza tus necesidades de entorno laboral para obtener mejores compatibilidades.</p>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Visual Environment */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-accent">
                    <h3 className="text-xl font-bold mb-4">Entorno Visual (Luz)</h3>
                    <div className="space-y-4">
                        {['low', 'medium', 'high'].map((level) => (
                            <label key={level} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="light"
                                    checked={preferences.light_sensitivity === level}
                                    onChange={() => setPreferences({ ...preferences, light_sensitivity: level })}
                                    className="form-radio text-primary h-5 w-5"
                                />
                                <span className="capitalize text-gray-700">{level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'} sensibilidad</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Auditory Environment */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-accent">
                    <h3 className="text-xl font-bold mb-4">Entorno Auditivo (Sonido)</h3>
                    <div className="space-y-4">
                        {['low', 'medium', 'high'].map((level) => (
                            <label key={level} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sound"
                                    checked={preferences.sound_sensitivity === level}
                                    onChange={() => setPreferences({ ...preferences, sound_sensitivity: level })}
                                    className="form-radio text-primary h-5 w-5"
                                />
                                <span className="capitalize text-gray-700">{level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'} sensibilidad</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Social Interaction */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary">
                    <h3 className="text-xl font-bold mb-4">Estilo de Interacción Social</h3>
                    <select
                        value={preferences.social_interaction}
                        onChange={(e) => setPreferences({ ...preferences, social_interaction: e.target.value })}
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="async">Asíncrono primero (Escrito)</option>
                        <option value="minimal">Reuniones mínimas programadas</option>
                        <option value="collaborative">Colaboración abierta</option>
                    </select>
                </div>

                {/* Breaks */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary">
                    <h3 className="text-xl font-bold mb-4">Frecuencia de Descansos</h3>
                    <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        value={preferences.break_frequency}
                        onChange={(e) => setPreferences({ ...preferences, break_frequency: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="mt-2 text-center text-primary font-bold">
                        Cada {preferences.break_frequency} minutos
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all"
                >
                    {saved ? '¡Guardado!' : 'Guardar Preferencias'}
                </button>
            </div>
        </div>
    );
};

export default SensoryProfile;
