import { PaymentRecord } from '../../../types';
import { VoucherDetail } from './PaymentDetailsModalTypes';
import { procesarComprobantesMasivo } from '../../../api/paymentsApi';
import toast from 'react-hot-toast';

interface PaymentHandlerProps {
  displayedPayment: PaymentRecord;
  modalPayments: PaymentRecord[];
  paymentDetails: VoucherDetail[];
  setPaymentDetails: (details: VoucherDetail[]) => void;
  imageIndex: number;
  paymentIndex: number;
  rejectType: 'partial' | 'total';
  selectedRejectReason: string;
  customReason: string;
  agenciaCode: string;
  totalAmount: string;
  userData: {
    agencias?: { cod_caja: string; user_caja: string }[];
    email?: string;
    dni?: string;
  } | null;
  paymentType?: 'normal' | 'liquidacion';
  paymentLimit?: number;
}

export const handleUpdateStatus = async (
  props: PaymentHandlerProps
) => {
  const {
    displayedPayment,
    modalPayments,
    paymentDetails,
    setPaymentDetails,
    imageIndex,
    paymentIndex,
    rejectType,
    selectedRejectReason,
    customReason,
    agenciaCode,
    totalAmount,
    userData
  } = props;

  const finalReason = selectedRejectReason === "Otro (especificar)"
    ? customReason.trim()
    : selectedRejectReason.trim();

  // Validar estado general del comprobante
  if (!['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral)) {
    toast.error('Este comprobante ya ha sido completamente procesado');
    return;
  }

  if (rejectType === 'total') {
    // Filtrar los paymentDetails solo para los pagos que están en modalPayments
    const activePaymentDetails = paymentDetails.filter(detail => {
      const payment = modalPayments[detail.paymentIndex];
      return payment !== undefined;
    });

    // Verificar que todos los campos estén completos solo para los vouchers activos
    const pendingVouchers = activePaymentDetails.filter(detail => detail.estado === 'pendiente');
    const incompleteVouchers = pendingVouchers.filter(
      voucher => !voucher.montoPago || !voucher.nroOperacion || !voucher.tipoOperacion
    );

    if (incompleteVouchers.length > 0) {
      toast.error('Debe completar los datos de todos los comprobantes pendientes');
      return;
    }

    const requestData = {
      montoTotal: '0',
      userData: {
        agencia: agenciaCode,
        cod_caja: userData?.agencias?.[0]?.cod_caja || '',
        user_caja: userData?.agencias?.[0]?.user_caja || '',
        email: userData?.email || '',
        dni_usuario: userData?.dni || '',
      },
      vouchers: modalPayments.map(payment => ({
        identificacion: {
          creditoId: payment.creditoId || '',
          dni: payment.dni,
          fecha: payment.fecha,
          hora: payment.hora,
          estadoGeneral: 'atendido',
        },
        detalles: payment.comprobantebase_64.map((comp, idx) => {
          // Buscar el detalle correspondiente
          const detail = paymentDetails.find(d => 
            d.paymentIndex === modalPayments.indexOf(payment) && 
            d.imageIndex === idx &&
            d.ruta === comp.ruta
          );

          if (!detail) return null;

          return {
            indice: idx,
            montoPago: '0',
            nroOperacion: detail.nroOperacion || '',
            tipoOperacion: detail.tipoOperacion || '',
            estado: 'rechazado',
            _id: comp._id || '',
            motivo_rechazo: finalReason,
          };
        }).filter((d): d is NonNullable<typeof d> => d !== null)
      }))
    };

    // Actualizar solo los detalles de los pagos que están en modalPayments
    const updatedDetails = paymentDetails.map(detail => {
      if (modalPayments[detail.paymentIndex]) {
        return {
          ...detail,
          estado: 'rechazado' as const,
          motivo_rechazo: finalReason,
          montoPago: '0'
        };
      }
      return detail;
    });

    setPaymentDetails(updatedDetails);
    
    console.log('=== RECHAZO TOTAL ===');
    console.log('Datos completos a enviar:', JSON.stringify(requestData, null, 2));
    console.log('======================');
    
    try {
      await procesarComprobantesMasivo(requestData);
      toast.success('Comprobantes rechazados exitosamente');
    } catch (error: any) {
      console.error('Error:', error);
      
      // Extraer mensaje específico del error
      let errorMessage = 'Error al procesar el rechazo';
      
      if (error?.response?.data?.message) {
        // Error del backend con mensaje específico
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        // Error con mensaje directo
        errorMessage = error.message;
      }
      
      // Mostrar mensaje específico en el toast
      toast.error(errorMessage);
    }
    return;
  }

  // Rechazo parcial
  const selectedVoucher = paymentDetails.find(v =>
    v.imageIndex === imageIndex &&
    v.paymentIndex === paymentIndex &&
    displayedPayment.comprobantebase_64[imageIndex]?.ruta === v.ruta
  );

  if (!selectedVoucher) {
    toast.error('No se encontró el voucher seleccionado');
    return;
  }

  if (selectedVoucher.estado !== 'pendiente') {
    toast.error('Este comprobante ya ha sido procesado');
    return;
  }

  if (!selectedVoucher.montoPago || !selectedVoucher.nroOperacion || !selectedVoucher.tipoOperacion) {
    toast.error('Debe completar todos los datos del comprobante seleccionado');
    return;
  }

  const requestData = {
    montoTotal: totalAmount,
    userData: {
      agencia: agenciaCode,
      cod_caja: userData?.agencias?.[0]?.cod_caja || '',
      user_caja: userData?.agencias?.[0]?.user_caja || '',
      email: userData?.email || '',
      dni_usuario: userData?.dni || '',
    },
    vouchers: modalPayments.map(payment => {
      const isCurrentPayment = payment === displayedPayment;
      const voucherDetails = payment.comprobantebase_64.map((comp, idx) => {
        const detail = paymentDetails.find(
          d => d.imageIndex === idx && 
              d.paymentIndex === modalPayments.indexOf(payment) && 
              d.ruta === comp.ruta
        );

        if (!detail) return null;

        // Solo modificar el voucher seleccionado en rechazo parcial
        const shouldReject = isCurrentPayment && idx === imageIndex;
        return {
          indice: idx,
          montoPago: shouldReject ? '0' : detail.montoPago,
          nroOperacion: detail.nroOperacion || '',
          tipoOperacion: detail.tipoOperacion || '',
          estado: shouldReject ? 'rechazado' as const : detail.estado,
          _id: comp._id || '',
          motivo_rechazo: shouldReject ? finalReason : detail.motivo_rechazo,
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null);

      // Determinar estado general del pago
      const hasRejected = voucherDetails.some(d => d.estado === 'rechazado');
      const hasPending = voucherDetails.some(d => d.estado === 'pendiente');
      const estadoGeneral = hasRejected && hasPending ? 'parcial'
        : hasRejected ? 'atendido'
        : 'pendiente';

      return {
        identificacion: {
          creditoId: payment.creditoId || '',
          dni: payment.dni,
          fecha: payment.fecha,
          hora: payment.hora,
          estadoGeneral,
        },
        detalles: voucherDetails,
      };
    }),
  };

  const updatedDetails = paymentDetails.map(detail => {
    if (detail === selectedVoucher) {
      return {
        ...detail,
        estado: 'rechazado' as const,
        motivo_rechazo: finalReason,
        montoPago: '0'
      };
    }
    return detail;
  });

  setPaymentDetails(updatedDetails);
  
  console.log('=== RECHAZO PARCIAL ===');
  console.log('Datos completos a enviar:', JSON.stringify(requestData, null, 2));
  console.log('========================');
  
  try {
    await procesarComprobantesMasivo(requestData);
    toast.success('Comprobante rechazado exitosamente');
  } catch (error: any) {
    console.error('Error:', error);
    
    // Extraer mensaje específico del error
    let errorMessage = 'Error al procesar el rechazo';
    
    if (error?.response?.data?.message) {
      // Error del backend con mensaje específico
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      // Error con mensaje directo
      errorMessage = error.message;
    }
    
    // Mostrar mensaje específico en el toast
    toast.error(errorMessage);
  }
};

export const handleAcceptStatus = async (
  props: PaymentHandlerProps
): Promise<string | null> => {
  const {
    displayedPayment,
    modalPayments,
    paymentDetails,
    setPaymentDetails,
    agenciaCode,
    userData,
    paymentType,
    paymentLimit
  } = props;

  // Validar estado general del comprobante
  if (!['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral)) {
    return 'Este comprobante ya ha sido completamente procesado';
  }

  // Filtrar los paymentDetails solo para los pagos que están en modalPayments
  const activePaymentDetails = paymentDetails.filter(detail => {
    const payment = modalPayments[detail.paymentIndex];
    return payment !== undefined;
  });

  // Verificar que todos los campos estén completos solo para los vouchers activos
  const pendingVouchers = activePaymentDetails.filter(detail => detail.estado === 'pendiente');
  const incompleteVouchers = pendingVouchers.filter(
    voucher => !voucher.montoPago || !voucher.nroOperacion || !voucher.tipoOperacion
  );

  if (incompleteVouchers.length > 0) {
    return 'Debe completar los datos de todos los comprobantes pendientes';
  }

  // Calcular el monto total de todos los vouchers pendientes
  const totalMonto = pendingVouchers.reduce((sum, voucher) => {
    const monto = parseFloat(voucher.montoPago) || 0;
    return sum + monto;
  }, 0);

  // VALIDAR LÍMITES SEGÚN EL TIPO DE PAGO
  if (paymentType && paymentLimit && paymentLimit > 0) {
    if (paymentType === 'normal' && totalMonto > paymentLimit) {
      return `El monto total (S/ ${totalMonto.toFixed(2)}) excede el máximo permitido para Pago Normal (S/ ${paymentLimit.toFixed(2)})`;
    } else if (paymentType === 'liquidacion' && Math.abs(totalMonto - paymentLimit) > 0.01) {
      return `Para Liquidación Total, el monto debe ser exactamente S/ ${paymentLimit.toFixed(2)}, pero se ingresó S/ ${totalMonto.toFixed(2)}`;
    }
  }

  const requestData = {
    montoTotal: totalMonto.toString(),
    userData: {
      agencia: agenciaCode,
      cod_caja: userData?.agencias?.[0]?.cod_caja || '',
      user_caja: userData?.agencias?.[0]?.user_caja || '',
      email: userData?.email || '',
      dni_usuario: userData?.dni || '',
    },
    vouchers: modalPayments.map(payment => ({
      identificacion: {
        creditoId: payment.creditoId || '',
        dni: payment.dni,
        fecha: payment.fecha,
        hora: payment.hora,
        estadoGeneral: 'atendido',
      },
      detalles: payment.comprobantebase_64.map((comp, idx) => {
        // Buscar el detalle correspondiente
        const detail = paymentDetails.find(d =>
          d.paymentIndex === modalPayments.indexOf(payment) &&
          d.imageIndex === idx &&
          d.ruta === comp.ruta
        );

        if (!detail) return null;

        return {
          indice: idx,
          montoPago: detail.montoPago || '0',
          nroOperacion: detail.nroOperacion || '',
          tipoOperacion: detail.tipoOperacion || '',
          estado: detail.estado === 'pendiente' ? 'aceptado' : detail.estado,
          _id: comp._id || '',
          motivo_rechazo: detail.estado === 'pendiente' ? '' : detail.motivo_rechazo,
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null)
    }))
  };

  // Actualizar solo los detalles de los pagos que están en modalPayments
  const updatedDetails = paymentDetails.map(detail => {
    if (modalPayments[detail.paymentIndex] && detail.estado === 'pendiente') {
      return {
        ...detail,
        estado: 'aceptado' as const,
        motivo_rechazo: ''
      };
    }
    return detail;
  });

  setPaymentDetails(updatedDetails);
  
  console.log('=== ACEPTACIÓN ===');
  console.log('Datos completos a enviar:', JSON.stringify(requestData, null, 2));
  console.log('==================');
  
  try {
    await procesarComprobantesMasivo(requestData);
    toast.success('Comprobantes aceptados exitosamente');
  } catch (error: any) {
    console.error('Error completo:', error);
    console.error('Error response:', error?.response);
    console.error('Error response data:', error?.response?.data);
    
    // Extraer mensaje específico del error - MÁS OPCIONES
    let errorMessage = 'Error al procesar la aceptación';
    
    if (error?.response?.data?.message) {
      // Error del backend con mensaje específico (formato estándar)
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.error) {
      // Error del backend con campo 'error'
      errorMessage = error.response.data.error;
    } else if (error?.response?.data) {
      // Si data es un string directamente
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      }
    } else if (error?.message) {
      // Error con mensaje directo
      errorMessage = error.message;
    }
    
    console.log('Mensaje final a mostrar:', errorMessage);
    
    // Mostrar mensaje específico en el toast
    toast.error(errorMessage);
    throw error;
  }
  return null;
};