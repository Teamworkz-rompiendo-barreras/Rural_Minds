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

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

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

    const [checklist, setChecklist] = useState<string[]>([]);

    useEffect(() => {
        if (user && user.role !== 'talent') {
            navigate('/');
        }
    }, [user, navigate]);

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
        if (user) { fetchExistingData(); }
    }, [user]);

    useEffect(() => {
        if (accessibilityPrefs.high_contrast) { document.body.classList.add('high-contrast'); } 
        else { document.body.classList.remove('high-contrast'); }
        if (accessibilityPrefs.reduced_motion) { document.body.classList.add('reduce-motion'); } 
        else { document.body.classList.remove('reduce-motion'); }
    }, [accessibilityPrefs]);

    const handleNext = () => {
        if (step === 3 && profileData.is_willing_to_move) {
            const validTargets = profileData.target_locations.filter(id => id && id.trim() !== "");
            if (validTargets.length === 0) {
                setError("Por favor, selecciona al menos una comunidad o municipio de destino.");
                return;
            }
        }
        if (step === 3) { generateChecklist(); }
        setError(null);
        setStep(prev => prev + 1);
    };

    const handleSkip = () => { setError(null); setStep(prev => prev + 1); };

    const generateChecklist = () => {
        const items: string[] = [];
        if (sensoryPrefs.light === 'high') items.push('☀️ Solicitar ubicación alejada de ventanas');
        if (sensoryPrefs.light === 'low') items.push('💡 Solicitar lámpara de luz cálida');
        if (sensoryPrefs.sound === 'high') items.push('🎧 Solicitar auriculares con cancelación de ruido');
        if (sensoryPrefs.sound === 'low') items.push('🔇 Solicitar espacio en zona tranquila');
        if (sensoryPrefs.communication === 'async') items.push('📝 Preferencia: Comunicación escrita');
        if (sensoryPrefs.communication === 'minimal') items.push('📅 Preferencia: Reuniones mínimas');
        if (accessibilityPrefs.high_contrast) items.push('🖥️ Activar modo alto contraste');
        if (accessibilityPrefs.reduced_motion) items.push('⏸️ Desactivar animaciones');
        if (items.length === 0) items.push('✅ Entorno estándar detectado.');
        setChecklist(items);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await axios.put('/user/profile/accessibility', {
                sensory_needs: sensoryPrefs,
                prefers_reduced_motion: accessibilityPrefs.reduced_motion,
                high_contrast_enabled: accessibilityPrefs.high_contrast
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
            setError(err.response?.data?.detail || 'Error al guardar.');
        } finally { setSaving(false); }
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
            <h1 className="text-4xl font-bold text-primary mb-4">Bienvenido a Teamworkz</h1>
            <button onClick={handleNext} className="btn-secondary px-8 py-3">Comenzar →</button>
        </div>
    );

    const renderAccessibility = () => (
        <div className="py-8">
            <h1 className="text-2xl font-bold text-primary mb-8">Ajustes de Interfaz</h1>
            <div className="grid gap-4 md:grid-cols-2">
                <button onClick={() => setAccessibilityPrefs(p => ({ ...p, high_contrast: !p.high_contrast }))}
                    className={`p-6 border-2 rounded-xl ${accessibilityPrefs.high_contrast ? 'bg-gray-900 text-white' : 'bg-white'}`}>
                    🌓 Alto Contraste
                </button>
                <button onClick={() => setAccessibilityPrefs(p => ({ ...p, reduced_motion: !p.reduced_motion }))}
                    className={`p-6 border-2 rounded-xl ${accessibilityPrefs.reduced_motion ? 'bg-primary text-white' : 'bg-white'}`}>
                    ⏸️ Reducir Movimiento
                </button>
            </div>
            <div className="mt-8 flex justify-between"><button onClick={handleSkip}>Saltar</button><button onClick={handleNext} className="btn-secondary">Siguiente</button></div>
        </div>
    );

    const renderSensory = () => (
        <div className="py-8">
            <h1 className="text-2xl font-bold text-primary mb-8">Perfil Sensorial</h1>
            <div className="space-y-6">
                <div>
                    <label className="block font-bold mb-3">Luz</label>
                    <div className="flex gap-3">
                        {(['low', 'medium', 'high'] as const).map(l => (
                            <button key={l} onClick={() => setSensoryPrefs(p => ({ ...p, light: l }))}
                                className={`flex-1 p-4 border-2 rounded-xl ${sensoryPrefs.light === l ? 'bg-accent/20 border-accent' : ''}`}>{l}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block font-bold mb-3">Sonido</label>
                    <div className="flex gap-3">
                        {(['low', 'medium', 'high'] as const).map(s => (
                            <button key={s} onClick={() => setSensoryPrefs(p => ({ ...p, sound: s }))}
                                className={`flex-1 p-4 border-2 rounded-xl ${sensoryPrefs.sound === s ? 'bg-accent/20 border-accent' : ''}`}>{s}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block font-bold mb-3">Comunicación</label>
                    <div className="flex gap-3">
                        {(['async', 'minimal', 'collaborative'] as const).map(c => (
                            <button key={c} onClick={() => setSensoryPrefs(p => ({ ...p, communication: c }))}
                                className={`flex-1 p-4 border-2 rounded-xl ${sensoryPrefs.communication === c ? 'bg-accent/20 border-accent' : ''}`}>{c}</button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-8 flex justify-between"><button onClick={handleSkip}>Saltar</button><button onClick={handleNext} className="btn-secondary">Siguiente</button></div>
        </div>
    );

    const renderProfile = () => (
        <div className="py-8">
            <h1 className="text-2xl font-bold text-primary mb-8">Tu Perfil</h1>
            <div className="space-y-6">
                <textarea className="w-full p-3 border rounded-xl h-28" placeholder="Bio..." value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} />
                <div className="p-3 border rounded-xl bg-white">
                    {profileData.skills.map(s => <span key={s} className="bg-accent px-2 py-1 rounded-full mr-2">{s}</span>)}
                    <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder="Habilidades..." className="outline-none" />
                </div>
                <div className="space-y-4">
                    <h3 className="font-bold">📍 Ubicación</h3>
                    <HierarchicalLocationSelector initialValue={profileData.residence_location_id} onChange={id => setProfileData({...profileData, residence_location_id: id})} />
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                        <span>¿Abierto a mudarte?</span>
                        <button onClick={() => setProfileData(p => ({...p, is_willing_to_move: !p.is_willing_to_move}))}
                            className={`w-12 h-6 rounded-full ${profileData.is_willing_to_move ? 'bg-p2' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${profileData.is_willing_to_move ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {profileData.is_willing_to_move && (
                        <HierarchicalLocationSelector label="Destino" onChange={id => setProfileData({...profileData, target_locations: [id]})} />
                    )}
                </div>
            </div>
            <div className="mt-8 flex justify-between"><button onClick={handleSkip}>Saltar</button><button onClick={handleNext} className="btn-secondary">Siguiente</button></div>
        </div>
    );

    const renderChecklist = () => (
        <div className="py-8 text-center">
            <h1 className="text-2xl font-bold mb-8">📋 Tu Checklist</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg text-left mb-6">
                {checklist.map((item, i) => <div key={i} className="mb-2">• {item}</div>)}
            </div>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <button onClick={handleSave} disabled={saving} className="btn-secondary px-8 py-3">{saving ? 'Guardando...' : 'Finalizar'}</button>
        </div>
    );

    const steps = [renderWelcome, renderAccessibility, renderSensory, renderProfile, renderChecklist];
    return (
        <div className="flex justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border-t-4 border-accent">
                {steps[step]()}
            </div>
        </div>
    );
};

export default TalentProfileWizard;
