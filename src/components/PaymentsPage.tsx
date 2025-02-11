import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { fetchPaymentsByDNI, fetchPaymentsByStatus, updatePaymentStatus } from '../api';
import { PaymentCard } from './PaymentCard';
import { PaymentRecord } from '../types';
import Layout from './Layout';
import { usePermissions } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface PaymentsPageProps {
  socket: Socket | null;
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ socket }) => {
  const { canAccessPayments } = usePermissions();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dniFilter, setDniFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pendiente');

  // Verificar permisos
  if (!canAccessPayments()) {
    return <Navigate to="/" replace />;
  }

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
      if (response?.comprobantes) {
        setPayments(response.comprobantes);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error al cargar pagos iniciales:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDNISearch = async () => {
    if (!dniFilter.trim()) {
      toast.error('Por favor ingrese un DNI válido');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchPaymentsByDNI(dniFilter);
      if (response?.comprobantes) {
        const filteredPayments = response.comprobantes.filter(
          payment => selectedStatus === 'todos' || payment.estado === selectedStatus
        );
        setPayments(filteredPayments);

        if (filteredPayments.length > 0) {
          toast.success(`Se encontraron ${filteredPayments.length} pagos para el DNI: ${dniFilter}`);
        }
      } else {
        setPayments([]);
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
      let response;
      if (dniFilter.trim()) {
        response = await fetchPaymentsByDNI(dniFilter);
        if (response?.comprobantes) {
          const filteredPayments = response.comprobantes.filter(
            payment => newStatus === 'todos' || payment.estado === newStatus
          );
          setPayments(filteredPayments);
        } else {
          setPayments([]);
        }
      } else {
        if (newStatus === 'todos') {
          const allPayments = await Promise.all([
            fetchPaymentsByStatus('pendiente'),
            fetchPaymentsByStatus('aceptado'),
            fetchPaymentsByStatus('rechazado')
          ]);
          const combinedPayments = allPayments.flatMap(payments => payments.comprobantes || []);
          setPayments(combinedPayments.length > 0 ? combinedPayments : []);
        } else {
          response = await fetchPaymentsByStatus(newStatus);
          if (response?.comprobantes) {
            setPayments(response.comprobantes);
          } else {
            setPayments([]);
          }
        }
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

  const handleUpdatePaymentStatus = async (payment: PaymentRecord, estado: string) => {
    try {
      await updatePaymentStatus(payment.dni, payment.fecha, payment.hora, estado);
      setPayments(prevPayments =>
        prevPayments.filter(p =>
          !(p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora && selectedStatus === 'pendiente')
        ).map(p =>
          p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora
            ? { ...p, estado }
            : p
        )
      );
      toast.success('Estado actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('No se pudo actualizar el estado del pago.');
    }
  };

  return (
    <Layout title="Gestión de Pagos">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="dni-input" className="block text-sm font-medium text-gray-700">
              Buscar por DNI
            </label>
            <div className="flex space-x-2">
              <input
                id="dni-input"
                type="text"
                value={dniFilter}
                onChange={(e) => setDniFilter(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Ingrese DNI"
              />
              <button
                onClick={handleDNISearch}
                className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
              Filtrar por Estado
            </label>
            <select
              id="status-select"
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
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
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
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
            {dniFilter
              ? `No se encontraron comprobantes para el DNI ${dniFilter}${selectedStatus !== 'todos' ? ` con estado ${selectedStatus}` : ''}`
              : `No se encontraron comprobantes${selectedStatus !== 'todos' ? ` con estado ${selectedStatus}` : ''}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {payments.map((payment) => (
            <PaymentCard
              key={`${payment.dni}-${payment.fecha}-${payment.hora}`}
              payment={payment}
              onUpdateStatus={(payment, estado) => handleUpdatePaymentStatus(payment, estado)}
              socket={socket}
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default PaymentsPage;