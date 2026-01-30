import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNeedsVerification(false);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axios.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { access_token } = response.data;
            login(access_token);

            // Fetch user profile to decide navigation
            try {
                const userRes = await axios.get('/user/me', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                const role = userRes.data.role;

                // Role-based redirect
                switch (role) {
                    case 'super_admin':
                        navigate('/admin');
                        break;
                    case 'territory_admin':
                        navigate('/municipality-dashboard');
                        break;
                    case 'enterprise':
                        navigate('/enterprise-dashboard');
                        break;
                    case 'talent':
                    default:
                        navigate('/talent-dashboard');
                        break;
                }
            } catch {
                navigate('/dashboard');
            }
        } catch (err: any) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail;

            if (status === 403 && detail?.includes('confirma tu email')) {
                setNeedsVerification(true);
                setError(detail);
            } else {
                setError(detail || 'Email o contraseña incorrectos');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            await axios.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
            setError('');
            setNeedsVerification(false);
            alert('Se ha enviado un nuevo enlace de verificación a tu email.');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center flex-grow p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-primary">
                <h2 className="text-3xl font-heading font-bold text-primary mb-6 text-center">Iniciar Sesión</h2>

                {error && (
                    <div
                        className={`p-4 rounded mb-4 text-sm ${needsVerification ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'bg-red-100 text-red-700'}`}
                        role="alert"
                        aria-live="polite"
                    >
                        {needsVerification ? (
                            <>
                                <p className="font-bold mb-2">📧 Verificación pendiente</p>
                                <p className="mb-3">{error}</p>
                                <button
                                    onClick={handleResendVerification}
                                    className="text-p2 font-bold underline hover:no-underline"
                                >
                                    Reenviar email de verificación
                                </button>
                            </>
                        ) : (
                            error
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                            required
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Contraseña</label>
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
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    ¿No tienes cuenta? <Link to="/register" className="text-primary font-bold hover:underline">Regístrate</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
