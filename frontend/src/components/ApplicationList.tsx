import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface TalentProfile {
    bio: string;
    skills: string[];
}

interface User {
    email: string;
    talent_profile?: TalentProfile;
}

interface Application {
    id: number;
    user_id: number;
    status: string;
    cover_letter: string;
    created_at: string;
    user?: User;
}

interface ApplicationListProps {
    challengeId: number;
    onClose: () => void;
}

const ApplicationList: React.FC<ApplicationListProps> = ({ challengeId, onClose }) => {
    const { token } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/api/challenges/${challengeId}/applications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setApplications(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (token && challengeId) fetchApplications();
    }, [token, challengeId]);

    const updateStatus = async (appId: number, status: 'accepted' | 'rejected') => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/applications/${appId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status } : app
            ));
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-primary">Applicants</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">×</button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500">Loading applicants...</p>
                ) : applications.length === 0 ? (
                    <p className="text-center text-gray-500 italic py-8">No applicants yet for this challenge.</p>
                ) : (
                    <div className="space-y-4">
                        {applications.map(app => (
                            <div key={app.id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">
                                            {app.status === 'accepted'
                                                ? (app.user?.email || `Applicant #${app.user_id}`)
                                                : <span className="text-gray-400 font-normal italic">Email hidden until accepted</span>
                                            }
                                        </div>
                                        {app.user?.talent_profile?.skills && app.user.talent_profile.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {app.user.talent_profile.skills.map(skill => (
                                                    <span key={skill} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {app.status}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {app.user?.talent_profile?.bio && (
                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold text-gray-700">Bio: </span>
                                            {app.user.talent_profile.bio}
                                        </div>
                                    )}

                                    <div className="bg-gray-100 p-3 rounded text-sm text-gray-600 italic border-l-4 border-gray-300">
                                        "{app.cover_letter}"
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 text-sm mt-4 pt-3 border-t border-gray-100">
                                    {app.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(app.id, 'rejected')}
                                                className="px-4 py-1.5 border border-red-200 text-red-700 rounded hover:bg-red-50 font-medium"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => updateStatus(app.id, 'accepted')}
                                                className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                                            >
                                                Accept
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationList;
