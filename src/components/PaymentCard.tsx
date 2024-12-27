import React, { useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { PaymentRecord } from '../types';
import { PaymentImage } from './PaymentImage';
import { format } from 'date-fns';

interface PaymentCardProps {
  payment: PaymentRecord;
  onUpdateStatus: (estado: 'pendiente' | 'aceptado' | 'rechazado') => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onUpdateStatus }) => {
  const [showImage, setShowImage] = useState(false);

  const handleDoubleClick = () => {
    setShowImage(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') {
      setShowImage(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {payment.nombre} {payment.apellido}
          </h3>
          <p className="text-gray-600">DNI: {payment.dni}</p>
          <p className="text-gray-600">
            {format(new Date(`${payment.fecha} ${payment.hora}`), 'PPpp')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {payment.estado === 'aceptado' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span>Pagado</span>
            </div>
          ) : payment.estado === 'rechazado' ? (
            <div className="flex items-center text-red-600">
              <Clock className="w-5 h-5 mr-1" />
              <span>Rechazado</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <Clock className="w-5 h-5 mr-1" />
              <span>Pendiente</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowImage(true)}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mt-4"
      >
        Ver Comprobante
      </button>

      {showImage && (
        <div className="mt-4">
          <PaymentImage
            base64Image={payment.comprobantebase_64}
            alt={`Comprobante de ${payment.nombre} ${payment.apellido}`}
          />
          {payment.estado === 'pendiente' && (
            <div className="mt-4">
              <button
                onClick={() => {
                  onUpdateStatus('aceptado');
                  setShowImage(false);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors mr-2"
              >
                Marcar como pagado
              </button>
              <button
                onClick={() => {
                  onUpdateStatus('rechazado');
                  setShowImage(false);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Rechazar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
