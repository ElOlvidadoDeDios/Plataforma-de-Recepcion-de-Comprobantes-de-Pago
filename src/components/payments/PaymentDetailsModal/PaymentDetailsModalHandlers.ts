import { PaymentRecord } from '../../../types';
import { VoucherDetail } from './PaymentDetailsModalTypes';
import { procesarComprobantesMasivo } from '../../../api/paymentsApi';
import toast from 'react-hot-toast';

// Función utilitaria para extraer mensajes de error más específicos de la API
const extractDetailedErrorMessage = (error: any): string => {
  // Prioridad 1: Buscar en details.DETALLES[].message (más específico)
  if (error?.response?.data?.details?.DETALLES && Array.isArray(error.response.data.details.DETALLES)) {
    const detalles = error.response.data.details.DETALLES;
    if (detalles.length > 0 && detalles[0]?.message) {
      return detalles[0].message; // "COD_OPERACION: 421578 YA EXISTE"
    }
  }

  // Prioridad 2: Buscar en response.data.error (error específico)
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Prioridad 3: Buscar en response.data.message (mensaje general)
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Prioridad 4: Si data es un string directamente
  if (error?.response?.data && typeof error.response.data === 'string') {
    return error.response.data;
  }

  // Prioridad 5: Error con mensaje directo
  if (error?.message) {
    return error.message;
  }

  // Fallback por defecto
  return 'Error desconocido al procesar la solicitud';
};

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
  userData: {
    agencias?: { cod_caja: string; user_caja: string }[];
    email?: string;
    dni?: string;
  } | null;
  paymentType?: 'normal' | 'liquidacion';
  paymentLimit?: number;
  globalBanco?: string;
}

