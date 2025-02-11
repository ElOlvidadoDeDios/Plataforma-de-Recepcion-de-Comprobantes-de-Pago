import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole, rolePermissions } from '../types/roles';

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
    canManageUsers: () => hasPermission('canManageUsers' as keyof typeof rolePermissions[UserRole]),
    canAccessPayments: () => hasPermission('canAccessPayments' as keyof typeof rolePermissions[UserRole]),
    canAccessCredits: () => hasPermission('canAccessCredits' as keyof typeof rolePermissions[UserRole]),
    canAssignRoles: () => hasPermission('canAssignRoles' as keyof typeof rolePermissions[UserRole]),
    canDeleteAccounts: () => hasPermission('canDeleteAccounts' as keyof typeof rolePermissions[UserRole]),
    canBlockEmails: () => hasPermission('canBlockEmails' as keyof typeof rolePermissions[UserRole]),
  };
}