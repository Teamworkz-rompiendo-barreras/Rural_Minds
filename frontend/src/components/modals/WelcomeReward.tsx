import React, { useEffect, useRef, useState } from 'react';
import LocalSeal from '../badges/LocalSeal';
import { pdf } from '@react-pdf/renderer';
import SealUsageGuidePDF from '../pdf/SealUsageGuidePDF';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface WelcomeRewardModalProps {
    municipalityName: string;
    onClose: () => void;
}

const WelcomeRewardModal: React.FC<WelcomeRewardModalProps> = ({ municipalityName, onClose }) => {
    const sealRef = useRef<SVGSVGElement>(null);
    const [generating, setGenerating] = useState(false);

    // Simple confetti effect
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const generateAssets = async () => {
        if (!sealRef.current) return null;

        // 1. Generate SVG Blob
        const svgData = new XMLSerializer().serializeToString(sealRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

        // 2. Generate PNG Blob (via Canvas)
        const canvas = document.createElement('canvas');
        canvas.width = 1200; // High res
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');

        // Wait for image load
        const pngBlob = await new Promise<Blob | null>((resolve) => {
            const img = new Image();
            img.onload = () => {
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => resolve(blob), 'image/png');
                } else {
                    resolve(null);
                }
            };
            img.src = URL.createObjectURL(svgBlob);
        });

        // 3. Generate PDF Blob
        const pdfBlob = await pdf(<SealUsageGuidePDF municipalityName={municipalityName} />).toBlob();

        return { svgBlob, pngBlob, pdfBlob };
    };

    const handleDownloadKit = async () => {
        setGenerating(true);
        try {
            const assets = await generateAssets();
            if (!assets || !assets.pngBlob) {
                alert("Error generando assets. Intenta descargar individualmente.");
                return;
            }

            const zip = new JSZip();
            const folder = zip.folder(`Kit_Bienvenida_RuralMinds_${municipalityName.replace(/\s+/g, '_')}`);
            if (folder) {
                folder.file("Sello_Empresa_Local.svg", assets.svgBlob);
                folder.file("Sello_Empresa_Local_AltaRes.png", assets.pngBlob);
                folder.file("Guia_Uso_Sello.pdf", assets.pdfBlob);
                folder.file("Instrucciones_Rapidas.txt",
                    `Gracias por unirte a Rural Minds.\n\nInstrucciones:\n1. Usa el SVG en tu web.\n2. Usa el PNG en firmas de email y redes sociales.\n3. Lee el PDF para más ideas.\n\nAtte, El equipo de Rural Minds.`
                );
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Kit_Bienvenida_${municipalityName.replace(/\s+/g, '_')}.zip`);

        } catch (err) {
            console.error(err);
            alert("Error al generar el Kit.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopySnippet = () => {
        const snippet = `<img src="ruta/a/tu/sello.svg" alt="Sello de Empresa Local Adherida a Rural Minds en ${municipalityName}" width="150" />`;
        navigator.clipboard.writeText(snippet);
        alert("Código copiado al portapapeles");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-n900/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full animate-confetti-fall`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-10%`,
                            backgroundColor: i % 2 === 0 ? '#374BA6' : '#FFD700',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center animate-scale-up border-4 border-p2/10 max-h-[90vh] overflow-y-auto">
                <div className="mb-6 flex justify-center">
                    <div className="animate-spin-slow-once drop-shadow-2xl bg-white rounded-full p-2">
                        <LocalSeal
                            ref={sealRef}
                            municipalityName={municipalityName}
                            width={220}
                            height={220}
                        />
                    </div>
                </div>

                <h2 className="text-3xl font-heading font-bold text-p2 mb-2">¡Enhorabuena!</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    Ya eres parte oficial del motor de cambio de <strong>{municipalityName}</strong>.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownloadKit}
                        disabled={generating}
                        className="btn-primary py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full"
                    >
                        {generating ? 'Preparando Kit...' : (
                            <><span>📦</span> Descargar Kit de Bienvenida (ZIP)</>
                        )}
                    </button>
                    <p className="text-xs text-gray-500">Incluye: SVG, PNG de alta calidad y Manual de Uso PDF</p>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg text-left border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">Snippet para tu Web:</p>
                    <code className="block bg-white p-2 text-xs font-mono text-gray-600 border border-gray-200 rounded mb-2 break-all">
                        {`<img src="..." alt="Sello de Empresa Local Adherida a Rural Minds en ${municipalityName}" ... />`}
                    </code>
                    <button
                        onClick={handleCopySnippet}
                        className="text-xs font-bold text-p2 hover:underline flex items-center gap-1"
                    >
                        📋 Copiar Código HTML
                    </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 font-medium text-sm"
                    >
                        Saltar y continuar al Panel →
                    </button>
                </div>
            </div>

            {/* Style for Confetti Animation */}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti-fall {
                    animation-name: confetti-fall;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                }
                @keyframes spin-slow-once {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .animate-spin-slow-once {
                    animation: spin-slow-once 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default WelcomeRewardModal;
