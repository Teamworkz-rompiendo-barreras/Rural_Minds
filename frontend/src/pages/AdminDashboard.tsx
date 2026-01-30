import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GlobalStats {
    total_organizations: number;
    total_users: number;
    users_by_plan: { starter: number; growth: number; enterprise: number };
    total_adjustments_requested: number;
    adjustments_implemented: number;
    global_wellbeing_avg: number;
    profile_activation_rate: string;
}

interface OrgInfo {
    id: string;
    name: string;
    plan: string;
    user_count: number;
    user_limit: number | null;
    created_at: string;
}

interface AuditLogEntry {
    id: string;
    event_type: string;
    message: string;
    created_at: string;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [orgs, setOrgs] = useState<OrgInfo[]>([]);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'orgs' | 'logs'>('stats');

    useEffect(() => {
        if (user?.role !== 'super_admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [statsRes, orgsRes, logsRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/admin/stats/global'),
                axios.get('http://127.0.0.1:8000/admin/organizations'),
                axios.get('http://127.0.0.1:8000/admin/logs?limit=20')
            ]);
            setStats(statsRes.data);
            setOrgs(orgsRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrg = async (orgId: string, orgName: string) => {
        if (!confirm(`DANGER: Are you sure you want to delete "${orgName}" and ALL its data?`)) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/admin/organizations/${orgId}`);
            setOrgs(orgs.filter(o => o.id !== orgId));
            alert('Organization deleted');
        } catch (err) {
            alert('Failed to delete organization');
        }
    };

    if (loading) return <div className="p-8">Loading admin panel...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-4xl font-heading font-bold text-primary">Admin Control Panel</h1>
                <p className="text-gray-600">Super Admin Dashboard for Teamworkz SaaS Management</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {(['stats', 'orgs', 'logs'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-bold transition-all border-b-2 -mb-px ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'stats' ? '📊 Global Stats' : tab === 'orgs' ? '🏢 Organizations' : '📋 Audit Logs'}
                    </button>
                ))}
            </div>

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 card-radius shadow-md border-l-4 border-primary">
                        <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Total Organizations</div>
                        <div className="text-4xl font-bold text-gray-900 font-heading">{stats.total_organizations}</div>
                    </div>
                    <div className="bg-white p-6 card-radius shadow-md border-l-4 border-teal-500">
                        <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Total Users</div>
                        <div className="text-4xl font-bold text-gray-900 font-heading">{stats.total_users}</div>
                    </div>
                    <div className="bg-white p-6 card-radius shadow-md border-l-4 border-purple-500">
                        <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Adjustments Implemented</div>
                        <div className="text-4xl font-bold text-gray-900 font-heading">{stats.adjustments_implemented}</div>
                    </div>
                    <div className="bg-white p-6 card-radius shadow-md border-l-4 border-orange-500">
                        <div className="text-gray-500 text-xs font-bold uppercase mb-1 font-heading">Avg Wellbeing</div>
                        <div className="text-4xl font-bold text-gray-900 font-heading">{stats.global_wellbeing_avg}/10</div>
                    </div>

                    <div className="md:col-span-4 bg-white p-6 card-radius shadow-md">
                        <h3 className="text-lg font-bold mb-4 font-heading">Users by Plan</h3>
                        <div className="flex gap-8">
                            <div className="flex-1 p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-gray-800">{stats.users_by_plan.starter}</div>
                                <div className="text-sm text-gray-500 font-bold">Starter</div>
                            </div>
                            <div className="flex-1 p-4 bg-blue-50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-blue-700">{stats.users_by_plan.growth}</div>
                                <div className="text-sm text-blue-600 font-bold">Growth</div>
                            </div>
                            <div className="flex-1 p-4 bg-purple-50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-purple-700">{stats.users_by_plan.enterprise}</div>
                                <div className="text-sm text-purple-600 font-bold">Enterprise</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Organizations Tab */}
            {activeTab === 'orgs' && (
                <div className="bg-white card-radius shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-left font-bold text-gray-600">Organization</th>
                                <th className="p-4 text-left font-bold text-gray-600">Plan</th>
                                <th className="p-4 text-left font-bold text-gray-600">Users</th>
                                <th className="p-4 text-left font-bold text-gray-600">Created</th>
                                <th className="p-4 text-right font-bold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.map(org => (
                                <tr key={org.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-bold">{org.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${org.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                                org.plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {org.plan}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {org.user_count} / {org.user_limit ?? '∞'}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteOrg(org.id, org.name)}
                                            className="text-red-600 hover:text-red-800 font-bold text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'logs' && (
                <div className="bg-white card-radius shadow-md overflow-hidden">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No audit logs recorded yet.</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-left font-bold text-gray-600">Type</th>
                                    <th className="p-4 text-left font-bold text-gray-600">Message</th>
                                    <th className="p-4 text-left font-bold text-gray-600">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.event_type === 'error' ? 'bg-red-100 text-red-700' :
                                                    log.event_type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700">{log.message}</td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
