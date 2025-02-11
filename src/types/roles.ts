// Enumeración de roles de usuario disponibles en el sistema
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Super administrador: control total del sistema
  ADMIN = 'ADMIN',                 // Administrador: puede gestionar usuarios y roles
  PAYMENTS_USER = 'PAYMENTS_USER',  // Usuario de pagos: acceso solo a la sección de pagos
  CREDIT_USER = 'CREDIT_USER',     // Usuario de créditos: acceso solo a la sección de créditos
  BASIC_USER = 'BASIC_USER'        // Usuario básico: solo puede ver la pantalla de inicio
}

// Interfaz que define la estructura de un usuario con su rol
export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  lastName?: string;  // Agregado para mantener consistencia con la respuesta del backend
  dni?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Definición de permisos para cada rol en el sistema
export const rolePermissions = {
  [UserRole.SUPER_ADMIN]: {
    canDeleteAccounts: true,    // Puede eliminar cuentas de usuario
    canBlockEmails: true,       // Puede bloquear correos electrónicos
    canAssignRoles: true,       // Puede asignar roles a usuarios
    canAccessPayments: true,    // Puede acceder al módulo de pagos
    canAccessCredits: true,     // Puede acceder al módulo de créditos
    canManageUsers: true,       // Puede gestionar usuarios
  },
  [UserRole.ADMIN]: {
    canDeleteAccounts: false,   // No puede eliminar cuentas
    canBlockEmails: false,      // No puede bloquear correos
    canAssignRoles: true,       // Puede asignar roles
    canAccessPayments: true,    // Puede acceder a pagos
    canAccessCredits: true,     // Puede acceder a créditos
    canManageUsers: true,       // Puede gestionar usuarios
  },
  [UserRole.PAYMENTS_USER]: {
    canDeleteAccounts: false,   // No puede eliminar cuentas
    canBlockEmails: false,      // No puede bloquear correos
    canAssignRoles: false,      // No puede asignar roles
    canAccessPayments: true,    // Solo puede acceder a pagos
    canAccessCredits: false,    // No puede acceder a créditos
    canManageUsers: false,      // No puede gestionar usuarios
  },
  [UserRole.CREDIT_USER]: {
    canDeleteAccounts: false,   // No puede eliminar cuentas
    canBlockEmails: false,      // No puede bloquear correos
    canAssignRoles: false,      // No puede asignar roles
    canAccessPayments: false,   // No puede acceder a pagos
    canAccessCredits: true,     // Solo puede acceder a créditos
    canManageUsers: false,      // No puede gestionar usuarios
  },
  [UserRole.BASIC_USER]: {
    canDeleteAccounts: false,   // No puede eliminar cuentas
    canBlockEmails: false,      // No puede bloquear correos
    canAssignRoles: false,      // No puede asignar roles
    canAccessPayments: false,   // No puede acceder a pagos
    canAccessCredits: false,    // No puede acceder a créditos
    canManageUsers: false,      // No puede gestionar usuarios
  }
};