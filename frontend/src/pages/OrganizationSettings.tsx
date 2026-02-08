import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';
import DeleteAccountModal from '../components/DeleteAccountModal';

interface User {
    id: string;
    email: string;
    role: string;
}

const OrganizationSettings: React.FC = () => {
    const { token, user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Sensory Commitment State
    const [sensoryCommitment, setSensoryCommitment] = useState<any>({
        quietSpaces: false,
        adjustableLighting: false,
        fullRemote: false,
        flexibleHours: false,
        mentorshipProgram: false
    });
    const [savingSensory, setSavingSensory] = useState(false);
    const [hqAddress, setHqAddress] = useState({
        street: '',
        postal_code: '',
        city: '',
        province: ''
    });
    const [savingHq, setSavingHq] = useState(false);

    useEffect(() => {
        if (token) {
            fetchUsers();
            if (user?.organization?.sensory_commitment) {
                setSensoryCommitment({
                    ...sensoryCommitment,
                    ...user.organization.sensory_commitment
                });
            }
            if (user?.organization?.street_address) {
                setHqAddress(prev => ({
                    ...prev,
                    street: user.organization?.street_address || '',
                    postal_code: user.organization?.postal_code || ''
                }));
            }
        }
    }, [token, user]);

    const handleSaveSensory = async () => {
        setSavingSensory(true);
        try {
            await axios.put('/org/details', {
                sensory_commitment: sensoryCommitment
            });
            alert("Perfil de compromiso sensorial actualizado.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar el perfil sensorial.");
        } finally {
            setSavingSensory(false);
        }
    };

    const handleSaveHq = async () => {
        setSavingHq(true);
        try {
            await axios.put('/org/details', {
                street_address: hqAddress.street,
                postal_code: hqAddress.postal_code
            });
            alert("Ubicación de sede actualizada. El match por geolocalización ahora es más preciso.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar la ubicación.");
        } finally {
            setSavingHq(false);
        }
    };

    const handleCPChange = (cp: string) => {
        setHqAddress({ ...hqAddress, postal_code: cp });
        // Mock Autocomplete
        if (cp === '28001') setHqAddress(prev => ({ ...prev, postal_code: cp, city: 'Madrid', province: 'Madrid' }));
        if (cp === '08001') setHqAddress(prev => ({ ...prev, postal_code: cp, city: 'Barcelona', province: 'Barcelona' }));
        if (cp === '19250') setHqAddress(prev => ({ ...prev, postal_code: cp, city: 'Sigüenza', province: 'Guadalajara' }));
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/org/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError('');
        setInviteSuccess('');

        try {
            await axios.post('/org/invite', {
                email: inviteEmail,
                role: 'enterprise'
            });
            setInviteSuccess(`Invitación enviada a ${inviteEmail}`);
            setInviteEmail('');
            fetchUsers(); // Refresh list
        } catch (err: any) {
            let msg = 'Error al invitar usuario';
            if (err.response) {
                if (err.response.status === 409) msg = "El usuario ya es miembro de la organización.";
                else if (err.response.status === 404) msg = "Usuario no encontrado en el sistema (debe registrarse primero).";
                else if (err.response.data?.detail) msg = err.response.data.detail;
            } else if (err.request) {
                msg = "Error de conexión. Inténtalo más tarde.";
            }
            setInviteError(msg);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar a este usuario?")) return;
        try {
            await axios.delete(`/org/users/${userId}`);
            fetchUsers();
        } catch (err) {
            alert('Error al eliminar usuario');
        }
    };

    const handleAccountDeletion = async (reason: string) => {
        try {
            // Optional: Send reason to backend if supported, otherwise just log or ignore
            console.log("Deletion reason:", reason);
            await axios.delete('/user/me');

            // Redirect happens after successful deletion logic
            window.location.href = '/login?deleted=true';
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data?.detail || "Hubo un problema al eliminar la cuenta. Por favor, contacta con soporte.";
            alert(msg);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-12">
            <header>
                <h1 className="text-4xl font-heading font-bold text-p2 mb-2">Configuración de la Organización</h1>
                <p className="text-n900 text-lg">{user?.organization?.name || 'Mi Perfil Corporativo'}</p>
            </header>

            {/* Sensory Commitment Profile - Case insensitive check for robustness */}
            {(user?.role?.toLowerCase().includes('enterprise')) && (
                <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="bg-p2/10 p-2 rounded-lg text-2xl">🌿</div>
                        <h2 className="text-2xl font-heading font-bold text-n900">Perfil de Compromiso Sensorial</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Define las condiciones de adaptabilidad que ofrece tu organización. Esta información ayudará a conectar con el mejor talento.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {[
                            { id: 'quietSpaces', label: '🔇 Espacios de trabajo silenciosos', desc: 'Zonas libres de ruidos estridentes o distracciones.' },
                            { id: 'adjustableLighting', label: '💡 Iluminación regulable', desc: 'Opción de luz natural o control de intensidad.' },
                            { id: 'fullRemote', label: '🏠 Teletrabajo 100% disponible', desc: 'Posibilidad de trabajo remoto total.' },
                            { id: 'flexibleHours', label: '⏰ Flexibilidad Horaria', desc: 'Gestión autónoma del tiempo.' },
                            { id: 'mentorshipProgram', label: '🤝 Mentoría Inclusiva', desc: 'Apoyo personalizado para nuevos ingresos.' },
                        ].map((item) => (
                            <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${sensoryCommitment[item.id] ? 'border-p2 bg-p2/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="mt-1 w-5 h-5 accent-p2"
                                    checked={sensoryCommitment[item.id]}
                                    onChange={(e) => setSensoryCommitment({ ...sensoryCommitment, [item.id]: e.target.checked })}
                                />
                                <div>
                                    <span className="block font-bold text-n900">{item.label}</span>
                                    <span className="text-xs text-gray-500">{item.desc}</span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveSensory}
                            disabled={savingSensory}
                            className="bg-p2 text-white font-bold py-3 px-8 rounded-lg hover:bg-p2/90 transition-all shadow-md disabled:opacity-50"
                        >
                            {savingSensory ? 'Guardando...' : 'Guardar Compromiso'}
                        </button>
                    </div>
                </section>
            )}

            {/* Physical Headquarters Section */}
            {(user?.role?.toLowerCase().includes('enterprise')) && (
                <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="bg-indigo-100 p-2 rounded-lg text-2xl">🏢</div>
                        <h2 className="text-2xl font-heading font-bold text-n900">Sede Física (Ancla GPS)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <p className="text-gray-600 text-sm">Esta es la ubicación donde el talento desempeñará sus funciones. Es vital para diferenciar entre **Arraigo** y **Atracción**.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Calle y Número</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-p2/20"
                                        placeholder="Ej: Calle Mayor, 14"
                                        value={hqAddress.street}
                                        onChange={e => setHqAddress({ ...hqAddress, street: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Código Postal</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-p2/20 font-mono"
                                        placeholder="28001"
                                        value={hqAddress.postal_code}
                                        onChange={e => handleCPChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Municipio / Provincia</label>
                                    <div className="p-3 bg-gray-100 border border-gray-100 rounded-xl text-gray-500 font-medium">
                                        {hqAddress.city ? `${hqAddress.city} (${hqAddress.province})` : 'Introduce CP para detectar...'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveHq}
                                    disabled={savingHq}
                                    className="bg-n900 text-white font-bold py-3 px-8 rounded-lg hover:bg-black transition-all shadow-md disabled:opacity-50"
                                >
                                    {savingHq ? 'Guardando...' : 'Actualizar Sede'}
                                </button>
                            </div>
                        </div>

                        {/* Interactive SVG Pin Map */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase">Vista de Mapa</h3>
                            <div className="w-full aspect-square bg-white rounded-xl shadow-inner border border-gray-100 relative overflow-hidden flex items-center justify-center">
                                {/* Conceptual Map Background (SVG) */}
                                <svg viewBox="0 0 100 100" className="absolute inset-0 opacity-10">
                                    <path d="M0,20 Q50,0 100,20 L100,80 Q50,100 0,80 Z" fill="none" stroke="#000" strokeWidth="0.5" />
                                    <line x1="0" y1="50" x2="100" y2="50" stroke="#000" strokeWidth="0.5" />
                                    <line x1="50" y1="0" x2="50" y2="100" stroke="#000" strokeWidth="0.5" />
                                </svg>

                                {hqAddress.street ? (
                                    <div className="relative animate-bounce">
                                        <span className="text-4xl">📍</span>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/10 rounded-full blur-[2px]"></div>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-300 italic">Sin ubicación configurada</span>
                                )}
                            </div>
                            <p className="mt-4 text-[10px] text-gray-400 leading-tight">Mapa conceptual accesible para orientación espacial rápida.</p>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <h1 className="text-3xl font-heading font-bold text-primary mb-6">Gestión del Equipo</h1>
            </section>

            {/* Invite Section */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-accent">
                <h2 className="text-xl font-bold mb-4">Invitar Miembro</h2>
                <form onSubmit={handleInvite} className="flex gap-4 items-start">
                    <div className="flex-grow">
                        <input
                            type="email"
                            placeholder="colega@empresa.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            aria-label="Email del nuevo miembro"
                        />
                        {inviteError && <p className="text-red-500 text-sm mt-1">{inviteError}</p>}
                        {inviteSuccess && <p className="text-green-600 text-sm mt-1">{inviteSuccess}</p>}
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90"
                    >
                        Invitar
                    </button>
                </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-bold text-gray-600">Email</th>
                            <th className="p-4 font-bold text-gray-600">Rol</th>
                            <th className="p-4 font-bold text-gray-600 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${u.role === 'enterprise' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                                        }`}>
                                        {u.role === 'enterprise' ? 'Empresa' : u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {u.id !== user?.id && (
                                        <button
                                            onClick={() => handleRemove(u.id)}
                                            className="text-red-500 hover:text-red-700 font-bold text-sm"
                                            aria-label={`Eliminar al usuario ${u.email}`}
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && <div className="p-8 text-center text-gray-500">No se encontraron miembros.</div>}
            </div>

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-red-200">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Zona de Peligro</h2>
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-red-900">Eliminar Cuenta de Organización</h3>
                        <p className="text-red-700 text-sm">Esta acción es irreversible. Se eliminarán todos los datos, proyectos y candidatos asociados.</p>
                    </div>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-colors"
                    >
                        Eliminar mi cuenta
                    </button>
                </div>
            </div>

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleAccountDeletion}
            />
        </div>
    );
};

export default OrganizationSettings;
