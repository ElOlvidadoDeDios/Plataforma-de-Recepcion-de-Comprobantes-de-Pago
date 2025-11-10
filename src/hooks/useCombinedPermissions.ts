import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Permission } from '../types/permissions';

/**
 * Hook que maneja permisos del nuevo sistema simplificado
 * Este es el hook principal que deben usar los componentes para verificar permisos
 */
export function useCombinedPermissions() {
  const { user } = useContext(AuthContext);
  if (!user) {
    // Si no hay usuario autenticado, devolver estado sin permisos
    throw new Error('useCombinedPermissions must be used within an AuthProvider');
  }
  
  // Obtener permisos del usuario desde la base de datos
  const userPermissions: Permission[] = user?.permissions || [];

  // Función principal que verifica permisos con lógica de herencia
  const hasPermission = (permission: Permission): boolean => {
    // Si el usuario es SUPER_ADMIN, tiene todos los permisos
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    // Verificar si tiene el permiso exacto
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Lógica de herencia: Si tiene EDITAR, automáticamente tiene VER
    if (permission.endsWith(':view')) {
      const editPermission = permission.replace(':view', ':edit') as Permission;
      if (userPermissions.includes(editPermission)) {
        return true;
      }
    }

    return false;
  };

  // Función que permite verificar múltiples permisos (OR logic)
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Función que permite verificar que tenga todos los permisos (AND logic)
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  return {
    // Usuario y permisos
    user,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Métodos específicos para el sistema simplificado (2 niveles por pantalla)
    
    // === GESTIÓN DE USUARIOS ===
    canViewUsers: () => hasPermission(Permission.USERS_VIEW),
    canEditUsers: () => hasPermission(Permission.USERS_EDIT),
    canManageUsers: () => hasPermission(Permission.USERS_EDIT), // Legacy compatibility
    
    // === PAGOS ===
    canViewPayments: () => hasPermission(Permission.PAYMENTS_VIEW),
    canEditPayments: () => hasPermission(Permission.PAYMENTS_EDIT),
    canAccessPayments: () => hasPermission(Permission.PAYMENTS_VIEW), // Legacy compatibility
    
    // === CRÉDITOS ===
    canViewCredits: () => hasPermission(Permission.CREDITS_VIEW),
    canEditCredits: () => hasPermission(Permission.CREDITS_EDIT),
    canAccessCredits: () => hasPermission(Permission.CREDITS_VIEW), // Legacy compatibility
    
    // === CONSULTA DE CUOTAS ===
    canViewInstallments: () => hasPermission(Permission.INSTALLMENTS_VIEW),
    canEditInstallments: () => hasPermission(Permission.INSTALLMENTS_EDIT),
    canAccessConsultaCuotas: () => hasPermission(Permission.INSTALLMENTS_VIEW), // Legacy compatibility
    
    // === CONSULTAR SOCIOS ===
    canViewPartners: () => hasPermission(Permission.PARTNERS_VIEW),
    canEditPartners: () => hasPermission(Permission.PARTNERS_EDIT),
    canAccessConsultaSocios: () => hasPermission(Permission.PARTNERS_VIEW), // Legacy compatibility
    
    // === REGISTRO DE CLIENTES ===
    canViewClients: () => hasPermission(Permission.CLIENTS_VIEW),
    canEditClients: () => hasPermission(Permission.CLIENTS_EDIT),
    canAccessRegistroClientes: () => hasPermission(Permission.CLIENTS_VIEW), // Legacy compatibility
    
    // === GESTIÓN DE MORA ===
    canViewMora: () => hasPermission(Permission.MORA_VIEW),
    canEditMora: () => hasPermission(Permission.MORA_EDIT),
    canAccessGestionMora: () => hasPermission(Permission.MORA_VIEW), // Legacy compatibility
    
    // === PENDIENTES A DESEMBOLSAR ===
    canViewDisbursements: () => hasPermission(Permission.DISBURSEMENTS_VIEW),
    canEditDisbursements: () => hasPermission(Permission.DISBURSEMENTS_EDIT),
    canAccessPendientesDesembolsar: () => hasPermission(Permission.DISBURSEMENTS_VIEW), // Legacy compatibility
    
    // === INTERACCIONES DEL BOT ===
    canViewBot: () => hasPermission(Permission.BOT_VIEW),
    canEditBot: () => hasPermission(Permission.BOT_EDIT),
    canAccessBotInteractions: () => hasPermission(Permission.BOT_VIEW), // Legacy compatibility
    
    // === CALCULADORA DE CRÉDITOS ===
    canViewCalculator: () => hasPermission(Permission.CALCULATOR_VIEW),
    canEditCalculator: () => hasPermission(Permission.CALCULATOR_EDIT),
    canAccessCalculadoraCreditos: () => hasPermission(Permission.CALCULATOR_VIEW), // Legacy compatibility

    // === GEODILE ===
    canViewGeodile: () => hasPermission(Permission.GEODILE_VIEW),
    canEditGeodile: () => hasPermission(Permission.GEODILE_EDIT),
    canAccessGeodile: () => hasPermission(Permission.GEODILE_VIEW), // Legacy compatibility

    // === MÉTODOS LEGACY PARA COMPATIBILIDAD ===
    canAccessReports: () => hasPermission(Permission.INSTALLMENTS_VIEW), // Mapear a consulta de cuotas
    canAssignRoles: () => hasPermission(Permission.USERS_EDIT),
    canDeleteAccounts: () => hasPermission(Permission.USERS_EDIT),
    canBlockEmails: () => hasPermission(Permission.USERS_EDIT),

    // === AFILIACIÓN DE SOCIOS ===
    canAccessAffiliationSocios: () => hasPermission(Permission.AFFILIATION_SOCIOS_VIEW),
    canEditAffiliationSocios: () => hasPermission(Permission.AFFILIATION_SOCIOS_EDIT),
    canViewAffiliationSocios: () => hasPermission(Permission.AFFILIATION_SOCIOS_VIEW),

    // pago recaudadores
    canAccessPagoRecaudadores: () => hasPermission(Permission.PAGO_RECAUDADORES_VIEW),
    canEditPagoRecaudadores: () => hasPermission(Permission.PAGO_RECAUDADORES_EDIT),
    canViewPagoRecaudadores: () => hasPermission(Permission.PAGO_RECAUDADORES_VIEW),

    // === HISTORIAL DE DESEMBOLSOS ===
    canAccessHistorialDesembolsos: () => {
      // Roles con acceso automático sin necesidad de permisos
      const rolesConAccesoAutomatico = ['SUPER_ADMIN', 'GERENTE_GENERAL', 'JEFE_OPERACIONES'];
      if (rolesConAccesoAutomatico.includes(user?.role || '')) {
        return true;
      }
      // Para otros roles, verificar permisos específicos
      return hasPermission(Permission.DISBURSEMENT_HISTORY_VIEW);
    },
    canEditHistorialDesembolsos: () => {
      // Roles con acceso automático sin necesidad de permisos
      const rolesConAccesoAutomatico = ['SUPER_ADMIN', 'GERENTE_GENERAL', 'JEFE_OPERACIONES'];
      if (rolesConAccesoAutomatico.includes(user?.role || '')) {
        return true;
      }
      // Para otros roles, verificar permisos específicos
      return hasPermission(Permission.DISBURSEMENT_HISTORY_EDIT);
    },
    canViewHistorialDesembolsos: () => {
      // Roles con acceso automático sin necesidad de permisos
      const rolesConAccesoAutomatico = ['SUPER_ADMIN', 'GERENTE_GENERAL', 'JEFE_OPERACIONES'];
      if (rolesConAccesoAutomatico.includes(user?.role || '')) {
        return true;
      }
      // Para otros roles, verificar permisos específicos
      return hasPermission(Permission.DISBURSEMENT_HISTORY_VIEW);
    },

    // Método para verificar si es usuario básico
    isBasicUser: () => {
      if (!user || !user.role) return true;
      return user.role === 'BASIC_USER';
    },

    // Método para verificar si es SUPER_ADMIN
    isSuperAdmin: () => {
      return user?.role === 'SUPER_ADMIN';
    },

    // Información adicional útil
    hasAnyPermissions: () => userPermissions.length > 0,
    getPermissions: () => userPermissions,
    getPermissionCount: () => userPermissions.length,
    
    // Método para debug - mostrar todos los permisos

  };
}

export default useCombinedPermissions;