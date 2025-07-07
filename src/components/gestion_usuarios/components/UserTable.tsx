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
  setShowChangePasswordModal
}) => {
  return (
    <div className="hidden lg:block w-full max-w-full">
      <div className="w-full">
        <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="w-[40%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">
              Usuario
            </th>
            <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">
              Estado
            </th>
            <th className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">
              Rol
            </th>
            <th className="w-[25%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user: User) => (
            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
              <td className="w-[40%] px-3 py-3">
                <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                <div className="text-sm text-gray-500">
                  {canViewSensitiveInfo(user) ? (
                    <>
                      {user.razon && user.razon}
                      {user.dni && ` | DNI: ${user.dni}`}
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Información restringida</span>
                  )}
                </div>
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
                    <div className="mt-1 text-xs text-gray-500">
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
              </td>
              <td className="w-[15%] px-3 py-3">
                <select
                  value={user.status}
                  onChange={(e) => handleStatusChange(user._id, Number(e.target.value))}
                  className={`text-xs w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 ${
                    (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) ||
                    (currentUser?.email === user.email)
                      ? 'bg-gray-100 cursor-not-allowed'
                      : ''
                  }`}
                  disabled={
                    (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) ||
                    (currentUser?.email === user.email) // Protección contra auto-sabotaje
                  }
                  title={
                    currentUser?.email === user.email
                      ? '🔒 No puedes cambiar tu propio estado (protección del sistema)'
                      : user.role === UserRole.SUPER_ADMIN && !isSuperAdmin
                        ? 'Solo SUPER_ADMIN puede modificar otros SUPER_ADMIN'
                        : ''
                  }
                >
                  <option value={0}>Sin permisos</option>
                  <option value={1}>Activo</option>
                  <option value={2}>Bloqueado</option>
                  <option value={3}>Eliminado</option>
                </select>
                {currentUser?.email === user.email && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    🔒 <span className="ml-1">Protegida</span>
                  </div>
                )}
              </td>
              <td className="w-[20%] px-3 py-3">
                {canAssignRoles() ? (
                  <div>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`text-xs w-full border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 ${
                        (!canAssignRole(user.role as UserRole, user)) ||
                        (currentUser?.email === user.email)
                          ? 'bg-gray-100 cursor-not-allowed'
                          : ''
                      }`}
                      disabled={
                        !canAssignRole(user.role as UserRole, user) ||
                        (currentUser?.email === user.email) // Protección contra auto-sabotaje
                      }
                      title={
                        currentUser?.email === user.email
                          ? '🔒 No puedes cambiar tu propio rol (protección del sistema)'
                          : ''
                      }
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
                    {currentUser?.email === user.email && (
                      <div className="text-xs text-blue-600 mt-1">
                        🛡️ Protegido
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-900">
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
              </td>
              <td className="w-[25%] px-3 py-3 text-xs font-medium">
                <div className="flex flex-col gap-1">
                  {user.status !== 1 && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowActivateModal(true);
                      }}
                      className="w-full px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    >
                      Activar
                    </button>
                  )}
                  {user.status === 1 && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowChangePasswordModal(true);
                      }}
                      className={`w-full px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        currentUser?.email === user.email
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }`}
                      title={currentUser?.email === user.email ? 'Cambiar mi contraseña' : 'Cambiar contraseña del usuario'}
                    >
                      🔑 {currentUser?.email === user.email ? 'Mi Contraseña' : 'Contraseña'}
                    </button>
                  )}
                  {canManageAgenciasOf(user) && (
                    <button
                      onClick={() => handleOpenAgenciaModal(user)}
                      className={`w-full px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        currentUser?.id === user._id
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                      }`}
                    >
                      {currentUser?.id === user._id ? '⚙️ Mis Agencias' : 'Agencias'}
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