import React from 'react';
import { PaymentCard } from './PaymentCard';
import { PaymentRecord } from '../types';

interface PaymentListProps {
  payments: PaymentRecord[];
  onUpdateStatus: (payment: PaymentRecord, estado: 'pendiente' | 'aceptado' | 'rechazado') => Promise<void>;
}

export const PaymentList: React.FC<PaymentListProps> = ({ payments, onUpdateStatus }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lista de Pagos</h1>
      <div className="mt-4">
        {payments.map((payment) => (
          <PaymentCard
            key={`${payment.dni}-${payment.fecha}-${payment.hora}`}
            payment={payment}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </div>
    </div>
  );
};
