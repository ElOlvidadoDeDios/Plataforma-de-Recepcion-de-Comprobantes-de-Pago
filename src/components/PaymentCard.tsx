import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, X } from 'lucide-react';
import { PaymentRecord } from '../types';
import { PaymentImage } from './PaymentImage';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPaymentByDNIAndTime } from '../api';
import toast from 'react-hot-toast';

interface PaymentCardProps {
  payment: PaymentRecord;
  onUpdateStatus: (payment: PaymentRecord, estado: 'pendiente' | 'aceptado' | 'rechazado') => Promise<void>;
  socket: any;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onUpdateStatus, socket }) => {
  const [showImage, setShowImage] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(payment);

  useEffect(() => {
    if (socket) {
      const handlePaymentUpdated = (updatedPayment: PaymentRecord) => {
        if (
          updatedPayment.dni === currentPayment.dni &&
          updatedPayment.fecha === currentPayment.fecha &&
          updatedPayment.hora === currentPayment.hora
        ) {
          setCurrentPayment(updatedPayment);
        }
      };

      socket.on('paymentUpdated', handlePaymentUpdated);

      return () => {
        socket.off('paymentUpdated', handlePaymentUpdated);
      };
    }
  }, [socket, currentPayment]);

  const handleOpenModal = async () => {
    setShowImage(true);

    try {
      const updatedPayment = await fetchPaymentByDNIAndTime(
        currentPayment.dni,
        currentPayment.fecha,
        currentPayment.hora
      );

      if (updatedPayment) {
        setCurrentPayment(updatedPayment);
      }
    } catch (error) {
      console.error('Error al obtener el estado más reciente del comprobante:', error);
      toast.error('No se pudo obtener el estado más reciente del comprobante.');
    }
  };

  const handleCloseModal = () => {
    setShowImage(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setShowImage(false);
    }
  };

  const updateStatus = async (estado: 'pendiente' | 'aceptado' | 'rechazado') => {
    await onUpdateStatus(currentPayment, estado);
    setShowImage(false);
  };

  const StatusBadge = () => {
    if (currentPayment.estado === 'aceptado') {
      return (
        <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span>Pagado</span>
        </div>
      );
    } else if (currentPayment.estado === 'rechazado') {
      return (
        <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full">
          <Clock className="w-4 h-4 mr-1" />
          <span>Rechazado</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
          <Clock className="w-4 h-4 mr-1" />
          <span>Pendiente</span>
        </div>
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {currentPayment.nombre} {currentPayment.apellido}
            </h3>
            <p className="text-gray-600">DNI: {currentPayment.dni}</p>
            <p className="text-gray-600">
              {format(new Date(`${currentPayment.fecha} ${currentPayment.hora}`), 'PPpp')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge />
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mt-4"
        >
          Ver Comprobante
        </button>
      </div>

      <AnimatePresence>
        {showImage && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg max-h-[90vh] w-full max-w-3xl relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {currentPayment.nombre} {currentPayment.apellido}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-gray-600 text-sm flex items-center">
                        <span className="font-medium text-gray-700 mr-2">DNI:</span>
                        {currentPayment.dni}
                      </p>
                      <p className="text-gray-600 text-sm flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Fecha:</span>
                        {format(new Date(`${currentPayment.fecha} ${currentPayment.hora}`), 'PPpp')}
                      </p>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Estado:</span>
                        <StatusBadge />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="flex justify-center items-center min-h-[200px]">
                  <PaymentImage
                    base64Image={currentPayment.comprobantebase_64}
                    alt={`Comprobante de ${currentPayment.nombre} ${currentPayment.apellido}`}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200">
                {currentPayment.estado === 'pendiente' ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => updateStatus('aceptado')}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => updateStatus('rechazado')}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Rechazar
                    </button>
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
    </>
  );
};
