import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../config/api';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Las contraseñas no coinciden.');
            return;
        }

        if (!token) {
            setStatus('error');
            setMessage('Token inválido o faltante.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await axios.post('/auth/reset-password', {
                token: token,
                new_password: password
            });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(err.response?.data?.detail || 'Error al restablecer contraseña. El enlace puede haber expirado.');
        }
    };

    if (!token) {
        return (
            <div className="p-8 text-center text-red-600 font-bold">
                Enlace inválido. Por favor solicita uno nuevo.
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center flex-grow p-4 min-h-[60vh]">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-primary">
                <h2 className="text-2xl font-heading font-bold text-primary mb-6 text-center">Nueva Contraseña</h2>

                {status === 'success' ? (
                    <div className="bg-green-100 text-green-800 p-4 rounded text-center">
                        <p className="font-bold mb-2">¡Contraseña actualizada!</p>
                        <p>Redirigiendo al inicio de sesión...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'error' && (
                            <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm text-center">
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-focus-ring outline-none"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Guardando...' : 'Cambiar Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
