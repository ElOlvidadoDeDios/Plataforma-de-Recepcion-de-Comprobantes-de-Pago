import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types/roles';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { hasPermission, user } = useAuth();
  
  const isBasicUser = () => {
    if (!user || !user.role) return true;
    return user.role === UserRole.BASIC_USER;
  };
  
  return {
    hasPermission,
    isBasicUser,
    canManageUsers: () => hasPermission('canManageUsers'),
    canAccessPayments: () => hasPermission('canAccessPayments'),
    canAccessCredits: () => hasPermission('canAccessCredits'),
    canAccessGestionMora: () => hasPermission('canAccessGestionMora'),
    canAccessPendientesDesembolsar: () => hasPermission('canAccessPendientesDesembolsar'),
    canAccessBotInteractions: () => hasPermission('canAccessBotInteractions'),
    canAccessConsultaCuotas: () => hasPermission('canAccessConsultaCuotas'),
    canAccessReports: () => hasPermission('canAccessReports'),
    canAssignRoles: () => hasPermission('canAssignRoles'),
    canDeleteAccounts: () => hasPermission('canDeleteAccounts'),
    canBlockEmails: () => hasPermission('canBlockEmails'),
  };
}