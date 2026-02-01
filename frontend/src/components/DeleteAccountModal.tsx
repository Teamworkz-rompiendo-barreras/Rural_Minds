import React, { useState } from 'react';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [reason, setReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleNext = () => setStep(2);

    const handleConfirm = async () => {
        setIsDeleting(true);
        await onConfirm(reason);
        setIsDeleting(false);
        onClose();
        setStep(1); // Reset for next time
        setReason('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {step === 1 ? (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                            ⚠️
                        </div>
                        <h3 className="text-2xl font-bold text-n900">¿Estás seguro?</h3>
                        <p className="text-gray-600">
                            Esta acción es irreversible. Perderás acceso a todos sus datos, proyectos y candidatos.
                        </p>
                        <div className="flex gap-4 justify-center pt-2">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors focus:ring-4 focus:ring-red-200"
                            >
                                Sí, eliminar cuenta
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-n900 mb-2">Lamentamos verte partir</h3>
                            <p className="text-sm text-gray-600">¿Podrías decirnos el motivo? Nos ayuda a mejorar.</p>
                        </div>

                        <textarea
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-p2 outline-none resize-none h-32 text-sm"
                            placeholder="Ej: No encontré lo que buscaba..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isDeleting}
                        />

                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 font-medium text-sm"
                                disabled={isDeleting}
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isDeleting}
                                className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeleteAccountModal;
