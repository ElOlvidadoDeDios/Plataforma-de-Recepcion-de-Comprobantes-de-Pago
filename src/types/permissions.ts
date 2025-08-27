/**
 * Sistema unificado de permisos importado desde el backend
 * Este archivo reemplaza a extraPermissions.ts
 */

// Sistema SIMPLIFICADO: Solo 2 permisos por pantalla (VER y EDITAR)
export enum Permission {
  // === GESTIÓN DE USUARIOS ===
  USERS_VIEW = 'users:view',          // Ver usuarios
  USERS_EDIT = 'users:edit',          // Editar usuarios (incluye crear, eliminar, roles, etc.)

  // === PAGOS ===
  PAYMENTS_VIEW = 'payments:view',    // Ver pagos
  PAYMENTS_EDIT = 'payments:edit',    // Editar pagos (incluye procesar, recibir, etc.)

  // === CRÉDITOS ===
  CREDITS_VIEW = 'credits:view',      // Ver créditos
  CREDITS_EDIT = 'credits:edit',      // Editar créditos (incluye crear, aprobar, rechazar, etc.)

  // === CONSULTA DE CUOTAS ===
  INSTALLMENTS_VIEW = 'installments:view',  // Ver cuotas
  INSTALLMENTS_EDIT = 'installments:edit',  // Editar cuotas

  // === CONSULTAR SOCIOS ===
  PARTNERS_VIEW = 'partners:view',    // Ver socios
  PARTNERS_EDIT = 'partners:edit',    // Editar socios

  // === REGISTRO DE CLIENTES ===
  CLIENTS_VIEW = 'clients:view',      // Ver clientes
  CLIENTS_EDIT = 'clients:edit',      // Editar clientes (incluye registrar, actualizar, etc.)

  // === GESTIÓN DE MORA ===
  MORA_VIEW = 'mora:view',            // Ver mora
  MORA_EDIT = 'mora:edit',            // Editar mora (incluye gestionar, procesar, etc.)

  // === PENDIENTES A DESEMBOLSAR ===
  DISBURSEMENTS_VIEW = 'disbursements:view',  // Ver desembolsos
  DISBURSEMENTS_EDIT = 'disbursements:edit',  // Editar desembolsos (incluye procesar, aprobar, etc.)

  // === INTERACCIONES DEL BOT ===
  BOT_VIEW = 'bot:view',              // Ver bot
  BOT_EDIT = 'bot:edit',              // Editar bot (incluye gestionar, configurar, etc.)

  // === CALCULADORA DE CRÉDITOS ===
  CALCULATOR_VIEW = 'calculator:view', // Ver calculadora
  CALCULATOR_EDIT = 'calculator:edit', // Editar calculadora (incluye calcular, etc.)

  // === REPORTES DE  UBICACIÓN  GEODILE ===
  GEODILE_VIEW = 'geodile:view',
  GEODILE_EDIT = 'geodile:edit',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GERENTE_GENERAL = 'GERENTE_GENERAL',
  ADMINISTRADOR = 'ADMINISTRADOR',
  CAJERO = 'CAJERO',
  ANALISTA_CREDITOS_I = 'ANALISTA_CREDITOS_I',
  JEFE_OPERACIONES = 'JEFE_OPERACIONES',
  ANALISTA_CREDITOS_PAGO_DIARIO = 'ANALISTA_CREDITOS_PAGO_DIARIO',
  BASIC_USER = 'BASIC_USER',
  RECAUDADOR = 'RECAUDADOR',
}

/**
 * Categorías SIMPLIFICADAS por pantallas - Solo 2 permisos por pantalla
 */
