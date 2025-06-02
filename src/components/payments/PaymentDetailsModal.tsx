import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
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
  onUpdateStatus: (estado: 'aceptado' | 'rechazado', detallesPago: {
    montoTotal: string;
    vouchers: {
      identificacion: {
        dni: string;
        fecha: string;
        hora: string;
      };
      detalles: {
        montoPago: string;
        nroOperacion: string;
        tipoOperacion: string;
      };
    }[];
    motivo_rechazo?: string;
  }) => void;
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
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'image' | 'form'>('image');
  const [relatedPayments, setRelatedPayments] = useState<PaymentRecord[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<Map<number, {
    montoPago: string;
    nroOperacion: string;
    tipoOperacion: string;
  }>>(new Map());
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [totalAmount, setTotalAmount] = useState(monto);
  const [modalPayments, setModalPayments] = useState<PaymentRecord[]>([]);

  // Inicializar modalPayments con el comprobante actual
  useEffect(() => {
    setModalPayments([currentPayment]);
    setPaymentIndex(0);
    setImageIndex(0);
  }, [currentPayment]);

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
          setModalPayments([currentPayment, ...filteredPayments]);
          
          const details = new Map();
          [currentPayment, ...filteredPayments].forEach((payment, index) => {
            details.set(index, {
              montoPago: payment.cuotasVencidasTotalAPagar,
              nroOperacion: '',
              tipoOperacion: ''
            });
          });
          setPaymentDetails(details);

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

  const removePayment = (index: number) => {
    if (index === 0) return;
    
    const newPayments = [...modalPayments];
    newPayments.splice(index, 1);
    setModalPayments(newPayments);
    
    if (paymentIndex >= newPayments.length) {
      setPaymentIndex(newPayments.length - 1);
    }

    const total = newPayments.reduce(
      (sum, payment) => sum + Number(payment.cuotasVencidasTotalAPagar),
      0
    );
    setTotalAmount(total.toString());
    setMonto(total.toString());
  };

  const allPayments = modalPayments;
  const displayedPayment = allPayments[paymentIndex];

  const handleNextPayment = () => {
    setPaymentIndex((prev) => (prev + 1) % allPayments.length);
    setImageIndex(0); // Reset image index when changing payment
  };

  const handlePrevPayment = () => {
    setPaymentIndex((prev) => (prev - 1 + allPayments.length) % allPayments.length);
    setImageIndex(0); // Reset image index when changing payment
  };

  const updatePaymentDetail = (field: 'montoPago' | 'nroOperacion' | 'tipoOperacion', value: string) => {
    const details = paymentDetails.get(paymentIndex) || {
      montoPago: '',
      nroOperacion: '',
      tipoOperacion: ''
    };
    const newPaymentDetails = new Map(paymentDetails).set(paymentIndex, {
      ...details,
      [field]: value
    });
    setPaymentDetails(newPaymentDetails);

    if (field === 'montoPago') {
      const total = Array.from(newPaymentDetails.values())
        .reduce((sum, detail) => sum + (Number(detail.montoPago) || 0), 0);
      setMonto(total.toString());
    }
  };

  const handleUpdateStatus = () => {
    const allFieldsComplete = Array.from(paymentDetails.entries())
      .filter(([index]) => index < modalPayments.length)
      .every(([_, details]) => details.montoPago && details.nroOperacion && details.tipoOperacion);
    
    if (!allFieldsComplete) {
      toast.error('Debe completar los datos de todos los comprobantes (monto, número y tipo de operación)');
      return;
    }

    const requestData = {
      montoTotal: totalAmount,
      userData: {
        agencia: agenciaCode,
        cod_caja: user?.agencias?.[0]?.cod_caja || '',
        user_caja: user?.agencias?.[0]?.user_caja || '',
        email: user?.email || '',
        dni_usuario: user?.dni || ''
      },
      vouchers: modalPayments.map((payment, index) => {
        const details = paymentDetails.get(index);
        return {
          identificacion: {
            dni: payment.dni,
            fecha: payment.fecha,
            hora: payment.hora
          },
          detalles: {
            montoPago: details?.montoPago || '',
            nroOperacion: details?.nroOperacion || '',
            tipoOperacion: details?.tipoOperacion || ''
          }
        };
      })
    };
    
    onUpdateStatus('aceptado', requestData);
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
              ? 'fixed inset-0 overflow-hidden'
              : 'relative w-[800px] rounded-lg h-[90vh] max-h-[1000px]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <PaymentHeader
            displayedPayment={displayedPayment}
            totalAmount={totalAmount}
            currentIndex={paymentIndex}
            totalPayments={allPayments.length}
            onCloseModal={onCloseModal}
            showImage={showImage}
          />
  
          <div className={`flex-1 flex ${modalPosition.isMobile ? 'flex-col' : 'flex-row'} gap-3 p-4 text-sm overflow-hidden relative`}>
            {allPayments.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-50 pointer-events-none">
                <button
                  onClick={handlePrevPayment}
                  className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white pointer-events-auto transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPayment}
                  className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white pointer-events-auto transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="absolute top-2 right-2 z-30">
              {paymentIndex > 0 && (
                <button
                  onClick={() => removePayment(paymentIndex)}
                  className="text-gray-500 hover:text-red-500 transition-colors bg-white/90 rounded-full shadow-md p-1"
                  title="Quitar comprobante"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {modalPosition.isMobile && (
              <div className="flex border-b border-gray-200 mb-2">
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === 'image' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('image')}
                >
                  Imagen
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === 'form' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('form')}
                >
                  Formulario
                </button>
              </div>
            )}
            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'image' ? 'flex-1' : 'hidden'
                : 'w-7/12 min-h-[600px]'
            } flex-shrink-0 h-full overflow-hidden relative`}>
              <p className="mb-1 px-2 text-xs text-gray-500">
                {paymentIndex === 0 ? 'Comprobante principal' : `Comprobante adicional ${paymentIndex}`}
              </p>
              <PaymentImageViewer
                imageSource={displayedPayment.comprobantebase_64}
                altText={`Comprobante de ${displayedPayment.nombreSocio}`}
                isLoading={isLoading || loadingRelated}
              />
            </div>

            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'form' ? 'flex-1' : 'hidden'
                : 'w-5/12'
            } overflow-auto relative z-20`}>
              <PaymentForm
                montoPago={paymentDetails.get(paymentIndex)?.montoPago || totalAmount}
                nroOperacion={paymentDetails.get(paymentIndex)?.nroOperacion || ''}
                tipoOperacion={paymentDetails.get(paymentIndex)?.tipoOperacion || ''}
                onUpdateDetail={updatePaymentDetail}
                agenciaName={agenciaSeleccionada}
                isEditable={displayedPayment.estado === 'pendiente'}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white shadow-lg">
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