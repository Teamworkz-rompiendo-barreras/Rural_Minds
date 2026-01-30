
import React from 'react';

const SuperAdminDashboard: React.FC = () => {
    // const { user } = useAuth();

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
                            <span className="text-sm">45/50</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-p2 h-2 rounded-full" style={{ width: '90%' }}></div>
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
                <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-heading font-bold text-n900">Gestión de Entidades (Ayuntamientos)</h2>
                        <button className="btn-primary text-sm">+ Nueva Entidad</button>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-500 text-sm border-b border-gray-100">
                                <th className="pb-3 font-bold">Nombre</th>
                                <th className="pb-3 font-bold">Plan</th>
                                <th className="pb-3 font-bold">Estado</th>
                                <th className="pb-3 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[1, 2, 3].map(i => (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                    <td className="py-4 font-bold text-n900">Ayuntamiento de Villa {i}</td>
                                    <td className="py-4 text-gray-600">Enterprise</td>
                                    <td className="py-4"><span className="text-green-600 font-bold">Activo</span></td>
                                    <td className="py-4 text-right text-gray-400">•••</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
        </div>
    );
};

export default SuperAdminDashboard;
