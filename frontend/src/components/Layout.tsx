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

    // Helper to get role display name in Spanish
    const getRoleDisplayName = () => {
        switch (user?.role) {
            case 'super_admin':
                return 'Superadmin';
            case 'territory_admin':
                return 'Ayuntamiento';
            case 'enterprise':
                return 'Empresa';
            case 'talent':
                return 'Talento';
            default:
                return user?.role;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-bg font-sans text-text-main flex flex-col">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Rural Minds Logo" className="h-16 w-auto object-contain" />
                    </Link>

                    <nav className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-primary font-bold transition-colors">Inicio</Link>

                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 hidden md:block">
                                    {user?.email} <span className="text-p2 font-medium">({getRoleDisplayName()})</span>
                                </span>

                                {/* TALENT Navigation */}
                                {user?.role === 'talent' && (
                                    <>
                                        <Link to="/talent-dashboard" className="text-gray-600 hover:text-primary font-bold">Oportunidades</Link>
                                        <Link to="/profile" className="text-gray-600 hover:text-primary font-bold">Mi Perfil</Link>
                                        <Link to="/sensory-profile" className="text-gray-600 hover:text-primary font-bold">Sensorial</Link>
                                    </>
                                )}

                                {/* ENTERPRISE Navigation */}
                                {user?.role === 'enterprise' && (
                                    <>
                                        <Link to="/enterprise-dashboard" className="text-gray-600 hover:text-primary font-bold">Mi Panel</Link>
                                        <Link to="/create-project" className="text-gray-600 hover:text-primary font-bold">Crear Vacante</Link>
                                        <Link to="/solutions" className="text-gray-600 hover:text-primary font-bold">Soluciones</Link>
                                    </>
                                )}

                                {/* MUNICIPALITY Navigation */}
                                {user?.role === 'territory_admin' && (
                                    <>
                                        <Link to="/municipality-dashboard" className="text-gray-600 hover:text-primary font-bold">Mi Panel</Link>
                                        <Link to="/solutions" className="text-gray-600 hover:text-primary font-bold">Soluciones</Link>
                                        <Link to="/reports" className="text-gray-600 hover:text-primary font-bold">Informes</Link>
                                    </>
                                )}

                                {/* SUPER ADMIN Navigation */}
                                {user?.role === 'super_admin' && (
                                    <>
                                        <Link to="/admin" className="text-purple-600 hover:text-purple-800 font-bold">Admin Global</Link>
                                        <Link to="/reports" className="text-gray-600 hover:text-primary font-bold">Informes</Link>
                                    </>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-gray-600 hover:text-primary font-bold">Acceder</Link>
                                <Link to="/register" className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-opacity-90">Registrarse</Link>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-4 flex flex-col">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 p-6 mt-auto">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                        Rural Minds. <em>Innovación con denominación de origen</em> © 2026
                    </p>
                    <p className="text-sm text-gray-500">
                        Powered by <strong className="text-p2">Teamworkz</strong>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
