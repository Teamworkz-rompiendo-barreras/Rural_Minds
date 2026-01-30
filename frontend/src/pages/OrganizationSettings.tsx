import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

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

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/org/users');
            setUsers(res.data);
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
            setInviteError(err.response?.data?.detail || 'Error al invitar usuario');
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

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-heading font-bold text-primary mb-6">Gestión del Equipo</h1>

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
        </div>
    );
};

export default OrganizationSettings;
