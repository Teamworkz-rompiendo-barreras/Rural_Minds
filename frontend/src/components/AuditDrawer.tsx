import React, { useState, useEffect } from 'react';
import axios from '../config/api';

interface AuditDrawerProps {
    orgId: string;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: () => void;
}

interface AuditData {
    id: string;
    name: string;
    type: string;
    status: string;
    logo_url: string | null;
    created_at: string;
    municipality: { id: string; name: string } | null;
    documents: { type: string; status: string; url: string; name: string }[];
    profile: {
        description: string;
        website: string;
        contact_email: string;
        employees: string;
    };
}

interface Municipality {
    id: string;
    name: string;
}

const AuditDrawer: React.FC<AuditDrawerProps> = ({ orgId, isOpen, onClose, onStatusChange }) => {
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(false);

    // Actions State
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [selectedMuni, setSelectedMuni] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    useEffect(() => {
        if (isOpen && orgId) {
            fetchData();
            fetchMunicipalities();
        }
    }, [isOpen, orgId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/admin/audit/${orgId}`);
            setData(res.data);
            if (res.data.municipality) {
                setSelectedMuni(res.data.municipality.id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMunicipalities = async () => {
        try {
            const res = await axios.get('/admin/municipalities');
            setMunicipalities(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleValidate = async () => {
        // Validation Logic: Check if files are missing
        const missingFiles = data?.documents.some(d => d.status === 'missing');
        if (missingFiles) {
            alert("No se puede validar la excelencia: Faltan archivos obligatorios (Logo, Documentación legal).");
            return;
        }

        if (!data?.logo_url) {
            alert("No se puede validar: Falta el logo de la entidad.");
            return;
        }

        try {
            await axios.post(`/admin/audit/approve/${orgId}`);
            alert('✅ Sello de Excelencia validado correctamente.');
            onStatusChange();
            onClose();
        } catch (err) {
            alert('Error al validar.');
        }
    };

    const handleReject = async () => {
        if (!rejectReason) {
            alert('Por favor, indica el motivo del rechazo.');
            return;
        }
        try {
            await axios.post(`/admin/audit/reject/${orgId}?reason=${encodeURIComponent(rejectReason)}`);
            alert('Entidad rechazada. Se ha notificado los cambios requeridos.');
            onStatusChange();
            onClose();
        } catch (err) {
            alert('Error al rechazar.');
        }
    };

    const handleAssignMuni = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const muniId = e.target.value;
        setSelectedMuni(muniId);
        if (!muniId) return;

        try {
            await axios.post(`/admin/organizations/${orgId}/link-municipality`, { municipality_id: muniId });
            // Toast or silent update
        } catch (err) {
            console.error(err);
            alert('Error al asignar municipio.');
        }
    };

    const handleRequestLogo = () => {
        alert(`📧 Correo de solicitud de activos enviado a ${data?.profile.contact_email}`);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform overflow-y-auto border-l border-gray-200">
                {loading || !data ? (
                    <div className="p-10 text-center text-gray-500 font-sans">Cargando ficha...</div>
                ) : (
                    <div className="flex flex-col min-h-full">
                        {/* 1. Header (Identificación) */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <div className="flex justify-between items-start mb-4">
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕ Cerrar</button>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                    ${data.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                `}>
                                    {data.status === 'validated' ? 'Validado' : 'Pendiente de Revisión'}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold text-n900 mb-1" style={{ fontFamily: 'Futura, sans-serif' }}>
                                {data.name}
                            </h2>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">
                                    {data.type === 'municipality' ? 'Ayuntamiento' : 'Empresa'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Reg: {new Date(data.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* 2. Panel de Verificación (Checklist) */}
                        <div className="p-6 space-y-8 flex-grow">

                            {/* Identidad Visual */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Identidad Visual</h3>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {data.logo_url ? (
                                        <img src={data.logo_url} alt="Logo" className="w-16 h-16 object-contain bg-white rounded border border-gray-100" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs text-center p-1">
                                            Sin Logo
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700">{data.logo_url ? 'Logo cargado' : 'Falta archivo'}</p>
                                        {!data.logo_url && (
                                            <button
                                                onClick={handleRequestLogo}
                                                className="text-xs text-p2 hover:underline mt-1 font-medium"
                                            >
                                                📩 Solicitar logo al cliente
                                            </button>
                                        )}
                                    </div>
                                    {data.logo_url && <span className="text-green-500 text-xl">✓</span>}
                                </div>
                            </section>

                            {/* Documentación Legal */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Documentación Legal</h3>
                                <ul className="space-y-2">
                                    {data.documents.map((doc, idx) => (
                                        <li key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">📄</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{doc.type}</p>
                                                    <a href={doc.url} className="text-xs text-gray-500 hover:text-p2 underline decoration-gray-300">
                                                        {doc.name}
                                                    </a>
                                                </div>
                                            </div>
                                            <span className="text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded">OK</span>
                                        </li>
                                    ))}
                                    {/* Warning if list empty (though we mocked it) */}
                                    {data.documents.length === 0 && (
                                        <p className="text-sm text-red-500 italic">No hay documentos subidos.</p>
                                    )}
                                </ul>
                            </section>

                            {/* Campos de Perfil */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Datos del Perfil</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Sector:</span>
                                        <span className="col-span-2 font-medium text-gray-900">{data.profile.description}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Tamaño:</span>
                                        <span className="col-span-2 font-medium text-gray-900">{data.profile.employees}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Contacto:</span>
                                        <span className="col-span-2 font-medium text-gray-900">{data.profile.contact_email}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Asignación Municipio */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Ubicación (Nodo)</h3>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded font-sans text-sm focus:ring-2 focus:ring-p2 focus:border-transparent outline-none"
                                    value={selectedMuni}
                                    onChange={handleAssignMuni}
                                >
                                    <option value="">-- Seleccionar Municipio --</option>
                                    {municipalities.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Vincula esta organización a un nodo del mapa.</p>
                            </section>

                        </div>

                        {/* 3. Sistema de Control (Footer Actions) */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            {!showRejectInput ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRejectInput(true)}
                                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-white hover:text-red-600 transition-colors"
                                    >
                                        Rechazar / Cambios
                                    </button>
                                    <button
                                        onClick={handleValidate}
                                        className="flex-[2] py-3 px-4 bg-p2 text-white font-bold rounded-lg hover:bg-p2/90 shadow-lg shadow-blue-900/10 transition-all transform hover:-translate-y-0.5"
                                        style={{ backgroundColor: '#374BA6' }}
                                    >
                                        Validar Sello
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-fade-in">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Motivo del rechazo</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
                                        rows={3}
                                        placeholder="Ej: El archivo de identidad está caducado..."
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRejectInput(false)}
                                            className="flex-1 py-2 text-gray-500 font-bold text-sm hover:text-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm"
                                        >
                                            Enviar Feedback
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AuditDrawer;
