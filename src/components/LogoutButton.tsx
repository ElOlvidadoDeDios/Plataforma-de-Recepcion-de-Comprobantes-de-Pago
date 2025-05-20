import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { clearCache } from '../utils/cache';

export const LogoutButton = () => {
  const { setIsAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // Limpia todo el almacenamiento local
    clearCache(); // Limpia el caché de datos
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
    >
      Cerrar Sesión
    </button>
  );
};
