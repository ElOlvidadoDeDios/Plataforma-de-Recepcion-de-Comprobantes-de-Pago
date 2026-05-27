import React, { useState, useMemo } from 'react';
import { Permission } from '../../../types/permissions';
import { UserRole } from '../../../types/roles';

interface PermissionsSelectorProps {
    selectedRole: UserRole;
    selectedPermissions: Permission[];
    onPermissionsChange: (permissions: Permission[]) => void;
    disabled?: boolean;
}

const PermissionsSelector: React.FC<PermissionsSelectorProps> = ({
    selectedRole,
    selectedPermissions,
    onPermissionsChange,
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Etiquetas legibles para permisos simplificados
    const PermissionLabels: Record<Permission, string> = {
        [Permission.USERS_VIEW]: '👥 Ver Usuarios',
        [Permission.USERS_EDIT]: '✏️ Editar Usuarios',
        [Permission.PAYMENTS_VIEW]: '💰 Ver Pagos',
        [Permission.PAYMENTS_EDIT]: '💸 Editar Pagos',
        [Permission.CREDITS_VIEW]: '📝 Ver Créditos',
        [Permission.CREDITS_EDIT]: '✅ Editar Créditos',
        [Permission.CREDIT_APPROVAL_VIEW]: '📋 Ver Aprobación de Crédito',
        [Permission.CREDIT_APPROVAL_APPROVE]: '✅ Aprobar Crédito',
        [Permission.CREDIT_REQUEST_VIEW]: '📋 Ver Solicitud de Crédito',
        [Permission.CREDIT_REQUEST_EDIT]: '📝 Hacer Solicitud de Crédito',
        [Permission.INSTALLMENTS_VIEW]: '📊 Ver Cuotas',
        [Permission.INSTALLMENTS_EDIT]: '⚙️ Editar Cuotas',
        [Permission.PARTNERS_VIEW]: '👫 Ver Socios',
        [Permission.PARTNERS_EDIT]: '✏️ Editar Socios',
        [Permission.CLIENTS_VIEW]: '👥 Ver Clientes',
        [Permission.CLIENTS_EDIT]: '📝 Editar Clientes',
        [Permission.MORA_VIEW]: '📋 Ver Mora',
        [Permission.MORA_EDIT]: '⚙️ Editar Mora',
        [Permission.DISBURSEMENTS_VIEW]: '💳 Ver Desembolsos',
        [Permission.DISBURSEMENTS_EDIT]: '✅ Editar Desembolsos',
        [Permission.DISBURSEMENT_HISTORY_VIEW]: '📋 Ver Historial de Desembolsos',
        [Permission.DISBURSEMENT_HISTORY_EDIT]: '✏️ Editar Historial de Desembolsos',
        [Permission.BOT_VIEW]: '🤖 Ver Bot',
        [Permission.BOT_EDIT]: '⚙️ Editar Bot',
        [Permission.CALCULATOR_VIEW]: '🧮 Ver Calculadora',
        [Permission.CALCULATOR_EDIT]: '🔢 Usar Calculadora',
        [Permission.GEODILE_VIEW]: '📊 Ver Ubicación',
        [Permission.GEODILE_EDIT]: '⚙️ Gestionar Ubicación',
        [Permission.AFFILIATION_SOCIOS_VIEW]: '📊 Ver Reporte de Afiliación',
        [Permission.AFFILIATION_SOCIOS_EDIT]: '⚙️ Gestionar Reporte de Afiliación',
        [Permission.PAGO_RECAUDADORES_EDIT]: '⚙️ Gestionar Pagos Recaudadores',
        [Permission.PAGO_RECAUDADORES_VIEW]: '📊 Ver Pagos Recaudadores',
        [Permission.CULQI_VIEW]: '💳 Ver Culqi Pendientes',
        [Permission.CULQI_EDIT]: '⚙️ Gestionar Culqi Pendientes',
        [Permission.DISBURSEMENTS_TODAY_VIEW]: '📈 Ver Seguimiento Desembolsos Hoy',
        [Permission.RECUPERACIONES_VIEW]: '💳 Ver Recuperaciones',
        [Permission.RECUPERACIONES_EDIT]: '⚙️ Gestionar Recuperaciones',
    };

    // // Roles que pueden tener permisos de Culqi
    // const rolesConAccesoCulqui = [
    //     UserRole.SUPER_ADMIN,
    //     UserRole.ADMINISTRADOR,
    //     UserRole.ANALISTA_CREDITOS_I,
    //     UserRole.ANALISTA_CREDITOS_PAGO_DIARIO
    // ];

    // Permisos organizados por secciones simplificadas
    const permissionsByCategory: Record<string, Permission[]> = {
        'Gestión de Usuarios': [Permission.USERS_VIEW, Permission.USERS_EDIT],
        'Pagos': [Permission.PAYMENTS_VIEW, Permission.PAYMENTS_EDIT],
        'Créditos': [Permission.CREDITS_VIEW, Permission.CREDITS_EDIT],
        'Aprobación de Crédito': [Permission.CREDIT_APPROVAL_VIEW, Permission.CREDIT_APPROVAL_APPROVE],
        'Solicitud de Crédito': [Permission.CREDIT_REQUEST_VIEW, Permission.CREDIT_REQUEST_EDIT],
        'Consulta de Cuotas': [Permission.INSTALLMENTS_VIEW, Permission.INSTALLMENTS_EDIT],
        'Consultar Socios': [Permission.PARTNERS_VIEW, Permission.PARTNERS_EDIT],
        'Registro de Clientes': [Permission.CLIENTS_VIEW, Permission.CLIENTS_EDIT],
        'Gestión de Mora': [Permission.MORA_VIEW, Permission.MORA_EDIT],
        'Pendientes a Desembolsar': [Permission.DISBURSEMENTS_VIEW, Permission.DISBURSEMENTS_EDIT],
        'Seguimiento Desembolsos Hoy': [Permission.DISBURSEMENTS_TODAY_VIEW],
        'Historial de Desembolsos': [Permission.DISBURSEMENT_HISTORY_VIEW, Permission.DISBURSEMENT_HISTORY_EDIT],
        'Interacciones del Bot': [Permission.BOT_VIEW, Permission.BOT_EDIT],
        'Calculadora de Créditos': [Permission.CALCULATOR_VIEW, Permission.CALCULATOR_EDIT],
        'Módulo Geodile': [Permission.GEODILE_VIEW, Permission.GEODILE_EDIT],
        'Afiliación de socios': [Permission.AFFILIATION_SOCIOS_VIEW, Permission.AFFILIATION_SOCIOS_EDIT],
        'Pagos Recaudadores': [Permission.PAGO_RECAUDADORES_VIEW, Permission.PAGO_RECAUDADORES_EDIT],
        'Culqi Pendientes': [Permission.CULQI_VIEW, Permission.CULQI_EDIT],
        'Recuperaciones': [Permission.RECUPERACIONES_VIEW, Permission.RECUPERACIONES_EDIT],
        // // Solo agregar Culqi si el rol tiene acceso
        // ...(rolesConAccesoCulqui.includes(selectedRole) ? {
        //     'Culqi Pendientes': [Permission.CULQI_VIEW, Permission.CULQI_EDIT]
        // } : {})
    };

    // Todos los permisos disponibles (solo SUPER_ADMIN no necesita permisos extra)
    const availablePermissions = selectedRole === UserRole.SUPER_ADMIN 
        ? [] 
        : Object.values(Permission);

    // Función para mostrar/ocultar sección si no hay resultados de búsqueda
    const shouldShowSection = (permissions: Permission[]): boolean => {
        if (!searchTerm) return permissions.length > 0;
        
        return permissions.some(permission =>
            PermissionLabels[permission].toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Filtrar permisos por búsqueda
    const getFilteredPermissions = useMemo(() => {
        if (!searchTerm) return permissionsByCategory;

        const filtered: Record<string, Permission[]> = {};
        Object.entries(permissionsByCategory).forEach(([category, permissions]) => {
            const filteredPermissions = permissions.filter(permission =>
                PermissionLabels[permission].toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (filteredPermissions.length > 0) {
                filtered[category] = filteredPermissions;
            }
        });
        
        return filtered;
    }, [permissionsByCategory, searchTerm]);

    // Función para manejar cambios en permisos
    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        if (disabled) return;

        let newPermissions: Permission[];
        if (checked) {
            newPermissions = [...selectedPermissions, permission];
        } else {
            newPermissions = selectedPermissions.filter(p => p !== permission);
        }
        onPermissionsChange(newPermissions);
    };

    // Función para seleccionar/deseleccionar todos los permisos de una categoría
    const handleCategoryToggle = (categoryPermissions: Permission[], allSelected: boolean) => {
        if (disabled) return;

        let newPermissions: Permission[];
        if (allSelected) {
            // Deseleccionar todos los permisos de esta categoría
            newPermissions = selectedPermissions.filter(p => !categoryPermissions.includes(p));
        } else {
            // Seleccionar todos los permisos de esta categoría que no están ya seleccionados
            const toAdd = categoryPermissions.filter(p => !selectedPermissions.includes(p));
            newPermissions = [...selectedPermissions, ...toAdd];
        }
        onPermissionsChange(newPermissions);
    };

    // Si el rol es SUPER_ADMIN, no mostrar permisos extra
    if (selectedRole === UserRole.SUPER_ADMIN) {
        return (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                    <h4 className="text-blue-800 font-semibold mb-2">✅ Acceso Completo</h4>
                    <p className="text-blue-700">
                        El rol <strong>SUPER_ADMIN</strong> tiene acceso completo al sistema.
                        <br />
                        No necesita permisos adicionales.
                    </p>
                </div>
            </div>
        );
    }

    const totalPermissions = Object.values(getFilteredPermissions).flat().length;
    const selectedCount = selectedPermissions.length;

    return (
        <div className="space-y-4">
            {/* Header informativo del sistema simplificado */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-green-800 font-semibold mb-2">📋 Sistema Simplificado de Permisos</h4>
                <p className="text-sm text-green-700">
                    Solo 2 niveles por pantalla: <strong>VER</strong> (solo lectura) y <strong>EDITAR</strong> (incluye crear, modificar, eliminar, procesar).
                    <br />
                    Los permisos de EDITAR automáticamente incluyen los permisos de VER.
                </p>
            </div>

            {/* Header con estadísticas */}
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-lg font-medium text-gray-900">
                        Permisos del Usuario
                    </h4>
                    <p className="text-sm text-gray-600">
                        {selectedCount} de {availablePermissions.length} permisos seleccionados
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    disabled={disabled}
                >
                    {isExpanded ? 'Contraer' : 'Expandir todo'}
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar permisos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={disabled}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Mostrar mensaje si no hay resultados */}
            {searchTerm && totalPermissions === 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-gray-600">
                        No se encontraron permisos que coincidan con "{searchTerm}"
                    </p>
                </div>
            )}

            {/* Lista de categorías y permisos */}
            {Object.entries(getFilteredPermissions).map(([categoryName, categoryPermissions]) => {
                if (!shouldShowSection(categoryPermissions)) return null;

                const filteredCategoryPermissions = searchTerm 
                    ? categoryPermissions.filter(permission =>
                        PermissionLabels[permission].toLowerCase().includes(searchTerm.toLowerCase()) ||
                        permission.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    : categoryPermissions;

                const allSelected = filteredCategoryPermissions.every(permission => 
                    selectedPermissions.includes(permission)
                );
                const someSelected = filteredCategoryPermissions.some(permission => 
                    selectedPermissions.includes(permission)
                );

                return (
                    <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Header de categoría */}
                        <div 
                            className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                            onClick={() => !disabled && handleCategoryToggle(filteredCategoryPermissions, allSelected)}
                        >
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                        if (input) input.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={() => {}} // Manejado por el onClick del div
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={disabled}
                                />
                                <h5 className="font-medium text-gray-900">
                                    {categoryName}
                                </h5>
                                <span className="text-sm text-gray-500">
                                    ({filteredCategoryPermissions.filter(p => selectedPermissions.includes(p)).length}/{filteredCategoryPermissions.length})
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                            </div>
                        </div>

                        {/* Lista de permisos */}
                        <div className={`${isExpanded ? 'block' : 'hidden'} border-t border-gray-200`}>
                            <div className="p-4 space-y-3">
                                {filteredCategoryPermissions.map((permission) => {
                                    const isChecked = selectedPermissions.includes(permission);
                                    
                                    return (
                                        <div key={permission} className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                id={`permission-${permission}`}
                                                checked={isChecked}
                                                onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                                disabled={disabled}
                                            />
                                            <label 
                                                htmlFor={`permission-${permission}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {PermissionLabels[permission]}
                                                        {permission.includes(':edit') && (
                                                            <span className="text-xs text-green-600 ml-2">(incluye VER)</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {permission}
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Resumen de permisos seleccionados */}
            {selectedPermissions.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h6 className="font-medium text-blue-900 mb-2">
                        Permisos Seleccionados ({selectedPermissions.length})
                    </h6>
                    <div className="space-y-1">
                        {selectedPermissions.slice(0, 8).map(permission => (
                            <span key={permission} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                {PermissionLabels[permission]}
                            </span>
                        ))}
                        {selectedPermissions.length > 8 && (
                            <div className="text-xs text-blue-600 mt-2">
                                +{selectedPermissions.length - 8} permisos más
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionsSelector;