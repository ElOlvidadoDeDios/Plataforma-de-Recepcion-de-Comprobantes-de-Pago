import React, { useState, useCallback, useEffect } from 'react';
import logger from '../../utils/logger';
import { PaymentRecord, AgenciaCaja } from '../../types';
import { fetchPaymentByDNIAndTime, fetchPendingPaymentsByPagare } from '../../api/paymentsApi';
import toast from 'react-hot-toast';
import { PaymentCardView } from './PaymentCardView';
import { PaymentDetailsModal } from './PaymentDetailsModal';

interface PaymentCardProps {
  payment: PaymentRecord;
  onUpdateStatus: (
    payment: PaymentRecord,
    estado: 'pendiente' | 'aceptado' | 'rechazado',
    motivoRechazo?: string,
    agenciaCode?: string,
    monto?: string | null
  ) => Promise<void>;
  socket: any;
  agencias?: string[];
  userAgencias?: AgenciaCaja[];
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onUpdateStatus,
  socket,
  agencias = [],
}) => {
  const [showImage, setShowImage] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(payment);
  const [relatedPayments, setRelatedPayments] = useState<PaymentRecord[]>([]);
  const [modalPosition, setModalPosition] = useState<{
    isMobile: boolean;
    clickPosition?: { x: number; y: number };
  }>({
    isMobile: false
  });
  const [selectedRejectReason, setSelectedRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [monto, setMonto] = useState(payment.cuotasVencidasTotalAPagar);
  const [agenciaCode] = useState(agencias[0] || '');

  const handlePaymentUpdated = useCallback((updatedPayment: PaymentRecord) => {
    if (
      updatedPayment.dni === currentPayment.dni &&
      updatedPayment.fecha === currentPayment.fecha &&
      updatedPayment.hora === currentPayment.hora
    ) {
      setCurrentPayment(updatedPayment);
    }

    setRelatedPayments(prev => 
      prev.map(p => 
        p.dni === updatedPayment.dni && 
        p.fecha === updatedPayment.fecha && 
        p.hora === updatedPayment.hora 
          ? updatedPayment 
          : p
      )
    );
  }, [currentPayment]);

  useEffect(() => {
    if (socket) {
      socket.on('paymentUpdated', handlePaymentUpdated);
      return () => {
        socket.off('paymentUpdated', handlePaymentUpdated);
      };
    }
  }, [socket, handlePaymentUpdated]);

// En tu componente PaymentCard, reemplaza la función handleOpenModal:

const handleOpenModal = async (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // Obtener información del elemento clickeado
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 768;
  
  let clickX: number;
  let clickY: number;
  
  if (isMobile) {
    // En móvil, usar posición más simple y centrar horizontalmente
    clickX = viewportWidth / 2;
    // Usar la posición del botón + un offset pequeño
    clickY = rect.bottom + 5; // 5px debajo del botón
    
    // Si el botón está muy abajo, mostrar arriba
    if (rect.bottom > viewportHeight * 0.7) {
      clickY = rect.top - 5; // 5px arriba del botón
    }
  } else {
    // Lógica de desktop (la que ya teníamos)
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;
    
    clickX = elementCenterX;
    clickY = elementCenterY;
    
    // Si el elemento está muy a la derecha, usar el borde izquierdo
    if (rect.right > viewportWidth * 0.75) {
      clickX = rect.left;
    }
    // Si está muy a la izquierda, usar el borde derecho
    else if (rect.left < viewportWidth * 0.25) {
      clickX = rect.right;
    }
    
    // Para la posición Y, preferir mostrar debajo del elemento
    if (rect.bottom < viewportHeight * 0.7) {
      clickY = rect.bottom + 10; // 10px de separación
    } else {
      clickY = rect.top - 10; // Mostrar arriba si no hay espacio abajo
    }
  }

  setModalPosition({
    isMobile: isMobile,
    clickPosition: {
      x: clickX,
      y: clickY + window.scrollY // Incluir el scroll
    }
  });
  
  setIsLoading(true);
  setShowImage(true);

  try {
    const updatedPayment = await fetchPaymentByDNIAndTime(
      currentPayment.dni, 
      currentPayment.fecha, 
      currentPayment.hora
    );
    
    if (updatedPayment) {
      setCurrentPayment(updatedPayment);

      if (updatedPayment.estado === 'pendiente' && updatedPayment.creditoId) {
        const payments = await fetchPendingPaymentsByPagare(updatedPayment.creditoId);
        const filteredPayments = payments.filter(p => 
          !(p.dni === updatedPayment.dni && 
            p.fecha === updatedPayment.fecha && 
            p.hora === updatedPayment.hora)
        );
        setRelatedPayments(filteredPayments);

        const total = filteredPayments.reduce(
          (sum, p) => sum + Number(p.cuotasVencidasTotalAPagar),
          Number(updatedPayment.cuotasVencidasTotalAPagar)
        );
        setMonto(total.toString());
      }
    }
  } catch (error) {
    toast.error('No se pudo actualizar el comprobante.');
    if (import.meta.env.DEV) {
      logger.error(error);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleCloseModal = () => {
    setShowImage(false);
    setShowRejectModal(false);
  };

  const handleReject = () => {
    setShowRejectModal(true);
    setShowImage(false);
  };

  const handleConfirmReject = async () => {
    const finalReason = selectedRejectReason === "Otro (especificar)" ? customReason.trim() : selectedRejectReason.trim();
    if (!finalReason) {
      toast.error("Debe especificar un motivo de rechazo");
      return;
    }
    await updateStatus('rechazado', finalReason);
  };

  const updateStatus = async (
    estado: 'pendiente' | 'aceptado' | 'rechazado',
    detallesPago?: { montoPago: string; nroOperacion: string; tipoOperacion: string; }[] | string
  ) => {
    const motivoRechazo = typeof detallesPago === 'string' ? detallesPago : undefined;
    setIsLoading(true);
    try {
      if (estado === 'aceptado' && detallesPago && Array.isArray(detallesPago)) {
        const [mainPayment, ...otherPayments] = detallesPago;
        
        await onUpdateStatus(currentPayment, estado, undefined, agenciaCode, mainPayment.montoPago);

        if (relatedPayments.length > 0) {
          for (let i = 0; i < relatedPayments.length; i++) {
            const payment = relatedPayments[i];
            const details = otherPayments[i];
            if (details) {
              await onUpdateStatus(payment, estado, undefined, agenciaCode, details.montoPago);
            }
          }
        }
      } else if (estado === 'rechazado' && motivoRechazo) {
        await onUpdateStatus(currentPayment, estado, motivoRechazo, agenciaCode, null);
      } else {
        await onUpdateStatus(currentPayment, estado, undefined, agenciaCode, null);
      }

      handleCloseModal();
      setSelectedRejectReason("");
      setCustomReason("");
      setRelatedPayments([]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error al actualizar estado:', error);
      }
      toast.error(`Error al actualizar el estado a ${estado}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PaymentCardView
        payment={payment}
        currentPayment={currentPayment}
        isLoading={isLoading}
        onOpenModal={handleOpenModal}
      />
      
      <PaymentDetailsModal
        showImage={showImage}
        showRejectModal={showRejectModal}
        currentPayment={currentPayment}
        isLoading={isLoading}
        modalPosition={modalPosition}
        monto={monto}
        setMonto={setMonto}
        agenciaCode={agenciaCode}
        selectedRejectReason={selectedRejectReason}
        setSelectedRejectReason={setSelectedRejectReason}
        customReason={customReason}
        setCustomReason={setCustomReason}
        onCloseModal={handleCloseModal}
        onReject={handleReject}
        onConfirmReject={handleConfirmReject}
        onUpdateStatus={updateStatus}
      />
    </>
  );
};