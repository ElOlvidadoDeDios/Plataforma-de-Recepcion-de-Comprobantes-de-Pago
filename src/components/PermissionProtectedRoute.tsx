import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCombinedPermissions } from '../hooks/useCombinedPermissions';

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  permission: string;
}

const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = ({
  children,
  permission
}) => {
  const permissions = useCombinedPermissions();

  // Verificar si el usuario tiene el permiso específico (base + extra)
  let hasPermission = false;
  
  switch (permission) {
    case 'canAccessConsultaSocios':
      hasPermission = permissions.canAccessConsultaSocios();
      break;
    case 'canManageUsers':
      hasPermission = permissions.canManageUsers();
      break;
    case 'canAccessPayments':
      hasPermission = permissions.canAccessPayments();
      break;
    case 'canAccessCredits':
      hasPermission = permissions.canAccessCredits();
      break;
    case 'canAccessBotInteractions':
      hasPermission = permissions.canAccessBotInteractions();
      break;
    case 'canAccessConsultaCuotas':
      hasPermission = permissions.canAccessConsultaCuotas();
      break;
    case 'canAccessGestionMora':
      hasPermission = permissions.canAccessGestionMora();
      break;
    case 'canAccessPendientesDesembolsar':
      hasPermission = permissions.canAccessPendientesDesembolsar();
      break;
    case 'canAccessRegistroClientes':
      hasPermission = permissions.canAccessRegistroClientes();
      break;
    case 'canAccessCalculadoraCreditos':
      hasPermission = permissions.canAccessCalculadoraCreditos();
      break;
    case 'canAccessGeodile':
      hasPermission = permissions.canAccessGeodile();
      break;
    case 'canAccessReports':
      hasPermission = permissions.canAccessReports();
      break;
    case 'canAccessAffiliationSocios':
      hasPermission = permissions.canAccessAffiliationSocios();
      break;
    case 'canAccessPagoRecaudadores':
      hasPermission = permissions.canAccessPagoRecaudadores();
      break;
    case 'canAccessHistorialDesembolsos':
      hasPermission = permissions.canAccessHistorialDesembolsos();
      break;
    case 'canAccessCulqui':
      hasPermission = permissions.canAccessCulqui();
      break;
    case 'canAccessSeguimientoDesembolsosHoy':
      hasPermission = permissions.canAccessSeguimientoDesembolsosHoy();
      break;
    case 'canAccessRecuperaciones':
      hasPermission = permissions.canAccessRecuperaciones();
      break;
    case 'canViewCreditApproval':
      hasPermission = permissions.canViewCreditApproval();
      break;
    case 'canViewCreditRequest':
      hasPermission = permissions.canViewCreditRequest();
      break;
    case 'canViewWhatsAppConversations':
      hasPermission = permissions.canViewWhatsAppConversations();
      break;
    case 'canViewCumpaSeguro':
      hasPermission = permissions.canViewCumpaSeguro();
      break;
    case 'canAccessDileScore':
      hasPermission = permissions.canAccessDileScore();
      break;
    
    default:
      hasPermission = false;
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PermissionProtectedRoute;