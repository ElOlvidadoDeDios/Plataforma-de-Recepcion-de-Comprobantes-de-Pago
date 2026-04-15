import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onConfirmReject,
  isReadOnlyMode = false
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
    imageIndex,
    setImageIndex,
    loadingRelated,
    totalAmount,
    modalPayments,
    paymentType,
    paymentLimit,
    handlePaymentTypeChange,
    globalBanco,
    setGlobalBanco
  } = usePaymentDetailsState(currentPayment, monto, setMonto);

  // const handleNextPayment = () => {
  //   const nextIndex = (paymentIndex + 1) % modalPayments.length;
  //   setPaymentIndex(nextIndex);
  //   setImageIndex(0);
  // };

  // const handlePrevPayment = () => {
  //   const prevIndex = (paymentIndex - 1 + modalPayments.length) % modalPayments.length;
  //   setPaymentIndex(prevIndex);
  //   setImageIndex(0);
  // };

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
              : 'relative w-[95vw] max-w-[1400px] min-w-[360px] rounded-lg h-[98vh] max-h-[1200px] min-h-[700px]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - 30% del espacio vertical */}
          <div className={`${modalPosition.isMobile ? 'flex-shrink-0' : 'flex-shrink-0'} border-b border-gray-200 overflow-auto`}>
            <PaymentHeader
              displayedPayment={displayedPayment}
              totalAmount={totalAmount}
              currentIndex={paymentIndex}
              totalPayments={allPayments.length}
              onCloseModal={onCloseModal}
              showImage={showImage}
              onTypeChange={handlePaymentTypeChange}
            />
          </div>

          {/* Contenido de imagen - 70% del espacio vertical */}
          <div className={`${modalPosition.isMobile ? 'min-h-[85vh]' : 'flex-1'} flex ${modalPosition.isMobile ? 'flex-col' : 'flex-row'} ${modalPosition.isMobile ? '' : 'overflow-hidden'} relative min-h-0`}>
            {/* ✅ NOTA: Navegación y botón quitar comprobante deshabilitados en modo individual */}
            {/* Ya no se cargan múltiples pagos relacionados, solo el registro seleccionado */}

            {/* Tabs móviles */}
            {modalPosition.isMobile && (
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'image' 
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-white' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('image')}
                >
                  📷 Imagen
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'form' 
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-white' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('form')}
                >
                  📝 Formulario
                </button>
              </div>
            )}

            {/* SECCIÓN DE IMAGEN - Ocupa todo el espacio disponible */}
            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'image' ? 'h-[70vh]' : 'hidden'
                : 'w-1/2 lg:w-3/5 xl:w-1/2'
            } flex-shrink-0 ${modalPosition.isMobile ? '' : 'h-full overflow-hidden'} relative min-h-0 bg-gray-50`}>
              <div className="p-2 h-full flex flex-col">
                <p className="mb-2 text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 inline-block">
                  {paymentIndex === 0 ? '📄 Comprobante principal' : `📄 Comprobante adicional ${paymentIndex}`}
                </p>
                {/* Contenedor de imagen con más espacio */}
                <div className="flex-1 min-h-0">
                  <PaymentImageViewer
                    imageSource={displayedPayment.comprobantebase_64.map(c => c.ruta)}
                    altText={`Comprobante de ${displayedPayment.nombreSocio}`}
                    isLoading={isLoading || loadingRelated}
                    currentIndex={imageIndex}
                    onChangeIndex={setImageIndex}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN DE FORMULARIO - Mantiene tamaño original */}
            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'form' ? 'h-[70vh] overflow-y-auto' : 'hidden'
                : 'w-1/2 lg:w-2/5 xl:w-1/2'
            } ${modalPosition.isMobile ? '' : 'overflow-auto'} relative z-20 min-h-0 bg-white`}>
              <div className="p-2 h-full">
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
                      // Solo sumar vouchers que están pendientes (no procesados)
                      const total = newDetails
                        .filter(detail => detail.estado === 'pendiente')
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
                      globalBanco
                    });
                    
                    if (error) {
                      throw new Error(error);
                    }
                  }}
                  agenciaName={agenciaSeleccionada}
                  isEditable={
                    !isReadOnlyMode &&
                    ['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral) &&
                    displayedPayment.comprobantebase_64[imageIndex]?.estado === 'pendiente'
                  }
                  userData={user}
                  agenciaCode={agenciaCode}
                  creditoId={displayedPayment.creditoId}
                />
              </div>
            </div>
          </div>

          {/* Footer de acciones - Mostrar solo en modo edición */}
          <div className={`border-t border-gray-200 bg-gray-50 shadow-lg ${modalPosition.isMobile ? 'flex-shrink-0' : ''}`}>
            {isReadOnlyMode ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-medium">Modo Solo Lectura</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Puede ver los detalles pero no procesar pagos</p>
                <button
                  onClick={onCloseModal}
                  className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
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
                    userData: user,
                    globalBanco
                  });
                  
                  if (error) {
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
                    userData: user,
                    paymentType,
                    paymentLimit,
                    globalBanco
                  });
                  
                  if (error) {
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
                globalBanco={globalBanco}
                onBancoChange={setGlobalBanco}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};