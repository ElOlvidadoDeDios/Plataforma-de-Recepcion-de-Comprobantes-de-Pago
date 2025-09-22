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
  setShowPermissionsModal: (show: boolean) => void;
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
  setShowChangePasswordModal,
  setShowPermissionsModal
}) => {
  return (
    <div className="lg:hidden w-full mx-0">
      <div className="w-full space-y-4 mx-0">
        {users.map((user: User) => {
          const isCurrentUser = currentUser?.email === user.email;

          return (
            <div
              key={user._id}
              className={`w-full rounded-none sm:rounded-xl shadow-md border-0 transition-all duration-200 hover:shadow-lg ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50  ring-2 ring-blue-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-4 w-full">
                {/* Contenido de la tarjeta */}
                <div className="w-full mb-4">
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-7 h-7 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-xl flex-shrink-0 ${
                      isCurrentUser ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="w-full mb-2">
                        <div className="flex items-start gap-2 w-full">
                          <div className={`font-semibold text-sm ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'} flex-1 min-w-0`}>
                            <div className="break-all leading-tight">
                              {isCurrentUser && '👤 '}
                              {user.email}
                            </div>
                          </div>
                          {isCurrentUser && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 font-medium">
                              Tú
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full text-sm text-gray-600">
                        {canViewSensitiveInfo(user) ? (
                          <div className="space-y-1 w-full">
                            {user.razon && user.role && (
                              <div className="font-medium text-sm break-words">
                                {user.razon} {user.role}
                              </div>
                            )}
                            {user.dni && (
                              <div className="text-gray-500 text-xs">
                                DNI: {user.dni}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Información restringida</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Agencias */}
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
                    user.role === UserRole.RECAUDADOR ||
                    user.role === UserRole.ADMINISTRADOR ||
                    user.role === UserRole.GERENTE_GENERAL ||
                    user.role === UserRole.JEFE_OPERACIONES ||
                    user.role === UserRole.SUPER_ADMIN ||
                    user.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO
                  ) && agenciasValidas.length > 0 && (
                    <div className="w-full bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Agencias: {agenciasValidas.length} asignada{agenciasValidas.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-2 w-full">
                        {agenciasValidas.map((ag, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-cyan-100 text-cyan-800 font-medium">
                            {Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {/* Controles */}
                <div className="w-full space-y-4 mb-4">
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Estado</label>
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user._id, Number(e.target.value))}
                      className={`w-full text-sm py- px-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
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
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Rol</label>
                    {canAssignRoles() ? (
                      <div className="w-full">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`w-full text-sm py-3 px-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
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
                               role === UserRole.ADMINISTRADOR ? 'Administrador de agencia' :
                               role === UserRole.CAJERO ? 'Cajero' :
                               role === UserRole.RECAUDADOR ? 'Recaudador' :
                               role === UserRole.ANALISTA_CREDITOS_I ? 'Analista de Créditos I' :
                               role === UserRole.GERENTE_GENERAL ? 'Gerente General' :
                               role === UserRole.JEFE_OPERACIONES ? 'Jefe de Operaciones' :
                               role === UserRole.BASIC_USER ? 'Usuario Básico' :
                               role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO ? 'Analista de Créditos PagoDíario' :
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
                      <div className="w-full text-sm text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                        {user.role === UserRole.SUPER_ADMIN ? '🔥 Super Admin' :
                         user.role === UserRole.ADMINISTRADOR ? 'Administrador' :
                         user.role === UserRole.CAJERO ? 'Cajero' :
                         user.role === UserRole.RECAUDADOR ? 'Recaudador' :
                         user.role === UserRole.ANALISTA_CREDITOS_I ? 'Analista de Créditos I' :
                         user.role === UserRole.GERENTE_GENERAL ? 'Gerente General' :
                         user.role === UserRole.JEFE_OPERACIONES ? 'Jefe de Operaciones' :
                         user.role === UserRole.BASIC_USER ? 'Usuario Básico' :
                         user.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO ? 'Analista de Créditos PagoDíario' :
                         user.role}
                      </div>
                    )}
                  </div>
                </div>
                {/* Botones de acción */}
                <div className="w-full space-y-3 pt-4 border-t border-gray-200">
                  {user.status !== 1 && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowActivateModal(true);
                      }}
                      className="w-full px-4 py-1 rounded-lg text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all duration-200 flex items-center justify-center gap-2"
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
                      className={`w-full px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border ${
                        currentUser?.email === user.email
                          ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
                          : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {currentUser?.email === user.email ? 'Mi Contraseña' : 'Cambiar Contraseña'}
                    </button>
                  )}
                  {canManageAgenciasOf(user) && (
                    <button
                      onClick={() => handleOpenAgenciaModal(user)}
                      className={`w-full px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border ${
                        currentUser?.id === user._id
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                          : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {currentUser?.id === user._id ? '⚙️ Mis Agencias' : 'Gestionar Agencias'}
                    </button>
                  )}
                  {(isSuperAdmin || currentUser?.role === 'GERENTE_GENERAL') && user.status === 1 && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPermissionsModal(true);
                      }}
                      className="w-full px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      🛡️ Permisos Extra
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserCardList;
