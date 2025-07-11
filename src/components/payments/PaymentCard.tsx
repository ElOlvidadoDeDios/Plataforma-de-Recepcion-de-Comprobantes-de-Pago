import React, { useState, useCallback, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import { PaymentRecord, AgenciaCaja } from '../../types';
import { fetchPaymentByDNIAndTime, fetchPendingPaymentsByPagare } from '../../api/paymentsApi';
import toast from 'react-hot-toast';
import { PaymentCardView } from './PaymentCardView';
import { PaymentDetailsModal } from './PaymentDetailsModal';

interface PaymentCardProps {
  payment: PaymentRecord;
  socket: any;
  agencias?: string[];
  userAgencias?: AgenciaCaja[];
  onUpdateStatus?: (payment: PaymentRecord, estado: 'pendiente' | 'aceptado' | 'rechazado') => Promise<void>;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  socket,
  agencias = [],
}) => {
  const { user } = useContext(AuthContext);
  const [showImage, setShowImage] = useState(false);
  const [, setDisplayedImageIndex] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(payment);
  const [modalPosition, setModalPosition] = useState<{
    isMobile: boolean;
    clickPosition?: { x: number; y: number };
  }>({
    isMobile: false
  });
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [monto, setMonto] = useState(payment.cuotasVencidasTotalAPagar);
  // Obtener la agencia activa del usuario
  const [agenciaCode] = useState(() => {
    // Si el usuario tiene agencias asignadas, usar la primera como activa
    if (user?.agencias && user.agencias.length > 0) {
      return user.agencias[0].agencia;
    }
    // Fallback al primer elemento de agencias pasado como prop
    return agencias[0] || '';
  });
  const [, setRejectType] = useState<'partial' | 'total'>('total');

  const handlePaymentUpdated = useCallback((updatedPayment: PaymentRecord) => {
    if (
      updatedPayment.dni === currentPayment.dni &&
      updatedPayment.fecha === currentPayment.fecha &&
      updatedPayment.hora === currentPayment.hora
    ) {
      setCurrentPayment(updatedPayment);
    }
  }, [currentPayment]);

  useEffect(() => {
    if (socket) {
      socket.on('paymentUpdated', handlePaymentUpdated);
      return () => {
        socket.off('paymentUpdated', handlePaymentUpdated);
      };
    }
  }, [socket, handlePaymentUpdated]);

  // Listener para cerrar modal después de procesamiento exitoso
  useEffect(() => {
    const handleCloseModalEvent = () => {
      handleCloseModal();
    };

    window.addEventListener('closePaymentModal', handleCloseModalEvent);
    
    return () => {
      window.removeEventListener('closePaymentModal', handleCloseModalEvent);
    };
  }, []);

  const handleOpenModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;
    
    let clickX: number;
    let clickY: number;
    
    if (isMobile) {
      clickX = viewportWidth / 2;
      clickY = rect.bottom + 5;
      if (rect.bottom > viewportHeight * 0.7) {
        clickY = rect.top - 5;
      }
    } else {
      const elementCenterX = rect.left + rect.width / 2;
      const elementCenterY = rect.top + rect.height / 2;
      
      clickX = elementCenterX;
      clickY = elementCenterY;
      
      if (rect.right > viewportWidth * 0.75) {
        clickX = rect.left;
      } else if (rect.left < viewportWidth * 0.25) {
        clickX = rect.right;
      }
      
      if (rect.bottom < viewportHeight * 0.7) {
        clickY = rect.bottom + 10;
      } else {
        clickY = rect.top - 10;
      }
    }

    setModalPosition({
      isMobile: isMobile,
      clickPosition: {
        x: clickX,
        y: clickY + window.scrollY
      }
    });
    
    setIsLoading(true);
    setShowImage(true);
    setDisplayedImageIndex(0);

    try {
      const updatedPayment = await fetchPaymentByDNIAndTime(
        currentPayment.dni, 
        currentPayment.fecha, 
        currentPayment.hora
      );
      
      if (updatedPayment) {
        setCurrentPayment(updatedPayment);

        if ((updatedPayment.estadoGeneral === 'pendiente' || updatedPayment.estadoGeneral === 'parcial') && updatedPayment.creditoId) {
          const payments = await fetchPendingPaymentsByPagare(updatedPayment.creditoId);
          const total = payments.reduce(
            (sum, p) => sum + Number(p.cuotasVencidasTotalAPagar),
            0
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
  };

  const handleConfirmReject = (type: 'partial' | 'total') => {
    setRejectType(type);
    setShowRejectModal(false);
  };

  const updateStatus = async (
    estado: 'aceptado' | 'rechazado',
    detallesPago: {
      montoTotal: string;
      userData?: {
        agencia: string;
        cod_caja: string;
        user_caja: string;
        email: string;
        dni_usuario: string;
      };
      vouchers: {
        identificacion: {
          creditoId?: string;
          dni: string;
          fecha: string;
          hora: string;
          estadoGeneral?: string;
        };
        detalles: {
          indice: number;
          montoPago: string;
          nroOperacion: string;
          tipoOperacion: string;
          estado?: string;
          _id?: string;
          motivo_rechazo?: string;
        }[];
      }[];
    }
  ) => {
    setIsLoading(true);
    try {
      // Ensure userData is included
      if (!detallesPago.userData) {
        detallesPago.userData = {
          agencia: agenciaCode,
          cod_caja: user?.agencias?.[0]?.cod_caja || '',
          user_caja: user?.agencias?.[0]?.user_caja || '',
          email: user?.email || '',
          dni_usuario: user?.dni || ''
        };
      }

      // Call the backend API (uncomment and adjust as needed)
      // await onUpdateStatus(currentPayment, estado);

      // Update currentPayment state
      const updatedVoucher = detallesPago.vouchers.find(
        v => v.identificacion.dni === currentPayment.dni &&
            v.identificacion.fecha === currentPayment.fecha &&
            v.identificacion.hora === currentPayment.hora
      );
      if (updatedVoucher) {
        const validEstados: ('pendiente' | 'parcial' | 'atendido')[] = ['pendiente', 'parcial', 'atendido'];
        const newEstadoGeneral = validEstados.includes(updatedVoucher.identificacion.estadoGeneral as any) 
          ? updatedVoucher.identificacion.estadoGeneral as 'pendiente' | 'parcial' | 'atendido'
          : currentPayment.estadoGeneral;
        
        setCurrentPayment({
          ...currentPayment,
          estadoGeneral: newEstadoGeneral,
          comprobantebase_64: updatedVoucher.detalles.map(d => ({
            ...currentPayment.comprobantebase_64[d.indice],
            estado: (d.estado || 'pendiente') as 'aceptado' | 'rechazado' | 'pendiente',
            motivo_rechazo: d.motivo_rechazo
          }))
        });
      }

      handleCloseModal();
      setSelectedRejectReason('');
      setCustomReason('');
    } catch (error) {
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