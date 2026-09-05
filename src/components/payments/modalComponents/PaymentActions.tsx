import React, { useState } from 'react';
import { TotalRejectModal } from './TotalRejectModal';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
    {message}
  </div>
);

interface PaymentActionsProps {
  totalMonto: string;
  isPending: boolean;
  isLoading: boolean;
  isMobile: boolean;
  totalPayments: number;
  showRejectModal: boolean;
  selectedRejectReason: string;
  customReason: string;
  rejectType: 'partial' | 'total';
  onUpdateStatus: (estado: 'aceptado' | 'rechazado', data: any, indice: number) => void;
  onAcceptStatus: () => Promise<void>;
  onReject: () => void;
  onCloseModal: () => void;
  onConfirmReject: (rejectType: 'partial' | 'total') => void;
  setSelectedRejectReason: (value: string) => void;
  setCustomReason: (value: string) => void;
  paymentDetails?: any[];
  userData?: {
    agencias?: { cod_caja: string; user_caja: string }[];
    email?: string;
    dni?: string;
  } | null;
  agenciaCode?: string;
  // Nuevas props para manejo global del banco
  globalBanco: string;
  onBancoChange: (banco: string) => void;
}

export const PaymentActions: React.FC<PaymentActionsProps> = ({
  isPending,
  isLoading,
  totalPayments,
  showRejectModal,
  selectedRejectReason,
  customReason,
  rejectType,
  onUpdateStatus,
  onAcceptStatus,
  onCloseModal,
  onConfirmReject,
  setSelectedRejectReason,
  setCustomReason,
  totalMonto,
  paymentDetails = [],
  userData,
  agenciaCode,
  globalBanco,
  onBancoChange,
}) => {
  const [showTotalRejectModal, setShowTotalRejectModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState(false); // Estado para evitar múltiples clics

  // Función para validar datos obligatorios
  const validateRequiredData = (): string | null => {
    if (!agenciaCode || agenciaCode.trim() === '') {
      return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
    }

    // Validar que se haya seleccionado un banco
    if (!globalBanco || globalBanco.trim() === '') {
      return 'Debe seleccionar un banco antes de procesar el pago.';
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

    return null;
  };

  if (!isPending) {
    return (
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="text-center text-gray-600">
          Este pago ya ha sido {isPending ? 'pendiente' : 'procesado'}
        </div>
      </div>
    );
  }

  const handleRejectAll = () => {
    if (processing || isLoading) return; // Evitar múltiples clics

    // VALIDAR DATOS OBLIGATORIOS PRIMERO
    const validationError = validateRequiredData();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Solo verificar que todos los vouchers pendientes tengan sus campos completos
    const pendingVouchers = paymentDetails.filter(detail => detail.estado === 'pendiente');
    const incompleteVouchers = pendingVouchers.filter(
      voucher => !voucher.montoPago || !voucher.nroOperacion || !voucher.nro_banco || !voucher.tipoOperacion
    );

    if (incompleteVouchers.length > 0) {
      setErrorMessage('Debe completar los datos de todos los comprobantes pendientes para realizar un rechazo total');
      return;
    }

    // Si todos los campos están completos, mostrar el modal de rechazo total
    setSelectedRejectReason(''); // Limpiar razón anterior
    setCustomReason(''); // Limpiar razón personalizada anterior
    setErrorMessage('');
    onConfirmReject('total');
    setShowTotalRejectModal(true);
  };

  const handleTotalReject = () => {
    if (processing || isLoading) return; // Evitar múltiples clics

    const finalReason = selectedRejectReason === "Otro (especificar)"
      ? customReason.trim()
      : selectedRejectReason.trim();

    onUpdateStatus('rechazado', {
      montoTotal: '0',
      vouchers: [],
      motivo_rechazo: finalReason
    }, 0);
    
    setShowTotalRejectModal(false);
  };

  const handleAcceptStatus = async () => {
    if (processing || isLoading) return; // Evitar múltiples clics

    setProcessing(true);
    setErrorMessage('');
    
    try {
      await onAcceptStatus();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al procesar la aceptación');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (processing || isLoading) return; // Evitar múltiples clics

    if (!selectedRejectReason) {
      setErrorMessage('Debe seleccionar un motivo de rechazo');
      return;
    }
    if (selectedRejectReason === "Otro (especificar)" && !customReason.trim()) {
      setErrorMessage('Debe especificar el motivo del rechazo');
      return;
    }

    setProcessing(true);
    
    const finalReason = selectedRejectReason === "Otro (especificar)"
      ? customReason.trim()
      : selectedRejectReason.trim();

    setErrorMessage('');
    onUpdateStatus('rechazado', {
      montoTotal: '0',
      vouchers: [],
      motivo_rechazo: finalReason
    }, 0);
    
    setProcessing(false);
  };

  const isDisabled = isLoading || processing;

  return (
    <>
      <div className="p-2 sm:p-3 border-t border-gray-200 bg-white space-y-2 sm:space-y-3">
        {errorMessage && <ErrorMessage message={errorMessage} />}
        
        {/* Fila con Monto Total y Banco */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          {/* Monto Total */}
          <div className="flex items-center gap-1 sm:gap-3">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Monto Total:
            </label>
            <input
              type="text"
              value={`S/ ${totalMonto}`}
              readOnly
              className="w-20 sm:w-32 rounded-md border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              title="El monto total se calcula automáticamente sumando solo los montos de vouchers pendientes (no procesados)"
            />
          </div>
          
          {/* Banco Global */}
          <div className="flex items-center gap-1 sm:gap-3">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Banco:
            </label>
            <select
              value={globalBanco}
              onChange={(e) => onBancoChange(e.target.value)}
              className={`w-28 sm:w-36 rounded-md border px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm transition-colors outline-none focus:outline-none ${
                isDisabled
                  ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
              }`}
              disabled={isDisabled}
            >
              <option value="">Seleccionar...</option>
              <option value="1">BBVA</option>
              <option value="2">SCOTIABANK</option>
              <option value="6">CAJA CUSCO</option>

            </select>
          </div>
        </div>
        
        {/* Fila con botones */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            onClick={handleAcceptStatus}
            className={`bg-green-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded hover:bg-green-600 transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isDisabled}
          >
            {isDisabled ? 'Procesando...' : totalPayments > 1 ? `Aceptar (${totalPayments})` : 'Aceptar'}
          </button>
          <button
            onClick={handleRejectAll}
            className={`bg-red-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded hover:bg-red-600 transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isDisabled}
          >
            {isDisabled ? 'Procesando...' : 'Rechazar Todo'}
          </button>
        </div>
      </div>

      {showRejectModal && rejectType === 'partial' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" onClick={onCloseModal}>
          <div
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-red-600">
                    Rechazo Parcial
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Esta acción rechazará el comprobante seleccionado
                  </p>
                </div>
                <button
                  onClick={onCloseModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                  disabled={isDisabled}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-4 sm:p-6 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Motivo del rechazo
                </label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white disabled:opacity-50 disabled:bg-gray-50"
                  disabled={isDisabled}
                >
                  <option value="">Seleccione un motivo</option>
                  {[
                    "Imagen no legible",
                    "Comprobante ya utilizado",
                    "Imagen incorrecta o no válida",
                    "Otro (especificar)"
                  ].map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {selectedRejectReason === "Otro (especificar)" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Especifique el motivo
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describa detalladamente el motivo del rechazo..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                    rows={4}
                    disabled={isDisabled}
                  />
                  <p className="text-xs text-gray-500">
                    Caracteres: {customReason.length}
                  </p>
                </div>
              )}
            </div>

            {/* Footer fijo */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={onCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled}
                >
                  {isDisabled ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    'Confirmar Rechazo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTotalRejectModal && (
        <TotalRejectModal
          showModal={true}
          isLoading={isDisabled}
          selectedReason={selectedRejectReason}
          customReason={customReason}
          onClose={() => setShowTotalRejectModal(false)}
          onConfirm={handleTotalReject}
          setSelectedReason={setSelectedRejectReason}
          setCustomReason={setCustomReason}
        />
      )}
    </>
  );
};