
import React from 'react';

interface RelocationLead {
    id: string;
    talent_name: string;
    origin_city: string;
    origin_province: string;
    target_municipality: string;
    challenge_title: string;
    company_name: string;
    sensory_requirement_highlight: string;
    status: string;
}

interface RelocationLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: RelocationLead | null;
    municipalityName: string;
    onStatusUpdate: (id: string, status: string) => Promise<void>;
}

const RelocationLeadModal: React.FC<RelocationLeadModalProps> = ({ isOpen, onClose, lead, municipalityName, onStatusUpdate }) => {
    if (!isOpen || !lead) return null;

    const welcomeScript = `Hola ${lead.talent_name || lead.id.slice(0, 5)}, soy el Agente de Desarrollo de ${municipalityName}. Hemos visto que te interesa el proyecto de ${lead.company_name} y que te planteas venir a vivir con nosotros. Queremos decirte que en la zona donde está la empresa contamos con servicios adaptados y que, respecto a tu necesidad de ${lead.sensory_requirement_highlight}, nuestro pueblo es especialmente tranquilo en esa área. ¿Te gustaría que te ayudemos a buscar opciones de vivienda?`;

    const handleCopy = () => {
        navigator.clipboard.writeText(welcomeScript);
        alert("Script copiado al portapapeles. ¡Ya puedes pegarlo en el chat!");
        onStatusUpdate(lead.id, 'contacted');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-100"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header with Impact Icon */}
                <div className="bg-gradient-to-r from-p2 to-indigo-900 p-8 text-white relative">
                    <div className="absolute top-6 right-8 text-6xl opacity-20">🏠</div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="bg-[#F2D680] text-n900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                            Nuevo Vecino Potencial
                        </span>
                    </div>
                    <h2 id="modal-title" className="text-3xl font-heading font-black">Iniciar Proceso de Acogida</h2>
                    <p className="text-indigo-100 mt-2 font-medium">Este talento ha marcado el compromiso de mudanza al municipio.</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Lead Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Candidato</p>
                            <p className="text-lg font-bold text-n900">{lead.talent_name || `RM-${lead.id.slice(0, 4).toUpperCase()}`}</p>
                            <p className="text-sm text-gray-500">Origen: {lead.origin_city}, {lead.origin_province}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Proyecto Objetivo</p>
                            <p className="text-lg font-bold text-n900">{lead.challenge_title}</p>
                            <p className="text-sm text-p2 font-bold">{lead.company_name}</p>
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-gray-200">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Necesidad Sensorial Relevante</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">✨</span>
                                <p className="text-md font-bold text-emerald-700 italic">"{lead.sensory_requirement_highlight}"</p>
                            </div>
                        </div>
                    </div>

                    {/* Script Generator */}
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <h3 className="text-lg font-heading font-black text-n900">Script de Bienvenida</h3>
                                <p className="text-xs text-gray-500 font-medium lowercase">Pre-redactado estratégicamente para facilitar el contacto inicial</p>
                            </div>
                            <span className="text-[10px] font-bold text-p2 uppercase tracking-widest bg-p2/5 px-2 py-1 rounded">Basado en perfil sensorial</span>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-p2 to-[#F2D680] rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                            <div className="relative bg-white border-2 border-p2/20 p-6 rounded-2xl">
                                <p className="text-n900 text-sm leading-relaxed font-serif italic text-gray-600">
                                    "{welcomeScript}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={handleCopy}
                            className="flex-1 bg-p2 text-white font-black py-4 rounded-2xl shadow-xl shadow-p2/20 hover:bg-indigo-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span>📋 Copiar y Empezar</span>
                        </button>
                        <a
                            href="https://ruralminds.es/guia-aterrizaje.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-4 bg-white border-2 border-gray-200 text-n900 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <span>📎 Ver Guía Locales</span>
                        </a>
                    </div>

                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Al pulsar en copiar, el estado del lead cambiará a "Contactado"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RelocationLeadModal;
