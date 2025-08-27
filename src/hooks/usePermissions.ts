import { useState, useMemo, useCallback } from 'react';
import {
    Permission,
    UserRole,
    getAssignablePermissions,
    getRevokablePermissions,
    getPermissionsByCategory,
    getAssignedPermissionsByCategory,
    PermissionLabels
} from '../types/permissions';

export interface UsePermissionsProps {
    userRole: UserRole;
    currentPermissions?: Permission[];    
    onPermissionsChange?: (permissions: Permission[]) => void;
}

export function usePermissions({
    userRole,
    currentPermissions = [],
    onPermissionsChange
}: UsePermissionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Permisos que se pueden asignar (que no tiene el usuario)
    const assignablePermissions = useMemo(() =>
        getAssignablePermissions(userRole, currentPermissions),
        [userRole, currentPermissions]
    );

    // Permisos que se pueden revocar (que tiene el usuario y no son de su rol base)
    const revokablePermissions = useMemo(() =>
        getRevokablePermissions(userRole, currentPermissions),
        [userRole, currentPermissions]
    );

    // Agrupar permisos asignables por categoría
    const assignableByCategory = useMemo(() =>
        getPermissionsByCategory(userRole, currentPermissions),
        [userRole, currentPermissions]
    );

    // Agrupar permisos revocables por categoría
    const revokableByCategory = useMemo(() =>
        getAssignedPermissionsByCategory(userRole, currentPermissions),
        [userRole, currentPermissions]
    );

    // Contadores
    const totalAssignable = assignablePermissions.length;
    const totalRevokable = revokablePermissions.length;

    // Función para asignar un permiso
    const assignPermission = useCallback(async (permission: Permission) => {
        if (!assignablePermissions.includes(permission)) {
            setError(`No se puede asignar el permiso: ${PermissionLabels[permission]}`);
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newPermissions = [...currentPermissions, permission];
            onPermissionsChange?.(newPermissions);
            return true;
        } catch (err) {
            setError(`Error al asignar permiso: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [assignablePermissions, currentPermissions, onPermissionsChange]);

    // Función para revocar un permiso
    const revokePermission = useCallback(async (permission: Permission) => {
        if (!revokablePermissions.includes(permission)) {
            setError(`No se puede revocar el permiso: ${PermissionLabels[permission]}`);
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newPermissions = currentPermissions.filter(p => p !== permission);
            onPermissionsChange?.(newPermissions);
            return true;
        } catch (err) {
            setError(`Error al revocar permiso: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [revokablePermissions, currentPermissions, onPermissionsChange]);

    // Función para asignar múltiples permisos
    const assignMultiplePermissions = useCallback(async (permissions: Permission[]) => {
        const invalidPermissions = permissions.filter(p => !assignablePermissions.includes(p));

        if (invalidPermissions.length > 0) {
            setError(`No se pueden asignar estos permisos: ${invalidPermissions.map(p => PermissionLabels[p]).join(', ')}`);
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newPermissions = [...currentPermissions, ...permissions];
            onPermissionsChange?.(newPermissions);
            return true;
        } catch (err) {
            setError(`Error al asignar permisos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [assignablePermissions, currentPermissions, onPermissionsChange]);

    // Función para revocar múltiples permisos
    const revokeMultiplePermissions = useCallback(async (permissions: Permission[]) => {
        const invalidPermissions = permissions.filter(p => !revokablePermissions.includes(p));

        if (invalidPermissions.length > 0) {
            setError(`No se pueden revocar estos permisos: ${invalidPermissions.map(p => PermissionLabels[p]).join(', ')}`);
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newPermissions = currentPermissions.filter(p => !permissions.includes(p));
            onPermissionsChange?.(newPermissions);
            return true;
        } catch (err) {
            setError(`Error al revocar permisos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [revokablePermissions, currentPermissions, onPermissionsChange]);

    // Función para verificar si un permiso está asignado
    const hasPermission = useCallback((permission: Permission) => {
        return currentPermissions.includes(permission);
    }, [currentPermissions]);

    // Función para verificar si se puede asignar un permiso
    const canAssignPermission = useCallback((permission: Permission) => {
        return assignablePermissions.includes(permission);
    }, [assignablePermissions]);

    // Función para verificar si se puede revocar un permiso
    const canRevokePermission = useCallback((permission: Permission) => {
        return revokablePermissions.includes(permission);
    }, [revokablePermissions]);

    // Función para limpiar errores
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // Estados
        isLoading,
        error,
        clearError,

        // Permisos
        assignablePermissions,
        revokablePermissions,
        assignableByCategory,
        revokableByCategory,

        // Contadores
        totalAssignable,
        totalRevokable,

        // Funciones de acción
        assignPermission,
        revokePermission,
        assignMultiplePermissions,
        revokeMultiplePermissions,

        // Funciones de verificación
        hasPermission,
        canAssignPermission,
        canRevokePermission,
    };
}

export default usePermissions;