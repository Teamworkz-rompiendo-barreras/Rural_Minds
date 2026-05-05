import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector';

// Types
interface AccessibilityPrefs {
    high_contrast: boolean;
    reduced_motion: boolean;
}

interface SensoryPrefs {
    light: 'low' | 'medium' | 'high';
    sound: 'low' | 'medium' | 'high';
    communication: 'async' | 'minimal' | 'collaborative';
}

interface ProfileData {
    bio: string;
    skills: string[];
    residence_location_id?: string;
    residence_international?: string;
    is_international?: boolean;
    is_willing_to_move: boolean;
    target_locations: string[]; // List of location IDs
    preferences: {
        needs_housing?: boolean;
        [key: string]: any;
    };
}

const TalentProfileWizard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Wizard State
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Toast State
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    // Data States
    const [accessibilityPrefs, setAccessibilityPrefs] = useState<AccessibilityPrefs>({
        high_contrast: false,
        reduced_motion: false
    });
    const [sensoryPrefs, setSensoryPrefs] = useState<SensoryPrefs>({
        light: 'medium',
        sound: 'medium',
        communication: 'minimal'
    });
    const [profileData, setProfileData] = useState<ProfileData>({
        bio: '',
        skills: [],
        residence_location_id: '',
        residence_international: '',
        is_international: false,
        is_willing_to_move: false,
        target_locations: [],
        preferences: {
            needs_housing: false
        }
    });
    const [skillInput, setSkillInput] = useState('');
    const [lastLoggedLocation, setLastLoggedLocation] = useState<string | null>(null);

    const logInteraction = async (locationId: string, type: 'favorite' | 'commitment') => {
        if (!locationId || locationId === lastLoggedLocation) return;
        try {
            await axios.post('/stats/interaction', { location_id: locationId, type });
            setLastLoggedLocation(locationId);
        } catch (err) {
            console.error("Error logging interaction", err);
        }
    };

    // Generated Checklist
    const [checklist, setChecklist] = useState<string[]>([]);

    useEffect(() => {
        if (user && user.role !== 'talent') {
            navigate('/');
        }
    }, [user, navigate]);

    // FETCH EXISTING DATA FOR EDITING
    useEffect(() => {
        const fetchExistingData = async () => {
            try {
                const accessRes = await axios.get('/user/profile/accessibility');
                if (accessRes.data) {
                    setAccessibilityPrefs({
                        high_contrast: accessRes.data.high_contrast_enabled || false,
                        reduced_motion: accessRes.data.prefers_reduced_motion || false
                    });
                    if (accessRes.data.sensory_needs) {
                        setSensoryPrefs(accessRes.data.sensory_needs);
                    }
                }

                const profileRes = await axios.get('/api/profiles/me');
                if (profileRes.data) {
                    setProfileData({
                        bio: profileRes.data.bio || '',
                        skills: profileRes.data.skills || [],
                        residence_location_id: profileRes.data.residence_location_id || '',
                        residence_international: profileRes.data.residence_international || '',
                        is_international: !!profileRes.data.residence_international,
                        is_willing_to_move: profileRes.data.is_willing_to_move || false,
                        target_locations: profileRes.data.target_locations || [],
                        preferences: profileRes.data.preferences || { needs_housing: false }
                    });
                }
            } catch (err) {
                console.log("No existing profile or error fetching", err);
            }
        };

        if (user) {
            fetchExistingData();
        }
    }, [user]);

    useEffect(() => {
        if (accessibilityPrefs.high_contrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        if (accessibilityPrefs.reduced_motion) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }, [accessibilityPrefs]);

    const handleNext = () => {
        if (step === 3 && profileData.is_willing_to_move) {
            const validTargets = profileData.target_locations.filter(id => id && id.trim() !== "");
            if (validTargets.length === 0) {
                setError("Por favor, selecciona al menos una comunidad o municipio de destino si estás abierto a mudarte.");
                return;
            }
        }

        if (step === 3) {
            generateChecklist();
        }
        setError(null);
        setStep(prev => prev + 1);
    };

    const handleSkip = () => {
        setError(null);
        setStep(prev => prev + 1);
    };

    const generateChecklist = () => {
        const items: string[] = [];
        if (sensoryPrefs.light === 'high') items.push('☀️ Solicitar ubicación alejada de ventanas o iluminación directa');
        if (sensoryPrefs.light === 'low') items.push('💡 Solicitar lámpara de luz cálida para escritorio');
        if (sensoryPrefs.sound === 'high') items.push('🎧 Solicitar auriculares con cancelación de ruido');
        if (sensoryPrefs.sound === 'low') items.push('🔇 Solicitar espacio en zona tranquila');
        if (sensoryPrefs.communication === 'async') items.push('📝 Preferencia: Comunicación escrita (Slack/Email)');
        if (sensoryPrefs.communication === 'minimal') items.push('📅 Preferencia: Reuniones solo esenciales y programadas');
        if (accessibilityPrefs.high_contrast) items.push('🖥️ Activar modo alto contraste en herramientas');
        if (accessibilityPrefs.reduced_motion) items.push('⏸️ Desactivar animaciones en sistema operativo');

        if (items.length === 0) items.push('✅ Tu perfil indica un entorno estándar. ¡Ajusta cuando lo necesites!');
        setChecklist(items);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await axios.put('/user/profile/accessibility', {
                sensory_needs: {
                    light: sensoryPrefs.light || 'medium',
                    sound: sensoryPrefs.sound || 'medium',
                    communication: sensoryPrefs.communication || 'minimal'
                },
                prefers_reduced_motion: Boolean(accessibilityPrefs.reduced_motion),
                high_contrast_enabled: Boolean(accessibilityPrefs.high_contrast)
            });

            const dataToSave = {
                bio: profileData.bio,
                skills: profileData.skills,
                is_willing_to_move: profileData.is_willing_to_move,
                target_locations: profileData.target_locations.filter(id => id && id.trim() !== ""),
                preferences: profileData.preferences,
                residence_location_id: profileData.residence_location_id || null,
                residence_international: profileData.residence_international || null
            };

            await axios.put('/api/profiles/me', dataToSave);
            navigate('/talent-dashboard');
        } catch (err: any) {
            console.error(err);
            let msg = 'Error desconocido al guardar.';
            if (err.response) {
                if (err.response.status === 401) msg = "Sesión expirada. Por favor inicia sesión nuevamente.";
                else if (err.response.status === 422) msg = "Datos inválidos. Revisa los campos.";
                else if (err.response.data?.detail) msg = err.response.data.detail;
            } else if (err.request) {
                msg = "Error de conexión. Verifica tu internet.";
            }
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const addSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!profileData.skills.includes(skillInput.trim())) {
                setProfileData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            }
            setSkillInput('');
        }
    };

    const renderWelcome = () => (
        <div className="text-center py-12">
            <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
                    <span className="text-5xl text-accent">✨</span>
                </div>
                <h1 className="text-4xl font-heading font-bold text-primary mb-4">Bienvenido a Teamworkz (v1.1)</h1>
                <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
                    Vamos a preparar tu entorno de trabajo ideal en solo unos pasos.
                </p>
            </div>
            <button onClick={handleNext} className="btn-secondary text-lg px-8 py-3">
                Comenzar →
            </button>
        </div>
    );

    const renderAccessibility = () => (
        <div className="py-8">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">Ajustes de Interfaz</h1>
            <p className="text-gray-600 mb-8">Antes de empezar, ¿necesitas alguna adaptación visual?</p>
            <div className="grid gap-4 md:grid-cols-2">
                <button
                    onClick={() => setAccessibilityPrefs(p => ({ ...p, high_contrast: !p.high_contrast }))}
                    className={`card-radius p-6 text-left border-2 transition-all ${accessibilityPrefs.high_contrast
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                    <span className="text-3xl mb-2 block">🌓</span>
                    <span className="font-bold text-lg">Alto Contraste</span>
                </button>
                <button
                    onClick={() => setAccessibilityPrefs(p => ({ ...p, reduced_motion: !p.reduced_motion }))}
                    className={`card-radius p-6 text-left border-2 transition-all ${accessibilityPrefs.reduced_motion
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                    <span className="text-3xl mb-2 block">⏸️</span>
                    <span className="font-bold text-lg">Reducir Movimiento</span>
                </button>
            </div>
            <div className="mt-8 flex justify-between items-center">
                <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-bold">Saltar este paso</button>
                <button onClick={handleNext} className="btn-secondary">Siguiente →</button>
            </div>
        </div>
    );

    const renderSensory = () => (
        <div className="py-8">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">Perfil Sensorial</h1>
            <p className="text-gray-600 mb-8">Ayúdanos a entender tu entorno ideal.</p>
            <div className="mb-6">
                <label className="block font-bold mb-3">Sensibilidad a la Luz</label>
                <div className="flex gap-3">
                    {(['low', 'medium', 'high'] as const).map(level => (
                        <button key={level} onClick={() => setSensoryPrefs(p => ({ ...p, light: level }))}
                            className={`card-radius flex-1 p-4 border-2 text-center transition-all ${sensoryPrefs.light === level ? 'border-accent bg-accent/20' : 'border-gray-200 hover:border-gray-300'}`}>
                            <span className="capitalize font-bold">{level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
                <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-bold">Saltar</button>
                <button onClick={handleNext} className="btn-secondary">Siguiente →</button>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="py-8">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">Tu Perfil</h1>
            <div className="space-y-6">
                <div>
                    <label className="block font-bold mb-2">Bio</label>
                    <textarea
                        className="w-full p-3 border border-gray-300 card-radius outline-none h-28"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block font-bold mb-2">Habilidades</label>
                    <div className="flex flex-wrap gap-2 mb-2 p-3 border border-gray-300 card-radius bg-white">
                        {profileData.skills.map(skill => (
                            <span key={skill} className="bg-accent px-3 py-1 rounded-full text-sm font-bold">
                                {skill}
                                <button onClick={() => setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))} className="ml-2">×</button>
                            </span>
                        ))}
                        <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} className="outline-none" />
                    </div>
                </div>
                <div className="pt-6 border-t border-gray-100 space-y-8">
                    <h3 className="font-bold text-xl text-primary">📍 Ubicación y Movilidad</h3>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <HierarchicalLocationSelector
                            initialValue={profileData.residence_location_id}
                            onChange={(id) => setProfileData(prev => ({ ...prev, residence_location_id: id }))}
                        />
                    </div>
                    <div className="bg-p2/5 p-6 rounded-2xl flex justify-between items-center">
                        <h4 className="font-bold text-sm">¿Estás abierto a mudarte?</h4>
                        <button
                            onClick={() => setProfileData(prev => ({ ...prev, is_willing_to_move: !prev.is_willing_to_move }))}
                            className={`h-7 w-14 rounded-full transition-colors ${profileData.is_willing_to_move ? 'bg-p2' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-5 w-5 bg-white rounded-full transform transition-transform ${profileData.is_willing_to_move ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {profileData.is_willing_to_move && (
                        <HierarchicalLocationSelector
                            label="Destino Preferente"
                            onChange={(id) => setProfileData(prev => ({ ...prev, target_locations: [id] }))}
                        />
                    )}
                </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
                <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-bold">Saltar</button>
                <button onClick={handleNext} className="btn-secondary">Ver mi Checklist →</button>
            </div>
        </div>
    );

    const renderChecklist = () => (
        <div className="py-8 text-center">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">¡Tu Checklist de Ajustes!</h1>
            <div className="bg-white card-radius shadow-lg p-6 text-left max-w-lg mx-auto border-l-4 border-accent mb-4">
                <ul className="space-y-3">
                    {checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">{item}</li>
                    ))}
                </ul>
            </div>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
            <button onClick={handleSave} disabled={saving} className="btn-secondary text-lg px-8 py-3">
                {saving ? 'Guardando...' : 'Finalizar y Guardar →'}
            </button>
        </div>
    );

    const steps = [renderWelcome, renderAccessibility, renderSensory, renderProfile, renderChecklist];
    const stepLabels = ['Bienvenida', 'Interfaz', 'Sensorial', 'Perfil', 'Checklist'];

    return (
        <div className="flex justify-center p-4">
            <div className="bg-white p-8 card-radius shadow-xl max-w-2xl w-full border-t-4 border-accent">
                {step > 0 && step < 4 && (
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                            {stepLabels.map((label, i) => (
                                <span key={i} className={step === i ? 'text-primary' : ''}>{label}</span>
                            ))}
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full">
                            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
                        </div>
                    </div>
                )}
                {steps[step]()}
            </div>
            {toast.visible && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-n900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-fade-in-up max-w-md w-full border-l-4 border-p2">
                    <span className="text-2xl">🌱</span>
                    <div>
                        <h4 className="font-bold text-lg">¡Buena elección!</h4>
                        <p className="text-sm opacity-90">El Ayuntamiento de <span className="font-bold text-p2">{toast.message}</span> ha sido notificado.</p>
                    </div>
                    <button onClick={() => setToast({ ...toast, visible: false })} className="ml-auto text-white/50 hover:text-white">×</button>
                </div>
            )}
        </div>
    );
};

export default TalentProfileWizard;
