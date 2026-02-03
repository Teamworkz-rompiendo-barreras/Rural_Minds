import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/api';

const MunicipalitySuccess: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuth(); // Unused here, we fetch org details directly
    const [municipalityName, setMunicipalityName] = useState('Tu Municipio');

    useEffect(() => {
        // Fetch org details to get name
        const fetchDetails = async () => {
            try {
                const res = await axios.get('/org/details');
                setMunicipalityName(res.data.name);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDetails();
    }, []);

    const handleDashboard = () => {
        navigate('/municipality-dashboard');
    };

    const handleInvite = () => {
        // Navigate to dashboard with invite modal open trigger? 
        // For now, just go to dashboard, user can click invite there.
        // Or create a specific invite route? 
        // Let's go to dashboard.
        navigate('/municipality-dashboard');
    };

    return (
        <div className="min-h-screen bg-n100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
            {/* Background Decoration (Abstract Confetti) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-p1 rounded-full animate-bounce delay-100 opacity-60"></div>
                <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-p2 rounded-full animate-pulse delay-200 opacity-50"></div>
                <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-red-400 rounded-full animate-bounce delay-500 opacity-60"></div>
                <div className="absolute top-1/2 right-1/3 w-5 h-5 bg-green-400 rounded-full animate-pulse delay-700 opacity-40"></div>
                <div className="absolute top-10 left-10 w-8 h-8 bg-p1 rounded-full opacity-20"></div>
                <div className="absolute bottom-10 right-10 w-12 h-12 bg-p2 rounded-full opacity-20"></div>
            </div>

            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center relative z-10 border-t-8 border-p2 animate-fade-in-up">

                {/* Icon / Brand */}
                <div className="flex justify-center mb-6">
                    <div className="bg-p2 text-white p-4 rounded-full shadow-lg">
                        <span className="text-4xl">🏛️</span>
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-heading font-bold text-n900 mb-4 focus:outline-none" tabIndex={-1} autoFocus>
                    ¡Enhorabuena! <br />
                    <span className="text-p2">{municipalityName}</span> ya es un referente de innovación.
                </h1>

                <p className="text-lg text-n600 mb-8 leading-relaxed">
                    Has completado el registro con éxito. Tu municipio ya es visible para el talento que busca una nueva vida y para las empresas que quieren transformar su impacto social.
                </p>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-p2 transition-colors">
                        <div className="text-2xl mb-2">📍</div>
                        <h3 className="font-bold text-n900 text-sm mb-1">Ficha Activa</h3>
                        <p className="text-xs text-n500">Talento visible: Fibra, servicios y vida.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-p2 transition-colors">
                        <div className="text-2xl mb-2">🏢</div>
                        <h3 className="font-bold text-n900 text-sm mb-1">Validación</h3>
                        <p className="text-xs text-n500">Certifica a tus empresas locales.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-p2 transition-colors">
                        <div className="text-2xl mb-2">📈</div>
                        <h3 className="font-bold text-n900 text-sm mb-1">Impacto</h3>
                        <p className="text-xs text-n500">Tu dashboard recoge los primeros datos.</p>
                    </div>
                </div>

                <div className="flex justify-center mb-8">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Innovación con Denominación de Origen
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button
                        onClick={handleDashboard}
                        className="btn-primary w-full md:w-auto px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                        Ir a mi Panel de Control
                    </button>
                    {/* Secondary Action */}
                    <button
                        onClick={handleInvite}
                        className="px-8 py-3 bg-white text-n700 border border-gray-300 font-bold rounded-xl hover:bg-gray-50 transition-colors w-full md:w-auto"
                    >
                        Invitar Empresa Local
                    </button>
                </div>
            </div>

            <footer className="mt-8 text-n500 text-sm">
                Rural Minds &copy; 2026
            </footer>
        </div>
    );
};

export default MunicipalitySuccess;
