import { useState, useCallback } from 'react';
import { PaymentRecord } from '../types';
import { fetchPayments, updatePaymentStatus } from '../api';
import { getErrorMessage } from '../utils/error';
import { toast } from 'react-hot-toast';

export const usePayments = (startDate: string, endDate: string) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const paymentsData = await fetchPayments(startDate, endDate);
      setPayments(paymentsData.comprobantes);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleUpdateStatus = async (payment: PaymentRecord, nuevoEstado: string) => {
    try {
      const { dni, fecha, hora } = payment;
      const updatedPayment = await updatePaymentStatus(dni, fecha, hora, nuevoEstado);
      setPayments(prevPayments =>
        prevPayments.map(p => (p.dni === updatedPayment.dni && p.fecha === updatedPayment.fecha && p.hora === updatedPayment.hora ? updatedPayment : p))
      );
      toast.success('Estado de pago actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return {
    payments,
    loading,
    fetchData,
    handleUpdateStatus
  };
};
