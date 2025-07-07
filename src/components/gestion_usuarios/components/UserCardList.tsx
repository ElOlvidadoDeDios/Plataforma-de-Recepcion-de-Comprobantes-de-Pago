import React from 'react';
import { User, AGENCIAS } from '../../../types';
import { UserRole } from '../../../types/roles';

interface UserCardListProps {
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
}

const UserCardList: React.FC<UserCardListProps> = ({
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
  setShowChangePasswordModal
}) => {
  return (
    <div className="lg:hidden space-y-4">
      {users.map((user: User) => {
        const isCurrentUser = currentUser?.email === user.email;
        
        return (
          <div
            key={user._id}
            className={`rounded-xl shadow-md border-2 p-5 transition-all duration-200 hover:shadow-lg ${
              isCurrentUser
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="space-y-4">
              {/* Header con Avatar y Email */}
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  isCurrentUser ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
                }`}>
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className={`text-base font-semibold ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'} break-all`}>
                    {isCurrentUser && '👤 '}
                    <span className="break-all">{user.email}</span>
                    {isCurrentUser && <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded-full whitespace-nowrap">Tú</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {canViewSensitiveInfo(user) ? (
                      <>
                        {user.razon && user.role && `${user.razon} ${user.role}`}
                        {user.dni && ` | DNI: ${user.dni}`}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Información restringida</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Agencias */}
            {(() => {
              // 🔧 Filtrar solo agencias válidas (sin arrays vacíos)
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

              // Solo mostrar si hay agencias válidas
              return (
                user.role === UserRole.CAJERO ||
                user.role === UserRole.ADMINISTRADOR ||
                user.role === UserRole.GERENTE_GENERAL ||
                user.role === UserRole.JEFE_OPERACIONES ||
                user.role === UserRole.SUPER_ADMIN
              ) && agenciasValidas.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Agencias: {agenciasValidas.length} asignada(s)
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agenciasValidas.map((ag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-cyan-50 text-cyan-700">
                        {Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={user.status}
                  onChange={(e) => handleStatusChange(user._id, Number(e.target.value))}
                  className={`w-full text-base py-2 px-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                    (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) || isCurrentUser
                      ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={(user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) || isCurrentUser}
                  title={isCurrentUser ? '🔒 No puedes cambiar tu propio estado (protección del sistema)' : ''}
                >
                  <option value={0}>Sin permisos</option>
                  <option value={1}>Activo</option>
                  <option value={2}>Bloqueado</option>
                  <option value={3}>Eliminado</option>
                </select>
                {isCurrentUser && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    🔒 <span className="ml-1">Tu estado - Protegido</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                {canAssignRoles() ? (
                  <div>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`w-full text-base py-2 px-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        !canAssignRole(user.role as UserRole, user) || isCurrentUser
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                          : 'bg-white border-gray-300'
                      }`}
                      disabled={!canAssignRole(user.role as UserRole, user) || isCurrentUser}
                      title={isCurrentUser ? '🔒 No puedes cambiar tu propio rol (protección del sistema)' : ''}
                    >
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>
                        {role === UserRole.SUPER_ADMIN ? '🔥 Super Admin' :
                         role === UserRole.ADMINISTRADOR ? 'Administrador' :
                         role === UserRole.CAJERO ? 'Cajero' :
                         role === UserRole.ANALISTA_CREDITOS_I ? 'Analista de Créditos I' :
                         role === UserRole.GERENTE_GENERAL ? 'Gerente General' :
                         role === UserRole.JEFE_OPERACIONES ? 'Jefe de Operaciones' :
                         role === UserRole.BASIC_USER ? 'Usuario Básico' :
                         ''}
                      </option>
                    ))}
                  </select>
                  {isCurrentUser && (
                    <div className="text-xs text-blue-600 mt-1">
                      🛡️ Auto-protegido
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-base text-gray-900 py-2 px-3 bg-gray-50 rounded-lg block">
                  {user.role === UserRole.SUPER_ADMIN ? '🔥 Super Admin' :
                   user.role === UserRole.ADMINISTRADOR ? 'Administrador' :
                   user.role === UserRole.CAJERO ? 'Cajero' :
                   user.role === UserRole.ANALISTA_CREDITOS_I ? 'Analista de Créditos I' :
                   user.role === UserRole.GERENTE_GENERAL ? 'Gerente General' :
                   user.role === UserRole.JEFE_OPERACIONES ? 'Jefe de Operaciones' :
                   user.role === UserRole.BASIC_USER ? 'Usuario Básico' :
                   user.role}
                </span>
              )}
            </div>
          </div>
            <div className="grid gap-3 pt-3">
              {user.status !== 1 && (
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowActivateModal(true);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Activar Usuario
                </button>
              )}
              {user.status === 1 && (
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowChangePasswordModal(true);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    currentUser?.email === user.email
                      ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {currentUser?.email === user.email ? '🔑 Mi Contraseña' : '🔑 Cambiar Contraseña'}
                </button>
              )}
              {canManageAgenciasOf(user) && (
                <button
                  onClick={() => handleOpenAgenciaModal(user)}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    currentUser?.id === user._id
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {currentUser?.id === user._id ? '⚙️ Mis Agencias' : 'Gestionar Agencias'}
                </button>
              )}
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserCardList;