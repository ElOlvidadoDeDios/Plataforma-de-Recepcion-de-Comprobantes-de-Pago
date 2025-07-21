import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { clearCache } from '../utils/cache';
import { SessionManager } from '../utils/sessionManager';

export const LogoutButton = () => {
  const { setIsAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    SessionManager.clearCurrentSession(); // Solo limpia la sesión actual
    clearCache(); // Limpia el caché de datos
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
    >
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="hidden sm:inline">Cerrar Sesión</span>
      <span className="sm:hidden">Salir</span>
    </button>
  );
};
