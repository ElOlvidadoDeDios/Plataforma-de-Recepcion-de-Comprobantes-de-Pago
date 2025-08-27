import React, { useState } from 'react';
import { Permission, UserRole } from '../../../types/permissions';

interface PermissionsManagerProps {
    userRole: UserRole;
    currentPermissions: Permission[];
    onPermissionsChange: (permissions: Permission[]) => void;
    disabled?: boolean;
}

// Sistema SIMPLIFICADO: Solo 2 permisos por pantalla (VER y EDITAR)
const SIMPLIFIED_MODULES = {
    'Gestión de Usuarios': {
        icon: '👥',
        description: 'Administra los usuarios del sistema',
        viewPermission: Permission.USERS_VIEW,
        editPermission: Permission.USERS_EDIT,
    },
    'Pagos': {
        icon: '💰',
        description: 'Gestiona los pagos de los clientes',
        viewPermission: Permission.PAYMENTS_VIEW,
        editPermission: Permission.PAYMENTS_EDIT,
    },
    'Créditos': {
        icon: '📝',
        description: 'Revisa y aprueba solicitudes de crédito',
        viewPermission: Permission.CREDITS_VIEW,
        editPermission: Permission.CREDITS_EDIT,
    },
    'Consulta de Cuotas': {
        icon: '📊',
        description: 'Revisa el estado de las cuotas',
        viewPermission: Permission.INSTALLMENTS_VIEW,
        editPermission: Permission.INSTALLMENTS_EDIT,
    },
    'Consultar Socios': {
        icon: '👫',
        description: 'Gestiona tu base de socios',
        viewPermission: Permission.PARTNERS_VIEW,
        editPermission: Permission.PARTNERS_EDIT,
    },
    'Registro de Clientes': {
        icon: '👤',
        description: 'Registra y gestiona información de clientes',
        viewPermission: Permission.CLIENTS_VIEW,
        editPermission: Permission.CLIENTS_EDIT,
    },
    'Gestión de Mora': {
        icon: '📋',
        description: 'Gestiona clientes en mora y seguimiento',
        viewPermission: Permission.MORA_VIEW,
        editPermission: Permission.MORA_EDIT,
    },
    'Pendientes a Desembolsar': {
        icon: '💳',
        description: 'Gestiona créditos pendientes de desembolso',
        viewPermission: Permission.DISBURSEMENTS_VIEW,
        editPermission: Permission.DISBURSEMENTS_EDIT,
    },
    'Interacciones del Bot': {
        icon: '🤖',
        description: 'Analiza las interacciones con el bot',
        viewPermission: Permission.BOT_VIEW,
        editPermission: Permission.BOT_EDIT,
    },
    'Calculadora de Créditos': {
        icon: '🧮',
        description: 'Calcula el monto de crédito para un cliente',
        viewPermission: Permission.CALCULATOR_VIEW,
        editPermission: Permission.CALCULATOR_EDIT,
    }
};

