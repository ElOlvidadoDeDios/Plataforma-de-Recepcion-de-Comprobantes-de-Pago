import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { fetchPaymentsByDNI, fetchPaymentsByStatus, updatePaymentStatus } from '../api';
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
        payment => selectedStatus === 'todos' || payment.estado === selectedStatus
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
          payment => newStatus === 'todos' || payment.estado === newStatus
        ) || [];
        setPayments(filteredPayments);
      } else if (newStatus === 'todos') {
        const allPayments = await Promise.all([
          fetchPaymentsByStatus('pendiente'),
          fetchPaymentsByStatus('aceptado'),
          fetchPaymentsByStatus('rechazado')
        ]);
        const combinedPayments = allPayments.flatMap(p => p.comprobantes || []);
        setPayments(combinedPayments);
      } else {
        const response = await fetchPaymentsByStatus(newStatus);
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

  const handleUpdatePaymentStatus = async (
    payment: PaymentRecord,
    estado: 'pendiente' | 'aceptado' | 'rechazado',
    motivo_Rechazo?: string,
    agenciaCode?: string,
    monto?: string | null
  ) => {
    if (user?.role === UserRole.PAYMENTS_USER && !selectedAgencia) {
      toast.error('Debe seleccionar una agencia antes de procesar pagos');
      return;
    }

    try {
      // Obtener los datos completos de la agencia seleccionada
      const agenciaData = user?.agencias?.find(ag => ag.agencia === (agenciaCode || selectedAgencia));

      if (!agenciaData && estado === 'aceptado') {
        toast.error('No se encontró la información completa de la agencia');
        return;
      }

      console.log('Datos de agencia para enviar:', agenciaData);

      const result = await updatePaymentStatus(
        payment.dni,
        payment.fecha,
        payment.hora,
        estado,
        motivo_Rechazo,
        agenciaData || null,
        monto
      );
      
      if (result && !(result as any).error) {
        setPayments(prevPayments =>
          prevPayments.map(p =>
            p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora
              ? { ...p, estado, ...(motivo_Rechazo && { motivo_rechazo: motivo_Rechazo }) }
              : p
          ).filter(p => selectedStatus === 'todos' || p.estado === selectedStatus)
        );
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('No se pudo actualizar el estado.');
    }
  };

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
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-6 pb-4 border-b border-gray-200">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="dni-input" className="block text-sm font-medium text-gray-700">Buscar por DNI</label>
                <div className="flex space-x-2">
                  <input
                    id="dni-input"
                    type="text"
                    value={dniFilter}
                    onChange={(e) => setDniFilter(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ingrese DNI"
                  />
                  <button
                    onClick={handleDNISearch}
                    disabled={!esDniValido(dniFilter)}
                    className={`bg-cyan-600 text-white px-4 py-2 rounded-md ${!esDniValido(dniFilter) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-700'}`}
                  >
                    Buscar
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">Filtrar por Estado</label>
                <select
                  id="status-select"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aceptado">Aceptado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Cargando pagos...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
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
                  onUpdateStatus={handleUpdatePaymentStatus}
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