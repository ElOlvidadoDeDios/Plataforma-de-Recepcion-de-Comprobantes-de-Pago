import { AgenciaCaja } from './index';

// Solo definiciones de tipos necesarias para el frontend
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',           // Super administrador
  ADMINISTRADOR = 'ADMINISTRADOR',       // Administrador
  CAJERO = 'CAJERO',                     // Cajero
  ANALISTA_CREDITOS_I = 'ANALISTA_CREDITOS_I', // Analista de créditos I
  GERENTE_GENERAL = 'GERENTE_GENERAL',   // Gerente general
  JEFE_OPERACIONES = 'JEFE_OPERACIONES', // Jefe de operaciones
  BASIC_USER = 'BASIC_USER'              // Usuario básico
}

// Estados de usuario
export enum UserStatus {
  CREATED = 0,     // Cuenta creada sin permisos
  ACTIVE = 1,      // Cuenta activa con rol
  BLOCKED = 2,     // Cuenta bloqueada
  DELETED = 3      // Cuenta eliminada
}

// Texto descriptivo para cada estado
export const UserStatusText: Record<UserStatus, string> = {
  [UserStatus.CREATED]: 'Usuario creado sin permisos',
  [UserStatus.ACTIVE]: 'Usuario activo',
  [UserStatus.BLOCKED]: 'Usuario bloqueado',
  [UserStatus.DELETED]: 'Usuario eliminado'
};

// Interfaz que define la estructura de un usuario con su rol
export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  name?: string;        // Mantenemos para compatibilidad (mapea desde razon)
  lastName?: string;    // Mantenemos para compatibilidad (siempre vacío)
  razon?: string;       // Nombre completo/razón social (campo real del backend)
  cargo?: string;       // Cargo del usuario
  user?: string;        // Usuario
  dni: string;          // Hacemos el DNI obligatorio
  status: UserStatus;
  statusText?: string;
  createdAt: string;
  updatedAt: string;
  agencias?: AgenciaCaja[];  // Array de agencias para usuarios de pagos
  id_ana?: string;      // ID analista
  id_age?: string;      // ID agencia
}