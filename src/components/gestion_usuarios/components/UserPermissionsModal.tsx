import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Permission, UserRole } from '../../../types/permissions';
import { SessionManager } from '../../../utils/sessionManager';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import PermissionsSelector from './ExtraPermissionsSelector';

interface User {
    _id: string;
    email: string;
    razon?: string;
    role: string;
    permissions?: Permission[];
}

interface UserPermissionsModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
    isOpen,
    user,
    onClose
}) => {
    const queryClient = useQueryClient();
    const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // En el sistema simplificado, todos los roles (excepto SUPER_ADMIN) pueden tener cualquier permiso
    const filterValidPermissions = (permissions: Permission[], userRole: UserRole): Permission[] => {
        if (userRole === UserRole.SUPER_ADMIN) {
            return Object.values(Permission); // SUPER_ADMIN tiene todos los permisos
        }
        // Filtrar solo permisos válidos del nuevo sistema
        const validPermissions = Object.values(Permission);
        return permissions.filter(permission => validPermissions.includes(permission));
    };

    useEffect(() => {
        if (user && isOpen) {
            const validPermissions = filterValidPermissions(user.permissions || [], user.role as UserRole);
            setSelectedPermissions(validPermissions);
            
            // Si hay permisos inválidos, mostrar un aviso
            const invalidPermissions = (user.permissions || []).filter(p => !validPermissions.includes(p));
            if (invalidPermissions.length > 0) {
            }
        }
    }, [user, isOpen]);

    // Sincronizar cuando cambian los permisos del usuario (después de guardar)
    useEffect(() => {
        if (user) {
            const validPermissions = filterValidPermissions(user.permissions || [], user.role as UserRole);
            setSelectedPermissions(validPermissions);
        }
    }, [user?.permissions]);

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/${user._id}/permissions`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SessionManager.getItem('token')}`
                },
                body: JSON.stringify({
                    permissions: selectedPermissions
                }),
            });

            if (response.ok) {
                toast.success('Permisos actualizados correctamente');
                queryClient.invalidateQueries({ queryKey: ['users'] });
                handleClose();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Error al actualizar permisos');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedPermissions([]);
        onClose();
    };

    const hasChanges = JSON.stringify(selectedPermissions.sort()) !== JSON.stringify((user.permissions || []).sort());

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Gestionar Permisos
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {user.razon ? `${user.razon} (${user.email})` : user.email} - Rol: {user.role}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500"
                        disabled={isLoading}
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <PermissionsSelector
                        selectedRole={user.role as UserRole}
                        selectedPermissions={selectedPermissions}
                        onPermissionsChange={setSelectedPermissions}
                        disabled={isLoading}
                    />

                    {/* Comparación de cambios */}
                    {hasChanges && (
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-yellow-800 mb-2">
                                📋 Resumen de Cambios
                            </h5>
                            <div className="space-y-2 text-sm">
                                {/* Permisos que se van a agregar */}
                                {selectedPermissions.filter(p => !(user.permissions || []).includes(p)).length > 0 && (
                                    <div>
                                        <span className="font-medium text-green-700">
                                            ➕ Se agregarán ({selectedPermissions.filter(p => !(user.permissions || []).includes(p)).length}):
                                        </span>
                                        <div className="ml-4 mt-1">
                                            {selectedPermissions
                                                .filter(p => !(user.permissions || []).includes(p))
                                                .slice(0, 3)
                                                .map(p => (
                                                    <span key={p} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                                        {p.replace(':', ': ').replace('_', ' ')}
                                                    </span>
                                                ))
                                            }
                                            {selectedPermissions.filter(p => !(user.permissions || []).includes(p)).length > 3 && (
                                                <span className="text-xs text-green-600">
                                                    +{selectedPermissions.filter(p => !(user.permissions || []).includes(p)).length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Permisos que se van a quitar */}
                                {(user.permissions || []).filter(p => !selectedPermissions.includes(p)).length > 0 && (
                                    <div>
                                        <span className="font-medium text-red-700">
                                            ➖ Se quitarán ({(user.permissions || []).filter(p => !selectedPermissions.includes(p)).length}):
                                        </span>
                                        <div className="ml-4 mt-1">
                                            {(user.permissions || [])
                                                .filter(p => !selectedPermissions.includes(p))
                                                .slice(0, 3)
                                                .map(p => (
                                                    <span key={p} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                                        {p.replace(':', ': ').replace('_', ' ')}
                                                    </span>
                                                ))
                                            }
                                            {(user.permissions || []).filter(p => !selectedPermissions.includes(p)).length > 3 && (
                                                <span className="text-xs text-red-600">
                                                    +{(user.permissions || []).filter(p => !selectedPermissions.includes(p)).length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        {hasChanges ? (
                            <span className="text-yellow-700">⚠️ Hay cambios sin guardar</span>
                        ) : (
                            <span className="text-green-700">✅ Sin cambios pendientes</span>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading || !hasChanges}
                            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserPermissionsModal;
