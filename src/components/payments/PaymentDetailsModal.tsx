import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PaymentRecord, AGENCIAS } from '../../types';
import { fetchPendingPaymentsByPagare } from '../../api/paymentsApi';
import toast from 'react-hot-toast';

import { PaymentHeader } from './modalComponents/PaymentHeader';
import { PaymentImageViewer } from './modalComponents/PaymentImageViewer';
import { PaymentForm } from './modalComponents/PaymentForm';
import { PaymentActions } from './modalComponents/PaymentActions';

interface PaymentDetailsModalProps {
  showImage: boolean;
  showRejectModal: boolean;
  currentPayment: PaymentRecord;
  isLoading: boolean;
  modalPosition: {
    isMobile: boolean;
    clickPosition?: { x: number; y: number };
  };
  monto: string;
  setMonto: (value: string) => void;
  agenciaCode: string;
  selectedRejectReason: string;
  setSelectedRejectReason: (value: string) => void;
  customReason: string;
  setCustomReason: (value: string) => void;
  onCloseModal: () => void;
  onReject: () => void;
  onConfirmReject: () => void;
  onUpdateStatus: (estado: 'aceptado', detallesPago?: {
    montoPago: string;
    nroOperacion: string;
    tipoOperacion: string;
  }[]) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  showImage,
  showRejectModal,
  currentPayment,
  isLoading,
  modalPosition,
  monto,
  setMonto,
  agenciaCode,
  selectedRejectReason,
  setSelectedRejectReason,
  customReason,
  setCustomReason,
  onCloseModal,
  onReject,
  onConfirmReject,
  onUpdateStatus
}) => {
  const [relatedPayments, setRelatedPayments] = useState<PaymentRecord[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<Map<number, {
    montoPago: string;
    nroOperacion: string;
    tipoOperacion: string;
  }>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [totalAmount, setTotalAmount] = useState(monto);

  useEffect(() => {
    const loadRelatedPayments = async () => {
      if (currentPayment.estado === 'pendiente' && currentPayment.creditoId) {
        setLoadingRelated(true);
        try {
          const payments = await fetchPendingPaymentsByPagare(currentPayment.creditoId);
          const filteredPayments = payments
            .filter(p => !(p.dni === currentPayment.dni && p.fecha === currentPayment.fecha && p.hora === currentPayment.hora))
            .sort((a, b) => new Date(a.fecha + ' ' + a.hora).getTime() - new Date(b.fecha + ' ' + b.hora).getTime());
          
          setRelatedPayments(filteredPayments);
          
          // Inicializar los detalles con los montos de las cuotas vencidas
          const details = new Map();
          [currentPayment, ...filteredPayments].forEach((payment, index) => {
            details.set(index, {
              montoPago: payment.cuotasVencidasTotalAPagar,
              nroOperacion: '',
              tipoOperacion: ''
            });
          });
          setPaymentDetails(details);

          // Calcular el total inicial
          const total = [currentPayment, ...filteredPayments]
            .reduce((sum, payment) => sum + Number(payment.cuotasVencidasTotalAPagar), 0);
          setTotalAmount(total.toString());
          setMonto(total.toString());
        } catch (error) {
          toast.error('Error al cargar comprobantes relacionados');
        } finally {
          setLoadingRelated(false);
        }
      }
    };

    loadRelatedPayments();

    const details = new Map(paymentDetails);
    [currentPayment, ...relatedPayments].forEach((_, index) => {
      if (!details.has(index)) {
        details.set(index, {
          montoPago: '',
          nroOperacion: '',
          tipoOperacion: ''
        });
      }
    });
    setPaymentDetails(details);
  }, [currentPayment, setMonto]);

  const allPayments = [currentPayment, ...relatedPayments];
  const displayedPayment = allPayments[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allPayments.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allPayments.length) % allPayments.length);
  };

  const updatePaymentDetail = (field: 'montoPago' | 'nroOperacion' | 'tipoOperacion', value: string) => {
    const details = paymentDetails.get(currentIndex) || {
      montoPago: '',
      nroOperacion: '',
      tipoOperacion: ''
    };
    const newPaymentDetails = new Map(paymentDetails).set(currentIndex, {
      ...details,
      [field]: value
    });
    setPaymentDetails(newPaymentDetails);

    // Actualizar monto total cuando cambia cualquier montoPago
    if (field === 'montoPago') {
      const total = Array.from(newPaymentDetails.values())
        .reduce((sum, detail) => sum + (Number(detail.montoPago) || 0), 0);
      setMonto(total.toString());
    }
  };

  const handleUpdateStatus = () => {
    const allFieldsComplete = Array.from(paymentDetails.entries()).every(
      ([_, details]) => details.montoPago && details.nroOperacion && details.tipoOperacion
    );
    
    if (!allFieldsComplete) {
      toast.error('Debe completar los datos de todos los comprobantes (monto, número y tipo de operación)');
      return;
    }
    const detalles = Array.from(paymentDetails.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, details]) => details);
    
    onUpdateStatus('aceptado', detalles);
  };

  const agenciaSeleccionada = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaCode)?.[0] || agenciaCode;

  if (!showImage) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 w-screen h-screen bg-black/50 z-[9999] backdrop-blur-sm"
        onClick={onCloseModal}
        style={{
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`bg-white shadow-2xl border border-gray-200 z-[10000] flex flex-col ${
            modalPosition.isMobile
              ? 'fixed inset-0'
              : 'relative w-[800px] rounded-lg'
          }`}
          style={{
            maxHeight: modalPosition.isMobile ? '100%' : '650px',
            minHeight: modalPosition.isMobile ? '100%' : '650px',
            height: modalPosition.isMobile ? '100%' : '650px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <PaymentHeader 
            displayedPayment={displayedPayment}
            totalAmount={totalAmount}
            currentIndex={currentIndex}
            totalPayments={allPayments.length}
            onCloseModal={onCloseModal}
          />

          <div className={`${modalPosition.isMobile ? 'flex-1 flex flex-col' : 'h-[480px] flex flex-row'} gap-3 p-3 relative px-12 overflow-hidden`}>
            {allPayments.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className={`${modalPosition.isMobile ? 'h-1/2 min-h-[300px] overflow-auto' : 'w-7/12 h-full'}`}>
              <PaymentImageViewer
                imageSource={displayedPayment.comprobantebase_64}
                altText={`Comprobante de ${displayedPayment.nombreSocio}`}
                isLoading={isLoading || loadingRelated}
                showNavigation={false}
                onPrevious={handlePrev}
                onNext={handleNext}
              />
            </div>

            <div className={`${modalPosition.isMobile ? 'h-1/2 overflow-auto' : 'w-5/12 h-full'} relative z-20`}>
              <PaymentForm
                montoPago={paymentDetails.get(currentIndex)?.montoPago || totalAmount}
                nroOperacion={paymentDetails.get(currentIndex)?.nroOperacion || ''}
                tipoOperacion={paymentDetails.get(currentIndex)?.tipoOperacion || ''}
                onUpdateDetail={updatePaymentDetail}
                agenciaName={agenciaSeleccionada}
                isEditable={displayedPayment.estado === 'pendiente'}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50">
            <PaymentActions
              isPending={displayedPayment.estado === 'pendiente'}
              isLoading={isLoading}
              isMobile={modalPosition.isMobile}
              totalPayments={allPayments.length}
              showRejectModal={showRejectModal}
              selectedRejectReason={selectedRejectReason}
              customReason={customReason}
              onUpdateStatus={handleUpdateStatus}
              onReject={onReject}
              onCloseModal={onCloseModal}
              onConfirmReject={onConfirmReject}
              setSelectedRejectReason={setSelectedRejectReason}
              setCustomReason={setCustomReason}
              totalMonto={monto}
              onMontoTotalChange={setMonto}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};