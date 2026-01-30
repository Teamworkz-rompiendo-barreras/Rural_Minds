import React from 'react';

const MainDashboard: React.FC = () => {
    // Mock Data for MVP
    const stats = [
        { label: 'Team Health', value: '92%', status: 'good' },
        { label: 'Inclusion Score', value: 'A-', status: 'good' },
        { label: 'Active Accommodations', value: '14', status: 'neutral' },
        { label: 'Pending Requests', value: '3', status: 'warning' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-heading font-bold text-primary mb-6">Executive Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-accent">
                        <div className="text-gray-500 text-sm font-bold uppercase mb-1">{stat.label}</div>
                        <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Retention Trends</h3>
                    <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg border-2 border-dashed border-gray-300">
                        [Chart Placeholder: Retention vs Industry Avg]
                    </div>
                </div>

                {/* Alerts / Activity */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 mt-2 bg-accent rounded-full"></span>
                            <div>
                                <p className="text-sm font-bold">New Solution Request</p>
                                <p className="text-xs text-gray-500">Alex M. requested "Noise Cancelling Headphones"</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 mt-2 bg-green-500 rounded-full"></span>
                            <div>
                                <p className="text-sm font-bold">Challenge Completed</p>
                                <p className="text-xs text-gray-500">"Data Cleanup" ended successfully.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 mt-2 bg-primary rounded-full"></span>
                            <div>
                                <p className="text-sm font-bold">New Applicant</p>
                                <p className="text-xs text-gray-500">Sarah J. applied for "Frontend Dev"</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MainDashboard;