export const handleUpdateStatus = async (
  props: PaymentHandlerProps
): Promise<string | null> => {
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
    userData,
    globalBanco
  } = props;

  const finalReason = selectedRejectReason === "Otro (especificar)"
    ? customReason.trim()
    : selectedRejectReason.trim();

  // Validar estado general del comprobante
  if (!['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral)) {
    return 'Este comprobante ya ha sido completamente procesado';
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
      return 'Debe completar los datos de todos los comprobantes pendientes';
    }

    // VALIDAR BANCO OBLIGATORIO
    if (!globalBanco || globalBanco.trim() === '') {
      return 'Debe seleccionar un banco antes de procesar el rechazo';
    }

    // VALIDAR DATOS OBLIGATORIOS ANTES DE ENVIAR AL BACKEND (RECHAZO TOTAL)
    if (!userData?.agencias || userData.agencias.length === 0) {
      return 'Su usuario no tiene agencias asignadas. Contacte al administrador para configurar su acceso.';
    }

    if (!agenciaCode || agenciaCode.trim() === '') {
      return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
    }

    const codCaja = userData?.agencias?.[0]?.cod_caja || '';
    const userCaja = userData?.agencias?.[0]?.user_caja || '';

    if (!codCaja || codCaja.trim() === '') {
      return 'Falta información de código de caja. Contacte al administrador para configurar su agencia correctamente.';
    }

    if (!userCaja || userCaja.trim() === '') {
      return 'Falta información de usuario de caja. Contacte al administrador para configurar su agencia correctamente.';
    }

    if (!userData?.email || userData.email.trim() === '') {
      return 'Falta información del usuario (email). Inicie sesión nuevamente.';
    }

    if (!userData?.dni || userData.dni.trim() === '') {
      return 'Falta información del usuario (DNI). Inicie sesión nuevamente.';
    }

    const requestData = {
      montoTotal: '0',
      tipo_pago: 'rechazo_total', // Para rechazo total, usar tipo específico
      userData: {
        agencia: agenciaCode,
        cod_caja: codCaja,
        user_caja: userCaja,
        email: userData.email,
        dni_usuario: userData.dni,
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
            nro_banco: detail.nro_banco || '',
            banco: globalBanco || '', // Usar banco global
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
    
    try {
      await procesarComprobantesMasivo(requestData);
      toast.success('Comprobantes rechazados exitosamente');
      
      // Cerrar modal después del éxito - usar setTimeout para permitir que se complete el toast
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('closePaymentModal'));
      }, 1000);
    } catch (error: any) {
      // Usar la nueva función para extraer mensaje específico del error
      const errorMessage = extractDetailedErrorMessage(error);
      
      // Mostrar mensaje específico en el toast
      toast.error(errorMessage);
    }
    return null;
  }

  // Rechazo parcial
  const selectedVoucher = paymentDetails.find(v =>
    v.imageIndex === imageIndex &&
    v.paymentIndex === paymentIndex &&
    displayedPayment.comprobantebase_64[imageIndex]?.ruta === v.ruta
  );

  if (!selectedVoucher) {
    return 'No se encontró el voucher seleccionado';
  }

  if (selectedVoucher.estado !== 'pendiente') {
    return 'Este comprobante ya ha sido procesado';
  }

  if (!selectedVoucher.montoPago || !selectedVoucher.nroOperacion || !selectedVoucher.tipoOperacion) {
    return 'Debe completar todos los datos del comprobante seleccionado';
  }

  // VALIDAR BANCO OBLIGATORIO
  if (!globalBanco || globalBanco.trim() === '') {
    return 'Debe seleccionar un banco antes de procesar el pago';
  }

  // VALIDAR DATOS OBLIGATORIOS ANTES DE ENVIAR AL BACKEND (RECHAZO PARCIAL)
  if (!userData?.agencias || userData.agencias.length === 0) {
    return 'Su usuario no tiene agencias asignadas. Contacte al administrador para configurar su acceso.';
  }

  if (!agenciaCode || agenciaCode.trim() === '') {
    return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
  }

  const codCaja = userData?.agencias?.[0]?.cod_caja || '';
  const userCaja = userData?.agencias?.[0]?.user_caja || '';

  if (!codCaja || codCaja.trim() === '') {
    return 'Falta información de código de caja. Contacte al administrador para configurar su agencia correctamente.';
  }

  if (!userCaja || userCaja.trim() === '') {
    return 'Falta información de usuario de caja. Contacte al administrador para configurar su agencia correctamente.';
  }

  if (!userData?.email || userData.email.trim() === '') {
    return 'Falta información del usuario (email). Inicie sesión nuevamente.';
  }

  if (!userData?.dni || userData.dni.trim() === '') {
    return 'Falta información del usuario (DNI). Inicie sesión nuevamente.';
  }

  const requestData = {
    montoTotal: selectedVoucher.montoPago, // Solo el monto del voucher seleccionado para rechazo parcial
    tipo_pago: 'rechazo_parcial', // Para rechazo parcial, usar tipo específico
    userData: {
      agencia: agenciaCode,
      cod_caja: codCaja,
      user_caja: userCaja,
      email: userData.email,
      dni_usuario: userData.dni,
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
          montoPago: detail.montoPago || '0',
          nroOperacion: detail.nroOperacion || '',
          tipoOperacion: detail.tipoOperacion || '',
          nro_banco: detail.nro_banco || '',
          banco: globalBanco || '', // Usar banco global
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
        montoPago: detail.montoPago || '0'
      };
    }
    return detail;
  });

  setPaymentDetails(updatedDetails);
  
  
  try {
    await procesarComprobantesMasivo(requestData);
    toast.success('Comprobante rechazado exitosamente');
    
    // Cerrar modal después del éxito - usar setTimeout para permitir que se complete el toast
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('closePaymentModal'));
    }, 1000);
  } catch (error: any) {
    // Usar la nueva función para extraer mensaje específico del error
    const errorMessage = extractDetailedErrorMessage(error);
    
    // Mostrar mensaje específico en el toast
    toast.error(errorMessage);
  }
  
  return null;
};

