import React from 'react';
import { PaymentRecord } from '../../types';
import StatusBadge from '../shared/StatusBadge';

interface PaymentCardViewProps {
  payment: PaymentRecord;
  currentPayment: PaymentRecord;
  isLoading: boolean;
  onOpenModal: (e: React.MouseEvent) => void;
}

export const PaymentCardView: React.FC<PaymentCardViewProps> = ({
  payment,
  currentPayment,
  isLoading,
  onOpenModal
}) => {
  const formatDate = (fecha: string, hora: string) => {
    try {
      return new Date(`${fecha} ${hora}`).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return `${fecha} ${hora}`;
    }
  };

  return (
    <div
      className="bg-white/90 rounded-lg shadow-md p-6 mb-4"
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
        <StatusBadge estado={currentPayment.estadoGeneral} />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={onOpenModal}
          disabled={isLoading}
          className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading 
            ? 'Cargando...' 
            : currentPayment.estadoGeneral === 'pendiente' || currentPayment.estadoGeneral === 'parcial' 
              ? 'Aplicar Pago' 
              : 'Ver Comprobante'
          }
        </button>
      </div>
    </div>
  );
};