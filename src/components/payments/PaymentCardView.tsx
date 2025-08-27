import React from 'react';
import { PaymentRecord } from '../../types';
import StatusBadge from '../shared/StatusBadge';

interface PaymentCardViewProps {
  payment: PaymentRecord;
  currentPayment: PaymentRecord;
  isLoading: boolean;
  onOpenModal: (e: React.MouseEvent) => void;
  isReadOnlyMode?: boolean;
}

export const PaymentCardView: React.FC<PaymentCardViewProps> = ({
  payment,
  currentPayment,
  isLoading,
  onOpenModal,
  isReadOnlyMode = false
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
          className={`${
            isReadOnlyMode
              ? 'bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600'
              : 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading
            ? 'Cargando...'
            : isReadOnlyMode
              ? 'Ver Detalles'
              : currentPayment.estadoGeneral === 'pendiente' || currentPayment.estadoGeneral === 'parcial'
                ? 'Aplicar Pago'
                : 'Ver Comprobante'
          }
        </button>
        {/* 🔧 Indicador visual de modo solo lectura */}
        {isReadOnlyMode && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Solo Lectura
          </span>
        )}
      </div>
    </div>
  );
};