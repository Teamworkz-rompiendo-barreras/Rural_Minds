import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary text-white py-24 px-6 text-center">
                <div className="max-w-5xl mx-auto flex flex-col items-center">
                    {/* Logo Real (con fondo blanco para visibilidad) */}
                    <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
                        <img src="/logo.png" alt="Rural Minds Logo" className="h-24 w-auto object-contain bg-white p-3 rounded-xl shadow-md" />
                    </div>

                    {/* Titular: Más pequeño para asegurar una línea */}
                    <div className="w-full px-4 mb-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-wide mx-auto max-w-screen-xl whitespace-nowrap overflow-hidden text-ellipsis">
                            Innovación con Denominación de Origen
                        </h1>
                    </div>

                    <p className="max-w-3xl text-[18px] leading-relaxed mb-10 font-sans text-gray-100" style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif" }}>
                        Convertimos la neurodiversidad en ventaja competitiva.
                        <br />
                        El sistema operativo completo para la inclusión y retención de talento.
                    </p>

                    <div className="flex justify-center gap-4">
                        {/* Botón Primario: P1 (#F2D680) + N900 (#0D1321) */}
                        <Link to="/register" className="px-8 py-4 bg-accent text-[#0D1321] font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-lg text-lg flex items-center gap-2">
                            Empieza Gratis
                        </Link>
                        <Link to="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-primary transition-all text-lg">
                            Agenda una Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Real Cases / Social Proof */}
            <section className="py-16 px-6 bg-neutral-bg">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-heading font-bold text-center mb-12 text-primary">Líderes Inclusivos Confían en Rural Minds</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-accent">
                            <p className="italic text-gray-600 mb-4">"Rural Minds nos ayudó a cubrir 5 roles técnicos en un mes con candidatos increíbles."</p>
                            <div className="font-bold text-primary">- TechFlow Solutions</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-primary">
                            <p className="italic text-gray-600 mb-4">"El perfil sensorial cambió nuestra forma de hacer onboarding. La retención subió un 40%."</p>
                            <div className="font-bold text-primary">- GreenLeaf Co-op</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-accent">
                            <p className="italic text-gray-600 mb-4">"Por fin una plataforma que entiende que la neurodiversidad es una ventaja competitiva."</p>
                            <div className="font-bold text-primary">- Innovation Hub</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid (Brief) */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl font-bold font-heading text-primary mb-12">¿Por qué Rural Minds?</h2>
                    <div className="grid md:grid-cols-2 gap-12 text-left">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Para Empresas</h3>
                            <p className="text-gray-600">Accede a talento inexplorado, gestiona ajustes con nuestro Catálogo de Soluciones y mide tus KPIs de inclusión.</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Para Talento</h3>
                            <p className="text-gray-600">Crea un perfil que hable tu idioma (Sensorial, Comunicación) y encuentra roles remotos que se ajusten a ti.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
