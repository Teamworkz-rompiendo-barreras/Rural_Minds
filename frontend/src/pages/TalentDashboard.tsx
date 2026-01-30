import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Challenge {
    id: number;
    title: string;
    description: string;
    skills_required: string[];
    modality: string;
    budget: string;
}

interface Application {
    id: number;
    challenge_id: number;
    status: string;
    created_at: string;
    challenge?: Challenge;
}

const TalentDashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [status, setStatus] = useState('loading');

    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [applyStatus, setApplyStatus] = useState('idle');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [challengesRes, applicationsRes] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/challenges/recommendations', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://127.0.0.1:8000/api/applications/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setChallenges(challengesRes.data);
                setApplications(applicationsRes.data);
                setStatus('idle');
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        };

        if (token) fetchData();
    }, [token]);

    const handleApplyClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setCoverLetter('');
        setApplyStatus('idle');
    };

    const submitApplication = async () => {
        if (!selectedChallenge) return;
        setApplyStatus('submitting');
        try {
            await axios.post(`http://127.0.0.1:8000/api/challenges/${selectedChallenge.id}/apply`,
                { cover_letter: coverLetter },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh applications
            const res = await axios.get('http://127.0.0.1:8000/api/applications/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(res.data);

            setApplyStatus('success');
            setTimeout(() => {
                setSelectedChallenge(null);
                setApplyStatus('idle');
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setApplyStatus('error');
        }
    };

    const hasApplied = (challengeId: number) => {
        return applications.some(app => app.challenge_id === challengeId);
    };

    if (status === 'loading') return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="flex flex-col p-4 w-full max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md border-l-4 border-primary">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-800">Welcome, {user?.email}</h1>
                    <p className="text-gray-600">Find challenges that match your unique skills.</p>
                </div>
                <Link to="/profile" className="px-4 py-2 bg-secondary text-secondary-contrast rounded font-bold hover:bg-opacity-90 transition-colors">
                    Edit Profile
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Challenges */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-2xl font-bold font-heading text-primary">Recommended Matches</h2>
                        <span className="text-sm text-gray-500">Based on your skills</span>
                    </div>

                    <div className="grid gap-6">
                        {challenges.map(challenge => (
                            <div key={challenge.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{challenge.title}</h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{challenge.modality}</span>
                                </div>
                                <p className="text-gray-600 mb-4 line-clamp-3">{challenge.description}</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {challenge.skills_required.map(skill => (
                                        <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                    <span className="font-mono text-sm text-green-700 bg-green-50 px-2 py-1 rounded">{challenge.budget || 'Negotiable'}</span>

                                    {hasApplied(challenge.id) ? (
                                        <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 font-bold rounded cursor-not-allowed">
                                            Applied
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleApplyClick(challenge)}
                                            className="px-6 py-2 bg-primary text-white font-bold rounded hover:-translate-y-0.5 transform transition-all shadow-sm hover:shadow-md"
                                        >
                                            Apply Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {challenges.length === 0 && <p className="text-gray-500 italic">No challenges available right now.</p>}
                    </div>
                </div>

                {/* Sidebar: My Applications */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold font-heading text-secondary border-b pb-2">My Applications</h2>
                    <div className="space-y-4">
                        {applications.map(app => (
                            <div key={app.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400">
                                <div className="font-bold text-gray-800 mb-1">Challenge #{app.challenge_id}</div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {app.status}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {applications.length === 0 && <p className="text-gray-500 text-sm">You haven't applied to any challenges yet.</p>}
                    </div>
                </div>
            </div>

            {/* Application Modal Overlay */}
            {selectedChallenge && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-100">
                        <h3 className="text-2xl font-bold mb-2 text-primary">Apply to {selectedChallenge.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">Introduce yourself and explain why you're a fit.</p>

                        <textarea
                            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none h-32 mb-4"
                            placeholder="I'm interested in this challenge because..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedChallenge(null)}
                                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitApplication}
                                disabled={applyStatus === 'submitting'}
                                className="px-6 py-2 bg-primary text-white font-bold rounded shadow hover:bg-opacity-90 transition-all flex items-center gap-2"
                            >
                                {applyStatus === 'submitting' ? 'Sending...' : 'Send Application'}
                            </button>
                        </div>
                        {applyStatus === 'error' && <p className="text-red-600 mt-2 text-sm text-center">Failed to submit application. Try again.</p>}
                        {applyStatus === 'success' && <p className="text-green-600 mt-2 text-sm text-center font-bold">Application Sent!</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TalentDashboard;
