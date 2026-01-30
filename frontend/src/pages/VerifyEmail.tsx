import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../config/api';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('No se ha proporcionado un token de verificación.');
                return;
            }

            try {
                const response = await axios.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || '¡Email verificado correctamente!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.detail || 'Error al verificar el email.');
            }
        };

        verifyToken();
    }, [searchParams]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-p2">

                {status === 'loading' && (
                    <>
                        <div className="text-6xl mb-6 animate-pulse">⏳</div>
                        <h1 className="text-2xl font-heading font-bold text-n900 mb-4">
                            Verificando tu email...
                        </h1>
                        <p className="text-gray-600">Por favor, espera un momento.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-6">✅</div>
                        <h1 className="text-2xl font-heading font-bold text-green-700 mb-4">
                            ¡Verificación Exitosa!
                        </h1>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <Link
                            to="/login"
                            className="inline-block bg-p2 text-white font-bold py-3 px-8 rounded-lg hover:bg-p2/90 transition-all shadow-md"
                        >
                            Iniciar Sesión
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-6">❌</div>
                        <h1 className="text-2xl font-heading font-bold text-red-600 mb-4">
                            Error de Verificación
                        </h1>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <div className="space-y-4">
                            <Link
                                to="/login"
                                className="block bg-p2 text-white font-bold py-3 px-8 rounded-lg hover:bg-p2/90 transition-all shadow-md"
                            >
                                Ir al Login
                            </Link>
                            <p className="text-sm text-gray-500">
                                ¿Necesitas un nuevo enlace?{' '}
                                <Link to="/resend-verification" className="text-p2 font-bold underline hover:no-underline">
                                    Reenviar verificación
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
