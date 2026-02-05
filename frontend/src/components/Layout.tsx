import React, { useState } from 'react';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper for active state
    // MODIFIED: Adding thicker underline and color P2 for active state
    const isActive = (path: string) => location.pathname === path
        ? "active-link text-p2 font-bold border-b-4 border-p2"
        : "text-gray-600 hover:text-primary font-bold transition-colors border-b-4 border-transparent";

    // Superadmin specific fix: Ensure /admin doesn't stay active if we are in other routes
    const isSuperAdminActive = () => location.pathname.startsWith('/admin')
        ? "active-link text-purple-800 font-bold border-b-4 border-purple-800"
        : "text-purple-600 hover:text-purple-800 font-bold border-b-4 border-transparent";

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
            {/* Skip Link for Accessibility - Fixed visibility on focus */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-primary focus:text-white focus:p-4 focus:font-bold focus:outline-none focus:ring-4 focus:ring-focus-ring"
            >
                Saltar al contenido principal
            </a>

            {/* Menu: Removed sticky for better zoom behavior (or keep sticky but handle resize) 
                Prompt said "Eliminar el menú fijo (position: fixed)" to avoid covering content at high zoom. 
                Using relative/static flow.
            */}
            <header className="bg-white shadow-sm p-4 z-50 relative">
                <div className="container mx-auto flex items-center justify-between flex-wrap">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Rural Minds Logo" className="h-16 w-auto object-contain" />
                    </Link>

                    {/* Hamburger Button for Mobile/Zoom 400% */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={isMenuOpen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>

                    <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto items-center gap-4 mt-4 md:mt-0 transition-all`}>
                        <Link to="/" className={isActive('/')}>Inicio</Link>

                        {isAuthenticated && user ? (
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
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
                                        <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>
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
                            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                                <Link to="/login" className={isActive('/login')}>Acceder</Link>
                                <Link to="/register" className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-opacity-90">Registrarse</Link>
                            </div>
                        )}

                        {/* Dark Mode Switch */}
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <span id="dark-mode-label" className="sr-only">Activar modo oscuro</span>
                            <button
                                onClick={toggleHighContrast}
                                role="switch"
                                aria-checked={highContrast}
                                aria-labelledby="dark-mode-label"
                                title={highContrast ? "Desactivar modo oscuro" : "Activar modo oscuro"}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                                    ${highContrast ? 'bg-primary' : 'bg-gray-200'}
                                `}
                            >
                                <span className="sr-only">Activar modo oscuro</span>
                                <span
                                    className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                        ${highContrast ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                />
                            </button>
                        </div>
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
                            Centro de Aprendizaje
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500">
                        Desarrollado por <strong className="text-p2">Teamworkz</strong>
                    </p>
                </div>
            </footer>
        </div >
    );
};

export default Layout;
