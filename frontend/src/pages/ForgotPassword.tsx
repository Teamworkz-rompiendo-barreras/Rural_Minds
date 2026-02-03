import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);

    // Cooldown timer
    React.useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const sendEmail = async (emailAddr: string) => {
        await axios.post(`/auth/forgot-password?email=${encodeURIComponent(emailAddr)}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await sendEmail(email);
            setStatus('success');
            setMessage('Si el email existe, recibirás instrucciones para restablecer tu contraseña en breve.');
            setCooldown(30);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Hubo un error al procesar tu solicitud. Inténtalo de nuevo.');
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            await sendEmail(email);
            setMessage('Si el email existe, recibirás instrucciones para restablecer tu contraseña en breve.');
            setCooldown(30);
        } catch (err) {
            console.error(err);
            alert('Hubo un error al reenviar el email.');
        } finally {
            setIsResending(false);
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

                        <div className="mb-6 space-y-2">
                            <p className="text-sm text-gray-600">¿No has recibido el email?</p>
                            <button
                                onClick={handleResend}
                                disabled={cooldown > 0 || isResending}
                                className="text-primary font-bold underline hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                            >
                                {isResending ? 'Enviando...' : (cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar email')}
                            </button>
                        </div>

                        <Link to="/login" className="text-gray-500 font-medium hover:text-gray-700 text-sm">
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
