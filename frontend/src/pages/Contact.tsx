
import React from 'react';
import { Link } from 'react-router-dom';

const Contact: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-heading font-bold text-p2 mb-4">Agenda una Demo</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Descubre cómo Rural Minds puede transformar la inclusión en tu organización.
                </p>
            </header>

            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-bold text-n900 mb-2">Nombre Completo</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-focus-ring focus:border-p2 outline-none"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-n900 mb-2">Email Corporativo</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-focus-ring focus:border-p2 outline-none"
                                placeholder="tu@empresa.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="company" className="block text-sm font-bold text-n900 mb-2">Organización</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-focus-ring focus:border-p2 outline-none"
                            placeholder="Nombre de tu empresa o ayuntamiento"
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-bold text-n900 mb-2">Tu Rol</label>
                        <select
                            id="role"
                            name="role"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-focus-ring focus:border-p2 outline-none"
                        >
                            <option value="hr">Recursos Humanos</option>
                            <option value="manager">Dirección</option>
                            <option value="dei">Diversidad e Inclusión</option>
                            <option value="municipality">Ayuntamiento</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-bold text-n900 mb-2">¿Qué te gustaría saber?</label>
                        <textarea
                            id="message"
                            name="message"
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-focus-ring focus:border-p2 outline-none resize-none"
                            placeholder="Cuéntanos tus necesidades de inclusión..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-p2 text-white font-bold py-4 rounded-lg hover:bg-p2/90 transition-all shadow-md focus:ring-4 focus:ring-focus-ring outline-none text-lg"
                    >
                        Solicitar Demo Gratuita
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Te responderemos en menos de 24 horas laborables.
                </p>
            </div>

            <div className="mt-10 text-center">
                <p className="text-gray-600 mb-4">¿Prefieres explorar primero?</p>
                <Link to="/register" className="text-p2 font-bold underline hover:no-underline">
                    Crea una cuenta gratuita →
                </Link>
            </div>
        </div>
    );
};

export default Contact;
