import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Challenge {
    id: number;
    title: string;
    description: string;
    problem_reason?: string;
    deliverable_type: string;
    created_at: string;
    budget?: string;
}

import ApplicationList from '../components/ApplicationList';

const MyChallenges: React.FC = () => {
    const { token } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/my-challenges', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChallenges(response.data);
            } catch (error) {
                console.error("Error fetching challenges", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchChallenges();
    }, [token]);

    if (loading) return <div className="p-8 text-center">Loading your challenges...</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-heading font-bold text-primary">My Challenges</h1>
                <Link
                    to="/create"
                    className="px-6 py-2 bg-primary text-white font-bold rounded hover:bg-opacity-90 transition-colors"
                >
                    + New Challenge
                </Link>
            </div>

            {challenges.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Challenges Yet</h3>
                    <p className="text-gray-500 mb-6">Start by creating your first challenge to find local talent.</p>
                    <Link
                        to="/create"
                        className="inline-block px-6 py-2 bg-accent text-text-main font-bold rounded hover:bg-yellow-400"
                    >
                        Create Challenge
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {challenges.map(challenge => (
                        <div key={challenge.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{challenge.deliverable_type}</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">Active</span>
                            </div>
                            <h2 className="text-xl font-bold font-heading mb-2 text-primary">{challenge.title}</h2>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{challenge.problem_reason || challenge.description}</p>

                            <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100 gap-4">
                                <span>{challenge.budget ? `${challenge.budget}` : 'No Budget'}</span>
                                <button
                                    onClick={() => setSelectedChallengeId(challenge.id)}
                                    className="text-secondary font-bold hover:underline"
                                >
                                    View Applicants
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Applicant Modal */}
            {selectedChallengeId && (
                <ApplicationList
                    challengeId={selectedChallengeId}
                    onClose={() => setSelectedChallengeId(null)}
                />
            )}
        </div>
    );
};

export default MyChallenges;
