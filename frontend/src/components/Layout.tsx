import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const { highContrast, toggleHighContrast } = useTheme();
    const navigate = useNavigate();
    const location = useLocation(); // Hook for active route

    // Helper for active state
    const isActive = (path: string) => location.pathname === path ? "active-link text-p2 font-bold border-b-2 border-p2" : "text-gray-600 hover:text-primary font-bold transition-colors";

    // Superadmin specific fix: Ensure /admin doesn't stay active if we are in other routes
    const isSuperAdminActive = () => location.pathname.startsWith('/admin') ? "active-link text-purple-800 font-bold border-b-2 border-purple-800" : "text-purple-600 hover:text-purple-800 font-bold";

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
            {/* Skip Link for Accessibility */}
            <a href="#main-content" className="sr-only sr-only-focusable z-50 bg-primary text-white p-2 absolute">
                Saltar al contenido principal
            </a>

            <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Rural Minds Logo" className="h-16 w-auto object-contain" />
                    </Link>

                    <nav className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-primary font-bold transition-colors">Inicio</Link>

                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 hidden md:block">
                                    {user?.email} <span className="text-p2 font-medium">({getRoleDisplayName()})</span>
                                </span>

                                {/* TALENT Navigation */}
                                {user?.role === 'talent' && (
                                    <>
                                        <Link to="/talent-dashboard" className={isActive('/talent-dashboard')}>Oportunidades</Link>
                                        <Link to="/profile" className={isActive('/profile')}>Mi Perfil</Link>
                                        <Link to="/sensory-profile" className={isActive('/sensory-profile')}>Sensorial</Link>
                                        <Link to="/my-adjustments" className={isActive('/my-adjustments')}>Ajustes</Link>
                                    </>
                                )}

                                {/* ENTERPRISE Navigation */}
                                {user?.role === 'enterprise' && (
                                    <>
                                        <Link to="/enterprise-dashboard" className={isActive('/enterprise-dashboard')}>Mi Panel</Link>
                                        <Link to="/create-project" className={isActive('/create-project')}>Crear Vacante</Link>
                                        <Link to="/solutions" className={isActive('/solutions')}>Soluciones</Link>
                                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                                        <Link to="/org-settings" className={isActive('/org-settings')}>Equipo</Link>
                                        <Link to="/subscription" className={isActive('/subscription')}>Plan</Link>
                                    </>
                                )}

                                {/* MUNICIPALITY Navigation */}
                                {user?.role === 'territory_admin' && (
                                    <>
                                        <Link to="/municipality-dashboard" className={isActive('/municipality-dashboard')}>Mi Panel</Link>
                                        <Link to="/solutions" className={isActive('/solutions')}>Soluciones</Link>
                                        <Link to="/reports" className={isActive('/reports')}>Informes</Link>
                                    </>
                                )}

                                {/* SUPER ADMIN Navigation */}
                                {user?.role === 'super_admin' && (
                                    <>
                                        <Link to="/admin" className={isSuperAdminActive()}>Admin Global</Link>
                                        <Link to="/reports" className={isActive('/reports')}>Informes</Link>
                                        <Link to="/org-settings" className={isActive('/org-settings')}>Org</Link>
                                    </>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="text-gray-600 hover:text-red-600 font-bold transition-colors"
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

                        {/* High Contrast Toggle */}
                        <button
                            onClick={toggleHighContrast}
                            className={`ml-2 p-2 rounded-full border-2 font-bold text-xs transition-colors ${highContrast ? 'bg-yellow-300 text-black border-yellow-400' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
                            aria-label={highContrast ? "Desactivar Alto Contraste" : "Activar Alto Contraste"}
                            title="Cambiar Contraste"
                        >
                            {highContrast ? '👁️‍🗨️' : '👁️'}
                        </button>
                    </nav>
                </div>
            </header >

            <main id="main-content" className="flex-grow container mx-auto p-4 flex flex-col">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 p-6 mt-auto">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <p className="text-sm text-gray-600">
                            Rural Minds. <em>Innovación con denominación de origen</em> © 2026
                        </p>
                        <Link to="/learning" className="text-sm text-p2 hover:underline font-bold">
                            Learning Center
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500">
                        Powered by <strong className="text-p2">Teamworkz</strong>
                    </p>
                </div>
            </footer>
        </div >
    );
};

export default Layout;