export const handlePartialAcceptStatus = async (
  props: PaymentHandlerProps & { imageIndex: number; paymentIndex: number }
): Promise<string | null> => {
  const {
    displayedPayment,
    modalPayments,
    paymentDetails,
    setPaymentDetails,
    imageIndex,
    paymentIndex,
    agenciaCode,
    userData,
    paymentType,
    paymentLimit,
    globalBanco
  } = props;

  // Validar estado general del comprobante
  if (!['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral)) {
    return 'Este comprobante ya ha sido completamente procesado';
  }

  // Buscar el voucher seleccionado (similar al rechazo parcial)
  const selectedVoucher = paymentDetails.find(v =>
    v.imageIndex === imageIndex &&
    v.paymentIndex === paymentIndex &&
    displayedPayment.comprobantebase_64[imageIndex]?.ruta === v.ruta
  );

  if (!selectedVoucher) {
    return 'No se encontró el voucher seleccionado';
  }

  if (selectedVoucher.estado !== 'pendiente') {
    return 'Este comprobante ya ha sido procesado';
  }

  if (!selectedVoucher.montoPago || !selectedVoucher.nroOperacion || !selectedVoucher.tipoOperacion) {
    return 'Debe completar todos los datos del comprobante seleccionado';
  }

  // VALIDAR BANCO OBLIGATORIO
  if (!globalBanco || globalBanco.trim() === '') {
    return 'Debe seleccionar un banco antes de procesar el pago';
  }

  // Validar monto individual del voucher
  const montoVoucher = parseFloat(selectedVoucher.montoPago) || 0;
  
  // 🚨 DIAGNÓSTICO: El límite está llegando como 0 cuando debería tener valor
  if (paymentLimit === 0) {
  }

  // VALIDAR LÍMITES SEGÚN EL TIPO DE PAGO (IGUAL QUE handleAcceptStatus)
  if (!paymentType) {
    return 'Error: No se ha seleccionado el tipo de pago. Seleccione "Pago Normal" o "Liquidación Total" antes de continuar.';
  }

  // Validación más flexible - permitir paymentLimit = 0 en algunos casos
  if (paymentLimit === undefined || paymentLimit === null) {
    return 'Error: No se pudo obtener el límite de pago. Espere a que carguen los datos del crédito o recargue la página.';
  }

  // Solo validar negativos, permitir 0
  if (paymentLimit < 0) {
    return 'Error: Límite de pago inválido (valor negativo).';
  }

  if (paymentType === 'normal') {
    if (montoVoucher > paymentLimit) {
      return `El monto del comprobante (S/ ${montoVoucher.toFixed(2)}) excede el máximo permitido para Pago Normal (S/ ${paymentLimit.toFixed(2)})`;
    }
  } else if (paymentType === 'liquidacion') {
    if (montoVoucher < paymentLimit) {
      return `Para Liquidación, el monto debe ser mayor o igual al saldo pendiente (S/ ${paymentLimit.toFixed(2)}), pero se ingresó S/ ${montoVoucher.toFixed(2)}`;
    }
  }

  // VALIDAR DATOS OBLIGATORIOS ANTES DE ENVIAR AL BACKEND (PAGO PARCIAL)
  if (!userData?.agencias || userData.agencias.length === 0) {
    return 'Su usuario no tiene agencias asignadas. Contacte al administrador para configurar su acceso.';
  }

  if (!agenciaCode || agenciaCode.trim() === '') {
    return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
  }

  const codCaja = userData?.agencias?.[0]?.cod_caja || '';
  const userCaja = userData?.agencias?.[0]?.user_caja || '';

  if (!codCaja || codCaja.trim() === '') {
    return 'Falta información de código de caja. Contacte al administrador para configurar su agencia correctamente.';
  }

  if (!userCaja || userCaja.trim() === '') {
    return 'Falta información de usuario de caja. Contacte al administrador para configurar su agencia correctamente.';
  }

  if (!userData?.email || userData.email.trim() === '') {
    return 'Falta información del usuario (email). Inicie sesión nuevamente.';
  }

  if (!userData?.dni || userData.dni.trim() === '') {
    return 'Falta información del usuario (DNI). Inicie sesión nuevamente.';
  }

  const requestData = {
    montoTotal: selectedVoucher.montoPago, // Solo el monto del voucher seleccionado
    tipo_pago: paymentType === 'liquidacion' ? 'pago_liquida' : 'pago_normal',
    userData: {
      agencia: agenciaCode,
      cod_caja: codCaja,
      user_caja: userCaja,
      email: userData.email,
      dni_usuario: userData.dni,
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

        // Solo modificar el voucher seleccionado en pago parcial
        const shouldAccept = isCurrentPayment && idx === imageIndex;
        return {
          indice: idx,
          montoPago: detail.montoPago || '0',
          nroOperacion: detail.nroOperacion || '',
          tipoOperacion: detail.tipoOperacion || '',
          nro_banco: detail.nro_banco || '',
          banco: globalBanco || '', // Usar banco global
          estado: shouldAccept ? 'aceptado' as const : detail.estado,
          _id: comp._id || '',
          motivo_rechazo: shouldAccept ? '' : detail.motivo_rechazo,
          monto_pago: shouldAccept ? (parseFloat(detail.montoPago) || 0) : (detail.estado === 'aceptado' ? (parseFloat(detail.montoPago) || 0) : 0),
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null);

      // Determinar estado general del pago
      const hasAccepted = voucherDetails.some(d => d.estado === 'aceptado');
      const hasRejected = voucherDetails.some(d => d.estado === 'rechazado');
      const hasPending = voucherDetails.some(d => d.estado === 'pendiente');
      
      const estadoGeneral = (hasAccepted || hasRejected) && hasPending ? 'parcial'
        : (hasAccepted || hasRejected) ? 'atendido'
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

  try {
    // ✅ PRIMERO: Llamar a la API
    await procesarComprobantesMasivo(requestData);
    
    // ✅ SEGUNDO: Solo si la API fue exitosa, actualizar el estado visual
    const updatedDetails = paymentDetails.map(detail => {
      if (detail === selectedVoucher) {
        return {
          ...detail,
          estado: 'aceptado' as const,
          motivo_rechazo: ''
        };
      }
      return detail;
    });

    setPaymentDetails(updatedDetails);
    
    toast.success('Comprobante aceptado exitosamente');
    
    // Cerrar modal después del éxito
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('closePaymentModal'));
    }, 1000);
  } catch (error: any) {
    // ✅ Si hay error, NO cambiar el estado visual y mostrar mensaje específico
    const errorMessage = extractDetailedErrorMessage(error);
    
    toast.error(errorMessage);
    throw error;
  }
  
  return null;
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
    paymentLimit,
    globalBanco
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

  // VALIDAR BANCO OBLIGATORIO
  if (!globalBanco || globalBanco.trim() === '') {
    return 'Debe seleccionar un banco antes de procesar el pago';
  }

  // Calcular el monto total de todos los vouchers pendientes
  const totalMonto = pendingVouchers.reduce((sum, voucher) => {
    const monto = parseFloat(voucher.montoPago) || 0;
    return sum + monto;
  }, 0);

  // VALIDAR LÍMITES SEGÚN EL TIPO DE PAGO
  if (!paymentType) {
    return 'Error: No se ha seleccionado el tipo de pago. Seleccione "Pago Normal" o "Liquidación Total" antes de continuar.';
  }

  // Validación más flexible - consistente con handlePartialAcceptStatus
  if (paymentLimit === undefined || paymentLimit === null) {
    return 'Error: No se pudo obtener el límite de pago. Espere a que carguen los datos del crédito o recargue la página.';
  }

  // Solo validar negativos, permitir 0
  if (paymentLimit < 0) {
    return 'Error: Límite de pago inválido (valor negativo).';
  }

  if (paymentType === 'normal') {
    if (totalMonto > paymentLimit) {
      return `El monto total (S/ ${totalMonto.toFixed(2)}) excede el máximo permitido para Pago Normal (S/ ${paymentLimit.toFixed(2)})`;
    }
  } else if (paymentType === 'liquidacion') {
    if (totalMonto < paymentLimit) {
      return `Para Liquidación Total, el monto debe ser mayor o igual a S/ ${paymentLimit.toFixed(2)}, pero se ingresó S/ ${totalMonto.toFixed(2)}`;
    }
  }

  // VALIDAR DATOS OBLIGATORIOS ANTES DE ENVIAR AL BACKEND
  if (!userData?.agencias || userData.agencias.length === 0) {
    return 'Su usuario no tiene agencias asignadas. Contacte al administrador para configurar su acceso.';
  }

  if (!agenciaCode || agenciaCode.trim() === '') {
    return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
  }

  const codCaja = userData?.agencias?.[0]?.cod_caja || '';
  const userCaja = userData?.agencias?.[0]?.user_caja || '';

  if (!codCaja || codCaja.trim() === '') {
    return 'Falta información de código de caja. Contacte al administrador para configurar su agencia correctamente.';
  }

  if (!userCaja || userCaja.trim() === '') {
    return 'Falta información de usuario de caja. Contacte al administrador para configurar su agencia correctamente.';
  }

  if (!userData?.email || userData.email.trim() === '') {
    return 'Falta información del usuario (email). Inicie sesión nuevamente.';
  }

  if (!userData?.dni || userData.dni.trim() === '') {
    return 'Falta información del usuario (DNI). Inicie sesión nuevamente.';
  }

  const requestData = {
    montoTotal: totalMonto.toString(),
    tipo_pago: paymentType === 'liquidacion' ? 'pago_liquida' : 'pago_normal',
    userData: {
      agencia: agenciaCode,
      cod_caja: codCaja,
      user_caja: userCaja,
      email: userData.email,
      dni_usuario: userData.dni,
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
          nro_banco: detail.nro_banco || '',
          banco: globalBanco || '', // Usar banco global
          estado: detail.estado === 'pendiente' ? 'aceptado' : detail.estado,
          _id: comp._id || '',
          motivo_rechazo: detail.estado === 'pendiente' ? '' : detail.motivo_rechazo,
          monto_pago: parseFloat(detail.montoPago) || 0,  // ✅ AGREGAR COMO NÚMERO
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null)
    }))
  };

  try {
    // ✅ PRIMERO: Llamar a la API
    await procesarComprobantesMasivo(requestData);
    
    // ✅ SEGUNDO: Solo si la API fue exitosa, actualizar el estado visual
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
    
    toast.success('Comprobantes aceptados exitosamente');
    
    // Cerrar modal después del éxito
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('closePaymentModal'));
    }, 1000);
  } catch (error: any) {
    // ✅ Si hay error, NO cambiar el estado visual y mostrar mensaje específico
    const errorMessage = extractDetailedErrorMessage(error);
    
    // Mostrar mensaje específico en el toast
    toast.error(errorMessage);
    throw error;
  }
  return null;
};