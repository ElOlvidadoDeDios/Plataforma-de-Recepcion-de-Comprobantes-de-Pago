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
} from './gestion_usuarios';
import UserCreateSimpleModal from './gestion_usuarios/components/UserCreateSimpleModal';
import AdminChangePasswordModal from './gestion_usuarios/components/AdminChangePasswordModal';

const UserManagementPage: React.FC = () => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

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
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        {isError && (
          <div className="mb-6 bg-red-50 p-4 rounded-md border-l-4 border-red-500">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm text-red-700">Error al cargar los usuarios.</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Botón para crear usuario */}
            {canManageUsers() && (
              <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Nuevo Usuario
                </button>
              </div>
            )}

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
            />

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
            />
          </>
        )}
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
    </Layout>
  );
};

export default UserManagementPage;
