import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', email); // OAuth2 expects 'username'
            formData.append('password', password);

            const response = await axios.post('http://127.0.0.1:8000/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            login(response.data.access_token);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center flex-grow p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-primary">
                <h2 className="text-3xl font-heading font-bold text-primary mb-6 text-center">Login</h2>
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
                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-2 rounded hover:bg-opacity-90 transition-colors"
                    >
                        Sign In
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
