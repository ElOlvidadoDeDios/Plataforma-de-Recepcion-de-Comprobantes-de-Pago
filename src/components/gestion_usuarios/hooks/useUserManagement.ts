import { useState } from 'react';
import { User, AgenciaCaja } from '../../../types';
import { UserRole } from '../../../types/roles';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth, usePermissions } from '../../../hooks/useAuth';
import { updateUserRole, updateUserStatus } from '../../../api';
import toast from 'react-hot-toast';
//import { User } from 'lucide-react';

export const useUserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canManageUsers, canAssignRoles } = usePermissions();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  
  const [showAgenciaModal, setShowAgenciaModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAgencias, setUserAgencias] = useState<AgenciaCaja[]>([]);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; role: UserRole } | null>(null);

  const handleRoleChange = async (userId: string, role: string) => {
    const targetUser = queryClient.getQueryData<User[]>(['users'])?.find((u: User) => u._id === userId);
    const targetRole = role as UserRole;
    
    if (targetUser?.status !== 1) {
      toast.error('El usuario debe estar activo para asignar un rol');
      return;
    }

    if (!canAssignRole(targetRole, targetUser)) {
      toast.error('No tienes permisos para asignar este rol a este usuario');
      return;
    }

    if (targetRole === UserRole.SUPER_ADMIN) {
      const confirmed = window.confirm(
        `⚠️ ATENCIÓN: Estás asignando el rol SUPER_ADMIN a ${targetUser.email}.\n\n` +
        'Este rol tiene acceso TOTAL al sistema.\n\n' +
        '¿Estás absolutamente seguro?'
      );
      if (!confirmed) return;
    }

    try {
      await updateUserRole(userId, targetRole);
      toast.success('Rol actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });

      if (role === UserRole.CAJERO || role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO) {
        toast('Ahora puede gestionar las agencias del usuario usando el botón "Gestionar Agencias". Disponible para cajeros, administradores, gerentes, jefes de operaciones y super admin', {
          duration: 5000,
          style: {
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #93C5FD'
          }
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el rol');
    }
  };

  const canAssignRole = (targetRole: UserRole, targetUser?: User): boolean => {
    if (!canAssignRoles()) return false;
    
    if (targetRole === UserRole.SUPER_ADMIN && !isSuperAdmin) {
      return false;
    }
    
    if (targetUser?.role === UserRole.SUPER_ADMIN && !isSuperAdmin) {
      return false;
    }
    
    return true;
  };

  const getAvailableRoles = (): UserRole[] => {
    const baseRoles = [
      UserRole.ADMINISTRADOR,
      UserRole.CAJERO,
      UserRole.ANALISTA_CREDITOS_I,
      UserRole.GERENTE_GENERAL,
      UserRole.JEFE_OPERACIONES,
      UserRole.BASIC_USER,
      UserRole.ANALISTA_CREDITOS_PAGO_DIARIO,
      UserRole.RECAUDADOR
    ];
    if (isSuperAdmin) {
      return [UserRole.SUPER_ADMIN, ...baseRoles];
    }
    return baseRoles;
  };

  const canViewSensitiveInfo = (targetUser: User): boolean => {
    if (isSuperAdmin) return true;
    
    if (
      user?.role === UserRole.ADMINISTRADOR ||
      user?.role === UserRole.GERENTE_GENERAL ||
      user?.role === UserRole.JEFE_OPERACIONES
    ) {
      return targetUser.role !== UserRole.SUPER_ADMIN;
    }
    
    return false;
  };

  const canManageAgenciasOf = (targetUser: User): boolean => {
    if (targetUser.status !== 1) return false;
    
    if (
      targetUser.role !== UserRole.CAJERO &&
      targetUser.role !== UserRole.ADMINISTRADOR &&
      targetUser.role !== UserRole.GERENTE_GENERAL &&
      targetUser.role !== UserRole.JEFE_OPERACIONES &&
      targetUser.role !== UserRole.SUPER_ADMIN && 
      targetUser.role !== UserRole.ANALISTA_CREDITOS_PAGO_DIARIO &&
      targetUser.role !== UserRole.RECAUDADOR
    ) {
      return false;
    }
    
    if (user?._id === targetUser._id) {
      return (
        targetUser.role === UserRole.CAJERO ||
        targetUser.role === UserRole.ADMINISTRADOR ||
        targetUser.role === UserRole.GERENTE_GENERAL ||
        targetUser.role === UserRole.JEFE_OPERACIONES ||
        targetUser.role === UserRole.SUPER_ADMIN ||
        targetUser.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO ||
        targetUser.role === UserRole.RECAUDADOR

      );
    }
    
    if (isSuperAdmin) return true;
    
    if (
      user?.role === UserRole.ADMINISTRADOR ||
      user?.role === UserRole.GERENTE_GENERAL ||
      user?.role === UserRole.JEFE_OPERACIONES
    ) {
      return targetUser.role !== UserRole.SUPER_ADMIN;
    }
    
    return false;
  };

  const handleStatusChange = async (userId: string, newStatus: number) => {
    try {
      const response = await updateUserStatus(userId, newStatus);
      toast.success(response.message || 'Estado actualizado correctamente');

      if (newStatus === 2 || newStatus === 3) {
        await updateUserRole(userId, UserRole.BASIC_USER);
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  return {
    user,
    isSuperAdmin,
    canManageUsers,
    canAssignRoles,
    showAgenciaModal,
    setShowAgenciaModal,
    showActivateModal,
    setShowActivateModal,
    selectedUser,
    setSelectedUser,
    userAgencias,
    setUserAgencias,
    pendingRoleChange,
    setPendingRoleChange,
    handleRoleChange,
    canAssignRole,
    getAvailableRoles,
    canViewSensitiveInfo,
    canManageAgenciasOf,
    handleStatusChange,
    navigate,
    queryClient
  };
};