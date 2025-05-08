import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, X } from 'lucide-react';
import { PaymentRecord, AGENCIAS, AgenciaCaja } from '../types';
import { PaymentImage } from './PaymentImage';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPaymentByDNIAndTime } from '../api';
import toast from 'react-hot-toast';

interface PaymentCardProps {
  payment: PaymentRecord;
  onUpdateStatus: (
    payment: PaymentRecord,
    estado: 'pendiente' | 'aceptado' | 'rechazado',
    motivoRechazo?: string,
    agenciaCode?: string,
    monto?: string | null
  ) => Promise<void>;
  socket: any;
  agencias?: string[];
  userAgencias?: AgenciaCaja[];
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onUpdateStatus,
  socket,
  agencias = [],
}) => {
  const [showImage, setShowImage] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(payment);
  const [selectedRejectReason, setSelectedRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [monto, setMonto] = useState(payment.cuotasVencidasTotalAPagar);
  // Usar la primera agencia disponible, que ya fue seleccionada en la pantalla inicial
  const [agenciaCode] = useState(agencias[0] || '');

  const rejectReasons = [
    "Imagen no legible",
    "Comprobante ya utilizado",
    "Imagen incorrecta o no válida",
    "Otro (especificar)"
  ];

  const handlePaymentUpdated = useCallback((updatedPayment: PaymentRecord) => {
    if (
      updatedPayment.dni === currentPayment.dni &&
      updatedPayment.fecha === currentPayment.fecha &&
      updatedPayment.hora === currentPayment.hora
    ) {
      setCurrentPayment(updatedPayment);
    }
  }, [currentPayment]);

  useEffect(() => {
    if (socket) {
      socket.on('paymentUpdated', handlePaymentUpdated);
      return () => {
        socket.off('paymentUpdated', handlePaymentUpdated);
      };
    }
  }, [socket, handlePaymentUpdated]);

  const handleOpenModal = async () => {
    setIsLoading(true);
    setShowImage(true);
    try {
      const updatedPayment = await fetchPaymentByDNIAndTime(currentPayment.dni, currentPayment.fecha, currentPayment.hora);
      if (updatedPayment) setCurrentPayment(updatedPayment);
    } catch (error) {
      toast.error('No se pudo actualizar el comprobante.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowImage(false);
  };

  const handleReject = () => {
    setShowRejectModal(true);
    setShowImage(false);
  };

  const handleConfirmReject = async () => {
    const finalReason = selectedRejectReason === "Otro (especificar)" ? customReason.trim() : selectedRejectReason.trim();
    if (!finalReason) {
      toast.error("Debe especificar un motivo de rechazo");
      return;
    }
    await updateStatus('rechazado', finalReason);
  };

  const updateStatus = async (estado: 'pendiente' | 'aceptado' | 'rechazado', motivoRechazo?: string) => {
    setIsLoading(true);
    try {
      // Al aceptar: envía monto, al rechazar: envía null como monto
      const montoAEnviar = estado === 'aceptado' ? monto : null;
      await onUpdateStatus(currentPayment, estado, motivoRechazo, agenciaCode, montoAEnviar);
      setShowImage(false);
      setShowRejectModal(false);
      setSelectedRejectReason("");
      setCustomReason("");
      // No mostrar mensaje de éxito aquí, el mensaje vendrá del backend
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error(`Error al actualizar el estado a ${estado}`);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusBadge = () => {
    const badgeStyles = {
      aceptado: "flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full",
      rechazado: "flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full",
      pendiente: "flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full"
    };
    const estado = currentPayment.estado as 'pendiente' | 'aceptado' | 'rechazado';
    return (
      <div className={badgeStyles[estado]}>
        {estado === 'aceptado' ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
        <span>{estado === 'aceptado' ? 'Pagado' : estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}</span>
      </div>
    );
  };

  const formatDate = (fecha: string, hora: string) => {
    try {
      return format(new Date(`${fecha} ${hora}`), 'PPpp');
    } catch (error) {
      console.error('Error formatting date:', error);
      return `${fecha} ${hora}`;
    }
  };

  const agenciaSeleccionada = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaCode)?.[0] || agenciaCode;

  return (
    <div>
      <div
        className="bg-white rounded-lg shadow-md p-6 mb-4"
        data-payment-id={`${payment.dni}-${payment.fecha}-${payment.hora}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{currentPayment.nombreSocio}</h3>
            <p className="text-gray-600">DNI: {currentPayment.dni}</p>
            <p className="text-gray-600">{formatDate(currentPayment.fecha, currentPayment.hora)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handleOpenModal}
            disabled={isLoading}
            className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Cargando...' : 'Ver Comprobante'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-h-[90vh] w-full max-w-3xl relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{currentPayment.nombreSocio}</h3>
                    <div className="space-y-1">
                      <p className="text-gray-600 text-sm">DNI: {currentPayment.dni}</p>
                      <p className="text-gray-600 text-sm">Fecha: {formatDate(currentPayment.fecha, currentPayment.hora)}</p>
                      <p className="text-gray-600 text-sm">Pagaré: {currentPayment.creditoId}</p>
                      <p className="text-gray-600 text-sm">Cuota Seleccionada: {currentPayment.cuotaSeleccionada}</p>
                      <p className="text-gray-600 text-sm">Cuotas Vencidas: {currentPayment.cuotasVencidasCantidad}</p>
                      <p className="text-gray-600 text-sm">Total a Pagar: S/ {currentPayment.cuotasVencidasTotalAPagar}</p>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Estado:</span>
                        <StatusBadge />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="flex justify-center items-center min-h-[200px]">
                  {isLoading ? (
                    <div className="text-gray-600">Cargando imagen...</div>
                  ) : (
                    <PaymentImage imageSource={currentPayment.comprobantebase_64} alt={`Comprobante de ${currentPayment.nombreSocio}`} />
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-gray-200">
                {currentPayment.estado === 'pendiente' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Monto a Pagar:
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-1 w-32 focus:ring-2 focus:ring-cyan-500"
                        placeholder="Monto"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Agencia: {agenciaSeleccionada}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStatus('aceptado')}
                        className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Procesando...' : 'Aceptar'}
                      </button>
                      <button
                        onClick={handleReject}
                        className={`bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Procesando...' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    Este pago ya ha sido {currentPayment.estado === 'aceptado' ? 'aceptado' : 'rechazado'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Motivo de Rechazo</h3>
              <div className="space-y-4">
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-cyan-500"
                  disabled={isLoading}
                >
                  <option value="">Seleccione un motivo</option>
                  {rejectReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                {selectedRejectReason === "Otro (especificar)" && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Especifique el motivo del rechazo"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-cyan-500"
                    rows={3}
                    disabled={isLoading}
                  />
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className={`px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};