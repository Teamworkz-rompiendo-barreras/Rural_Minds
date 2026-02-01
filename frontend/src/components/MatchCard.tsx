import React from 'react';

interface MatchCardProps {
    candidateName: string;
    matchScore: number;
    adjustments: string[];
    isLocal: boolean;
    onAccept: () => void;
    onContact: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ candidateName, matchScore, adjustments, isLocal, onAccept, onContact }) => {
    // Colour logic for match score
    const scoreColor = matchScore >= 80 ? 'text-green-600' : matchScore >= 50 ? 'text-yellow-600' : 'text-red-500';
    const ringColor = matchScore >= 80 ? '#059669' : matchScore >= 50 ? '#D97706' : '#EF4444';

    // Cost calculation (Mock logic as requested)
    const costLevel = adjustments.length === 0 ? "Coste 0" : adjustments.length < 3 ? "Bajo Coste" : "Requiere Inversión";

    return (
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden" tabIndex={0} role="article" aria-label={`Tarjeta de compatibilidad para ${candidateName}`}>
            {isLocal && (
                <div className="absolute top-0 right-0 bg-p2 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                    🌍 Talento Local - D.O.
                </div>
            )}

            <div className="flex gap-6 items-start">
                {/* Circular Indicator */}
                <div className="flex-shrink-0 relative w-24 h-24 flex items-center justify-center transform hover:scale-105 transition-transform" aria-label={`Compatibilidad de adecuación del ${matchScore} por ciento`}>
                    <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                        <circle cx="50%" cy="50%" r="40" stroke="#E5E7EB" strokeWidth="8" fill="transparent" />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="40"
                            stroke={ringColor}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - matchScore / 100)}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className={`text-2xl font-bold font-heading ${scoreColor}`}>{Math.round(matchScore)}%</span>
                    </div>
                </div>

                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-heading font-bold text-primary mb-1">{candidateName}</h3>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facilidad de Adaptación</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 font-bold flex items-center gap-2">
                        {matchScore > 80 ? '✅ Alta Compatibilidad' : '⚠️ Requiere Ajustes'}
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">{costLevel}</span>
                    </p>

                    <div className="space-y-2 mb-6">
                        {adjustments.slice(0, 3).map((adj, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="text-lg" aria-hidden="true">🛠️</span>
                                <span>{adj}</span>
                            </div>
                        ))}
                        {adjustments.length > 3 && (
                            <p className="text-xs text-center text-gray-500 italic">+ {adjustments.length - 3} ajustes más...</p>
                        )}
                        {adjustments.length === 0 && (
                            <p className="text-sm text-green-700 italic flex items-center gap-2">
                                <span aria-hidden="true">🎉</span> Sin ajustes requeridos. ¡Ready to work!
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onAccept}
                            className="flex-1 bg-p2 text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors focus:ring-4 focus:ring-focus-ring outline-none"
                            aria-label={`Aceptar match con ${candidateName}`}
                        >
                            Aceptar Match
                        </button>
                        <button
                            onClick={onContact}
                            className="flex-1 border-2 border-gray-300 text-gray-600 font-bold py-2 px-4 rounded hover:border-gray-400 hover:text-gray-800 transition-colors focus:ring-4 focus:ring-focus-ring outline-none"
                            aria-label={`Contactar con ${candidateName}`}
                        >
                            Contactar
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-center text-gray-500">
                Esta incorporación mejora tu índice de impacto social en el municipio en un <span className="font-bold text-p2">5%</span>
            </div>
        </div>
    );
};

export default MatchCard;
