import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import LocationSelector from '../components/LocationSelector';

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

    // Toast State
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const showToast = (municipalityName: string) => {
        setToast({ message: municipalityName, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
    };

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
        is_willing_to_move: false,
        target_locations: [],
        preferences: {
            needs_housing: false
        }
    });
    const [skillInput, setSkillInput] = useState('');

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
            // Avoid reloading if we already have data (simplistic check)
            // But actually we want to load fresh from DB on mount
            try {
                // 1. Fetch Accessibility Prefs
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

                // 2. Fetch Talent Profile (Bio/Skills)
                const profileRes = await axios.get('/api/profiles/me');
                if (profileRes.data) {
                    setProfileData({
                        bio: profileRes.data.bio || '',
                        skills: profileRes.data.skills || [],
                        residence_location_id: profileRes.data.residence_location_id || '',
                        is_willing_to_move: profileRes.data.is_willing_to_move || false,
                        target_locations: profileRes.data.target_locations || [],
                        preferences: profileRes.data.preferences || { needs_housing: false }
                    });
                }
            } catch (err) {
                console.log("No existing profile or error fetching", err);
                // Silent fail is okay here, it just means starting fresh
            }
        };

        if (user) {
            fetchExistingData();
        }
    }, [user]);

    // Apply accessibility preferences live
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
        if (step === 3) {
            // Generate checklist before showing it
            generateChecklist();
        }
        setStep(s => s + 1);
    };

    const handleSkip = () => {
        setStep(s => s + 1);
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

    const [error, setError] = useState<string | null>(null);

    // ... (rest of states)

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // Save accessibility profile
            await axios.put('/user/profile/accessibility', {
                sensory_needs: sensoryPrefs,
                prefers_reduced_motion: accessibilityPrefs.reduced_motion,
                high_contrast_enabled: accessibilityPrefs.high_contrast
            });
            // Save talent profile
            await axios.put('/api/profiles/me', profileData);
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

    // --- RENDER STEPS ---

    // Step 0: Welcome
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

    // Step 1: Accessibility Preferences (BEFORE data)
    const renderAccessibility = () => (
        <div className="py-8">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">Ajustes de Interfaz</h1>
            <p className="text-gray-600 mb-8">Antes de empezar, ¿necesitas alguna adaptación visual?</p>

            <div className="grid gap-4 md:grid-cols-2">
                <button
                    onClick={() => setAccessibilityPrefs(p => ({ ...p, high_contrast: !p.high_contrast }))}
                    className={`card-radius p-6 text-left border-2 transition-all ${accessibilityPrefs.high_contrast
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    aria-pressed={accessibilityPrefs.high_contrast}
                >
                    <span className="text-3xl mb-2 block" aria-hidden="true">🌓</span>
                    <span className="font-bold text-lg">Alto Contraste</span>
                    <p className={`text-sm mt-1 ${accessibilityPrefs.high_contrast ? 'text-gray-200' : 'text-gray-500'}`}>
                        Aumenta la diferencia entre colores para mejor legibilidad.
                    </p>
                </button>

                <button
                    onClick={() => setAccessibilityPrefs(p => ({ ...p, reduced_motion: !p.reduced_motion }))}
                    className={`card-radius p-6 text-left border-2 transition-all ${accessibilityPrefs.reduced_motion
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    aria-pressed={accessibilityPrefs.reduced_motion}
                >
                    <span className="text-3xl mb-2 block" aria-hidden="true">⏸️</span>
                    <span className="font-bold text-lg">Reducir Movimiento</span>
                    <p className={`text-sm mt-1 ${accessibilityPrefs.reduced_motion ? 'text-gray-200' : 'text-gray-500'}`}>
                        Desactiva animaciones y transiciones.
                    </p>
                </button>
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-bold">
                    Saltar este paso
                </button>
                <button onClick={handleNext} className="btn-secondary">
                    Siguiente →
                </button>
            </div>
        </div>
    );

    // Step 2: Sensory Preferences (Cards)
    const renderSensory = () => (
        <div className="py-8">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">Perfil Sensorial</h1>
            <p className="text-gray-600 mb-8">Ayúdanos a entender tu entorno ideal.</p>

            {/* Light */}
            <div className="mb-6">
                <label className="block font-bold mb-3">Sensibilidad a la Luz</label>
                <div className="flex gap-3">
                    {(['low', 'medium', 'high'] as const).map(level => (
                        <button key={level} onClick={() => setSensoryPrefs(p => ({ ...p, light: level }))}
                            className={`card-radius flex-1 p-4 border-2 text-center transition-all ${sensoryPrefs.light === level ? 'border-accent bg-accent/20' : 'border-gray-200 hover:border-gray-300'}`}
                            aria-pressed={sensoryPrefs.light === level}>
                            <span className="text-2xl block mb-1" aria-hidden="true">{level === 'low' ? '🌑' : level === 'medium' ? '🌤️' : '☀️'}</span>
                            <span className="capitalize font-bold">{level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sound */}
            <div className="mb-6">
                <label className="block font-bold mb-3">Sensibilidad al Sonido</label>
                <div className="flex gap-3">
                    {(['low', 'medium', 'high'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setSensoryPrefs(p => ({ ...p, sound: level }))}
                            className={`card-radius flex-1 p-4 border-2 text-center transition-all ${sensoryPrefs.sound === level
                                ? 'border-accent bg-accent/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-2xl block mb-1">
                                {level === 'low' ? '🔇' : level === 'medium' ? '🔉' : '🔊'}
                            </span>
                            <span className="capitalize font-bold">{level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Communication */}
            <div className="mb-6">
                <label className="block font-bold mb-3">Canal de Comunicación Preferido</label>
                <div className="flex gap-3 flex-wrap">
                    {[
                        { key: 'async', label: 'Escrita (Async)', icon: '📝' },
                        { key: 'minimal', label: 'Reuniones Mínimas', icon: '📅' },
                        { key: 'collaborative', label: 'Colaboración Abierta', icon: '👥' }
                    ].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setSensoryPrefs(p => ({ ...p, communication: opt.key as any }))}
                            className={`card-radius flex-1 min-w-[120px] p-4 border-2 text-center transition-all ${sensoryPrefs.communication === opt.key
                                ? 'border-accent bg-accent/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-2xl block mb-1">{opt.icon}</span>
                            <span className="font-bold text-sm">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-bold">
                    Saltar
                </button>
                <button onClick={handleNext} className="btn-secondary">
                    Siguiente →
                </button>
            </div>
        </div>
    );

    // Step 3: Profile Data (Bio, Skills)
    const renderProfile = () => (
        <div className="py-8">
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">Tu Perfil</h1>
            <p className="text-gray-600 mb-8">Cuéntanos un poco sobre ti (opcional).</p>

            <div className="space-y-6">
                <div>
                    <label className="block font-bold mb-2">Bio</label>
                    <textarea
                        className="w-full p-3 border border-gray-300 card-radius focus:border-primary focus:ring-2 focus:ring-focus-ring outline-none h-28 leading-relaxed"
                        placeholder="Cuéntanos sobre ti..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block font-bold mb-2">Habilidades</label>
                    <div className="flex flex-wrap gap-2 mb-2 p-3 border border-gray-300 card-radius bg-white min-h-[50px]">
                        {profileData.skills.map(skill => (
                            <span key={skill} className="bg-accent text-gray-900 px-3 py-1 rounded-full text-sm flex items-center gap-2 font-bold">
                                {skill}
                                <button onClick={() => setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}
                                    className="hover:text-red-700"
                                    aria-label={`Eliminar habilidad ${skill}`}>×</button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={addSkill}
                            placeholder="Añadir habilidad..."
                            className="flex-grow outline-none bg-transparent min-w-[120px]"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Pulsa Enter para añadir.</p>
                </div>

                {/* Location - NEW */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-lg text-primary mb-4">Ubicación y Movilidad</h3>

                    <div className="mb-6">
                        <LocationSelector
                            label="¿Dónde resides actualmente?"
                            value={profileData.residence_location_id}
                            onChange={(id) => setProfileData(prev => ({ ...prev, residence_location_id: id }))}
                            placeholder="Busca tu municipio..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Te mostraremos oportunidades cercanas y validadas.
                        </p>
                    </div>

                    <div className="mb-6 flex items-center gap-3">
                        <div
                            onClick={() => setProfileData(prev => ({ ...prev, is_willing_to_move: !prev.is_willing_to_move }))}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${profileData.is_willing_to_move ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${profileData.is_willing_to_move ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="font-bold text-gray-700 cursor-pointer" onClick={() => setProfileData(prev => ({ ...prev, is_willing_to_move: !prev.is_willing_to_move }))}>
                            Estoy dispuesto a mudarme a otro municipio rural
                        </span>
                    </div>

                    <div className="mb-6 flex items-center gap-3">
                        <div
                            onClick={() => setProfileData(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, needs_housing: !prev.preferences.needs_housing }
                            }))}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${profileData.preferences.needs_housing ? 'bg-orange-500' : 'bg-gray-300'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${profileData.preferences.needs_housing ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="font-bold text-gray-700 cursor-pointer" onClick={() => setProfileData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, needs_housing: !prev.preferences.needs_housing }
                        }))}>
                            Necesito ayuda para encontrar vivienda 🏠❗
                        </span>
                    </div>

                    {profileData.is_willing_to_move && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="block font-bold mb-2">Municipios de Interés (Opcional)</label>
                            <LocationSelector
                                label=""
                                placeholder="Añadir municipio de interés..."
                                onChange={(id, name) => {
                                    if (!profileData.target_locations.includes(id)) {
                                        setProfileData(prev => ({ ...prev, target_locations: [...prev.target_locations, id] }));
                                        if (name) showToast(name);
                                    }
                                }}
                            />

                            {/* List of selected target locations */}
                            {profileData.target_locations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {profileData.target_locations.map(locId => (
                                        <span key={locId} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 font-bold">
                                            Municipio #{locId.substring(0, 4)}...
                                            {/* Note: In real app we need to fetch label for this ID or store object */}
                                            <button onClick={() => setProfileData(prev => ({ ...prev, target_locations: prev.target_locations.filter(l => l !== locId) }))}
                                                className="hover:text-purple-900"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-bold">
                    Saltar
                </button>
                <button onClick={handleNext} className="btn-secondary">
                    Ver mi Checklist →
                </button>
            </div>
        </div>
    );

    // Step 4: Generated Checklist (Aha Moment!)
    const renderChecklist = () => (
        <div className="py-8 text-center">
            <div className="mb-6">
                <span className="text-6xl">🎉</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">¡Tu Checklist de Ajustes!</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Basado en tus preferencias, aquí tienes recomendaciones para compartir con tu manager.
            </p>

            <div className="bg-white card-radius shadow-lg p-6 text-left max-w-lg mx-auto border-l-4 border-accent">
                <h3 className="font-bold text-lg mb-4 text-gray-800">📋 Ajustes Recomendados</h3>
                <ul className="space-y-3">
                    {checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                            <span className="text-accent">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="mt-8">
                <button onClick={handleSave} disabled={saving} className="btn-secondary text-lg px-8 py-3">
                    {saving ? 'Guardando...' : 'Finalizar y Guardar →'}
                </button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    const steps = [renderWelcome, renderAccessibility, renderSensory, renderProfile, renderChecklist];
    const stepLabels = ['Bienvenida', 'Interfaz', 'Sensorial', 'Perfil', 'Checklist'];

    return (
        <div className="flex justify-center p-4">
            <div className="bg-white p-8 card-radius shadow-xl max-w-2xl w-full border-t-4 border-accent">
                {/* Progress */}
                {step > 0 && step < 4 && (
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                            {stepLabels.map((label, i) => (
                                <span key={i} className={step === i ? 'text-primary' : ''}>{label}</span>
                            ))}
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(step / 4) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {steps[step]()}
            </div>

            {/* Custom Toast Notification */}
            {toast.visible && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-n900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-fade-in-up max-w-md w-full border-l-4 border-p2">
                    <span className="text-2xl">🌱</span>
                    <div>
                        <h4 className="font-bold text-lg">¡Buena elección!</h4>
                        <p className="text-sm opacity-90">
                            El Ayuntamiento de <span className="font-bold text-p2">{toast.message}</span> ha sido notificado y te enviará información de apoyo pronto.
                        </p>
                    </div>
                    <button
                        onClick={() => setToast({ ...toast, visible: false })}
                        className="ml-auto text-white/50 hover:text-white"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default TalentProfileWizard;
