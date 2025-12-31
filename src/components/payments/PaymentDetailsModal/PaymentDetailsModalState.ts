import { useState, useEffect } from 'react';
import { PaymentRecord } from '../../../types';
import { VoucherDetail } from './PaymentDetailsModalTypes';
// import { fetchPendingPaymentsByPagare } from '../../../api/paymentsApi';
// import toast from 'react-hot-toast';

// Mapeo para convertir nombres de banco a IDs
const BANCO_NAME_TO_ID: { [key: string]: string } = {
  'BBVA': '1',
  'SCOTIABANK': '2',
  'PLIN - BBVA': '3',
  'PLIN - BANBIF': '4',
  'PLIN - AREQUIPA': '5'
};

// Función para convertir nombre a ID (para mostrar en dropdown)
const getBancoId = (bancoName: string): string => {
  return BANCO_NAME_TO_ID[bancoName] || bancoName;
};

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
  const [paymentType, setPaymentType] = useState<'normal' | 'liquidacion'>('normal');
  const [paymentLimit, setPaymentLimit] = useState<number>(0);
  const [globalBanco, setGlobalBanco] = useState<string>('');

  // Inicializar modalPayments con el comprobante actual
  useEffect(() => {
    setModalPayments([currentPayment]);
    setPaymentIndex(0);
    setImageIndex(0);
  }, [currentPayment]);

  useEffect(() => {
  
    // Mantener solo el pago actual en modalPayments
    setModalPayments([currentPayment]);
    setRelatedPayments([]); // No cargar pagos relacionados
    setLoadingRelated(false);
    
    // Calcular total solo del comprobante actual
    const total = Number(currentPayment.cuotasVencidasTotalAPagar).toFixed(2);
    setTotalAmount(total);
    setMonto(total);

    // Inicializar los detalles del pago actual - PRECARGAR DATOS EXISTENTES
    const details: VoucherDetail[] = currentPayment.comprobantebase_64.map((comp, idx) => {
      // Calcular monto por defecto (división equitativa)
      const defaultMonto = (Number(currentPayment.cuotasVencidasTotalAPagar) / currentPayment.comprobantebase_64.length).toFixed(2);
      
      // Usar monto guardado en BD si existe, sino usar el calculado
      const montoPago = comp.monto_pago ? comp.monto_pago.toFixed(2) : defaultMonto;
      
      return {
        montoPago,
        nroOperacion: comp.nroOperacion || '', // ✅ Precargar si ya existe
        nro_banco: comp.nro_banco || '', // ✅ Precargar si ya existe
        tipoOperacion: comp.tipoOperacion || '', // ✅ Precargar si ya existe
        fecha_voucher: comp.fecha_voucher || new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' }), // ✅ Precargar si ya existe o fecha actual en hora peruana
        estado: comp.estado,
        imageIndex: idx,
        ruta: comp.ruta,
        motivo_rechazo: comp.motivo_rechazo,
        paymentIndex: 0
      };
    });
    setPaymentDetails(details);
    
    // ✅ Precargar banco global si existe en algún comprobante
    const existingBanco = currentPayment.comprobantebase_64.find(comp => comp.banco)?.banco;
    if (existingBanco) {
      const bancoId = getBancoId(existingBanco);
      setGlobalBanco(bancoId);
    }
  }, [currentPayment, setMonto]);

  // 🔧 SOLUCIÓN: Función para manejar cambios de tipo de pago desde PaymentHeader
  const handlePaymentTypeChange = (type: 'normal' | 'liquidacion', maxAmount: number) => {
    setPaymentType(type);
    setPaymentLimit(maxAmount); 
  };

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
    
    // Nota: Los límites se actualizarán automáticamente via handlePaymentTypeChange desde PaymentHeader
    // No necesitamos recalcular aquí porque los valores vienen de procesarInfoPago API
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
    removePayment,
    paymentType,
    setPaymentType,
    paymentLimit,
    setPaymentLimit,
    handlePaymentTypeChange, // ✅ Exportar la función para conectar con PaymentHeader
    globalBanco,
    setGlobalBanco
  };
};