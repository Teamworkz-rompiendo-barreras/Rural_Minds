
import React, { useState } from 'react';
import axios from '../config/api';
import { useNavigate } from 'react-router-dom';

const CreateProject: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        location_type: 'Remoto',
        compensation: 'Completa', // Using compensation field for 'Jornada' for now as mapped in schema
        description: '',
        requirements: [] as string[], // Using requirements field for adjustments
        is_public: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdjustmentChange = (adjustment: string) => {
        setFormData(prev => {
            const exists = prev.requirements.includes(adjustment);
            if (exists) {
                return { ...prev, requirements: prev.requirements.filter(a => a !== adjustment) };
            } else {
                return { ...prev, requirements: [...prev.requirements, adjustment] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('/api/challenges', {
                title: formData.title,
                description: formData.description,
                location_type: formData.location_type,
                compensation: formData.compensation,
                requirements: formData.requirements,
                is_public: formData.is_public
            });
            navigate('/enterprise-dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Error al crear el proyecto. Verifica tu sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-p2 mb-2">Crear Proyecto / Vacante</h1>
                <p className="text-n900">Define una nueva oportunidad inclusiva para el talento rural.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">

                {error && <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>}

                <div>
                    <label className="block text-sm font-bold text-n900 mb-2">Título del Proyecto</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:border-p2 focus:ring-1 focus:ring-p2"
                        placeholder="Ej: Desarrollador Backend Junior"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-n900 mb-2">Modalidad</label>
                        <select
                            name="location_type"
                            value={formData.location_type}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded"
                        >
                            <option value="Remoto">Remoto</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Presencial">Presencial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-n900 mb-2">Jornada</label>
                        <select
                            name="compensation"
                            value={formData.compensation}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded"
                        >
                            <option value="Completa">Completa</option>
                            <option value="Parcial">Parcial</option>
                            <option value="Proyecto Puntual">Proyecto Puntual</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-n900 mb-2">Descripción del Puesto</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full p-3 border border-gray-300 rounded"
                        placeholder="Describe las responsabilidades..."
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">💡 Tip: Usa lenguaje claro y evita jergas complejas para mejorar la accesibilidad cognitiva.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-n900 mb-2">Ajustes Pre-validados Ofrecidos</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "Horario Flexible / Asíncrono",
                            "Software de Lectura Compatible",
                            "Entorno Silencioso Garantizado",
                            "Mentoria Dedicada"
                        ].map((adj) => (
                            <label key={adj} className="flex items-center gap-2 p-3 border border-gray-200 rounded hover:bg-p1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requirements.includes(adj)}
                                    onChange={() => handleAdjustmentChange(adj)}
                                    className="w-4 h-4 text-p2"
                                />
                                <span className="text-sm">{adj}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <input
                        type="checkbox"
                        name="is_public"
                        checked={formData.is_public}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                        className="w-4 h-4 text-p2"
                    />
                    <label className="text-sm text-gray-700">Hacer pública esta vacante en el explorador de talento</label>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded">Cancelar</button>
                    <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                        {loading ? 'Publicando...' : 'Publicar Proyecto'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default CreateProject;
