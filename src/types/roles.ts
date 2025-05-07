import { AgenciaCaja } from './index';

// Solo definiciones de tipos necesarias para el frontend
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Super administrador
  ADMIN = 'ADMIN',                 // Administrador
  PAYMENTS_USER = 'PAYMENTS_USER',  // Usuario de pagos
  CREDIT_USER = 'CREDIT_USER',     // Usuario de créditos
  BASIC_USER = 'BASIC_USER'        // Usuario básico
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
  name?: string;
  lastName?: string;
  dni?: string;
  status: UserStatus;
  statusText?: string;
  createdAt: string;
  updatedAt: string;
  agencias?: AgenciaCaja[];  // Array de agencias para usuarios de pagos
}