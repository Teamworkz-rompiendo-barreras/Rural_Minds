import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type DeliverableType = 'software' | 'document' | 'design';

interface FormData {
    title: string;
    description: string;
    problemReason: string;

    deliverableType: DeliverableType | null;
    acceptanceCriteria: string[];

    skills: string[];
    autonomyLevel: number;

    modality: 'remote' | 'onsite';
    communicationPref: string;

    budget: string;
}

const steps = ['Problem', 'Deliverable', 'Skills', 'Logistics', 'Review'];

const ChallengeWizard: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        problemReason: '',
        deliverableType: null,
        acceptanceCriteria: [],
        skills: [],
        autonomyLevel: 3,
        modality: 'remote',
        communicationPref: 'email',
        budget: '',
    });

    const [acInput, setAcInput] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleNext = () => {
        if (currentStep < 5) setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
        else navigate('/');
    };

    const toggleDeliverable = (type: DeliverableType) => {
        setFormData(prev => ({ ...prev, deliverableType: type }));
    };

    const addCriteria = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && acInput.trim()) {
            e.preventDefault();
            setFormData(prev => ({ ...prev, acceptanceCriteria: [...prev.acceptanceCriteria, acInput.trim()] }));
            setAcInput('');
        }
    };

    const removeCriteria = (index: number) => {
        setFormData(prev => ({
            ...prev,
            acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index)
        }));
    };

    const addSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!formData.skills.includes(skillInput.trim())) {
                setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const submitChallenge = async () => {
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                problem_reason: formData.problemReason,
                deliverable_type: formData.deliverableType,
                acceptance_criteria: formData.acceptanceCriteria,
                skills_required: formData.skills,
                autonomy_level: formData.autonomyLevel,
                modality: formData.modality,
                communication_pref: formData.communicationPref,
                budget: formData.budget
            };

            await axios.post('http://127.0.0.1:8000/api/challenges', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmitStatus('success');
        } catch (error) {
            console.error(error);
            setSubmitStatus('error');
            setErrorMessage('Failed to connect to the server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitStatus === 'success') {
        return (
            <div className="flex items-center justify-center flex-grow p-4 font-sans text-text-main w-full">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                    <h2 className="text-2xl font-bold font-heading mb-2 text-primary">Reto Publicado con éxito</h2>
                    <p className="text-gray-600 mb-6">Your challenge has been successfully created.</p>
                    <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white font-bold rounded hover:bg-opacity-90">Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center flex-grow p-4 font-sans text-text-main w-full">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full">
                {/* Stepper */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded transition-all duration-300" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
                    {steps.map((step, index) => {
                        const stepNum = index + 1;
                        const isActive = stepNum === currentStep;
                        const isCompleted = stepNum < currentStep;
                        return (
                            <div key={step} className="flex flex-col items-center bg-white px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-200 ${isActive || isCompleted ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-400 bg-white'}`}>
                                    {stepNum}
                                </div>
                                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>{step}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="mb-8 min-h-[300px]">
                    {currentStep === 1 && (
                        <div>
                            <h2 className="text-2xl font-heading font-bold mb-2 text-primary">The Problem</h2>
                            <p className="text-gray-600 mb-6">What do you need to solve or improve?</p>

                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2">My need is...</label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    className="w-full p-3 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="e.g., I need to digitize my invoices..."
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                                <span className="text-xs text-gray-500 block text-right mt-1">{formData.title.length}/100</span>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2">Why is it a problem today?</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Repetitive tasks', 'Data loss', 'Lack of customers', 'Slow processes', 'High costs'].map(reason => (
                                        <button
                                            key={reason}
                                            onClick={() => setFormData({ ...formData, problemReason: reason })}
                                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${formData.problemReason === reason ? 'bg-blue-100 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Description (Optional Details)</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none h-24"
                                    placeholder="Any extra context..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h2 className="text-2xl font-heading font-bold mb-2 text-primary">The Deliverable</h2>
                            <p className="text-gray-600 mb-6">What exactly should the professional deliver?</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {[
                                    { id: 'software', label: 'Software/Web', icon: '💻' },
                                    { id: 'document', label: 'Report/Doc', icon: '📄' },
                                    { id: 'design', label: 'Design/Visual', icon: '🎨' },
                                ].map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleDeliverable(item.id as DeliverableType)}
                                        className={`cursor-pointer p-6 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-4 h-40 ${formData.deliverableType === item.id ? 'border-accent bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                    >
                                        <span className="text-4xl">{item.icon}</span>
                                        <span className="font-bold text-lg">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Definition of Done (Acceptance Criteria)</label>
                                <p className="text-xs text-gray-500 mb-2">The job is done when...</p>
                                <div className="space-y-2 mb-2">
                                    {formData.acceptanceCriteria.map((ac, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                            <span className="text-green-600 font-bold">✓</span>
                                            <span className="flex-grow text-sm">{ac}</span>
                                            <button onClick={() => removeCriteria(idx)} className="text-gray-400 hover:text-red-500">×</button>
                                        </div>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={acInput}
                                    onChange={(e) => setAcInput(e.target.value)}
                                    onKeyDown={addCriteria}
                                    placeholder="Type a criterion and press Enter (e.g., 'Mobile responsive')"
                                    className="w-full p-3 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h2 className="text-2xl font-heading font-bold mb-6 text-primary">Skills & Autonomy</h2>
                            <div className="mb-8">
                                <label className="block text-sm font-bold mb-2">Required Technologies/Skills</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-300 rounded bg-white">
                                    {formData.skills.map(skill => (
                                        <span key={skill} className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {skill}
                                            <button onClick={() => removeSkill(skill)} className="hover:text-accent">×</button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={addSkill}
                                        placeholder={formData.skills.length === 0 ? "Type tag & Enter..." : ""}
                                        className="flex-grow outline-none bg-transparent min-w-[150px]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-4 flex justify-between">
                                    <span>Autonomy Level</span>
                                    <span className="text-primary font-bold">Level {formData.autonomyLevel}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1" max="5" step="1"
                                    value={formData.autonomyLevel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, autonomyLevel: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Needs Guide</span>
                                    <span>Fully Autonomous</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <h2 className="text-2xl font-heading font-bold mb-6 text-primary">Logistics</h2>

                            <div className="mb-8">
                                <label className="block text-sm font-bold mb-3">Modality</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${formData.modality === 'remote' ? 'bg-blue-50 border-primary ring-1 ring-primary' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="modality" value="remote" checked={formData.modality === 'remote'} onChange={() => setFormData({ ...formData, modality: 'remote' })} className="hidden" />
                                        <div className="font-bold text-lg mb-1">🏠 Remote</div>
                                        <div className="text-sm text-gray-500">Work from anywhere (Preferred)</div>
                                    </label>
                                    <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${formData.modality === 'onsite' ? 'bg-blue-50 border-primary ring-1 ring-primary' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="modality" value="onsite" checked={formData.modality === 'onsite'} onChange={() => setFormData({ ...formData, modality: 'onsite' })} className="hidden" />
                                        <div className="font-bold text-lg mb-1">🏢 Onsite</div>
                                        <div className="text-sm text-gray-500">Only if strictly necessary</div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-3">Communication Preference</label>
                                <div className="space-y-3">
                                    {[
                                        { id: 'video', label: 'Video Call (Weekly)' },
                                        { id: 'chat', label: 'Chat/Email Only (Async)' },
                                        { id: 'phone', label: 'Phone Call' },
                                    ].map(pref => (
                                        <label key={pref.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="commPref"
                                                value={pref.id}
                                                checked={formData.communicationPref === pref.id}
                                                onChange={() => setFormData({ ...formData, communicationPref: pref.id })}
                                                className="w-4 h-4 text-primary focus:ring-focus-ring"
                                            />
                                            <span className="ml-3 font-medium">{pref.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div>
                            <h2 className="text-2xl font-heading font-bold mb-6 text-primary">Budget & Review</h2>

                            <div className="mb-8">
                                <label className="block text-sm font-bold mb-2">Budget / Reward</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="e.g., 500€ - 1000€ or Hourly Rate"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                />
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg text-sm border border-gray-200">
                                <h3 className="font-heading font-bold mb-4 text-lg">Challenge Summary</h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                    <div><span className="text-xs uppercase text-gray-500 block">Title</span> <strong>{formData.title}</strong></div>
                                    <div><span className="text-xs uppercase text-gray-500 block">Problem</span> <strong>{formData.problemReason}</strong></div>
                                    <div><span className="text-xs uppercase text-gray-500 block">Type</span> <strong>{formData.deliverableType}</strong></div>
                                    <div><span className="text-xs uppercase text-gray-500 block">Modality</span> <strong>{formData.modality}</strong></div>
                                    <div className="col-span-2">
                                        <span className="text-xs uppercase text-gray-500 block">Definition of Done</span>
                                        <ul className="list-disc list-inside pl-1 text-gray-700">
                                            {formData.acceptanceCriteria.map(ac => <li key={ac}>{ac}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {submitStatus === 'error' && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">{errorMessage}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                    <button onClick={handleBack} className="px-6 py-2 text-gray-600 font-bold hover:text-text-main rounded disabled:opacity-50" disabled={isSubmitting}>Back</button>
                    {currentStep < 5 ? (
                        <button onClick={handleNext} className="px-6 py-2 bg-primary text-white font-bold rounded hover:bg-opacity-90">Next Step</button>
                    ) : (
                        <button onClick={submitChallenge} disabled={isSubmitting} className="px-6 py-2 bg-accent text-text-main font-bold rounded hover:bg-yellow-400 flex items-center gap-2">
                            {isSubmitting ? 'Submitting...' : 'Submit Challenge'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChallengeWizard;
