import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

const MunicipalityOnboarding: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        slogan: '',
        description: '',
        internet_speed: 'Fibra 1Gb',
        connectivity_info: '',
        climate_co2: '',
        services: {
            health: '',
            education: '',
            coworking: '',
            commerce: ''
        },
        landing_guide_url: '',
        adl_contact_email: ''
    });

    useEffect(() => {
        // Fetch existing data if editing
        // For now, we assume fresh start or empty state
        if (user?.email) {
            setFormData(prev => ({ ...prev, adl_contact_email: user.email }));
        }
    }, [user]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleServiceChange = (service: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            services: { ...prev.services, [service]: value }
        }));
    };

    const saveProgress = async () => {
        setSaving(true);
        try {
            // We need a specific endpoint to update "My Municipality Details"
            // For now, let's assume we create a generic PUT /municipalities/me endpoint
            // OR reuse the profile endpoint if we map it correctly.
            // Let's stub the API call logic here.

            // Note: We haven't implemented PUT /municipalities/me yet.
            // I will implement it in the backend shortly.
            await axios.put('/municipalities/me/details', formData);

        } catch (err) {
            console.error("Error saving progress", err);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        await saveProgress();
        setStep(s => s + 1);
    };

    const handleFinish = async () => {
        setSaving(true);
        // "Generando ecosistema..." simulation or just visual feedack

        try {
            await axios.put('/municipalities/me/details', {
                ...formData,
                status: 'active'
            });

            // Artificial delay for "Generating Ecosystem" experience if faster than 1s
            setTimeout(() => {
                navigate('/municipality-success');
            }, 1500);

        } catch (err) {
            console.error("Error finalizing", err);
            setSaving(false);
        }
    };

    // Loading Screen Overlay
    if (saving && step === 3) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-n100 font-body">
                <div className="text-6xl mb-6 animate-bounce">🌍</div>
                <h2 className="text-2xl font-heading font-bold text-n900 mb-2">Generando tu ecosistema municipal...</h2>
                <p className="text-n600">Conectando con el talento y las empresas de Rural Minds.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-n100 py-12 px-4 sm:px-6 lg:px-8 font-body">
            <div className="max-w-3xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold text-n500 uppercase tracking-wider mb-2">
                        <span className={step >= 1 ? 'text-p2' : ''}>1. Identidad</span>
                        <span className={step >= 2 ? 'text-p2' : ''}>2. Infraestructura</span>
                        <span className={step >= 3 ? 'text-p2' : ''}>3. Recursos</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-p2 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border-t-4 border-p2 overflow-hidden">
                    <div className="p-8">
                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-heading font-bold text-n900 mb-6">Identidad Local</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="slogan" className="block font-bold text-n700 mb-2">Slogan Municipal</label>
                                        <input
                                            id="slogan"
                                            type="text"
                                            className="input-field w-full"
                                            placeholder="Ej: Tradición y Futuro"
                                            value={formData.slogan}
                                            onChange={e => handleChange('slogan', e.target.value)}
                                        />
                                        <p className="text-xs text-n500 mt-1">Frase corta que defina el espíritu de tu pueblo.</p>
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block font-bold text-n700 mb-2">Descripción General</label>
                                        <textarea
                                            id="description"
                                            className="input-field w-full h-32"
                                            placeholder="Describe tu municipio en un párrafo..."
                                            value={formData.description}
                                            onChange={e => handleChange('description', e.target.value)}
                                        />
                                    </div>
                                    {/* Image Upload would go here */}
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                        ℹ️ Para esta versión, las imágenes se gestionarán desde el soporte técnico.
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-heading font-bold text-n900 mb-6">Conectividad y Servicios</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="internet_speed" className="block font-bold text-n700 mb-2">Velocidad de Internet</label>
                                        <select
                                            id="internet_speed"
                                            className="input-field w-full"
                                            value={formData.internet_speed}
                                            onChange={e => handleChange('internet_speed', e.target.value)}
                                        >
                                            <option value="Fibra 1Gb">Fibra Óptica 1Gb (Simétrica)</option>
                                            <option value="Fibra 600Mb">Fibra Óptica 600Mb</option>
                                            <option value="Fibra 300Mb">Fibra Óptica 300Mb</option>
                                            <option value="4G/5G">Cobertura 4G/5G Estable</option>
                                            <option value="Satelite">Internet por Satélite (Starlink/Otros)</option>
                                            <option value="ADSL">ADSL Convencional</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-n700 mb-2">Transporte / Conectividad</label>
                                        <input
                                            type="text"
                                            className="input-field w-full"
                                            placeholder="Ej: Estación de tren a 10 min, Bus cada hora..."
                                            value={formData.connectivity_info}
                                            onChange={e => handleChange('connectivity_info', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-n700 mb-2">Clima Sensorial / Entorno</label>
                                        <input
                                            type="text"
                                            className="input-field w-full"
                                            placeholder="Ej: Baja densidad sonora, mucha luz natural..."
                                            value={formData.climate_co2}
                                            onChange={e => handleChange('climate_co2', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <label className="block font-bold text-sm mb-1">🏥 Salud</label>
                                            <input type="text" className="input-field w-full text-sm" placeholder="Ej: Consultorio local diario" value={formData.services.health} onChange={e => handleServiceChange('health', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-sm mb-1">🏫 Educación</label>
                                            <input type="text" className="input-field w-full text-sm" placeholder="Ej: CRA con comedor" value={formData.services.education} onChange={e => handleServiceChange('education', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-sm mb-1">🏢 Coworking</label>
                                            <input type="text" className="input-field w-full text-sm" placeholder="Ej: Sala municipal con fibra" value={formData.services.coworking} onChange={e => handleServiceChange('coworking', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-sm mb-1">🛒 Comercio</label>
                                            <input type="text" className="input-field w-full text-sm" placeholder="Ej: Tienda multiservicio abierta" value={formData.services.commerce} onChange={e => handleServiceChange('commerce', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-heading font-bold text-n900 mb-6">Guía de Bienvenida</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="landing_guide_url" className="block font-bold text-n700 mb-2">URL de la Guía de Aterrizaje (PDF)</label>
                                        <input
                                            id="landing_guide_url"
                                            type="url"
                                            className="input-field w-full"
                                            placeholder="https://..."
                                            value={formData.landing_guide_url}
                                            onChange={e => handleChange('landing_guide_url', e.target.value)}
                                        />
                                        <p className="text-xs text-n500 mt-1">Enlace directo a Google Drive, Dropbox o web municipal.</p>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-n700 mb-2">Email de Contacto (Agente Desarrollo)</label>
                                        <input
                                            type="email"
                                            className="input-field w-full"
                                            placeholder="adl@municipio.es"
                                            value={formData.adl_contact_email}
                                            onChange={e => handleChange('adl_contact_email', e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-green-50 p-6 rounded-lg text-center mt-8">
                                        <span className="text-4xl mb-4 block">🎉</span>
                                        <h3 className="font-bold text-green-800 text-lg">¡Casi listo!</h3>
                                        <p className="text-green-700 text-sm">
                                            Al finalizar, tu ficha será visible para miles de profesionales.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-8 py-5 flex justify-between items-center">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="text-n600 hover:text-n900 font-bold px-4 py-2"
                            >
                                ← Anterior
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? 'Guardando...' : 'Siguiente →'}
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? 'Guardando...' : 'Finalizar y Publicar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MunicipalityOnboarding;
