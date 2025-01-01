import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PaymentCard } from './components/PaymentCard';
import { motion } from 'framer-motion';
import { getCurrentDate } from './utils/date';
import io from 'socket.io-client';
import { PaymentRecord } from './types';
import { fetchPaymentsByDNI, fetchPaymentsByStatus, fetchPaymentsByStatusAndDate, updatePaymentStatus } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const socket = io(API_BASE_URL);

function App() {
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dniFilter, setDniFilter] = useState('');
  const [showStatusDateModal, setShowStatusDateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());

  useEffect(() => {
    socket.emit('fetchPayments', { fechaInicio: startDate, fechaFin: endDate });

    socket.on('payments', (data: PaymentRecord[]) => {
      setPayments(data);
      setLoading(false);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Error al obtener pagos:', error);
      setLoading(false);
    });

    socket.on('paymentUpdated', (updatedPayment: PaymentRecord) => {
      setPayments(prevPayments =>
        prevPayments.map(p =>
          p.dni === updatedPayment.dni && p.fecha === updatedPayment.fecha && p.hora === updatedPayment.hora
            ? updatedPayment
            : p
        )
      );
    });

    return () => {
      socket.off('payments');
      socket.off('error');
      socket.off('paymentUpdated');
    };
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchPaymentsByDefaultStatus = async () => {
      if (!selectedStatus) return;
      setLoading(true);
      try {
        const data = await fetchPaymentsByStatus(selectedStatus);
        if (data) {
          setPayments(data.comprobantes);
        }
      } catch (error) {
        console.error('Error al obtener pagos por estado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsByDefaultStatus();
  }, [selectedStatus]);

  const handleUpdateStatus = async (payment: PaymentRecord, estado: 'pendiente' | 'aceptado' | 'rechazado') => {
    try {
      await updatePaymentStatus(payment.dni, payment.fecha, payment.hora, estado);
      setPayments(prevPayments =>
        prevPayments.map(p =>
          p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora
            ? { ...p, estado }
            : p
        )
      );
    } catch (error) {
      console.error('Error al actualizar el estado del pago:', error);
    }
  };

  const handleDNIFilter = async () => {
    if (!dniFilter) return;
    setLoading(true);
    try {
      const data = await fetchPaymentsByDNI(dniFilter);
      if (data) {
        const sortedPayments = data.comprobantes.sort((a, b) => 
          new Date(`${b.fecha} ${b.hora}`).getTime() - new Date(`${a.fecha} ${a.hora}`).getTime()
        );
        setPayments(sortedPayments);
      }
    } catch (error) {
      console.error('Error al obtener pagos por DNI:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const status = event.target.value;
    setSelectedStatus(status);
  };

  const handleStatusDateFilter = async () => {
    if (!selectedStatus) return;
    setLoading(true);
    try {
      const data = await fetchPaymentsByStatusAndDate(selectedStatus, selectedDate);
      if (data) {
        setPayments(data.comprobantes);
      }
      setShowStatusDateModal(false);
    } catch (error) {
      console.error('Error al obtener pagos por estado y fecha:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-customLightBlue to-white">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 p-8 rounded-lg shadow-lg">
          <div className="flex items-center w-full max-w-5xl p-8">
            <motion.div
              className="relative w-48 h-48 overflow-hidden"
              style={{
                contain: 'layout',
                willChange: 'transform'
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.2, transition: { duration: 0.2 }}}
            >
              <motion.img
                src="logo_dile.webp"
                alt="Logo DILE"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: 'translateZ(0)',
                  willChange: 'transform'
                }}
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </motion.div>

            <motion.h1
              className="text-white font-bold text-6xl text-center flex-1 ml-8"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 }}}
            >
              Plataforma de Pagos
            </motion.h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DNI Filter */}
            <div className="space-y-2">
              <label htmlFor="dni-input" className="block text-sm font-medium text-gray-700">
                Filtrar por DNI
              </label>
              <div className="flex space-x-2">
                <input
                  id="dni-input"
                  type="text"
                  value={dniFilter}
                  onChange={(e) => setDniFilter(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Ingrese DNI"
                  aria-label="Ingrese DNI para filtrar"
                />
                <button
                  onClick={handleDNIFilter}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700"
                  aria-label="Buscar por DNI"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
                Filtrar por Estado
              </label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={handleStatusFilter}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                aria-label="Seleccione el estado del pago"
              >
                <option value="">Seleccione un estado</option>
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            {/* Status and Date Filter */}
            <div className="space-y-2">
              <label htmlFor="status-date-button" className="block text-sm font-medium text-gray-700">
                Filtrar por Estado y Fecha
              </label>
              <button
                id="status-date-button"
                onClick={() => setShowStatusDateModal(true)}
                className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700"
                aria-label="Abrir filtro por estado y fecha"
              >
                Seleccionar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                Fecha Inicio
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                aria-label="Seleccionar fecha de inicio"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                Fecha Fin
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                aria-label="Seleccionar fecha final"
              />
            </div>
          </div>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Cargando pagos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 font-medium">No hay pagos para mostrar en el rango de fechas seleccionado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map((payment) => (
              <PaymentCard
                key={`${payment.dni}-${payment.fecha}-${payment.hora}`}
                payment={payment}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {showStatusDateModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 id="modal-title" className="text-lg font-medium mb-4">
                Filtrar por Estado y Fecha
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="modal-status-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del Pago
                  </label>
                  <select
                    id="modal-status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    aria-label="Seleccione el estado del pago en el modal"
                  >
                    <option value="">Seleccione un estado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aceptado">Aceptado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="modal-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    id="modal-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    aria-label="Seleccionar fecha para el filtro"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={() => setShowStatusDateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    aria-label="Cancelar filtro"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleStatusDateFilter}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
                    aria-label="Aplicar filtros seleccionados"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center py-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm">Versión 1.0.0</p>
        </div>

        <Toaster position="top-right" />
      </div>
    </div>
  );
}

export default App;