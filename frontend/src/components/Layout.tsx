import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-neutral-bg font-sans text-text-main flex flex-col">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    {/* Placeholder Logo */}
                    <div className="flex items-center gap-3">
                        <img src="/src/assets/ruralminds_logo.png" alt="Rural Minds Logo" className="h-16 w-auto object-contain" />
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-primary font-bold transition-colors">Home</Link>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 hidden md:block">
                                    {user?.email} ({user?.role})
                                </span>
                                {user?.role === 'talent' && (
                                    <>
                                        <Link to="/talent-dashboard" className="text-gray-600 hover:text-primary font-bold">Find Challenges</Link>
                                        <Link to="/profile" className="text-gray-600 hover:text-primary font-bold">Profile</Link>
                                        <Link to="/sensory-profile" className="text-gray-600 hover:text-primary font-bold">Sensory</Link>
                                        <Link to="/solutions" className="text-gray-600 hover:text-primary font-bold">Solutions</Link>
                                        <Link to="/my-adjustments" className="text-gray-600 hover:text-primary font-bold">My Adjustments</Link>
                                    </>
                                )}
                                {(user?.role === 'enterprise' || user?.role === 'super_admin') && (
                                    <>
                                        <Link to="/dashboard" className="text-gray-600 hover:text-primary font-bold">Dashboard</Link>
                                        <Link to="/solutions" className="text-gray-600 hover:text-primary font-bold">Solutions</Link>
                                        <Link to="/org-settings" className="text-gray-600 hover:text-primary font-bold">Org</Link>
                                        {user?.role === 'super_admin' && (
                                            <Link to="/admin" className="text-purple-600 hover:text-purple-800 font-bold">Admin</Link>
                                        )}
                                    </>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-opacity-90">Login</Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-4 flex flex-col">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 p-6 mt-auto">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 gap-4">
                    <span className="font-medium">Rural Minds © 2026</span>
                    <span>
                        Powered by <span className="text-primary font-bold">Rural Minds</span> | Innovación con Denominación de Origen
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
