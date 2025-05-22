import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoutButton } from './LogoutButton';
import UserInfo from './UserInfo';
import { usePermissions } from '../hooks/useAuth';
import logo from '../logo_dile.webp';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
}

// Sidebar component
const Sidebar = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [isOpen, setIsOpen] = React.useState(true);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const NavButton = ({ onClick, children, icon }: { onClick: () => void, children: React.ReactNode, icon: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="w-full text-left text-white hover:bg-white/20 p-3 text-sm transition-all border-b border-white/10 flex items-center space-x-3 hover:shadow-lg hover:shadow-white/5"
    >
      <span className="text-white/80">{icon}</span>
      <span>{children}</span>
    </button>
  );
  
  return (
    <div className={`px-4 sm:px-6 py-4 w-full h-full bg-gradient-to-b from-cyan-500 to-blue-500 border-r border-white/20 transition-all duration-300 ease-in-out shadow-xl ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-white font-semibold text-lg ${!isOpen && 'hidden'}`}>Panel de Control</h3>
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            )}
          </svg>
        </button>
      </div>
      <div className={`space-y-2 ${!isOpen && 'hidden'}`}>
        {permissions.canAccessPayments() && (
          <NavButton
            onClick={() => navigate('/payments')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
          >
            Ver Pagos
          </NavButton>
        )}
        {permissions.canAccessCredits() && (
          <NavButton
            onClick={() => navigate('/credit-requests')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>}
          >
            Solicitudes de Crédito
          </NavButton>
        )}
        {!permissions.isBasicUser() && (
          <NavButton
            onClick={() => navigate('/bot-interactions')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>}
          >
            Interacciones del Bot
          </NavButton>
        )}
        {!permissions.isBasicUser() && (
          <NavButton
            onClick={() => navigate('/consultas-cuotas')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>}
          >
            Consulta de Cuotas
          </NavButton>
        )}
        {!permissions.isBasicUser() && (
          <NavButton
            onClick={() => navigate('/consulta-clientes')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
          >
            Consulta de Clientes
          </NavButton>
        )}
        {permissions.canManageUsers() && (
          <NavButton
            onClick={() => navigate('/user-management')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>}
          >
            Gestión de Usuarios
          </NavButton>
        )}
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, title, showBackButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-cyan-500 to-blue-500 flex flex-col overflow-hidden">
      <div className="w-full h-full flex flex-col bg-gradient-to-r from-cyan-500 to-blue-500">
        <div className="w-full">
          <div className="w-full px-6 sm:px-8 py-4">
            {/* Header container */}
            <div className="overflow-visible flex flex-col sm:flex-row items-center justify-between gap-4">
              <motion.div
                className="flex-1 relative min-w-[8rem] w-full max-w-xs h-20 sm:h-24 md:h-28"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.1 }}
              >
                <img
                  src={logo}
                  alt="Logo DILE"
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Título en el centro */}
              <motion.div
                className="flex-1 text-center"
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              >
                <h1 className="text-white font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl drop-shadow-md tracking-tight">
                  {title}
                </h1>
              </motion.div>

              {/* UserInfo */}
              <div className="flex-shrink-0">
                <UserInfo />
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-6 sm:px-8 py-1.5 border-t border-white/10">
          {showBackButton && !isHome && (
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Inicio</span>
            </button>
          )}
          <div className="w-full sm:w-auto">
            <LogoutButton />
          </div>
        </div>

        {/* Contenedor principal con sidebar y contenido */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar - visible solo para usuarios no básicos y cuando no está en la página principal */}
          {!permissions.isBasicUser() && !isHome && (
            <div className="flex-shrink-0 transition-all duration-300 ease-in-out h-full">
              <Sidebar />
            </div>
          )}
          
          {/* Contenido principal - ajusta el ancho según si el sidebar está visible */}
          <div className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
            <div className="bg-white/90 backdrop-blur-sm p-6 h-full overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <div className="bg-blue-600/20 backdrop-blur-sm p-4 text-center text-white text-sm border-t border-white/10 w-full">
        <p>© 2025 DILE. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default Layout;