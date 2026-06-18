import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoutButton } from './LogoutButton';
import UserInfo from './UserInfo';
import { useCombinedPermissions } from '../hooks/useCombinedPermissions';
import { UserChangePasswordModal } from './gestion_usuarios';
import { useAuth } from '../hooks/useAuth';
import { useAutoLogout } from '../hooks/useAutoLogout';
//import { NotificationBell } from './NotificationBell';
import logo from '../logo_dile.webp';

// Interfaz para las props del Layout
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  fullWidth?: boolean;
}

// Componente del icono SVG de Geodile
const GeodileIcon = React.memo(({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 141 153" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M82.4004 84.2898H58.5996C57.1667 84.2879 55.7931 83.7174 54.7806 82.7035C53.768 81.6897 53.1993 80.3153 53.1993 78.8824V56.4493C53.1993 55.0171 53.7683 53.6435 54.781 52.6308C55.7938 51.618 57.1673 51.049 58.5996 51.049H82.4004C83.8326 51.049 85.2062 51.618 86.219 52.6308C87.2317 53.6435 87.8007 55.0171 87.8007 56.4493V78.8824C87.8007 80.3153 87.232 81.6897 86.2194 82.7035C85.2069 83.7174 83.8333 84.2879 82.4004 84.2898Z" fill="currentColor"/>
    <path d="M101.323 30.5406C84.2968 13.5219 56.7031 13.5219 39.6774 30.5406C23.6527 46.5723 22.5811 72.2132 37.231 89.5209L63.3724 120.414C67.1019 124.82 73.8981 124.82 77.6275 120.414L103.769 89.5209C118.419 72.2132 117.347 46.5723 101.323 30.5406ZM70.5 94.1105C51.4015 94.1105 35.9127 78.6287 35.9127 59.5232C35.9127 40.4177 51.4015 24.9429 70.5 24.9429C89.5984 24.9429 105.087 40.4247 105.087 59.5232C105.087 78.6216 89.5984 94.1105 70.5 94.1105Z" fill="currentColor"/>
    <path d="M70.5 70.4013C71.9622 70.4013 73.3645 70.9822 74.3984 72.0161C75.4323 73.05 76.0131 74.4522 76.0131 75.9144V83.2746H64.9869V75.9144C64.9869 74.4522 65.5677 73.05 66.6017 72.0161C67.6356 70.9822 69.0378 70.4013 70.5 70.4013Z" fill="white"/>
  </svg>
));

// Iconos ORIGINALES del código inicial (revertidos, sin mis cambios)
const PaymentsIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const HistoryIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PendientesIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const RecaudadoresIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AfiliacionIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const SolicitudesIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BotIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const CuotasIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const UsersIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const HistorialDesembolsosIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CalculadoraIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const MoraIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const RegistroIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const GlobalMenuIcon = (
  <svg
    className="w-5 h-5 text-white stroke-current drop-shadow-[0_0_6px_rgba(0,123,255,0.8)] hover:scale-110 transition-transform duration-200"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
    />
  </svg>
);

const CuotasMoraIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


// Íconos para secciones padre (nuevos, acordes)
const OperacionesSectionIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const GestionSectionIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CreditosSectionIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const AdmisionSectionIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" /></svg>;

// Componente NavButton (modificado para sangría en hijos)
const NavButton = React.memo(({ onClick, children, icon }: { onClick: () => void, children: React.ReactNode, icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="w-full text-left text-white hover:bg-white/20 active:bg-white/30 p-2.5 sm:p-3 text-xs sm:text-sm transition-all border-b border-white/10 flex items-center space-x-2 sm:space-x-3 hover:shadow-lg hover:shadow-white/5 pl-4 sm:pl-6 rounded-md mx-1" 
  >
    <span className="text-white/80 flex-shrink-0">{icon}</span>
    <span className="truncate">{children}</span>
  </button>
));

// Componente SectionTitle (sin sangría, solo ícono)
const SectionTitle = React.memo(({ children, icon, isOpen, onClick }: { children: React.ReactNode, icon?: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex justify-between items-center px-3 sm:px-4 py-2 sm:py-2.5 text-white font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors text-xs sm:text-sm rounded-md mx-1"
  >
    <span className="text-xs sm:text-sm flex items-center space-x-2">
      {icon && <span className="text-white/80 flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
    <svg
      className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
));

// Sidebar
const Sidebar = React.memo(({ isMobile, isOpen, setIsOpen }: { isMobile: boolean, isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const permissions = useCombinedPermissions();
  const toggleSidebar = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  // Estado para secciones: Inicializar abiertas y persistir con localStorage para que no se cierren al navegar
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('sidebarSections');
    if (saved) {
      return JSON.parse(saved);
    }
    return { 0: true, 1: true, 2: true, 3: true }; // Por defecto todas abiertas
  });

  // Persistir en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem('sidebarSections', JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = useCallback((sectionIndex: number) => {
    setOpenSections(prev => ({ ...prev, [sectionIndex]: !prev[sectionIndex] }));
  }, []);

  const menuSections = useMemo(() => {
    const sections = [
      {
        title: "OPERACIONES",
        icon: OperacionesSectionIcon,
        options: [
          { to: '/payments', icon: PaymentsIcon, label: 'Ver Pagos', permission: permissions.canAccessPayments() },
          { to: '/payments/history', icon: HistoryIcon, label: 'Historial de Pagos', permission: permissions.canAccessPayments() },
          { to: '/pendientes-desembolsar', icon: PendientesIcon, label: 'Pendientes a Desembolsar', permission: permissions.canAccessPendientesDesembolsar() },
          { to: '/pago-recaudadores', icon: RecaudadoresIcon, label: 'Pago Recaudadores', permission: permissions.canAccessPagoRecaudadores() },
          { to: '/afiliacion-socios', icon: AfiliacionIcon, label: 'Afiliación de Socios', permission: permissions.canAccessAffiliationSocios() },
          {to: '/seguimiento-desembolsos-hoy', icon: CuotasMoraIcon, label: 'Seguimiento Desembolsos Hoy', permission: true},
          { to: '/ver-cuotas-mora', icon: CuotasMoraIcon, label: 'Ver Cuotas en Mora', permission: true },
        ]
      },
      {
        title: "GESTIÓN",
        icon: GestionSectionIcon,
        options: [
          { to: '/credit-requests', icon: SolicitudesIcon, label: 'Solicitudes de Crédito', permission: permissions.canAccessCredits() },
          { to: '/bot-interactions', icon: BotIcon, label: 'Interacciones del Bot', permission: permissions.canAccessBotInteractions() },
          { to: '/consultas-cuotas', icon: CuotasIcon, label: 'Reporte de Consulta de Cuotas', permission: permissions.canAccessConsultaCuotas() },
          { to: '/user-management', icon: UsersIcon, label: 'Gestión de Usuarios', permission: permissions.canManageUsers() },
          { to: '/historial-desembolsos', icon: HistorialDesembolsosIcon, label: 'Historial de Desembolsos', permission: permissions.canAccessHistorialDesembolsos() },
        ]
      },
      {
        title: "CRÉDITOS",
        icon: CreditosSectionIcon,
        options: [
          { to: '/aprobacion-creditos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Aprobación de Créditos', permission: permissions.canViewCreditApproval() },
          { to: '/solicitud-credito', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Solicitud de Crédito', permission: permissions.canViewCreditRequest() },
          { to: '/geodile', icon: <GeodileIcon className="w-5 h-5" />, label: 'Geodile', permission: permissions.canAccessGeodile() },
          { to: '/calculadora-creditos', icon: CalculadoraIcon, label: 'Calculadora de Créditos', permission: true },
          { to: '/gestion-mora', icon: MoraIcon, label: 'Gestión de Mora', permission: permissions.canAccessGestionMora() },
          { to: '/gestion-recuperadores', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, label: 'Gestión de Recuperadores', permission: permissions.canAccessRecuperaciones() },
          { to: '/culqui-pendientes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, label: 'QULLQI', permission: permissions.canAccessCulqui() },

        ]
      },
      {
        title: "ADMISIÓN",
        icon: AdmisionSectionIcon,
        options: [
          { to: '/registro-clientes', icon: RegistroIcon, label: 'Registro de Socios', permission: permissions.canAccessRegistroClientes() },
        ]
      }
    ];
    return sections.filter(section => section.options.some(option => option.permission));
  }, [permissions]);

  const sidebarClass = `bg-gradient-to-b from-cyan-500 to-blue-500 border-r border-white/20 shadow-xl transition-all duration-300 ease-in-out overflow-y-auto sidebar-scroll ${
    isMobile ? 'w-64 fixed top-0 left-0 z-50 h-screen flex flex-col' : isOpen ? 'w-64 h-full flex flex-col' : 'w-16 h-full flex flex-col'
  }`;

  return (
    <div className={sidebarClass}>
      <div className={`px-4 sm:px-6 py-4 flex-shrink-0 ${isMobile ? 'border-b border-white/10' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-white font-semibold text-lg ${(!isOpen && !isMobile) && 'hidden'}`}>Panel de Control</h3>
          {!isMobile && (
            <button onClick={toggleSidebar} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />}
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto px-3 sm:px-4 pb-6 min-h-0 ${(!isOpen && !isMobile) && 'hidden'}`}>
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            <SectionTitle 
              icon={section.icon} 
              isOpen={!!openSections[sectionIndex]} 
              onClick={() => toggleSection(sectionIndex)}
            >
              {section.title}
            </SectionTitle>
            <div className="space-y-1">  {/* Siempre renderiza el div, pero condicional el contenido */}
              {openSections[sectionIndex] && (
                <>
                  {section.options.map((option, optionIndex) =>
                    option.permission ? (
                      <NavButton key={optionIndex} onClick={() => navigate(option.to)} icon={option.icon}>
                        {option.label}
                      </NavButton>
                    ) : null
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// GlobalMenu - FIJADO PARA MÓVIL
const GlobalMenu = React.memo(() => {
  const navigate = useNavigate();
  const permissions = useCombinedPermissions();
  const [isOpen, setIsOpen] = useState(false);

  if (!permissions.canAccessConsultaSocios()) return null;

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigateToConsulta = () => {
    navigate('/consulta-clientes');
    setIsOpen(false);
  };

  const handleNavigateToCuotas = () => {
    navigate('/ver-cuotas-mora');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors flex items-center"
        title="Menú Global"
      >
        {GlobalMenuIcon}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[45] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`
              absolute right-0 top-full mt-2 w-80 sm:w-56 bg-white rounded-lg shadow-xl z-50 overflow-y-auto
              max-h-96
            `}
          >
            <button
              onClick={handleNavigateToConsulta}
              className="
                w-full text-left px-3 sm:px-4 py-3 hover:bg-blue-50 transition-colors
                flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-gray-700
                border-b border-gray-100
              "
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm sm:text-base break-words whitespace-normal">
                Consultar Socios
              </span>
            </button>
            <button
              onClick={handleNavigateToCuotas}
              className="
                w-full text-left px-3 sm:px-4 py-3 hover:bg-blue-50 transition-colors
                flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-gray-700
              "
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm sm:text-base break-words whitespace-normal">
                Ver Cuotas en Mora
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
});

// Layout principal
const Layout: React.FC<LayoutProps> = ({ children, title, showBackButton = true, fullWidth = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useCombinedPermissions();
  const { user } = useAuth();
  const { isMobile: isMobileDevice, isActive } = useAutoLogout();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarDesktopOpen, setSidebarDesktopOpen] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [layoutHidden, setLayoutHidden] = useState(false);
  const isGeodilePage = location.pathname === '/geodile';

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleLayoutHidden = useCallback(() => {
    const newLayoutHidden = !layoutHidden;
    setLayoutHidden(newLayoutHidden);
    window.dispatchEvent(new CustomEvent('geodileLayoutToggle', { detail: { hidden: newLayoutHidden } }));
  }, [layoutHidden]);

  const headerVisible = !(isGeodilePage && layoutHidden);
  const sidebarVisible = !permissions.isBasicUser() && location.pathname !== '/' && !(isGeodilePage && layoutHidden);
  const contentClass = fullWidth ? `h-full overflow-y-auto ${isGeodilePage && layoutHidden ? 'fixed inset-0 z-[55]' : ''}` : 'bg-white/90 backdrop-blur-sm p-0 h-full overflow-y-auto';

  return (
    <div className="h-screen w-full max-w-full flex flex-col bg-gradient-to-b from-cyan-500 to-blue-500 overflow-hidden">
      <div className="w-full flex flex-col flex-grow bg-gradient-to-r from-cyan-500 to-blue-500 min-h-0">
        {/* Header */}
        {headerVisible && (
          <>
            <div className="w-full max-w-full flex-shrink-0">
              <div className="w-full px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
                <div className="overflow-visible flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                  <motion.div
                    className="flex-1 relative min-w-[5rem] w-full max-w-[80px] sm:max-w-xs h-12 sm:h-16 md:h-20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <img src={logo} alt="Logo DILE" className="w-full h-full object-contain" />
                  </motion.div>
                  <motion.div
                    className="flex-1 text-center"
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  >
                    <h1 className="text-white font-extrabold text-xs sm:text-sm md:text-lg lg:text-2xl drop-shadow-md tracking-tight line-clamp-2">
                      {title}
                    </h1>
                  </motion.div>
                  <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-2">
                    <GlobalMenu />
                    {/*<NotificationBell />*/}
                    <UserInfo />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-8 py-1 sm:py-1.5 border-t border-white/10">
              {showBackButton && location.pathname !== '/' && (
                <button
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 text-xs sm:text-sm"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Volver al Inicio</span>
                  <span className="sm:hidden">Volver</span>
                </button>
              )}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full sm:w-auto bg-blue-400/80 hover:bg-blue-500/90 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 text-xs sm:text-sm"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
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

        {/* Botón toggle Geodile */}
        {isGeodilePage && (
          <button
            onClick={toggleLayoutHidden}
            className="fixed top-4 right-4 z-[60] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
            title={layoutHidden ? "Mostrar controles" : "Ocultar controles"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {layoutHidden ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />}
            </svg>
          </button>
        )}

        {/* Botón flotante móvil */}
        {sidebarVisible && isMobile && (
          <button
            onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
            className="fixed top-4 left-4 z-[60] bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarMobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        )}

        {/* Overlay móvil sidebar */}
        {sidebarVisible && isMobile && sidebarMobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarMobileOpen(false)} />
        )}

        {/* Contenedor principal */}
        <div className="flex flex-row flex-grow min-h-0 relative">
          {/* Sidebar - CON SCROLL PROPIO */}
          {sidebarVisible && (
            <>
              {!isMobile && (
                <div className="flex-shrink-0 h-full overflow-y-auto transition-all duration-300 ease-in-out">
                  <Sidebar isMobile={isMobile} isOpen={sidebarDesktopOpen} setIsOpen={setSidebarDesktopOpen} />
                </div>
              )}
              {isMobile && sidebarMobileOpen && (
                <div className="fixed top-0 left-0 h-full z-50 overflow-y-auto">
                  <Sidebar isMobile={isMobile} isOpen={sidebarMobileOpen} setIsOpen={setSidebarMobileOpen} />
                </div>
              )}
            </>
          )}

          {/* Contenido - CON SCROLL PROPIO */}
          <div className="flex-grow min-h-0 overflow-y-auto content-scroll transition-all duration-300 ease-in-out">
            <div className={contentClass}>{children}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {headerVisible && (
        <div className="w-full flex-shrink-0 bg-blue-600/20 backdrop-blur-sm p-4 text-center text-white text-sm border-t border-white/10">
          <div className="flex flex-col space-y-1">
            <p>© 2025 DILE. Todos los derechos reservados.</p>
            {isMobileDevice && isActive && <p className="text-xs text-yellow-200">📱 Auto-logout activado: Se cerrará sesión tras 5 min de inactividad</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <UserChangePasswordModal
        isOpen={showChangePasswordModal}
        user={user && user._id ? { _id: user._id, email: user.email, razon: user.razon || '', dni: user.dni, role: user.role, status: 1, agencias: [], statusText: 'ACTIVO', lastLogin: new Date().toISOString() } : null}
        currentUser={user}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default Layout;