export const PermissionCategories = {
  'Ver Pagos': [
    Permission.PAYMENTS_VIEW,    // Solo ver
    Permission.PAYMENTS_EDIT,    // Editar (incluye todo: procesar, recibir, etc.)
  ],
  'Solicitudes de Crédito': [
    Permission.CREDITS_VIEW,     // Solo ver
    Permission.CREDITS_EDIT,     // Editar (incluye todo: crear, aprobar, rechazar, etc.)
  ],
  'Interacciones del Bot': [
    Permission.BOT_VIEW,         // Solo ver
    Permission.BOT_EDIT,         // Editar (incluye gestionar, configurar, etc.)
  ],
  'Consulta de Cuotas': [
    Permission.INSTALLMENTS_VIEW, // Solo ver
    Permission.INSTALLMENTS_EDIT, // Editar
  ],
  'Consultar Socios': [
    Permission.PARTNERS_VIEW,    // Solo ver
    Permission.PARTNERS_EDIT,    // Editar
  ],
  'Registro de Clientes': [
    Permission.CLIENTS_VIEW,     // Solo ver
    Permission.CLIENTS_EDIT,     // Editar (incluye registrar, actualizar, etc.)
  ],
  'Gestión de Usuarios': [
    Permission.USERS_VIEW,       // Solo ver
    Permission.USERS_EDIT,       // Editar (incluye crear, roles, permisos, etc.)
  ],
  'Gestión de Mora': [
    Permission.MORA_VIEW,        // Solo ver
    Permission.MORA_EDIT,        // Editar (incluye gestionar, procesar, etc.)
  ],
  'Pendientes a Desembolsar': [
    Permission.DISBURSEMENTS_VIEW, // Solo ver
    Permission.DISBURSEMENTS_EDIT, // Editar (incluye procesar, aprobar, etc.)
  ],
  'Calculadora de Créditos': [
    Permission.CALCULATOR_VIEW,   // Solo ver
    Permission.CALCULATOR_EDIT,   // Editar (incluye calcular, etc.)
  ],
  'Reportes de Ubicación': [
    Permission.GEODILE_VIEW,   // Solo ver
    Permission.GEODILE_EDIT,   // Editar (incluye calcular, etc.)
  ],

};

/**
 * Etiquetas SIMPLIFICADAS para cada permiso
 */
export const PermissionLabels: Record<Permission, string> = {
  // Gestión de Usuarios
  [Permission.USERS_VIEW]: '👥 Ver Usuarios',
  [Permission.USERS_EDIT]: '✏️ Gestionar Usuarios',

  // Pagos
  [Permission.PAYMENTS_VIEW]: '💰 Ver Pagos',
  [Permission.PAYMENTS_EDIT]: '⚙️ Gestionar Pagos',

  // Créditos
  [Permission.CREDITS_VIEW]: '📝 Ver Créditos',
  [Permission.CREDITS_EDIT]: '✏️ Gestionar Créditos',

  // Consulta de Cuotas
  [Permission.INSTALLMENTS_VIEW]: '📊 Ver Cuotas',
  [Permission.INSTALLMENTS_EDIT]: '⚙️ Gestionar Cuotas',

  // Consultar Socios
  [Permission.PARTNERS_VIEW]: '👫 Ver Socios',
  [Permission.PARTNERS_EDIT]: '✏️ Gestionar Socios',

  // Registro de Clientes
  [Permission.CLIENTS_VIEW]: '👥 Ver Clientes',
  [Permission.CLIENTS_EDIT]: '✏️ Gestionar Clientes',

  // Gestión de Mora
  [Permission.MORA_VIEW]: '📋 Ver Mora',
  [Permission.MORA_EDIT]: '⚙️ Gestionar Mora',

  // Pendientes a Desembolsar
  [Permission.DISBURSEMENTS_VIEW]: '💳 Ver Desembolsos',
  [Permission.DISBURSEMENTS_EDIT]: '⚙️ Gestionar Desembolsos',

  // Interacciones del Bot
  [Permission.BOT_VIEW]: '🤖 Ver Bot',
  [Permission.BOT_EDIT]: '⚙️ Gestionar Bot',

  // Calculadora de Créditos
  [Permission.CALCULATOR_VIEW]: '🧮 Ver Calculadora',
  [Permission.CALCULATOR_EDIT]: '⚙️ Gestionar Calculadora',

  // Reportes de Ubicación
  [Permission.GEODILE_VIEW]: '📊 Ver Ubicación',
  [Permission.GEODILE_EDIT]: '⚙️ Gestionar Ubicación',
};

/**
 * Mapeo de permisos legacy (AuthContext) a nuevos permisos SIMPLIFICADOS
 */