const PermissionsManager: React.FC<PermissionsManagerProps> = ({
    userRole,
    currentPermissions,
    onPermissionsChange,
    disabled = false
}) => {
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Verificar si el usuario tiene un permiso específico
    const hasPermission = (permission: Permission) => {
        return currentPermissions.includes(permission);
    };

    // Alternar expansión de módulo
    const toggleModule = (moduleName: string) => {
        setExpandedModules(prev => 
            prev.includes(moduleName) 
                ? prev.filter(m => m !== moduleName)
                : [...prev, moduleName]
        );
    };

    // Manejar cambio de permiso
    const handlePermissionToggle = (permission: Permission, isEnabled: boolean) => {
        if (disabled) return;
        
        let newPermissions: Permission[];
        if (isEnabled) {
            // Remover permiso
            newPermissions = currentPermissions.filter(p => p !== permission);
        } else {
            // Agregar permiso
            newPermissions = [...currentPermissions, permission];
        }
        onPermissionsChange(newPermissions);
    };

    // Verificar el estado del módulo (cuántos permisos están activos)
    const getModuleStatus = (moduleConfig: any) => {
        const viewActive = hasPermission(moduleConfig.viewPermission);
        const editActive = hasPermission(moduleConfig.editPermission);
        
        if (viewActive && editActive) return 'full';
        if (viewActive || editActive) return 'partial';
        return 'none';
    };

    if (userRole === UserRole.SUPER_ADMIN) {
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

            {/* Información del rol */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                    Asignación de Permisos para: <span className="text-blue-600">{userRole}</span>
                </h3>
                <p className="text-sm text-gray-600">
                    Selecciona los módulos y niveles de acceso que tendrá este usuario. 
                    Cada módulo tiene solo 2 niveles: Ver y Editar.
                </p>
            </div>

            {/* Búsqueda */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar módulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={disabled}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Módulos */}
            <div className="space-y-3">
                {Object.entries(SIMPLIFIED_MODULES)
                    .filter(([moduleName]) => 
                        !searchTerm || moduleName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(([moduleName, moduleConfig]) => {
                        const status = getModuleStatus(moduleConfig);
                        const isExpanded = expandedModules.includes(moduleName);
                        const viewActive = hasPermission(moduleConfig.viewPermission);
                        const editActive = hasPermission(moduleConfig.editPermission);

                        return (
                            <div key={moduleName} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Header del módulo */}
                                <div 
                                    className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                    onClick={() => toggleModule(moduleName)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{moduleConfig.icon}</span>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{moduleName}</h4>
                                                <p className="text-sm text-gray-600">{moduleConfig.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="text-right">
                                                <div className={`text-sm font-medium ${
                                                    status === 'full' ? 'text-green-700' : 
                                                    status === 'partial' ? 'text-yellow-700' : 'text-gray-500'
                                                }`}>
                                                    {status === 'full' ? '✅ Completo' : 
                                                     status === 'partial' ? '⚡ Parcial' : '⚪ Sin acceso'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {(viewActive ? 1 : 0) + (editActive ? 1 : 0)}/2 permisos
                                                </div>
                                            </div>
                                            <svg 
                                                className={`h-5 w-5 text-gray-400 transition-transform ${
                                                    isExpanded ? 'rotate-180' : ''
                                                }`} 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Contenido expandible */}
                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Permiso de Ver */}
                                            <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                        👁️ <span className="ml-2">Ver / Lectura</span>
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={viewActive}
                                                            onChange={() => handlePermissionToggle(moduleConfig.viewPermission, viewActive)}
                                                            disabled={disabled}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-11 h-6 rounded-full transition-colors ${
                                                            viewActive ? 'bg-green-500' : 'bg-gray-300'
                                                        }`}>
                                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                                                viewActive ? 'translate-x-5' : 'translate-x-0.5'
                                                            }`}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    Permite acceder a la pantalla y ver información
                                                </p>
                                                <div className="text-xs text-gray-400">
                                                    <code>{moduleConfig.viewPermission}</code>
                                                </div>
                                            </div>

                                            {/* Permiso de Editar */}
                                            <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                        ✏️ <span className="ml-2">Editar / Gestionar</span>
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editActive}
                                                            onChange={() => handlePermissionToggle(moduleConfig.editPermission, editActive)}
                                                            disabled={disabled}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-11 h-6 rounded-full transition-colors ${
                                                            editActive ? 'bg-blue-500' : 'bg-gray-300'
                                                        }`}>
                                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                                                editActive ? 'translate-x-5' : 'translate-x-0.5'
                                                            }`}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    Permite crear, modificar y gestionar datos
                                                    <span className="text-green-600 ml-1">(incluye VER)</span>
                                                </p>
                                                <div className="text-xs text-gray-400">
                                                    <code>{moduleConfig.editPermission}</code>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información adicional */}
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                            <h5 className="text-xs font-semibold text-blue-800 mb-2">ℹ️ INFORMACIÓN:</h5>
                                            <div className="text-xs text-blue-700 space-y-1">
                                                <div><strong>Sistema simplificado:</strong> Solo 2 permisos por pantalla</div>
                                                <div><strong>Herencia automática:</strong> EDITAR incluye VER</div>
                                                <div className="text-xs text-blue-600 mt-2">
                                                    💡 <strong>Tip:</strong> Activa "Ver" para solo lectura, o "Editar" para acceso completo.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* Resumen */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Resumen de Permisos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{currentPermissions.length}</div>
                        <div className="text-gray-600">Permisos Activos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {Object.keys(SIMPLIFIED_MODULES).filter((module) =>
                                getModuleStatus((SIMPLIFIED_MODULES as any)[module]) !== 'none'
                            ).length}
                        </div>
                        <div className="text-gray-600">Módulos Activos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{Object.keys(SIMPLIFIED_MODULES).length}</div>
                        <div className="text-gray-600">Módulos Totales</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {Math.round((currentPermissions.length / 22) * 100)}%
                        </div>
                        <div className="text-gray-600">Cobertura</div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            {currentPermissions.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-center">
                        ⚠️ Este usuario no tiene permisos asignados. 
                        <br />
                        <strong>Debe seleccionar al menos un módulo para que pueda acceder al sistema.</strong>
                    </p>
                </div>
            )}
        </div>
    );
};

export default PermissionsManager;