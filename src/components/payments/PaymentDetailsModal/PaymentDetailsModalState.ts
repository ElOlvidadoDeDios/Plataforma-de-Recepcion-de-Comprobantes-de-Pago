import { useState, useEffect } from 'react';
import { PaymentRecord } from '../../../types';
import { VoucherDetail } from './PaymentDetailsModalTypes';
import { fetchPendingPaymentsByPagare } from '../../../api/paymentsApi';
import toast from 'react-hot-toast';

export const usePaymentDetailsState = (
  currentPayment: PaymentRecord,
  monto: string,
  setMonto: (value: string) => void
) => {
  const [activeTab, setActiveTab] = useState<'image' | 'form'>('image');
  const [rejectType, setRejectType] = useState<'partial' | 'total'>('total');
  const [paymentDetails, setPaymentDetails] = useState<VoucherDetail[]>([]);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [totalAmount, setTotalAmount] = useState(monto);
  const [modalPayments, setModalPayments] = useState<PaymentRecord[]>([]);
  const [relatedPayments, setRelatedPayments] = useState<PaymentRecord[]>([]);

  // Inicializar modalPayments con el comprobante actual
  useEffect(() => {
    setModalPayments([currentPayment]);
    setPaymentIndex(0);
    setImageIndex(0);
  }, [currentPayment]);

  useEffect(() => {
    const loadRelatedPayments = async () => {
      if (currentPayment.estadoGeneral === 'pendiente' && currentPayment.creditoId) {
        setLoadingRelated(true);
        try {
          const payments = await fetchPendingPaymentsByPagare(currentPayment.creditoId);
          const filteredPayments = payments
            .filter(p => !(p.dni === currentPayment.dni && p.fecha === currentPayment.fecha && p.hora === currentPayment.hora))
            .sort((a, b) => new Date(a.fecha + ' ' + a.hora).getTime() - new Date(b.fecha + ' ' + b.hora).getTime());
          
          setRelatedPayments(filteredPayments);
          setModalPayments([currentPayment, ...filteredPayments]);

          const details: VoucherDetail[] = [];
          [currentPayment, ...filteredPayments].forEach((payment, paymentIndex) => {
            if (payment.comprobantebase_64 && payment.comprobantebase_64.length > 0) {
              payment.comprobantebase_64.forEach((comp, idx) => {
                details.push({
                  montoPago: (Number(payment.cuotasVencidasTotalAPagar) / payment.comprobantebase_64.length).toFixed(2),
                  nroOperacion: '',
                  tipoOperacion: '',
                  estado: comp.estado,
                  imageIndex: idx,
                  ruta: comp.ruta,
                  motivo_rechazo: comp.motivo_rechazo,
                  paymentIndex
                });
              });
            }
          });
          setPaymentDetails(details);

          const total = [currentPayment, ...filteredPayments]
            .reduce((sum, payment) => sum + Number(payment.cuotasVencidasTotalAPagar), 0)
            .toFixed(2);
          setTotalAmount(total);
          setMonto(total);
        } catch (error) {
          toast.error('Error al cargar comprobantes relacionados');
        } finally {
          setLoadingRelated(false);
        }
      }
    };

    loadRelatedPayments();

    // Inicializar los detalles del pago actual
    const details: VoucherDetail[] = currentPayment.comprobantebase_64.map((comp, idx) => ({
      montoPago: (Number(currentPayment.cuotasVencidasTotalAPagar) / currentPayment.comprobantebase_64.length).toFixed(2),
      nroOperacion: '',
      tipoOperacion: '',
      estado: comp.estado,
      imageIndex: idx,
      ruta: comp.ruta,
      motivo_rechazo: comp.motivo_rechazo,
      paymentIndex: 0
    }));
    setPaymentDetails(details);
  }, [currentPayment, setMonto]);

  const removePayment = (index: number) => {
    if (index === 0) return;
    
    const newPayments = [...modalPayments];
    const removedPayment = newPayments[index];
    newPayments.splice(index, 1);
    setModalPayments(newPayments);
    
    // Actualizar paymentDetails removiendo los detalles del pago eliminado
    // y actualizando los índices de los pagos restantes
    const updatedDetails = paymentDetails.filter(detail => {
      const paymentForDetail = modalPayments[detail.paymentIndex];
      return paymentForDetail !== removedPayment;
    }).map(detail => ({
      ...detail,
      paymentIndex: detail.paymentIndex > index ? detail.paymentIndex - 1 : detail.paymentIndex
    }));
    
    setPaymentDetails(updatedDetails);
    
    if (paymentIndex >= newPayments.length) {
      setPaymentIndex(newPayments.length - 1);
    }

    const total = newPayments
      .reduce((sum, payment) => sum + Number(payment.cuotasVencidasTotalAPagar), 0)
      .toFixed(2);
    setTotalAmount(total);
    setMonto(total);
  };

  return {
    activeTab,
    setActiveTab,
    rejectType,
    setRejectType,
    paymentDetails,
    setPaymentDetails,
    paymentIndex,
    setPaymentIndex,
    imageIndex,
    setImageIndex,
    loadingRelated,
    totalAmount,
    modalPayments,
    relatedPayments,
    removePayment
  };
};