export const LegacyPermissionMapping: Record<string, Permission[]> = {
  // Mapeo SIMPLIFICADO - 2 niveles: VER y EDITAR
  'canManageUsers': [Permission.USERS_VIEW, Permission.USERS_EDIT],
  'canAccessPayments': [Permission.PAYMENTS_VIEW, Permission.PAYMENTS_EDIT],
  'canAccessCredits': [Permission.CREDITS_VIEW, Permission.CREDITS_EDIT],
  'canAccessGestionMora': [Permission.MORA_VIEW, Permission.MORA_EDIT],
  'canAccessPendientesDesembolsar': [Permission.DISBURSEMENTS_VIEW, Permission.DISBURSEMENTS_EDIT],
  'canAccessBotInteractions': [Permission.BOT_VIEW, Permission.BOT_EDIT],
  'canAccessConsultaCuotas': [Permission.INSTALLMENTS_VIEW, Permission.INSTALLMENTS_EDIT],
  'canAccessConsultaSocios': [Permission.PARTNERS_VIEW, Permission.PARTNERS_EDIT],
  'canAccessRegistroClientes': [Permission.CLIENTS_VIEW, Permission.CLIENTS_EDIT],
  'canAccessCalculadoraCreditos': [Permission.CALCULATOR_VIEW, Permission.CALCULATOR_EDIT],
  'canAccessGeodile': [Permission.GEODILE_VIEW, Permission.GEODILE_EDIT],
  'canAccessReports': [Permission.INSTALLMENTS_VIEW, Permission.INSTALLMENTS_EDIT], // Reportes van con cuotas
  'canAssignRoles': [Permission.USERS_EDIT],
  'canDeleteAccounts': [Permission.USERS_EDIT],
  'canBlockEmails': [Permission.USERS_EDIT],
};

/**
 * Plantillas de permisos sugeridos por rol
 * IMPORTANTE: Los roles son solo etiquetas. Solo SUPER_ADMIN tiene permisos por defecto.
 * Todos los demás usuarios necesitan permisos asignados individualmente.
 */
export const RolePermissionTemplates: Record<UserRole, Permission[]> = {
  // Solo SUPER_ADMIN tiene todos los permisos por defecto
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  
  // Todos los demás roles no tienen permisos por defecto - son solo etiquetas
  [UserRole.GERENTE_GENERAL]: [],
  [UserRole.ADMINISTRADOR]: [],
  [UserRole.CAJERO]: [],
  [UserRole.ANALISTA_CREDITOS_I]: [],
  [UserRole.JEFE_OPERACIONES]: [],
  [UserRole.ANALISTA_CREDITOS_PAGO_DIARIO]: [],
  [UserRole.BASIC_USER]: [],
  [UserRole.RECAUDADOR]: [],
};

/**
 * Plantillas SIMPLIFICADAS basadas en el nuevo sistema de 2 niveles
 * Organizadas por pantallas reales con solo Ver/Editar
 */
export const SuggestedPermissionTemplates: Record<string, Permission[]> = {
  'Cajero - Solo Ver Pagos': [
    Permission.PAYMENTS_VIEW, // Solo ver
  ],
  
  'Cajero - Gestionar Pagos': [
    Permission.PAYMENTS_EDIT, // Editar (incluye todo)
  ],
  
  'Analista - Solo Ver Créditos': [
    Permission.CREDITS_VIEW, // Solo ver
    Permission.CALCULATOR_VIEW, // Ver calculadora
  ],
  
  'Analista - Gestionar Créditos': [
    Permission.CREDITS_EDIT, // Editar (incluye todo)
    Permission.CALCULATOR_EDIT, // Editar calculadora
  ],
  
  'Consultas - Solo Lectura': [
    Permission.PARTNERS_VIEW, // Ver socios
    Permission.INSTALLMENTS_VIEW, // Ver cuotas
    Permission.CLIENTS_VIEW, // Ver clientes
  ],
  
  'Gestión Clientes Completa': [
    Permission.CLIENTS_EDIT, // Editar (incluye todo)
    Permission.PARTNERS_EDIT, // Editar socios
  ],
  
  'Gestor Mora - Ver': [
    Permission.MORA_VIEW, // Solo ver
  ],
  
  'Gestor Mora - Completo': [
    Permission.MORA_EDIT, // Editar (incluye todo)
  ],
  
  'Supervisor - Solo Ver': [
    Permission.USERS_VIEW, // Ver usuarios
    Permission.CREDITS_VIEW, // Ver créditos
    Permission.PAYMENTS_VIEW, // Ver pagos
    Permission.DISBURSEMENTS_VIEW, // Ver desembolsos
  ],
  
  'Supervisor - Gestión Completa': [
    Permission.USERS_VIEW, // Ver usuarios (sin crear)
    Permission.CREDITS_EDIT, // Gestionar créditos
    Permission.PAYMENTS_EDIT, // Gestionar pagos
    Permission.DISBURSEMENTS_EDIT, // Gestionar desembolsos
  ],
};

