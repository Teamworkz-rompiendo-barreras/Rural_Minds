import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MatchSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyName: string;
    projectName: string;
    candidateName: string;
    applicationId: string;
}

const MatchSuccessModal: React.FC<MatchSuccessModalProps> = ({ isOpen, onClose, companyName, projectName, candidateName, applicationId }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border-t-4 border-p2">
                <div className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-primary mb-4">
                        ¡Buenas noticias! <span className="text-p2">{companyName}</span> ha aceptado tu match.
                    </h2>

                    <div className="text-gray-700 space-y-4 mb-8 leading-relaxed">
                        <p>¡Hola, <strong>{candidateName}</strong>!</p>
                        <p>Tenemos excelentes noticias. La empresa <strong>{companyName}</strong> ha revisado tu postulación para el proyecto "<strong>{projectName}</strong>" y le encanta tu perfil.</p>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="font-bold text-green-900 mb-1">✅ Lo más importante:</p>
                            <p className="text-green-800 text-sm">
                                Han validado tus necesidades de adecuación. Esto significa que se comprometen a preparar el entorno de trabajo para que puedas brillar desde el primer día.
                            </p>
                        </div>

                        <p className="italic text-gray-500">Tu talento, sin barreras.</p>

                        <p>¿Qué sigue ahora? Hemos abierto un canal de comunicación directo para que hables con el equipo. No hay prisa.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                onClose();
                                navigate(`/chat/${applicationId}`);
                            }}
                            className="flex-1 bg-p2 text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-md"
                        >
                            Ir al chat del proyecto
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 font-bold hover:text-gray-700 px-4"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
                <div className="bg-gray-100 p-4 text-center text-xs text-gray-500 font-bold">
                    Rural Minds: Innovación con Denominación de Origen
                </div>
            </div>
        </div>
    );
};

export default MatchSuccessModal;
