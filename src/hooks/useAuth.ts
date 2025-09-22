import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types/roles';
import { useCombinedPermissions } from './useCombinedPermissions';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { user } = useAuth();
  const combinedPermissions = useCombinedPermissions();
  
  const isBasicUser = () => {
    if (!user || !user.role) return true;
    return user.role === UserRole.BASIC_USER;
  };
  
  return {
    // Método legacy para compatibilidad - siempre devuelve false para strings legacy
    hasPermission: (permission: string) => {
      console.warn(`⚠️ Método legacy hasPermission("${permission}") usado. Migrar a useCombinedPermissions`);
      return false; // Los strings legacy ya no se soportan
    },
    isBasicUser,
    // Métodos legacy que usan el nuevo sistema
    canManageUsers: () => combinedPermissions.canManageUsers(),
    canAccessPayments: () => combinedPermissions.canAccessPayments(),
    canAccessCredits: () => combinedPermissions.canAccessCredits(),
    canAccessGestionMora: () => combinedPermissions.canAccessGestionMora(),
    canAccessPendientesDesembolsar: () => combinedPermissions.canAccessPendientesDesembolsar(),
    canAccessBotInteractions: () => combinedPermissions.canAccessBotInteractions(),
    canAccessConsultaCuotas: () => combinedPermissions.canAccessConsultaCuotas(),
    canAccessConsultaSocios: () => combinedPermissions.canAccessConsultaSocios(),
    canAccessRegistroClientes: () => combinedPermissions.canAccessRegistroClientes(),
    canAccessCalculadoraCreditos: () => combinedPermissions.canAccessCalculadoraCreditos(),
    canAccessReports: () => combinedPermissions.canAccessReports(),
    canAssignRoles: () => combinedPermissions.canAssignRoles(),
    canDeleteAccounts: () => combinedPermissions.canDeleteAccounts(),
    canBlockEmails: () => combinedPermissions.canBlockEmails(),
    canAccessGeodile: () => combinedPermissions.canAccessGeodile(),
    canAccessAffiliationSocios: () => combinedPermissions.canAccessAffiliationSocios(),
    canAccessPagoRecaudadores: () => combinedPermissions.canAccessPagoRecaudadores(),
  };
}