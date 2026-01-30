import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
}

const TalentProfileWizard: React.FC = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Wizard State
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

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
        skills: []
    });
    const [skillInput, setSkillInput] = useState('');

    // Generated Checklist
    const [checklist, setChecklist] = useState<string[]>([]);

    useEffect(() => {
        if (user && user.role !== 'talent') {
            navigate('/');
        }
    }, [user, navigate]);

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

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save accessibility profile
            await axios.put('http://127.0.0.1:8000/user/profile/accessibility', {
                sensory_needs: sensoryPrefs,
                prefers_reduced_motion: accessibilityPrefs.reduced_motion,
                high_contrast_enabled: accessibilityPrefs.high_contrast
            });
            // Save talent profile
            await axios.put('http://127.0.0.1:8000/api/profiles/me', profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/talent-dashboard');
        } catch (err) {
            console.error(err);
            alert('Error al guardar. Inténtalo de nuevo.');
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
                <h1 className="text-4xl font-heading font-bold text-primary mb-4">Bienvenido a Teamworkz</h1>
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
            <h2 className="text-2xl font-heading font-bold text-primary mb-2">Ajustes de Interfaz</h2>
            <p className="text-gray-600 mb-8">Antes de empezar, ¿necesitas alguna adaptación visual?</p>

            <div className="grid gap-4 md:grid-cols-2">
                <button
                    onClick={() => setAccessibilityPrefs(p => ({ ...p, high_contrast: !p.high_contrast }))}
                    className={`card-radius p-6 text-left border-2 transition-all ${accessibilityPrefs.high_contrast
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                >
                    <span className="text-3xl mb-2 block">🌓</span>
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
                >
                    <span className="text-3xl mb-2 block">⏸️</span>
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
            <h2 className="text-2xl font-heading font-bold text-primary mb-2">Perfil Sensorial</h2>
            <p className="text-gray-600 mb-8">Ayúdanos a entender tu entorno ideal.</p>

            {/* Light */}
            <div className="mb-6">
                <label className="block font-bold mb-3">Sensibilidad a la Luz</label>
                <div className="flex gap-3">
                    {(['low', 'medium', 'high'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setSensoryPrefs(p => ({ ...p, light: level }))}
                            className={`card-radius flex-1 p-4 border-2 text-center transition-all ${sensoryPrefs.light === level
                                    ? 'border-accent bg-accent/20'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-2xl block mb-1">
                                {level === 'low' ? '🌑' : level === 'medium' ? '🌤️' : '☀️'}
                            </span>
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
            <h2 className="text-2xl font-heading font-bold text-primary mb-2">Tu Perfil</h2>
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
                                <button onClick={() => setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))} className="hover:text-red-700">×</button>
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
            <h2 className="text-2xl font-heading font-bold text-primary mb-2">¡Tu Checklist de Ajustes!</h2>
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
        </div>
    );
};

export default TalentProfileWizard;
