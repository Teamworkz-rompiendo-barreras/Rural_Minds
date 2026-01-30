import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

interface Article {
    id: number;
    title: string;
    summary: string;
    content: string;
    author: string;
    category: string;
    tags: string[];
    image_url?: string;
    created_at: string;
}

const LearningCenter: React.FC = () => {
    const { token } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [readingArticle, setReadingArticle] = useState<Article | null>(null);

    useEffect(() => {
        if (token) fetchArticles();
    }, [token, selectedCategory]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const endpoint = selectedCategory
                ? `/api/learning?category=${selectedCategory}`
                : '/api/learning';

            const res = await axios.get(endpoint);
            setArticles(res.data);
        } catch (err) {
            console.error("Failed to fetch articles");
        }
        setLoading(false);
    };

    const categories = ["Hiring", "Management", "Accommodations", "Neurodiversity 101"];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-heading font-bold text-primary mb-4">Learning Center</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Bite-sized knowledge to help you build a more inclusive workplace.
                </p>
            </header>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${!selectedCategory
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border'
                        }`}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === cat
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Article Grid */}
            {loading ? (
                <div className="text-center py-12">Loading knowledge...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map(article => (
                        <div
                            key={article.id}
                            onClick={() => setReadingArticle(article)}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group border border-transparent hover:border-primary"
                        >
                            {article.image_url && (
                                <div className="h-48 overflow-hidden bg-gray-100">
                                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-accent bg-blue-50 px-2 py-1 rounded">
                                        {article.category}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{article.summary}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4">
                                    <span>By {article.author}</span>
                                    <span>Read More →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && articles.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <p className="text-gray-500">No articles found in this category.</p>
                </div>
            )}

            {/* Reading Modal */}
            {readingArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fade-in">
                        <button
                            onClick={() => setReadingArticle(null)}
                            className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full p-2 w-10 h-10 flex items-center justify-center font-bold"
                        >
                            ✕
                        </button>

                        <div className="p-8 md:p-12">
                            {readingArticle.image_url && (
                                <img src={readingArticle.image_url} alt={readingArticle.title} className="w-full h-64 object-cover rounded-xl mb-8 shadow-sm" />
                            )}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">{readingArticle.category}</span>
                                <span className="text-gray-500 text-sm">{readingArticle.created_at.split('T')[0]}</span>
                            </div>
                            <h1 className="text-4xl font-heading font-bold mb-6 text-gray-900">{readingArticle.title}</h1>
                            <div className="flex items-center gap-2 mb-8 border-b pb-8">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <span className="text-sm font-bold text-gray-700">{readingArticle.author}</span>
                            </div>

                            <div className="prose prose-lg max-w-none text-gray-700">
                                {readingArticle.content.split('\n').map((para, i) => (
                                    <p key={i} className="mb-4">{para}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningCenter;
