import { AgenciaCaja } from './index';
import { Permission, UserRole } from './permissions';

// Re-exportar UserRole para compatibilidad
export { UserRole } from './permissions';

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
  _id?: string;         // ID de MongoDB
  email: string;
  role: UserRole;
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
  permissions?: Permission[];   // Permisos asignados al usuario
}