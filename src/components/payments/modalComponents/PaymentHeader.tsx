import React from 'react';
import { X } from 'lucide-react';
import { PaymentRecord } from '../../../types';

interface PaymentHeaderProps {
  displayedPayment: PaymentRecord;
  totalAmount?: string;
  currentIndex?: number;
  totalPayments?: number;
  onCloseModal: () => void;
}

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

const StatusBadge = ({ estado }: { estado: 'pendiente' | 'aceptado' | 'rechazado' }) => {
  const badgeStyles = {
    aceptado: "flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full",
    rechazado: "flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full",
    pendiente: "flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full"
  };
  
  return (
    <div className={badgeStyles[estado]}>
      <span>{estado === 'aceptado' ? 'Pagado' : estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}</span>
    </div>
  );
};

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  displayedPayment,
  totalAmount,
  currentIndex,
  totalPayments,
  onCloseModal
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{displayedPayment.nombreSocio}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p className="text-gray-600 text-sm">DNI: {displayedPayment.dni}</p>
            <p className="text-gray-600 text-sm">
              Fecha: {formatDate(displayedPayment.fecha, displayedPayment.hora)}
            </p>
            <p className="text-gray-600 text-sm">Pagaré: {displayedPayment.creditoId}</p>
            <p className="text-gray-600 text-sm">Cuota Seleccionada: {displayedPayment.cuotaSeleccionada}</p>
            <p className="text-gray-600 text-sm">Cuotas Vencidas: {displayedPayment.cuotasVencidasCantidad}</p>
            <p className="text-gray-600 text-sm">Total a Pagar: S/ {displayedPayment.cuotasVencidasTotalAPagar}</p>
            {totalAmount && (
              <p className="text-gray-600 text-sm font-semibold">
                Total Acumulado: S/ {totalAmount}
              </p>
            )}
            <div className="flex items-center">
              <span className="font-medium text-gray-700 mr-2">Estado:</span>
              <StatusBadge estado={displayedPayment.estado as 'pendiente' | 'aceptado' | 'rechazado'} />
            </div>
          </div>
        </div>
        <button
          onClick={onCloseModal}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {totalPayments && totalPayments > 1 && (
        <div className="text-sm font-medium text-gray-600 mt-3">
          Mostrando comprobante {currentIndex! + 1} de {totalPayments}
        </div>
      )}
    </div>
  );
};