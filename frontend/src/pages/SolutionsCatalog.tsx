import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Solution {
    id: number;
    title: string;
    description: string;
    category: string;
    impact_level: string;
    cost_estimate?: string;
    image_url?: string;
}

const SolutionsCatalog: React.FC = () => {
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSolutions();
    }, []);

    const fetchSolutions = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/accessibility/adjustments/catalog');
            setSolutions(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const filteredSolutions = filter === 'all'
        ? solutions
        : solutions.filter(s => s.category.toLowerCase() === filter.toLowerCase());

    const categories = ['all', 'software', 'hardware', 'environment', 'protocol'];

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando catálogo...</div>;

    return (
        <div className="min-h-screen bg-n50 pb-12">
            <main className="container mx-auto px-4 py-8">
                <header className="mb-6 border-b border-gray-100 pb-6">
                    <h1 className="text-4xl font-heading font-bold text-p2 mb-2">Catálogo de Soluciones</h1>
                    <p className="text-xl text-n900">Soluciones validadas para mejorar la inclusión laboral y productividad.</p>
                </header>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full font-bold transition-all ${filter === cat
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSolutions.map(sol => (
                        <div key={sol.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                                {/* Placeholder or Image */}
                                {sol.image_url ? (
                                    <img src={sol.image_url} alt={sol.title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">💡</span>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${sol.category === 'software' ? 'bg-blue-100 text-blue-700' :
                                        sol.category === 'hardware' ? 'bg-orange-100 text-orange-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {sol.category}
                                    </span>
                                    <span className="text-sm font-bold text-gray-500">{sol.cost_estimate || "$"}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-800">{sol.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{sol.description}</p>

                                <div className="flex items-center justify-between mt-4 text-sm">
                                    <span className="flex items-center text-primary font-bold">
                                        Impact: {sol.impact_level.toUpperCase()}
                                    </span>
                                    <button className="text-primary hover:text-accent font-bold underline">
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSolutions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No solutions found in this category.
                    </div>
                )}
            </main>
        </div>
    );
};

export default SolutionsCatalog;
