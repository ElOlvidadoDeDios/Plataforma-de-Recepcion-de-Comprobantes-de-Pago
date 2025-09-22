import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoutButton } from './LogoutButton';
import UserInfo from './UserInfo';
import { useCombinedPermissions } from '../hooks/useCombinedPermissions';
import { UserChangePasswordModal } from './gestion_usuarios';
import { useAuth } from '../hooks/useAuth';
import { useAutoLogout } from '../hooks/useAutoLogout';
import logo from '../logo_dile.webp';

// Interfaz para las props del Layout
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  fullWidth?: boolean;
}

// Componente del icono SVG de Geodile (puede ir en un archivo separado)
const GeodileIcon = React.memo(({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 141 153" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M82.4004 84.2898H58.5996C57.1667 84.2879 55.7931 83.7174 54.7806 82.7035C53.768 81.6897 53.1993 80.3153 53.1993 78.8824V56.4493C53.1993 55.0171 53.7683 53.6435 54.781 52.6308C55.7938 51.618 57.1673 51.049 58.5996 51.049H82.4004C83.8326 51.049 85.2062 51.618 86.219 52.6308C87.2317 53.6435 87.8007 55.0171 87.8007 56.4493V78.8824C87.8007 80.3153 87.232 81.6897 86.2194 82.7035C85.2069 83.7174 83.8333 84.2879 82.4004 84.2898Z" fill="currentColor"/>
    <path d="M101.323 30.5406C84.2968 13.5219 56.7031 13.5219 39.6774 30.5406C23.6527 46.5723 22.5811 72.2132 37.231 89.5209L63.3724 120.414C67.1019 124.82 73.8981 124.82 77.6275 120.414L103.769 89.5209C118.419 72.2132 117.347 46.5723 101.323 30.5406ZM70.5 94.1105C51.4015 94.1105 35.9127 78.6287 35.9127 59.5232C35.9127 40.4177 51.4015 24.9429 70.5 24.9429C89.5984 24.9429 105.087 40.4247 105.087 59.5232C105.087 78.6216 89.5984 94.1105 70.5 94.1105Z" fill="currentColor"/>
    <path d="M70.5 70.4013C71.9622 70.4013 73.3645 70.9822 74.3984 72.0161C75.4323 73.05 76.0131 74.4522 76.0131 75.9144V83.2746H64.9869V75.9144C64.9869 74.4522 65.5677 73.05 66.6017 72.0161C67.6356 70.9822 69.0378 70.4013 70.5 70.4013Z" fill="white"/>
  </svg>
));

// Componente NavButton (puede ir en un archivo separado)
const NavButton = React.memo(({ onClick, children, icon }: { onClick: () => void, children: React.ReactNode, icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="w-full text-left text-white hover:bg-white/20 p-3 text-sm transition-all border-b border-white/10 flex items-center space-x-3 hover:shadow-lg hover:shadow-white/5"
  >
    <span className="text-white/80">{icon}</span>
    <span>{children}</span>
  </button>
));

// Componente Sidebar (puede ir en un archivo separado)
const Sidebar = React.memo(({ isMobile, isOpen, setIsOpen }: { isMobile: boolean, isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const permissions = useCombinedPermissions();

  const toggleSidebar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  const navOptions = useMemo(() => [
    { to: '/payments', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Ver Pagos', permission: permissions.canAccessPayments() },
    { to: '/payments/history', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Historial de Pagos', permission: permissions.canAccessPayments() },
    { to: '/credit-requests', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Solicitudes de Crédito', permission: permissions.canAccessCredits() },
    { to: '/bot-interactions', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>, label: 'Historial de Interacciones con el Bot', permission: permissions.canAccessBotInteractions() },
    { to: '/consultas-cuotas', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, label: 'Historial de Consulta de Cuotas', permission: permissions.canAccessConsultaCuotas() },
    { to: '/consulta-clientes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Consultar socios', permission: permissions.canAccessConsultaSocios() },
    { to: '/registro-clientes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, label: 'Registro de Clientes', permission: permissions.canAccessRegistroClientes() },
    { to: '/user-management', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, label: 'Gestión de Usuarios', permission: permissions.canManageUsers() },
    { to: '/gestion-mora', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Gestión de Mora', permission: permissions.canAccessGestionMora() },
    { to: '/pago-recaudadores', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Pago Recaudadores', permission: permissions.canAccessPagoRecaudadores() }, 
    { to: '/pendientes-desembolsar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Pendientes a Desembolsar', permission: permissions.canAccessPendientesDesembolsar() },
    { to: '/calculadora-creditos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>, label: 'Calculadora de Créditos', permission: permissions.canAccessCalculadoraCreditos() },
    { to: '/geodile', icon: <GeodileIcon className="w-5 h-5" />, label: 'Geodile', permission: permissions.canAccessGeodile() },
    { to: '/afiliacion-socios', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>, label: 'Afiliación de Socios', permission: permissions.canAccessAffiliationSocios() },
  ], [permissions]);

  return (
    <div className={`bg-gradient-to-b from-cyan-500 to-blue-500 border-r border-white/20 transition-all duration-300 ease-in-out shadow-xl ${isMobile ? 'w-64 fixed top-0 left-0 z-50 h-screen flex flex-col' : isOpen ? 'w-64 h-full' : 'w-16 h-full'}`}>
      <div className={`px-4 sm:px-6 py-4 flex-shrink-0 ${isMobile ? 'border-b border-white/10' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-white font-semibold text-lg ${(!isOpen && !isMobile) && 'hidden'}`}>Panel de Control</h3>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto px-4 sm:px-6 pb-4 ${(!isOpen && !isMobile) && 'hidden'}`}>
        <div className="space-y-2">
          {navOptions.map((option, index) => (
            option.permission && (
              <NavButton
                key={index}
                onClick={() => navigate(option.to)}
                icon={option.icon}
              >
                {option.label}
              </NavButton>
            )
          ))}
        </div>
      </div>
    </div>
  );
});

// Componente principal Layout
const Layout: React.FC<LayoutProps> = ({ children, title, showBackButton = true, fullWidth = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useCombinedPermissions();
  const { user } = useAuth();

  // Hook para auto-logout en móviles (5 minutos de inactividad)
  const { isMobile: isMobileDevice, isActive } = useAutoLogout();

  // Estados para el sidebar
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarDesktopOpen, setSidebarDesktopOpen] = useState(true);

  // Estado para el modal de cambiar contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Estado para ocultar/mostrar el layout completo (para Geodile)
  const [layoutHidden, setLayoutHidden] = useState(false);
  const isGeodilePage = location.pathname === '/geodile';

  // Manejar el cambio de tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarMobileOpen(false);
      }
    };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para alternar el layout en Geodile
  const toggleLayoutHidden = useCallback(() => {
    const newLayoutHidden = !layoutHidden;
    setLayoutHidden(newLayoutHidden);
    window.dispatchEvent(new CustomEvent('geodileLayoutToggle', {
      detail: { hidden: newLayoutHidden }
    }));
  }, [layoutHidden]);

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-gradient-to-b from-cyan-500 to-blue-500 overflow-x-hidden">
      <div className="w-full flex flex-col flex-grow bg-gradient-to-r from-cyan-500 to-blue-500">
        {/* Header */}
        {!(isGeodilePage && layoutHidden) && (
          <>
            <div className="w-full max-w-full">
              <div className="w-full px-2 sm:px-6 lg:px-8 py-4">
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
                  <div className="flex-shrink-0">
                    <UserInfo />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-2 sm:px-6 lg:px-8 py-1.5 border-t border-white/10 overflow-x-hidden">
              {showBackButton && location.pathname !== '/' && (
                <button
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Volver al Inicio</span>
                  <span className="sm:hidden">Volver</span>
                </button>
              )}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto max-w-full">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full sm:w-auto bg-blue-400/80 hover:bg-blue-500/90 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1 1 21 9z" />
                  </svg>
                  <span className="hidden sm:inline">Cambiar Contraseña</span>
                  <span className="sm:hidden">Contraseña</span>
                </button>
                <LogoutButton />
              </div>
            </div>
          </>
        )}

        {/* Botón para ocultar/mostrar layout en Geodile */}
        {isGeodilePage && (
          <button
            onClick={toggleLayoutHidden}
            className="fixed top-4 right-4 z-[60] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
            title={layoutHidden ? "Mostrar controles" : "Ocultar controles"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {layoutHidden ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              )}
            </svg>
          </button>
        )}

        {/* Botón flotante para móvil */}
        {!permissions.isBasicUser() && location.pathname !== '/' && isMobile && !(isGeodilePage && layoutHidden) && (
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
        {!permissions.isBasicUser() && location.pathname !== '/' && isMobile && sidebarMobileOpen && !(isGeodilePage && layoutHidden) && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}

        {/* Contenedor principal con sidebar y contenido */}
        <div className="flex flex-row flex-grow min-h-0 relative">
          {/* Sidebar */}
          {!permissions.isBasicUser() && location.pathname !== '/' && !(isGeodilePage && layoutHidden) && (
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
            {fullWidth ? (
              <div className={`h-full overflow-y-auto ${isGeodilePage && layoutHidden ? 'fixed inset-0 z-[55]' : ''}`}>
                {children}
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm p-0 h-full overflow-y-auto">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!(isGeodilePage && layoutHidden) && (
        <div className="bg-blue-600/20 backdrop-blur-sm p-4 text-center text-white text-sm border-t border-white/10 mt-auto">
          <div className="flex flex-col space-y-1">
            <p>© 2025 DILE. Todos los derechos reservados.</p>
            {isMobileDevice && isActive && (
              <p className="text-xs text-yellow-200">
                📱 Auto-logout activado: Se cerrará sesión tras 5 min de inactividad
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de cambiar contraseña */}
      <UserChangePasswordModal
        isOpen={showChangePasswordModal}
        user={user && user._id ? {
          _id: user._id,
          email: user.email,
          razon: user.razon || '',
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
