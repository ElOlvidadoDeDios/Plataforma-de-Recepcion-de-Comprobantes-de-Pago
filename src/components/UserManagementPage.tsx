import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  fetchAllUsers,
  updateUserRole,
  toggleUserStatus,
  toggleEmailBlock,
  deleteUser,
} from '../api';
import { UserRole } from '../types/roles';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { canManageUsers, canAssignRoles, canBlockEmails } = usePermissions();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (!canManageUsers()) {
      navigate('/');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await fetchAllUsers();
      setUsers(usersData);
    } catch (error) {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role as UserRole);
      toast.success('Rol actualizado correctamente');
      loadUsers();
    } catch (error) {
      toast.error('Error al actualizar el rol');
    }
  };

  const handleStatusChange = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      toast.success('Estado actualizado correctamente');
      loadUsers();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleToggleEmailBlock = async (userId: string) => {
    try {
      await toggleEmailBlock(userId);
      toast.success('Estado del correo actualizado correctamente');
      loadUsers();
    } catch (error) {
      toast.error('Error al actualizar el estado del correo');
    }
  };

  const handleDeleteUser = async (userId: string, permanent: boolean = false) => {
    const message = permanent 
      ? '¿Estás seguro de que deseas eliminar permanentemente este usuario? Esta acción no se puede deshacer.'
      : '¿Estás seguro de que deseas eliminar este usuario?';

    if (!window.confirm(message)) {
      return;
    }

    try {
      await deleteUser(userId, permanent);
      toast.success(permanent ? 'Usuario eliminado permanentemente' : 'Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      toast.error('Error al eliminar el usuario');
    }
  };

  return (
    <Layout title="Gestión de Usuarios">
      <div className="px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                      <div className="flex items-center">
                        <div>
                          <div className={`text-sm font-medium ${user.isEmailBlocked ? 'text-red-600' : 'text-gray-900'}`}>
                            {user.email.replace('[BLOCKED]', '')}
                            {user.isEmailBlocked && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Bloqueado
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{`${user.name} ${user.lastName}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                      {canAssignRoles() && (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                          disabled={!isSuperAdmin && user.role === UserRole.SUPER_ADMIN}
                        >
                          {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.PAYMENTS_USER}>Usuario de Pagos</option>
                          <option value={UserRole.CREDIT_USER}>Usuario de Créditos</option>
                          <option value={UserRole.BASIC_USER}>Usuario Básico</option>
                        </select>
                      )}
                      {!canAssignRoles() && (
                        <span className="text-sm text-gray-900">{user.role}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                      <button
                        onClick={() => handleStatusChange(user._id)}
                        disabled={!canManageUsers()}
                        className={`px-3 py-1 rounded-md text-xs font-semibold ${
                          user.isActive
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-red-100 text-red-800'
                        } ${!canManageUsers() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80 transition-colors'}`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100 text-right text-sm font-medium space-x-2">
                      {canBlockEmails() && (
                        <button
                          onClick={() => handleToggleEmailBlock(user._id)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold ${
                            user.isEmailBlocked
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                          } transition-colors`}
                        >
                          {user.isEmailBlocked ? 'Desbloquear Email' : 'Bloquear Email'}
                        </button>
                      )}
                      {isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, true)}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800 hover:bg-red-200 transition-colors ml-2"
                          >
                            Eliminar Permanentemente
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagementPage;