import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { PaymentRecord } from '../../types';

interface PaymentCardViewProps {
  payment: PaymentRecord;
  currentPayment: PaymentRecord;
  isLoading: boolean;
  onOpenModal: (e: React.MouseEvent) => void;
}

const StatusBadge = ({ estado }: { estado: 'pendiente' | 'aceptado' | 'rechazado' }) => {
  const badgeStyles = {
    aceptado: "flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full",
    rechazado: "flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full",
    pendiente: "flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full"
  };

  return (
    <div className={badgeStyles[estado]}>
      {estado === 'aceptado' ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
      <span>{estado === 'aceptado' ? 'Pagado' : estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}</span>
    </div>
  );
};

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
        <StatusBadge estado={currentPayment.estado as 'pendiente' | 'aceptado' | 'rechazado'} />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={onOpenModal}
          disabled={isLoading}
          className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Cargando...' : currentPayment.estado === 'pendiente' ? 'Aplicar Pago' : 'Ver Comprobante'}
        </button>
      </div>
    </div>
  );
};