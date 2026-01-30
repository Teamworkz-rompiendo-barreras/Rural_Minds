import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('enterprise'); // Default to Enterprise for this phase
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Prepare Payload
        const payload = {
            org_data: {
                name: role === 'enterprise' ? orgName : `Freelance - ${email}`, // Auto-gen for talent
                subscription_plan: 'starter'
            },
            user_data: {
                email: email,
                password: password,
                role: role,
                full_name: email.split('@')[0]
            }
        };

        try {
            await axios.post('http://127.0.0.1:8000/auth/register', payload);
            navigate('/login');
        } catch (err: any) {
            console.error("Registration error:", err);
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
            setError(message || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center flex-grow p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-accent">
                <h2 className="text-3xl font-heading font-bold text-primary mb-6 text-center">Join Teamworkz</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert" aria-live="polite">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('talent')}
                                className={`p-3 border rounded-lg text-center transition-all ${role === 'talent' ? 'border-primary bg-blue-50 text-primary font-bold ring-2 ring-focus-ring' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                Talent
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('enterprise')}
                                className={`p-3 border rounded-lg text-center transition-all ${role === 'enterprise' ? 'border-primary bg-blue-50 text-primary font-bold ring-2 ring-focus-ring' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                Enterprise
                            </button>
                        </div>
                    </div>

                    {role === 'enterprise' && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Organization Name</label>
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-2 rounded hover:bg-opacity-90 transition-colors"
                    >
                        Create Account
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
