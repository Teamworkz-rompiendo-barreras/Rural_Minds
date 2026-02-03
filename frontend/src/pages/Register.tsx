import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../config/api';

const Register: React.FC = () => {
    const [searchParams] = useSearchParams();
    const refParam = searchParams.get('ref');

    // Default role to enterprise if ref is present (assumption based on usage)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState(refParam ? 'enterprise' : 'enterprise'); // Defaulting
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            org_data: {
                name: role === 'enterprise' ? orgName : `Freelance - ${email}`,
                subscription_plan: 'starter',
                municipality_id: role === 'enterprise' ? refParam : undefined
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
            setSuccess(true);
        } catch (err: any) {
            console.error("Registration error:", err);
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
            setError(message || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    // Success state - show verification message
    if (success) {
        return (
            <div className="flex items-center justify-center flex-grow p-4">
                <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full border-t-4 border-green-500 text-center">
                    <div className="text-6xl mb-6">📧</div>
                    <h2 className="text-2xl font-heading font-bold text-green-700 mb-4">
                        ¡Revisa tu Email!
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Hemos enviado un enlace de verificación a <strong className="text-n900">{email}</strong>.
                        <br /><br />
                        Haz clic en el enlace del email para activar tu cuenta.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-6">
                        <strong>⚠️ Importante:</strong> No podrás iniciar sesión hasta que confirmes tu email.
                    </div>
                    <div className="space-y-3">
                        <Link
                            to="/login"
                            className="block w-full bg-p2 text-white font-bold py-3 px-6 rounded-lg hover:bg-p2/90 transition-all"
                        >
                            Ir al Login
                        </Link>
                        <p className="text-sm text-gray-500">
                            ¿No recibiste el email?{' '}
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-p2 font-bold underline hover:no-underline"
                            >
                                Reenviar
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center flex-grow p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-accent">
                {/* Unified Auth Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <Link
                        to="/login"
                        className="flex-1 text-center py-2 font-bold text-gray-500 hover:text-primary transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                    <Link
                        to="/register"
                        className="flex-1 text-center py-2 font-bold text-primary border-b-2 border-primary"
                    >
                        Registrarse
                    </Link>
                </div>

                <h1 className="text-3xl font-heading font-bold text-primary mb-6 text-center">Únete a Rural Minds</h1>

                {/* Free Access Explainer */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-gray-700 border border-blue-100">
                    <h3 className="font-bold text-p2 mb-2">🚀 Acceso Gratuito</h3>
                    <p>
                        Registrarse no tiene coste. Podrás configurar tu perfil de inclusión, explorar ofertas y acceder a recursos del Learning Center de por vida.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm" role="alert" aria-live="polite">
                        {error}
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
                                minLength={8}
                                placeholder="Mínimo 8 caracteres"
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

                    <div>
                        <label className="block text-sm font-bold mb-2">Soy...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('talent')}
                                className={`p-3 border rounded-lg text-center transition-all ${role === 'talent' ? 'border-primary bg-blue-50 text-primary font-bold ring-2 ring-focus-ring' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                🧑‍💻 Talento
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('enterprise')}
                                className={`p-3 border rounded-lg text-center transition-all ${role === 'enterprise' ? 'border-primary bg-blue-50 text-primary font-bold ring-2 ring-focus-ring' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                🏢 Empresa
                            </button>
                        </div>
                    </div>

                    {role === 'enterprise' && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Nombre de la Organización</label>
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                                required
                                placeholder="Tu empresa o ayuntamiento"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-primary font-bold hover:underline">Iniciar Sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
