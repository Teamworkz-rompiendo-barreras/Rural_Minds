import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

interface MunicipalityDetails {
    id: string;
    municipality: string;
    province: string;
    autonomous_community: string;
    slogan: string;
    description: string;
    internet_speed: string;
    connectivity_info: string;
    climate_co2: string;
    services: {
        health: string;
        education: string;
        coworking: string;
        commerce: string;
    };
    gallery_urls: string[];
    landing_guide_url?: string;
    adl_contact_email?: string;
}

const MunicipalityProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [details, setDetails] = useState<MunicipalityDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`/locations/${id}/details`);
                setDetails(res.data);

                // Check if already in target locations (if user is logged in)
                if (user && user.talent_profile?.target_locations?.includes(id!)) {
                    setSaved(true);
                }
            } catch (err) {
                console.error("Error fetching details", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id, user]);

    const handleSave = async () => {
        if (!user) return navigate('/login');
        if (saved) return; // Already saved

        try {
            // Fetch current profile to append
            const profileRes = await axios.get('/api/profiles/me');
            const currentTargets = profileRes.data.target_locations || [];

            await axios.put('/api/profiles/me', {
                target_locations: [...currentTargets, id]
            });
            setSaved(true);
            // Optional: Show toast here too? The backend sends email anyway.
        } catch (err) {
            console.error("Error saving location", err);
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;
    if (!details) return <div className="p-10 text-center">Municipio no encontrado</div>;

    return (
        <div className="min-h-screen bg-n100 pb-20 font-body text-n900">
            {/* 1. Header Visual */}
            <header className="relative h-64 md:h-80 bg-n900 overflow-hidden">
                {details.gallery_urls[0] ? (
                    <img
                        src={details.gallery_urls[0]}
                        alt={`Vista de ${details.municipality}`}
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-p2 to-p1 opacity-80" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-n900/90 to-transparent flex flex-col justify-end p-6 md:p-10">
                    <div className="max-w-4xl mx-auto w-full">
                        <span className="inline-block bg-p1 text-n900 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                            Ayuntamiento Adherido a Rural Minds
                        </span>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                            {details.municipality}
                        </h1>
                        <p className="text-white/90 text-xl font-light italic">
                            "{details.slogan}"
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
                {/* 2. Actions & Intro */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div>
                        <p className="text-lg text-n600 leading-relaxed max-w-2xl">
                            {details.description}
                        </p>
                        <div className="mt-4 flex gap-4 text-sm text-n500">
                            <span>📍 {details.province}</span>
                            <span>🏢 {details.autonomous_community}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={saved}
                            className={`btn-primary w-full md:w-auto px-8 transition-all ${saved ? 'bg-green-600 border-green-600 hover:bg-green-700' : ''}`}
                        >
                            {saved ? '✅ En tus destinos' : '❤️ Añadir a mis destinos'}
                        </button>
                        {details.landing_guide_url && (
                            <a
                                href={details.landing_guide_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary text-center text-sm py-2"
                                aria-label={`Descargar guía de servicios y vivienda de ${details.municipality}`}
                            >
                                📥 Descargar Guía
                            </a>
                        )}
                        <button
                            onClick={() => navigate(-1)}
                            className="text-n500 hover:text-p2 underline text-sm mt-1 text-center"
                        >
                            ← Volver al explorador
                        </button>
                    </div>
                </div>

                {/* 3. Semaphore (Critical Data) */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-lg border-l-4 border-green-500 shadow-sm">
                        <div className="text-3xl mb-2">📶</div>
                        <h3 className="font-bold text-n900">Conectividad Digital</h3>
                        <p className="text-p2 font-bold text-lg">{details.internet_speed}</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border-l-4 border-yellow-500 shadow-sm">
                        <div className="text-3xl mb-2">🚆</div>
                        <h3 className="font-bold text-n900">Transporte</h3>
                        <p className="text-n700">{details.connectivity_info}</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <div className="text-3xl mb-2">🍃</div>
                        <h3 className="font-bold text-n900">Clima Sensorial</h3>
                        <p className="text-n700">{details.climate_co2}</p>
                    </div>
                </section>

                {/* 4. Services Grid */}
                <section>
                    <h2 className="text-2xl font-heading font-bold text-p2 mb-6 border-b border-gray-200 pb-2">
                        Servicios Esenciales
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex gap-4 items-start p-4 hover:bg-white rounded-lg transition-colors">
                            <div className="bg-n100 p-3 rounded-full text-p2 text-2xl">🏥</div>
                            <div>
                                <h4 className="font-bold text-lg">Salud</h4>
                                <p className="text-n600">{details.services.health}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-4 hover:bg-white rounded-lg transition-colors">
                            <div className="bg-n100 p-3 rounded-full text-p2 text-2xl">🏫</div>
                            <div>
                                <h4 className="font-bold text-lg">Educación</h4>
                                <p className="text-n600">{details.services.education}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-4 hover:bg-white rounded-lg transition-colors">
                            <div className="bg-n100 p-3 rounded-full text-p2 text-2xl">🏢</div>
                            <div>
                                <h4 className="font-bold text-lg">Coworking</h4>
                                <p className="text-n600">{details.services.coworking}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-4 hover:bg-white rounded-lg transition-colors">
                            <div className="bg-n100 p-3 rounded-full text-p2 text-2xl">🛒</div>
                            <div>
                                <h4 className="font-bold text-lg">Comercio</h4>
                                <p className="text-n600">{details.services.commerce}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MunicipalityProfile;
