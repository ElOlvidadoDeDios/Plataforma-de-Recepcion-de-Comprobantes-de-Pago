import React, { useState, useEffect } from 'react';
import { User, AGENCIAS, AgenciaCaja } from '../types';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  fetchAllUsers,
  updateUserRole,
  updateUserStatus,
  updateUserAgencias,
} from '../api';
import { UserRole } from '../types/roles';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canManageUsers, canAssignRoles } = usePermissions();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const [showAgenciaModal, setShowAgenciaModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAgencias, setUserAgencias] = useState<AgenciaCaja[]>([]);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; role: UserRole } | null>(null);

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

  const handleRoleChange = async (userId: string, role: string) => {
    const targetUser = users.find((u: User) => u._id === userId);
    if (targetUser?.status !== 1) {
      toast.error('El usuario debe estar activo para asignar un rol');
      return;
    }

    try {
      await updateUserRole(userId, role as UserRole);
      toast.success('Rol actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Si es PAYMENTS_USER, mostrar mensaje adicional
      if (role === UserRole.PAYMENTS_USER) {
        toast('Ahora puede gestionar las agencias del usuario usando el botón "Gestionar Agencias". Disponible para usuarios de pagos, admin y super admin', {
          duration: 5000,
          style: {
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #93C5FD'
          }
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el rol');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: number) => {
    try {
      const response = await updateUserStatus(userId, newStatus);
      toast.success(response.message || 'Estado actualizado correctamente');

      // Set role to BASIC_USER if status is blocked or deleted
      if (newStatus === 2 || newStatus === 3) {
        await updateUserRole(userId, UserRole.BASIC_USER);
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  const handleActivateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUserStatus(selectedUser._id, 1);
      toast.success('Usuario activado correctamente');
      setShowActivateModal(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al activar el usuario');
    }
  };

  const handleAgenciaChange = (index: number, field: keyof AgenciaCaja, value: string) => {
    const newAgencias = [...userAgencias];
    newAgencias[index] = { ...newAgencias[index], [field]: value };
    setUserAgencias(newAgencias);
  };

  const handleAddAgencia = () => {
    // Verificar si ya existe una fila vacía
    const tieneFilaVacia = userAgencias.some(ag =>
      !ag.agencia.trim() && !ag.cod_caja.trim() && !ag.user_caja.trim()
    );
    
    // Solo agregar nueva fila si no hay una vacía
    if (!tieneFilaVacia) {
      setUserAgencias([...userAgencias, { agencia: '', cod_caja: '', user_caja: '' }]);
    } else {
      toast('Complete la fila vacía existente antes de agregar una nueva', {
        duration: 4000,
        style: {
          background: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #93C5FD'
        }
      });
    }
  };

  const handleRemoveAgencia = (index: number) => {
    // Permitir eliminar agencias incluso cuando solo queda una
    const newAgencias = userAgencias.filter((_, i) => i !== index);
    
    // Si se eliminaron todas las agencias, agregar una vacía para mantener el formulario
    if (newAgencias.length === 0) {
      newAgencias.push({ agencia: '', cod_caja: '', user_caja: '' });
    }
    
    setUserAgencias(newAgencias);
  };

  const handleOpenAgenciaModal = (user: User) => {
    if (user.status !== 1) {
      toast.error('El usuario debe estar activo para gestionar agencias');
      return;
    }
    if (user.role !== UserRole.PAYMENTS_USER &&
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.SUPER_ADMIN) {
      toast.error('Solo se pueden gestionar agencias para usuarios de pagos, admin y super admin');
      return;
    }
    if (!canManageUsers()) {
      toast.error('No tienes permisos para gestionar agencias');
      return;
    }
    setSelectedUser(user);
    
    // Inicializar agencias existentes o una nueva agencia vacía
    const agenciasIniciales = user.agencias?.length
      ? [...user.agencias]
      : [{ agencia: '', cod_caja: '', user_caja: '' }];
    
    // Agregar una agencia vacía al final si todas las existentes están llenas
    const todasLlenas = agenciasIniciales.every(ag =>
      ag.agencia.trim() && ag.cod_caja.trim() && ag.user_caja.trim()
    );
    
    if (todasLlenas) {
      agenciasIniciales.push({ agencia: '', cod_caja: '', user_caja: '' });
    }
    
    setUserAgencias(agenciasIniciales);
    setShowAgenciaModal(true);
  };

  const handleSaveAgencias = async () => {
    if (!selectedUser) {
      toast.error('No se ha seleccionado ningún usuario');
      return;
    }

    // Filtrar agencias vacías
    const agenciasNoVacias = userAgencias.filter(ag =>
      ag.agencia.trim() !== '' &&
      ag.cod_caja.trim() !== '' &&
      ag.user_caja.trim() !== ''
    );

    // Obtener agencias actuales del usuario
    const agenciasActuales = selectedUser.agencias ?? [];

    // Verificar si hubo cambios reales en las agencias
    const agenciasIguales = agenciasNoVacias.length === agenciasActuales.length &&
      agenciasNoVacias.every((ag, idx) => {
        const agActual = agenciasActuales[idx];
        return ag.agencia.trim() === agActual.agencia.trim() &&
               ag.cod_caja.trim() === agActual.cod_caja.trim() &&
               ag.user_caja.trim() === agActual.user_caja.trim();
      });

    // Si no hubo cambios, cerrar el modal sin hacer la actualización
    if (agenciasIguales) {
      setShowAgenciaModal(false);
      setSelectedUser(null);
      setUserAgencias([]);
      return;
    }

    // Si no hay agencias válidas
    if (agenciasNoVacias.length === 0) {
      toast.error('Debe proporcionar al menos una agencia válida');
      return;
    }
    try {
      const agenciasFormateadas = agenciasNoVacias.map(ag => ({
        agencia: ag.agencia.trim(),
        cod_caja: ag.cod_caja.trim(),
        user_caja: ag.user_caja.trim(),
      }));

      const validaciones = {
        camposCompletos: agenciasFormateadas.every(ag => ag.agencia && ag.cod_caja && ag.user_caja),
        formatoValido: agenciasFormateadas.every(ag => ag.cod_caja.length >= 3 && ag.user_caja.length >= 3),
        codigosUnicos: new Set(agenciasFormateadas.map(ag => ag.cod_caja)).size === agenciasFormateadas.length,
      };

      if (!validaciones.camposCompletos) {
        toast.error('Todos los campos son obligatorios');
        return;
      }
      if (!validaciones.formatoValido) {
        toast.error('Códigos de caja y usuario deben tener al menos 3 caracteres');
        return;
      }
      if (!validaciones.codigosUnicos) {
        toast.error('No puede haber códigos de caja duplicados');
        return;
      }

      await updateUserAgencias(selectedUser._id, agenciasFormateadas);
      toast.success('Agencias actualizadas correctamente');

      if (pendingRoleChange) {
        await updateUserRole(pendingRoleChange.userId, pendingRoleChange.role);
        setPendingRoleChange(null);
      }

      setShowAgenciaModal(false);
      setSelectedUser(null);
      setUserAgencias([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      const status = error.response?.status;
      switch (status) {
        case 400:
          toast.error(error.response.data.message || 'Datos de agencias inválidos');
          break;
        case 401:
          toast.error('Sesión expirada. Inicia sesión nuevamente');
          navigate('/login');
          break;
        case 403:
          toast.error('No tienes permisos para esta acción');
          break;
        case 404:
          toast.error('Usuario no encontrado');
          break;
        case 409:
          toast.error('Conflicto: Los códigos de caja deben ser únicos');
          break;
        default:
          toast.error('Error al actualizar agencias');
      }

      // Revert role change if failed
      if (pendingRoleChange) {
        await updateUserRole(pendingRoleChange.userId, UserRole.BASIC_USER);
        setPendingRoleChange(null);
      }
    }
  };

  const handleCloseAgenciaModal = () => {
    setShowAgenciaModal(false);
    setSelectedUser(null);
    setUserAgencias([]);
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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user: User) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          {user.name && user.lastName && `${user.name} ${user.lastName}`}
                          {user.dni && ` | DNI: ${user.dni}`}
                        </div>
                        {(user.role === UserRole.PAYMENTS_USER || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (user.agencias ?? []).length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            Agencias: {(user.agencias ?? []).length} asignada(s)
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(user.agencias ?? []).map((ag, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-cyan-50 text-cyan-700">
                                  {Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user._id, Number(e.target.value))}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                          disabled={user.role === UserRole.SUPER_ADMIN && !isSuperAdmin}
                        >
                          <option value={0}>Sin permisos</option>
                          <option value={1}>Activo</option>
                          <option value={2}>Bloqueado</option>
                          <option value={3}>Eliminado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canAssignRoles() ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                            disabled={!isSuperAdmin && user.role === UserRole.SUPER_ADMIN}
                          >
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.PAYMENTS_USER}>Usuario de Pagos</option>
                            <option value={UserRole.CREDIT_USER}>Usuario de Créditos</option>
                            <option value={UserRole.BASIC_USER}>Usuario Básico</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{user.role}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {user.status !== 1 && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowActivateModal(true);
                            }}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                          >
                            Activar Usuario
                          </button>
                        )}
                        {(user.role === UserRole.PAYMENTS_USER || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                          <button
                            onClick={() => handleOpenAgenciaModal(user)}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition-colors"
                          >
                            Gestionar Agencias
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {users.map((user: User) => (
                <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">
                      {user.name && user.lastName && `${user.name} ${user.lastName}`}
                      {user.dni && ` | DNI: ${user.dni}`}
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
                            disabled={!isSuperAdmin && user.role === UserRole.SUPER_ADMIN}
                          >
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.PAYMENTS_USER}>Usuario de Pagos</option>
                            <option value={UserRole.CREDIT_USER}>Usuario de Créditos</option>
                            <option value={UserRole.BASIC_USER}>Usuario Básico</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{user.role}</span>
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
                      {(user.role === UserRole.PAYMENTS_USER || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                        <button
                          onClick={() => handleOpenAgenciaModal(user)}
                          className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Gestionar Agencias
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal para activar usuario */}
      {showActivateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activar Usuario</h3>
              <button
                onClick={() => setShowActivateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas activar al usuario <span className="font-medium">{selectedUser.email}</span>? Esto permitirá asignar roles y gestionar agencias.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleActivateUser}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Activar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar agencias */}
      {showAgenciaModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-cyan-700">Agregar Agencias</h3>
              <button
                onClick={handleCloseAgenciaModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Asigna agencias al usuario <span className="font-medium">{selectedUser.email}</span>.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Agencias Asignadas</h4>
                  <p className="text-sm text-gray-500">Cada agencia debe tener un código único.</p>
                </div>
                <button
                  onClick={handleAddAgencia}
                  className="px-3 py-2 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nueva Agencia
                </button>
              </div>

              {userAgencias.map((agencia, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 hover:border-cyan-300 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Agencia {index + 1}</span>
                    {userAgencias.length > 1 && (
                      <button
                        onClick={() => handleRemoveAgencia(index)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Agencia</label>
                      <select
                        value={agencia.agencia}
                        onChange={(e) => handleAgenciaChange(index, 'agencia', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        <option value="">Selecciona una agencia</option>
                        {Object.entries(AGENCIAS).map(([nombre, codigo]) => (
                          <option key={codigo} value={codigo}>
                            {nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Código de Caja</label>
                      <input
                        type="text"
                        value={agencia.cod_caja}
                        onChange={(e) => handleAgenciaChange(index, 'cod_caja', e.target.value)}
                        placeholder="Ej: C001"
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Usuario de Caja</label>
                      <input
                        type="text"
                        value={agencia.user_caja}
                        onChange={(e) => handleAgenciaChange(index, 'user_caja', e.target.value)}
                        placeholder="Ej: UCAJA001"
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseAgenciaModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAgencias}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserManagementPage;
