import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../config/api';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            await axios.post('/auth/register', payload);
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
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-primary focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
