import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AGENCIAS } from '../../../types';
import { AuthContext } from '../../../contexts/AuthContext';

import { PaymentHeader } from '../modalComponents/PaymentHeader';
import { PaymentImageViewer } from '../modalComponents/PaymentImageViewer';
import { PaymentForm } from '../modalComponents/PaymentForm';
import { PaymentActions } from '../modalComponents/PaymentActions';

import { PaymentDetailsModalProps } from './PaymentDetailsModalTypes';
import { usePaymentDetailsState } from './PaymentDetailsModalState';
import { handleUpdateStatus, handleAcceptStatus, handlePartialAcceptStatus } from './PaymentDetailsModalHandlers';

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
  onConfirmReject
}) => {
  const { user } = useContext(AuthContext);
  const {
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
    removePayment,
    paymentType,
    setPaymentType,
    paymentLimit,
    setPaymentLimit
  } = usePaymentDetailsState(currentPayment, monto, setMonto);

  const handleNextPayment = () => {
    const nextIndex = (paymentIndex + 1) % modalPayments.length;
    setPaymentIndex(nextIndex);
    setImageIndex(0);
  };

  const handlePrevPayment = () => {
    const prevIndex = (paymentIndex - 1 + modalPayments.length) % modalPayments.length;
    setPaymentIndex(prevIndex);
    setImageIndex(0);
  };

  const allPayments = modalPayments;
  const displayedPayment = allPayments[paymentIndex];
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
              ? 'fixed inset-0 overflow-y-auto'
              : 'relative w-[90vw] max-w-[1200px] min-w-[320px] rounded-lg h-[90vh] max-h-[900px] min-h-[500px]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={modalPosition.isMobile ? 'flex-shrink-0' : ''}>
            <PaymentHeader
              displayedPayment={displayedPayment}
              totalAmount={totalAmount}
              currentIndex={paymentIndex}
              totalPayments={allPayments.length}
              onCloseModal={onCloseModal}
              showImage={showImage}
              onTypeChange={(type, maxAmount) => {
                setPaymentType(type);
                setPaymentLimit(maxAmount);
              }}
            />
          </div>

          <div className={`${modalPosition.isMobile ? 'min-h-[80vh]' : 'flex-1'} flex ${modalPosition.isMobile ? 'flex-col' : 'flex-row'} gap-2 sm:gap-3 p-2 sm:p-4 text-sm ${modalPosition.isMobile ? '' : 'overflow-hidden'} relative min-h-0`}>
            {allPayments.length > 1 && (
              <div className={`absolute ${modalPosition.isMobile ? 'top-1/2 -translate-y-1/2' : 'inset-y-0'} left-0 right-0 flex items-center justify-between px-4 z-50 pointer-events-none`}>
                <button
                  onClick={handlePrevPayment}
                  className={`p-2 bg-white/90 rounded-full shadow-lg hover:bg-white pointer-events-auto transition-all ${modalPosition.isMobile ? 'relative' : ''}`}
                  style={modalPosition.isMobile ? { transform: 'translateY(-50%)' } : {}}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPayment}
                  className={`p-2 bg-white/90 rounded-full shadow-lg hover:bg-white pointer-events-auto transition-all ${modalPosition.isMobile ? 'relative' : ''}`}
                  style={modalPosition.isMobile ? { transform: 'translateY(-50%)' } : {}}
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
                ? activeTab === 'image' ? 'h-[60vh]' : 'hidden'
                : 'w-1/2 lg:w-3/5 xl:w-1/2'
            } flex-shrink-0 ${modalPosition.isMobile ? '' : 'h-full overflow-hidden'} relative min-h-0`}>
              <p className="mb-1 px-2 text-xs text-gray-500">
                {paymentIndex === 0 ? 'Comprobante principal' : `Comprobante adicional ${paymentIndex}`}
              </p>
              <PaymentImageViewer
                imageSource={displayedPayment.comprobantebase_64.map(c => c.ruta)}
                altText={`Comprobante de ${displayedPayment.nombreSocio}`}
                isLoading={isLoading || loadingRelated}
                currentIndex={imageIndex}
                onChangeIndex={setImageIndex}
              />
            </div>

            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'form' ? 'h-[60vh] overflow-y-auto' : 'hidden'
                : 'w-1/2 lg:w-2/5 xl:w-1/2'
            } ${modalPosition.isMobile ? '' : 'overflow-auto'} relative z-20 min-h-0`}>
              <PaymentForm
                vouchers={[paymentDetails.find(detail =>
                  detail.imageIndex === imageIndex &&
                  displayedPayment.comprobantebase_64[imageIndex]?.ruta === detail.ruta
                )].filter((detail): detail is NonNullable<typeof detail> => detail !== undefined)}
                onUpdateVoucher={(_, field, value) => {
                  const currentVoucher = paymentDetails.find(detail =>
                    detail.imageIndex === imageIndex &&
                    displayedPayment.comprobantebase_64[imageIndex]?.ruta === detail.ruta
                  );

                  if (!currentVoucher) return;

                  const newDetails = paymentDetails.map(detail => {
                    if (detail === currentVoucher) {
                      return {
                        ...detail,
                        [field]: value
                      };
                    }
                    return detail;
                  });

                  setPaymentDetails(newDetails);

                  if (field === 'montoPago') {
                    const total = newDetails
                      .filter(detail => detail.estado !== 'rechazado')
                      .reduce((sum, detail) => sum + (Number(detail.montoPago) || 0), 0)
                      .toFixed(2);
                    setMonto(total);
                  }
                }}
                onRejectVoucher={() => {
                  setRejectType('partial');
                  onReject();
                }}
                onAcceptVoucher={async () => {
                  const error = await handlePartialAcceptStatus({
                    displayedPayment,
                    modalPayments,
                    paymentDetails,
                    setPaymentDetails,
                    imageIndex,
                    paymentIndex,
                    agenciaCode,
                    userData: user,
                    paymentType,
                    paymentLimit,
                    rejectType: 'partial',
                    selectedRejectReason: '',
                    customReason: '',
                    totalAmount
                  });
                  
                  if (error) {
                    throw new Error(error);
                  }
                }}
                agenciaName={agenciaSeleccionada}
                isEditable={
                  ['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral) &&
                  displayedPayment.comprobantebase_64[imageIndex]?.estado === 'pendiente'
                }
                userData={user}
                agenciaCode={agenciaCode}
              />
            </div>
          </div>

          <div className={`border-t border-gray-200 bg-white shadow-lg ${modalPosition.isMobile ? 'flex-shrink-0' : ''}`}>
            <PaymentActions
              isPending={displayedPayment.comprobantebase_64[imageIndex]?.estado === 'pendiente'}
              isLoading={isLoading}
              isMobile={modalPosition.isMobile}
              totalPayments={allPayments.length}
              showRejectModal={showRejectModal}
              selectedRejectReason={selectedRejectReason}
              customReason={customReason}
              rejectType={rejectType}
              onUpdateStatus={async () => {
                const error = await handleUpdateStatus({
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
                  userData: user
                });
                
                if (error) {
                  // El error se manejará en PaymentActions
                  throw new Error(error);
                }
              }}
              onAcceptStatus={async () => {
                const error = await handleAcceptStatus({
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
                  userData: user,
                  paymentType,
                  paymentLimit
                });
                
                if (error) {
                  // El error se manejará en PaymentActions
                  throw new Error(error);
                }
              }}
              onReject={() => {
                setRejectType('partial');
                onReject();
              }}
              onCloseModal={onCloseModal}
              onConfirmReject={(type) => {
                setRejectType(type);
                onConfirmReject(type);
              }}
              setSelectedRejectReason={setSelectedRejectReason}
              setCustomReason={setCustomReason}
              totalMonto={monto}
              paymentDetails={paymentDetails}
              userData={user}
              agenciaCode={agenciaCode}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};