/**
 * Funciones de utilidad para el nuevo sistema basado en asignación individual
 */
export function getUserRolePermissions(role: UserRole): Permission[] {
  return RolePermissionTemplates[role] || [];
}

export function hasPermissionInRole(role: UserRole, permission: Permission): boolean {
  return getUserRolePermissions(role).includes(permission);
}

export function getAvailablePermissions(userRole: UserRole, currentPermissions: Permission[] = []): Permission[] {
  const allPermissions = Object.values(Permission);
  
  // Para todos los roles excepto SUPER_ADMIN, todos los permisos están disponibles para asignar
  if (userRole === UserRole.SUPER_ADMIN) {
    return []; // SUPER_ADMIN ya tiene todos los permisos por defecto
  }
  
  // Retornar todos los permisos que no tiene asignados actualmente
  return allPermissions.filter(permission => !currentPermissions.includes(permission));
}

export function getAssignablePermissions(userRole: UserRole, currentPermissions: Permission[] = []): Permission[] {
  return getAvailablePermissions(userRole, currentPermissions);
}

export function getRevokablePermissions(userRole: UserRole, currentPermissions: Permission[] = []): Permission[] {
  if (userRole === UserRole.SUPER_ADMIN) {
    // SUPER_ADMIN no puede revocar sus permisos base, pero sí los adicionales si los tuviera
    return currentPermissions.filter(permission => !getUserRolePermissions(userRole).includes(permission));
  }
  
  // Para todos los demás roles, se pueden revocar todos los permisos asignados
  return currentPermissions;
}

export function getPermissionsByCategory(userRole: UserRole, currentPermissions: Permission[] = []): Record<string, Permission[]> {
  const assignablePermissions = getAssignablePermissions(userRole, currentPermissions);
  
  const result: Record<string, Permission[]> = {};
  
  Object.entries(PermissionCategories).forEach(([categoryName, categoryPermissions]) => {
    const filteredPermissions = categoryPermissions.filter(permission =>
      assignablePermissions.includes(permission)
    );
    
    if (filteredPermissions.length > 0) {
      result[categoryName] = filteredPermissions;
    }
  });
  
  return result;
}

export function getAssignedPermissionsByCategory(userRole: UserRole, currentPermissions: Permission[] = []): Record<string, Permission[]> {
  const revokablePermissions = getRevokablePermissions(userRole, currentPermissions);
  
  const result: Record<string, Permission[]> = {};
  
  Object.entries(PermissionCategories).forEach(([categoryName, categoryPermissions]) => {
    const filteredPermissions = categoryPermissions.filter(permission =>
      revokablePermissions.includes(permission)
    );
    
    if (filteredPermissions.length > 0) {
      result[categoryName] = filteredPermissions;
    }
  });
  
  return result;
}

/**
 * Validar que los permisos sean válidos para un rol
 */
export function validatePermissions( permissions: Permission[]): {
  valid: boolean;
  invalidPermissions: Permission[];
} {
  const allPermissions = Object.values(Permission);
  const invalidPermissions = permissions.filter(permission => !allPermissions.includes(permission));
  
  return {
    valid: invalidPermissions.length === 0,
    invalidPermissions
  };
}