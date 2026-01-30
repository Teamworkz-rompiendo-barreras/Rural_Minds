import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

interface Municipality {
    id: string;
    name: string;
    plan: string;
    created_at: string | null;
    admin: {
        email: string;
        name: string;
        status: string;
    } | null;
    associated_companies: number;
}

interface CreatedCredentials {
    email: string;
    password: string;
    login_url: string;
}

const SuperAdminDashboard: React.FC = () => {
    const { token } = useAuth();
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        admin_email: '',
        admin_name: '',
        plan: 'enterprise',
        send_email: false
    });

    useEffect(() => {
        fetchMunicipalities();
    }, [token]);

    const fetchMunicipalities = async () => {
        try {
            const res = await axios.get('/admin/municipalities');
            setMunicipalities(res.data);
        } catch (err) {
            console.error('Error fetching municipalities:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMunicipality = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const res = await axios.post('/admin/municipalities', formData);
            setCreatedCredentials(res.data.credentials);
            fetchMunicipalities();
            // Don't close modal yet - show credentials first
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al crear el ayuntamiento');
        } finally {
            setCreating(false);
        }
    };

    const closeModalAndReset = () => {
        setShowCreateModal(false);
        setCreatedCredentials(null);
        setFormData({
            name: '',
            admin_email: '',
            admin_name: '',
            plan: 'enterprise',
            send_email: false
        });
        setError('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    return (
        <div className="flex flex-col gap-8">
            <header className="mb-6 border-b border-gray-200 pb-6">
                <div className="flex items-center gap-4 mb-2">
                    <span className="bg-gray-800 text-white px-3 py-1 text-xs font-bold rounded uppercase tracking-wider">Teamworkz</span>
                    <h1 className="text-4xl font-heading font-bold text-n900">Global Dashboard</h1>
                </div>
                <p className="text-xl text-gray-600">Gobernanza global y soporte técnico del ecosistema Rural Minds.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metrics */}
                <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-gray-800">
                    <h3 className="font-heading font-bold text-lg text-gray-500 uppercase tracking-wide">Impacto Social Global</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-5xl font-bold text-n900">1,240</span>
                        <span className="text-green-600 font-bold mb-2">▲ 12%</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Inserciones exitosas este año</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-gray-800">
                    <h3 className="font-heading font-bold text-lg text-gray-500 uppercase tracking-wide">Salud del Ecosistema</h3>
                    <div className="mt-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold">Ayuntamientos Activos</span>
                            <span className="text-sm">{municipalities.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-p2 h-2 rounded-full" style={{ width: `${Math.min(municipalities.length * 2, 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between mb-1 mt-4">
                            <span className="text-sm font-bold">Empresas Participantes</span>
                            <span className="text-sm">128</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-accent h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-red-500">
                    <h3 className="font-heading font-bold text-lg text-gray-500 uppercase tracking-wide">Alertas de Auditoría</h3>
                    <p className="text-3xl font-bold text-n900 mt-2">3 <span className="text-base font-normal text-gray-500">Proyectos Flagged</span></p>
                    <button className="text-red-600 font-bold text-sm mt-4 hover:underline">Revisar Auditoría d'Impacto</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                {/* Municipality Management */}
                <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-heading font-bold text-n900">Gestión de Ayuntamientos</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary text-sm"
                        >
                            + Nuevo Ayuntamiento
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-gray-500">Cargando...</p>
                    ) : municipalities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-4xl mb-4">🏛️</p>
                            <p>No hay ayuntamientos registrados</p>
                            <p className="text-sm mt-2">Crea el primero haciendo clic en "+ Nuevo Ayuntamiento"</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b border-gray-100">
                                    <th className="pb-3 font-bold">Nombre</th>
                                    <th className="pb-3 font-bold">Admin</th>
                                    <th className="pb-3 font-bold">Estado</th>
                                    <th className="pb-3 font-bold text-right">Empresas</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {municipalities.map((muni) => (
                                    <tr key={muni.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="py-4 font-bold text-n900">{muni.name}</td>
                                        <td className="py-4 text-gray-600">{muni.admin?.email || 'Sin admin'}</td>
                                        <td className="py-4">
                                            <span className={`font-bold ${muni.admin?.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {muni.admin?.status === 'active' ? 'Activo' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right text-gray-600">{muni.associated_companies}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h2 className="text-2xl font-heading font-bold text-n900 mb-6">Auditoría de Proyectos (Últimos)</h2>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">P{i}</div>
                                <div>
                                    <h4 className="font-bold text-n900">Proyecto Inclusivo {i}</h4>
                                    <p className="text-xs text-gray-500">Creado por Empresa X en Municipio Y</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Propósito OK</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Accesibilidad AA</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Create Municipality Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-heading font-bold text-n900">
                                    {createdCredentials ? '✅ Ayuntamiento Creado' : '🏛️ Nuevo Ayuntamiento'}
                                </h3>
                                <button
                                    onClick={closeModalAndReset}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {createdCredentials ? (
                            // Success - Show credentials
                            <div className="p-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                    <p className="text-green-800 font-bold">Ayuntamiento creado correctamente</p>
                                    <p className="text-green-700 text-sm mt-1">Guarda estas credenciales para compartirlas con el administrador:</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-500">Email</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 bg-white p-3 rounded border text-n900 font-mono">
                                                {createdCredentials.email}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(createdCredentials.email)}
                                                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                                                title="Copiar"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-500">Contraseña</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 bg-white p-3 rounded border text-n900 font-mono text-lg">
                                                {createdCredentials.password}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(createdCredentials.password)}
                                                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                                                title="Copiar"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-500">URL de Acceso</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 bg-white p-3 rounded border text-p2 font-mono text-sm">
                                                {createdCredentials.login_url}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(createdCredentials.login_url)}
                                                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                                                title="Copiar"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                                    <p className="text-yellow-800 text-sm">
                                        ⚠️ <strong>Importante:</strong> Esta contraseña solo se muestra una vez. Cópiala ahora y compártela de forma segura con el administrador del ayuntamiento.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        const text = `Credenciales Rural Minds\n\nEmail: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}\nAcceso: ${createdCredentials.login_url}`;
                                        copyToClipboard(text);
                                    }}
                                    className="w-full mt-6 bg-p2 text-white font-bold py-3 rounded-lg hover:bg-p2/90"
                                >
                                    📋 Copiar Todo
                                </button>

                                <button
                                    onClick={closeModalAndReset}
                                    className="w-full mt-3 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            // Form
                            <form onSubmit={handleCreateMunicipality} className="p-6 space-y-5">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-n900 mb-2">
                                        Nombre del Ayuntamiento *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-p2 focus:border-p2 outline-none"
                                        placeholder="Ej: Ayuntamiento de Villa Rural"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-n900 mb-2">
                                            Email Administrador *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.admin_email}
                                            onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-p2 focus:border-p2 outline-none"
                                            placeholder="admin@ayuntamiento.es"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-n900 mb-2">
                                            Nombre del Administrador
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.admin_name}
                                            onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-p2 focus:border-p2 outline-none"
                                            placeholder="Juan García"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-n900 mb-2">
                                        Plan de Suscripción
                                    </label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-p2 focus:border-p2 outline-none"
                                    >
                                        <option value="starter">Starter (Gratuito)</option>
                                        <option value="growth">Growth</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="send_email"
                                        checked={formData.send_email}
                                        onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                                        className="w-5 h-5 text-p2 rounded"
                                    />
                                    <label htmlFor="send_email" className="text-sm text-gray-700">
                                        <strong>Enviar credenciales por email</strong>
                                        <br />
                                        <span className="text-gray-500">El administrador recibirá un email con sus datos de acceso</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModalAndReset}
                                        className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-3 px-6 bg-p2 text-white font-bold rounded-lg hover:bg-p2/90 disabled:opacity-50"
                                    >
                                        {creating ? 'Creando...' : 'Crear Ayuntamiento'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
