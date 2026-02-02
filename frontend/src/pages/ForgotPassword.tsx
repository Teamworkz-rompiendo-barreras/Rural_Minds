import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await axios.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
            setStatus('success');
            setMessage('Si el email existe, recibirás instrucciones para restablecer tu contraseña en breve.');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Hubo un error al procesar tu solicitud. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="flex items-center justify-center flex-grow p-4 min-h-[60vh]">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-primary">
                <h2 className="text-2xl font-heading font-bold text-primary mb-4 text-center">Recuperar Contraseña</h2>

                {status === 'success' ? (
                    <div className="text-center">
                        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
                            {message}
                        </div>
                        <Link to="/login" className="text-primary font-bold hover:underline">
                            Volver a Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 mb-6 text-center text-sm">
                            Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
                        </p>

                        {status === 'error' && (
                            <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm text-center">
                                {message}
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
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                            >
                                {status === 'loading' ? 'Enviando...' : 'Enviar enlace'}
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            <Link to="/login" className="text-gray-500 text-sm hover:text-primary transition-colors">
                                Cancelar y volver
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
