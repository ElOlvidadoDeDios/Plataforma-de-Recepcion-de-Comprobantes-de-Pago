import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoutButton } from './LogoutButton';
import UserInfo from './UserInfo';
import { usePermissions } from '../hooks/useAuth';
import { UserChangePasswordModal } from './gestion_usuarios';
import { useAuth } from '../hooks/useAuth';
import logo from '../logo_dile.webp';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
}

// Sidebar component
const Sidebar = ({ isMobile, isOpen, setIsOpen }: { isMobile: boolean, isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  
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
    <div className={`px-4 sm:px-6 py-4 h-full bg-gradient-to-b from-cyan-500 to-blue-500 border-r border-white/20 transition-all duration-300 ease-in-out shadow-xl ${
      isMobile
        ? 'w-64 fixed top-0 left-0 z-50'
        : isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-white font-semibold text-lg ${(!isOpen && !isMobile) && 'hidden'}`}>Panel de Control</h3>
        {!isMobile && (
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
        )}
      </div>
      <div className={`space-y-2 ${(!isOpen && !isMobile) && 'hidden'}`}>
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
        {permissions.canAccessPayments() && (
          <NavButton
            onClick={() => navigate('/payments/history')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>}
          >
            Historial de Pagos
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
           Historial de Interacciones con el Bot
          </NavButton>
        )}
        {!permissions.isBasicUser() && (
          <NavButton
            onClick={() => navigate('/consultas-cuotas')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>}
          >
            Historial de Consulta de Cuotas
          </NavButton>
        )}
        {!permissions.isBasicUser() && (
          <NavButton
            onClick={() => navigate('/consulta-clientes')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
          >
            Consultar socios
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
        {permissions.canAccessGestionMora() && (
          <NavButton
            onClick={() => navigate('/gestion-mora')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>}
          >
            Gestión de Mora
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
  const { user } = useAuth();
  const isHome = location.pathname === '/';
  
  // Estados para el sidebar
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const [sidebarMobileOpen, setSidebarMobileOpen] = React.useState(false);
  const [sidebarDesktopOpen, setSidebarDesktopOpen] = React.useState(true);
  
  // Estado para el modal de cambiar contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarMobileOpen(false); // Cerrar sidebar móvil en desktop
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-gradient-to-b from-cyan-500 to-blue-500 overflow-x-hidden">
      <div className="w-full flex flex-col flex-grow bg-gradient-to-r from-cyan-500 to-blue-500">
        <div className="w-full max-w-full">
          <div className="w-full px-2 sm:px-6 lg:px-8 py-4">
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-2 sm:px-6 lg:px-8 py-1.5 border-t border-white/10 overflow-x-hidden">
          {showBackButton && !isHome && (
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
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
                <path d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver al Inicio</span>
              <span className="sm:hidden">Volver</span>
            </button>
          )}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto max-w-full">
            {/* Botón de cambiar contraseña */}
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="w-full sm:w-auto bg-blue-400/80 hover:bg-blue-500/90 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
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
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1 1 21 9z" />
              </svg>
              <span className="hidden sm:inline">Cambiar Contraseña</span>
              <span className="sm:hidden">Contraseña</span>
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Botón flotante para móvil */}
        {!permissions.isBasicUser() && !isHome && isMobile && (
          <button
            onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
            className="fixed top-4 left-4 z-[60] bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}

        {/* Overlay para sidebar móvil */}
        {!permissions.isBasicUser() && !isHome && isMobile && sidebarMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}

        {/* Contenedor principal con sidebar y contenido */}
        <div className="flex flex-row flex-grow min-h-0 relative">
          {/* Sidebar - visible solo para usuarios no básicos y cuando no está en la página principal */}
          {!permissions.isBasicUser() && !isHome && (
            <>
              {/* Sidebar Desktop */}
              {!isMobile && (
                <div className="flex-shrink-0 transition-all duration-300 ease-in-out">
                  <Sidebar isMobile={isMobile} isOpen={sidebarDesktopOpen} setIsOpen={setSidebarDesktopOpen} />
                </div>
              )}
              
              {/* Sidebar Mobile */}
              {isMobile && sidebarMobileOpen && (
                <div className="fixed top-0 left-0 h-full z-50">
                  <Sidebar isMobile={isMobile} isOpen={sidebarMobileOpen} setIsOpen={setSidebarMobileOpen} />
                </div>
              )}
            </>
          )}
          
          {/* Contenido principal */}
          <div className="flex-grow overflow-hidden transition-all duration-300 ease-in-out">
            <div className="bg-white/90 backdrop-blur-sm p-6 h-full overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <div className="bg-blue-600/20 backdrop-blur-sm p-4 text-center text-white text-sm border-t border-white/10 mt-auto">
        <p>© 2025 DILE. Todos los derechos reservados.</p>
      </div>

      {/* Modal de cambiar contraseña */}
      <UserChangePasswordModal
        isOpen={showChangePasswordModal}
        user={user ? {
          _id: user.id,
          email: user.email,
          razon: user.name || '',
          dni: user.dni,
          role: user.role,
          status: 1,
          agencias: [],
          statusText: 'ACTIVO',
          lastLogin: new Date().toISOString()
        } : null}
        currentUser={user}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default Layout;



