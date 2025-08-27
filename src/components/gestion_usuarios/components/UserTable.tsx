import React from 'react';
import { User, AGENCIAS } from '../../../types';
import { UserRole } from '../../../types/roles';

interface UserTableProps {
  users: User[];
  currentUser: any;
  isSuperAdmin: boolean;
  canViewSensitiveInfo: (user: User) => boolean;
  canAssignRoles: () => boolean;
  canAssignRole: (role: UserRole, user?: User) => boolean;
  canManageAgenciasOf: (user: User) => boolean;
  getAvailableRoles: () => UserRole[];
  handleStatusChange: (userId: string, status: number) => void;
  handleRoleChange: (userId: string, role: string) => void;
  handleOpenAgenciaModal: (user: User) => void;
  setSelectedUser: (user: User) => void;
  setShowActivateModal: (show: boolean) => void;
  setShowChangePasswordModal: (show: boolean) => void;
  setShowPermissionsModal: (show: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUser,
  isSuperAdmin,
  canViewSensitiveInfo,
  canAssignRoles,
  canAssignRole,
  canManageAgenciasOf,
  getAvailableRoles,
  handleStatusChange,
  handleRoleChange,
  handleOpenAgenciaModal,
  setSelectedUser,
  setShowActivateModal,
  setShowChangePasswordModal,
  setShowPermissionsModal
}) => {
  const getStatusBadge = (status: number) => {
    const statusConfig = {
      0: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '', text: 'Sin permisos' },
      1: { color: 'bg-green-100 text-green-700 border-green-200', icon: '', text: 'Activo' },
      2: { color: 'bg-red-100 text-red-700 border-red-200', icon: '', text: 'Bloqueado' },
      3: { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: '', text: 'Eliminado' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      [UserRole.SUPER_ADMIN]: { color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200', icon: '👑' },
      [UserRole.ADMINISTRADOR]: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🛡️' },
      [UserRole.CAJERO]: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '💰' },
      [UserRole.ANALISTA_CREDITOS_I]: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '📊' },
      [UserRole.GERENTE_GENERAL]: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🎯' },
      [UserRole.JEFE_OPERACIONES]: { color: 'bg-teal-100 text-teal-700 border-teal-200', icon: '⚡' },
      [UserRole.BASIC_USER]: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '👤' },
      [UserRole.ANALISTA_CREDITOS_PAGO_DIARIO]: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '📊' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig[UserRole.BASIC_USER];
    const roleName = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.ADMINISTRADOR]: 'Administrador de agencia',
      [UserRole.CAJERO]: 'Cajero',
      [UserRole.ANALISTA_CREDITOS_I]: 'Analista de Créditos I',
      [UserRole.GERENTE_GENERAL]: 'Gerente General',
      [UserRole.JEFE_OPERACIONES]: 'Jefe de Operaciones',
      [UserRole.BASIC_USER]: 'Usuario Básico',
      [UserRole.ANALISTA_CREDITOS_PAGO_DIARIO]: 'Analista de Créditos PagoDíario'
    }[role] || role;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {roleName}
      </span>
    );
  };

  return (
    <div className="hidden lg:block w-full max-w-full">
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="w-[40%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center">
                  <span className="mr-2">👥</span>
                  Usuario
                </div>
              </th>
              <th className="w-[15%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center">
                  <span className="mr-2">📊</span>
                  Estado
                </div>
              </th>
              <th className="w-[20%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center">
                  <span className="mr-2">🏷️</span>
                  Rol
                </div>
              </th>
              <th className="w-[25%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center">
                  <span className="mr-2">⚙️</span>
                  Acciones
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((user: User, index) => (
              <tr 
                key={user._id} 
                className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                  currentUser?.email === user.email ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-l-yellow-400' : ''
                } ${index % 2 === 0 ? 'bg-gray-50/30' : ''}`}
              >
                <td className="w-[40%] px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentUser?.email === user.email 
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      }`}>
                        {user.email?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                        {currentUser?.email === user.email && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <span className="mr-1">⭐</span>
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {canViewSensitiveInfo(user) ? (
                          <div className="space-y-1">
                            {user.razon && (
                              <div className="flex items-center">
                                <span className="mr-1">🏢</span>
                                {user.razon}
                              </div>
                            )}
                            {user.dni && (
                              <div className="flex items-center">
                                <span className="mr-1">🆔</span>
                                DNI: {user.dni}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 italic">
                            <span className="mr-1">🔒</span>
                            Información restringida
                          </div>
                        )}
                      </div>
                      {(() => {
                        const agenciasValidas = (user.agencias || []).filter(ag =>
                          ag &&
                          !Array.isArray(ag) &&
                          typeof ag === 'object' &&
                          typeof ag.agencia === 'string' &&
                          typeof ag.cod_caja === 'string' &&
                          typeof ag.user_caja === 'string' &&
                          ag.agencia.trim() !== '' &&
                          ag.cod_caja.trim() !== '' &&
                          ag.user_caja.trim() !== ''
                        );

                        return (
                          user.role === UserRole.CAJERO ||
                          user.role === UserRole.ADMINISTRADOR ||
                          user.role === UserRole.GERENTE_GENERAL ||
                          user.role === UserRole.JEFE_OPERACIONES ||
                          user.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO ||
                          user.role === UserRole.SUPER_ADMIN
                        ) && agenciasValidas.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center mb-1">
                              <span className="mr-1 text-xs">🏪</span>
                              <span className="text-xs text-gray-600 font-medium">
                                {agenciasValidas.length} agencia{agenciasValidas.length !== 1 ? 's' : ''} asignada{agenciasValidas.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {agenciasValidas.slice(0, 2).map((ag, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gradient-to-r from-cyan-500 to-blue-300 text-white-500 border border-cyan-200">
                                  {Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia}
                                </span>
                              ))}
                              {agenciasValidas.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 border border-gray-200">
                                  +{agenciasValidas.length - 2} más
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </td>
                
                <td className="w-[15%] px-6 py-4">
                  <div className="space-y-2">
                    {getStatusBadge(user.status)}
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user._id, Number(e.target.value))}
                      className={`w-full text-xs border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                        (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) ||
                        (currentUser?.email === user.email)
                          ? 'bg-gray-100 cursor-not-allowed opacity-60'
                          : 'bg-white hover:border-cyan-400'
                      }`}
                      disabled={
                        (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) ||
                        (currentUser?.email === user.email)
                      }
                      title={
                        currentUser?.email === user.email
                          ? '🔒 No puedes cambiar tu propio estado (protección del sistema)'
                          : user.role === UserRole.SUPER_ADMIN && !isSuperAdmin
                            ? 'Solo SUPER_ADMIN puede modificar otros SUPER_ADMIN'
                            : ''
                      }
                    >
                      <option value={0}>⏸️ Sin permisos</option>
                      <option value={1}>✅ Activo</option>
                      <option value={2}>🔒 Bloqueado</option>
                      <option value={3}>🗑️ Eliminado</option>
                    </select>
                    {currentUser?.email === user.email && (
                      <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200">
                        <span className="mr-1">🛡️</span>
                        <span>Protegida</span>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="w-[20%] px-6 py-4">
                  <div className="space-y-2">
                    {getRoleBadge(user.role)}
                    {canAssignRoles() ? (
                      <div>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`w-full text-xs border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                            (!canAssignRole(user.role as UserRole, user)) ||
                            (currentUser?.email === user.email)
                              ? 'bg-gray-100 cursor-not-allowed opacity-60'
                              : 'bg-white hover:border-cyan-400'
                          }`}
                          disabled={
                            !canAssignRole(user.role as UserRole, user) ||
                            (currentUser?.email === user.email)
                          }
                          title={
                            currentUser?.email === user.email
                              ? '🔒 No puedes cambiar tu propio rol (protección del sistema)'
                              : ''
                          }
                        >
                          {getAvailableRoles().map(role => (
                            <option key={role} value={role}>
                              {role === UserRole.SUPER_ADMIN ? '👑 Super Admin' :
                               role === UserRole.ADMINISTRADOR ? '🛡️ Administrador de agencia' :
                               role === UserRole.CAJERO ? '💰 Cajero' :
                               role === UserRole.ANALISTA_CREDITOS_I ? '📊 Analista de Créditos I' :
                               role === UserRole.GERENTE_GENERAL ? '👑 Gerente General' :
                               role === UserRole.JEFE_OPERACIONES ? '⚡ Jefe de Operaciones' :
                               role === UserRole.BASIC_USER ? '👤 Usuario Básico' :
                               role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO ? '📊 Analista de Créditos PagoDíario' :
                               ''}
                            </option>
                          ))}
                        </select>
                        {currentUser?.email === user.email && (
                          <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200">
                            <span className="mr-1">🔒</span>
                            <span>Protegido</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </td>
                
                <td className="w-[25%] px-6 py-4">
                  <div className="flex flex-col gap-2">
                    {user.status !== 1 && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowActivateModal(true);
                        }}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <span className="mr-1">✨</span>
                        Activar
                      </button>
                    )}
                    {user.status === 1 && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowChangePasswordModal(true);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                          currentUser?.email === user.email
                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-orange-600 hover:to-red-600'
                        }`}
                        title={currentUser?.email === user.email ? 'Cambiar mi contraseña' : 'Cambiar contraseña del usuario'}
                      >
                        <span className="mr-1">🔑</span>
                        {currentUser?.email === user.email ? 'Mi Contraseña' : 'Contraseña'}
                      </button>
                    )}
                    {canManageAgenciasOf(user) && (
                      <button
                        onClick={() => handleOpenAgenciaModal(user)}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                          currentUser?.id === user._id
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-indigo-600'
                        }`}
                      >
                        <span className="mr-1">🏪</span>
                        {currentUser?.id === user._id ? 'Mis Agencias' : 'Agencias'}
                      </button>
                    )}
                    {(isSuperAdmin || currentUser?.role === 'GERENTE_GENERAL') && user.status === 1 && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionsModal(true);
                        }}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                      >
                        <span className="mr-1">🛡️</span>
                        Permisos Extra
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;