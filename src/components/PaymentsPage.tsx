import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { fetchPaymentsByDNI, fetchPaymentsByStatus } from '../api'; //updatePaymentStatus
import { PaymentCard } from './PaymentCard';
import { PaymentRecord, AGENCIAS } from '../types';
import { UserRole } from '../types/roles';
import Layout from './Layout';
import { usePermissions, useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface PaymentsPageProps {
  socket: Socket | null;
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ socket }) => {
  const navigate = useNavigate();
  const { canAccessPayments } = usePermissions();
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dniFilter, setDniFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pendiente');
  
  // Estado inicial de agencia con useMemo
  const defaultAgencia = React.useMemo(() => {
    if (user?.role === UserRole.PAYMENTS_USER && user.agencias?.length === 1) {
      return user.agencias[0].agencia;
    }
    return '';
  }, [user]);

  const [selectedAgencia, setSelectedAgencia] = useState(defaultAgencia);

  // Actualizar agencia cuando cambie el usuario
  useEffect(() => {
    if (user?.role === UserRole.PAYMENTS_USER && user.agencias?.length === 1) {
      setSelectedAgencia(user.agencias[0].agencia);
    }
  }, [user]);

  // Validaciones con useMemo
  const validations = React.useMemo(() => ({
    hasPermissions: canAccessPayments(),
    hasAgencias: user?.role === UserRole.PAYMENTS_USER ? (user.agencias?.length ?? 0) > 0 : true,
    isPaymentsUser: user?.role === UserRole.PAYMENTS_USER
  }), [canAccessPayments, user]);

  // Verificar permisos básicos
  if (!validations.hasPermissions) {
    return <Navigate to="/" replace />;
  }

  // Si es usuario de pagos sin agencias, mostrar pantalla de espera
  if (validations.isPaymentsUser && !validations.hasAgencias) {
    return (
      <Layout title="Gestión de Pagos">
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Acceso Pendiente</h2>
            <p className="text-gray-600 mb-4">
              Para comenzar a procesar pagos, el administrador debe asignarle una o más agencias de trabajo.
              Por favor, espere a que se complete esta configuración.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Esta configuración es necesaria para garantizar la correcta gestión de los pagos.
              Si cree que esto es un error, contacte al administrador del sistema.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const esDniValido = (dni: string) => {
    const dniLimpio = dni.trim();
    return dniLimpio.length === 8 && /^\d+$/.test(dniLimpio);
  };

  useEffect(() => {
    fetchInitialPayments();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('paymentUpdated', (updatedPayment: PaymentRecord) => {
        setPayments(prevPayments =>
          prevPayments.map(payment =>
            payment.dni === updatedPayment.dni &&
            payment.fecha === updatedPayment.fecha &&
            payment.hora === updatedPayment.hora
              ? updatedPayment
              : payment
          )
        );
      });
      return () => {
        socket.off('paymentUpdated');
      };
    }
  }, [socket]);

  const fetchInitialPayments = async () => {
    setLoading(true);
    try {
      const response = await fetchPaymentsByStatus('pendiente');
      setPayments(response?.comprobantes || []);
    } catch (error) {
      console.error('Error al cargar pagos iniciales:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDNISearch = async () => {
    if (!esDniValido(dniFilter)) return;
    setLoading(true);
    try {
      const response = await fetchPaymentsByDNI(dniFilter);
      const filteredPayments = response?.comprobantes.filter(
        payment => selectedStatus === 'todos' || payment.estadoGeneral === selectedStatus
      ) || [];
      setPayments(filteredPayments);
      if (filteredPayments.length > 0) {
        toast.success(`Se encontraron ${filteredPayments.length} pagos para el DNI: ${dniFilter}`);
      }
    } catch (error) {
      console.error('Error al buscar por DNI:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value;
    setSelectedStatus(newStatus);
    setLoading(true);
    try {
      if (dniFilter.trim()) {
        const response = await fetchPaymentsByDNI(dniFilter);
        const filteredPayments = response?.comprobantes.filter(
          payment => newStatus === 'todos' || payment.estadoGeneral === newStatus
        ) || [];
        setPayments(filteredPayments);
      } else if (newStatus === 'todos') {
        const allPayments = await Promise.all([
          fetchPaymentsByStatus('pendiente'),
          fetchPaymentsByStatus('parcial'),
          fetchPaymentsByStatus('atendido')
        ]);
        const combinedPayments = allPayments.flatMap(p => p.comprobantes || []);
        setPayments(combinedPayments);
      } else {
        const response = await fetchPaymentsByStatus(newStatus as 'pendiente' | 'parcial' | 'atendido');
        setPayments(response?.comprobantes || []);
      }
    } catch (error) {
      console.error('Error al filtrar por estado:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setDniFilter('');
    setSelectedStatus('pendiente');
    await fetchInitialPayments();
  };

  // const handleUpdatePaymentStatus = async (
  //   payment: PaymentRecord,
  //   estado: 'pendiente' | 'aceptado' | 'rechazado',
  //   indice: number,
  //   motivoRechazo?: string,
  //   agenciaCode?: string,
  //   monto?: string | null,
  //   dni_usuario?: string
  // ) => {
  //   if (!user) {
  //     toast.error('Debe iniciar sesión para procesar pagos');
  //     return;
  //   }

  //   if (user.role === UserRole.PAYMENTS_USER && !selectedAgencia) {
  //     toast.error('Debe seleccionar una agencia antes de procesar pagos');
  //     return;
  //   }

  //   if (!user.email || !user.dni) {
  //     toast.error('Falta información del usuario. Por favor, inicie sesión nuevamente');
  //     return;
  //   }

  //   try {
  //     // Obtener los datos completos de la agencia seleccionada
  //     const agenciaData = user?.agencias?.find(ag => ag.agencia === (agenciaCode || selectedAgencia));

  //     if (!agenciaData && estado === 'aceptado') {
  //       toast.error('No se encontró la información completa de la agencia');
  //       return;
  //     }

  //     console.log('Datos de agencia para enviar:', agenciaData);

  //     const result = await updatePaymentStatus(
  //       payment.dni,
  //       payment.fecha,
  //       payment.hora,
  //       estado,
  //       motivoRechazo,
  //       agenciaData || null,
  //       monto ? parseFloat(monto) : null,
  //       dni_usuario || user?.dni || undefined,
  //       user?.email,
  //       indice
  //     );
      
  //     if (result && !(result as any).error) {
  //       setPayments(prevPayments =>
  //         prevPayments.map(p =>
  //           p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora
  //             ? {
  //                 ...p,
  //                 comprobante: p.comprobante.map((c, idx) =>
  //                   idx === indice ? { ...c, estado, motivo_rechazo: motivoRechazo } : c
  //                 )
  //               }
  //             : p
  //         ).filter(p => selectedStatus === 'todos' || p.estadoGeneral === selectedStatus)
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error al actualizar el estado:', error);
  //     toast.error('No se pudo actualizar el estado.');
  //   }
  // };

  return (
    <Layout title="Gestión de Pagos">
      {validations.isPaymentsUser && !selectedAgencia && validations.hasAgencias ? (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Selección de Agencia</h2>
            <p className="text-gray-600 mb-4">
              Por favor, seleccione la agencia donde procesará los pagos. Esta selección determina
              los pagos que podrá gestionar.
            </p>
            {user?.agencias && user.agencias.length > 0 && (
              <div className="space-y-4">
                <select
                  value={selectedAgencia}
                  onChange={(e) => setSelectedAgencia(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-cyan-500 text-lg"
                >
                  <option value="">Seleccione una agencia</option>
                  {user.agencias
                    .map(ag => ({
                      ...ag,
                      nombre: Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia
                    }))
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((ag) => (
                      <option key={ag.agencia} value={ag.agencia}>
                        {ag.nombre}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{user?.name} {user?.lastName}</h2>
                  <p className="text-sm text-gray-500">
                    {user?.role === UserRole.PAYMENTS_USER ? 'Usuario de Pagos' : user?.role}
                    {user?.dni && <span className="ml-2">- DNI: {user.dni}</span>}
                  </p>
                  {selectedAgencia && (
                    <p className="text-sm text-cyan-600 mt-1">
                      Agencia: {Object.entries(AGENCIAS).find(([_, code]) => code === selectedAgencia)?.[0]}
                    </p>
                  )}
                </div>

                {user?.role === UserRole.PAYMENTS_USER && user?.agencias && user?.agencias.length > 1 && (
                  <button
                    onClick={() => setSelectedAgencia('')}
                    className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                  >
                    Cambiar Agencia
                  </button>
                )}
              </div>
            </div>
              <div className="space-y-6 border-b border-gray-200 pb-6">
                {/* Contenedor principal de filtros */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtros de Búsqueda
                  </h3>

                  {/* Contenedor de filtros organizados */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Búsqueda por DNI */}
                    <div className="space-y-3">
                      <label htmlFor="dni-input" className="block text-sm font-medium text-gray-700">
                        🔍 Buscar por DNI del Cliente
                      </label>
                      <div className="flex gap-3">
                        <div className="flex-1 max-w-xs">
                          <input
                            id="dni-input"
                            type="text"
                            value={dniFilter}
                            onChange={(e) => setDniFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors shadow-sm"
                            placeholder="Ingrese DNI (8 dígitos)"
                            maxLength={8}
                          />
                        </div>
                        <button
                          onClick={handleDNISearch}
                          disabled={!esDniValido(dniFilter)}
                          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm ${
                            !esDniValido(dniFilter)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-cyan-600 text-white hover:bg-cyan-700 hover:shadow-md transform hover:scale-105'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Buscar
                        </button>
                      </div>
                      {dniFilter && !esDniValido(dniFilter) && (
                        <p className="text-xs text-red-500 mt-1">⚠️ El DNI debe tener exactamente 8 dígitos</p>
                      )}
                    </div>

                    {/* Filtro por Estado */}
                    <div className="space-y-3">
                      <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
                        📊 Filtrar por Estado de Pago
                      </label>
                      <div className="relative max-w-xs">
                        <select
                          id="status-select"
                          value={selectedStatus}
                          onChange={handleStatusChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors shadow-sm appearance-none bg-white"
                        >
                          <option value="pendiente">🟡 Pendiente</option>
                          <option value="parcial">🟠 Parcialmente Atendido</option>
                          <option value="atendido">🟢 Atendido</option>
                          <option value="todos">📋 Todos los Estados</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de resultados y acciones */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600 font-medium">
                      {payments.length > 0 ? (
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Mostrando {payments.length} comprobante{payments.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-gray-500">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Sin resultados
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/payments/history')}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-5 py-2.5 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ver Historial
                    </button>
                    <button
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2.5 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>
          </div>

          {loading ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Cargando pagos...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl p-8 text-center">
              <p className="text-gray-600 font-medium">
                {dniFilter ? `No se encontraron comprobantes para el DNI ${dniFilter}` : `No se encontraron comprobantes`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {payments.map((payment) => (
                <PaymentCard
                  key={`${payment.dni}-${payment.fecha}-${payment.hora}`}
                  payment={payment}
                  socket={socket}
                  agencias={user?.role === UserRole.PAYMENTS_USER && user.agencias
                    ? user.agencias.map(ag => ag.agencia)
                    : []}
                  userAgencias={user?.agencias || []}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default PaymentsPage;