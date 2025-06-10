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
    <div className="md:hidden space-y-4">
      {users.map((user: User) => (
        <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-900">{user.email}</div>
            <div className="text-sm text-gray-500">
              {canViewSensitiveInfo(user) ? (
                <>
                  {user.name && user.lastName && `${user.name} ${user.lastName}`}
                  {user.dni && ` | DNI: ${user.dni}`}
                </>
              ) : (
                <span className="text-gray-400 italic">Información restringida</span>
              )}
            </div>
            {(user.role === UserRole.PAYMENTS_USER || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && Array.isArray(user.agencias) && user.agencias.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Agencias: {user.agencias.length} asignada(s)
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.agencias.map((ag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-cyan-50 text-cyan-700">
                      {Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                <select
                  value={user.status}
                  onChange={(e) => handleStatusChange(user._id, Number(e.target.value))}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                  disabled={user.role === UserRole.SUPER_ADMIN && !isSuperAdmin}
                >
                  <option value={0}>Sin permisos</option>
                  <option value={1}>Activo</option>
                  <option value={2}>Bloqueado</option>
                  <option value={3}>Eliminado</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Rol</label>
                {canAssignRoles() ? (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                    disabled={!canAssignRole(user.role as UserRole, user)}
                  >
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>
                        {role === UserRole.SUPER_ADMIN ? '🔥 Super Admin' :
                         role === UserRole.ADMIN ? 'Admin' :
                         role === UserRole.PAYMENTS_USER ? 'Usuario de Pagos' :
                         role === UserRole.CREDIT_USER ? 'Usuario de Créditos' :
                         'Usuario Básico'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-900">
                    {user.role === UserRole.SUPER_ADMIN ? '🔥 Super Admin' : user.role}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {user.status !== 1 && (
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowActivateModal(true);
                  }}
                  className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                    currentUser?.email === user.email
                      ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {currentUser?.email === user.email ? '🔑 Mi Contraseña' : '🔑 Cambiar Contraseña'}
                </button>
              )}
              {canManageAgenciasOf(user) && (
                <button
                  onClick={() => handleOpenAgenciaModal(user)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                    currentUser?.id === user._id
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {currentUser?.id === user._id ? '⚙️ Mis Agencias' : 'Gestionar Agencias'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserCardList;