import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { useQuery } from '@tanstack/react-query';
import { fetchAllUsers } from '../api';
import {
  useUserManagement,
  useAgenciaManagement,
  UserTable,
  UserCardList,
  UserActivateModal,
  UserAgencyModal,
  UserUpdateModal,
} from './gestion_usuarios';
import UserCreateSimpleModal from './gestion_usuarios/components/UserCreateSimpleModal';
import AdminChangePasswordModal from './gestion_usuarios/components/AdminChangePasswordModal';
import UserPermissionsModal from './gestion_usuarios/components/UserPermissionsModal';

const UserManagementPage: React.FC = () => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const {
    user,
    isSuperAdmin,
    canManageUsers,
    canAssignRoles,
    showAgenciaModal,
    setShowAgenciaModal,
    showActivateModal,
    setShowActivateModal,
    selectedUser,
    setSelectedUser,
    userAgencias,
    setUserAgencias,
    pendingRoleChange,
    setPendingRoleChange,
    handleRoleChange,
    canAssignRole,
    getAvailableRoles,
    canViewSensitiveInfo,
    canManageAgenciasOf,
    handleStatusChange,
    navigate
  } = useUserManagement();

  const {
    handleAgenciaChange,
    handleAddAgencia,
    handleRemoveAgencia,
    handleOpenAgenciaModal,
    handleSaveAgencias,
    handleCloseAgenciaModal
  } = useAgenciaManagement({
    selectedUser,
    userAgencias,
    setUserAgencias,
    setShowAgenciaModal,
    setSelectedUser,
    pendingRoleChange,
    setPendingRoleChange
  });

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
    enabled: canManageUsers(),
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (!canManageUsers()) {
      navigate('/');
    }
  }, [canManageUsers, navigate]);

  const handleOpenAgenciaModalWrapper = (userToManage: any) => {
    handleOpenAgenciaModal(userToManage, canManageAgenciasOf);
  };

  return (
    <Layout title="Gestión de Usuarios">
      <div className="min-h-screen bg-gray-50">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                <p className="mt-1 text-cyan-100">Administra usuarios del sistema</p>
              </div>
              
              {/* Botón crear usuario mejorado para móvil */}
              {canManageUsers() && (
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="w-full sm:w-auto bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Crear Nuevo Usuario</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="px-4 sm:px-6 py-6">
          {isError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-red-700">Error al cargar los usuarios.</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow-sm">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!isLoading && !isError && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Mostrar tabla en desktop, cards en móvil */}
              <div className="hidden md:block">
                <UserTable
                  users={users}
                  currentUser={user}
                  isSuperAdmin={isSuperAdmin}
                  canViewSensitiveInfo={canViewSensitiveInfo}
                  canAssignRoles={canAssignRoles}
                  canAssignRole={canAssignRole}
                  canManageAgenciasOf={canManageAgenciasOf}
                  getAvailableRoles={getAvailableRoles}
                  handleStatusChange={handleStatusChange}
                  handleRoleChange={handleRoleChange}
                  handleOpenAgenciaModal={handleOpenAgenciaModalWrapper}
                  setSelectedUser={setSelectedUser}
                  setShowActivateModal={setShowActivateModal}
                  setShowChangePasswordModal={setShowChangePasswordModal}
                  setShowPermissionsModal={setShowPermissionsModal}
                  setShowUpdateModal={setShowUpdateModal}
                />
              </div>

              <div className="md:hidden p-4">
                <UserCardList
                  users={users}
                  currentUser={user}
                  isSuperAdmin={isSuperAdmin}
                  canViewSensitiveInfo={canViewSensitiveInfo}
                  canAssignRoles={canAssignRoles}
                  canAssignRole={canAssignRole}
                  canManageAgenciasOf={canManageAgenciasOf}
                  getAvailableRoles={getAvailableRoles}
                  handleStatusChange={handleStatusChange}
                  handleRoleChange={handleRoleChange}
                  handleOpenAgenciaModal={handleOpenAgenciaModalWrapper}
                  setSelectedUser={setSelectedUser}
                  setShowActivateModal={setShowActivateModal}
                  setShowChangePasswordModal={setShowChangePasswordModal}
                  setShowPermissionsModal={setShowPermissionsModal}
                  setShowUpdateModal={setShowUpdateModal}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <UserActivateModal
        isOpen={showActivateModal}
        user={selectedUser}
        onClose={() => {
          setShowActivateModal(false);
          setSelectedUser(null);
        }}
      />

      <UserAgencyModal
        isOpen={showAgenciaModal}
        user={selectedUser}
        currentUser={user}
        userAgencias={userAgencias}
        onClose={handleCloseAgenciaModal}
        onSave={handleSaveAgencias}
        onAgenciaChange={handleAgenciaChange}
        onAddAgencia={handleAddAgencia}
        onRemoveAgencia={handleRemoveAgencia}
      />

      <AdminChangePasswordModal
        isOpen={showChangePasswordModal}
        user={selectedUser}
        currentUser={user}
        onClose={() => {
          setShowChangePasswordModal(false);
          setSelectedUser(null);
        }}
      />

      <UserCreateSimpleModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        canCreateUsers={canManageUsers()}
        isSuperAdmin={isSuperAdmin}
      />

      <UserPermissionsModal
        isOpen={showPermissionsModal}
        user={selectedUser}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedUser(null);
        }}
      />

      <UserUpdateModal
        isOpen={showUpdateModal}
        user={selectedUser}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedUser(null);
        }}
      />
    </Layout>
  );
};

export default UserManagementPage;