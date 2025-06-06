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
}) => {
  const [showTotalRejectModal, setShowTotalRejectModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isPending) {
    return (
      <div className="p-4 border-t border-gray-200 bg-white mt-auto">
        <div className="text-center text-gray-600">
          Este pago ya ha sido {isPending ? 'pendiente' : 'procesado'}
        </div>
      </div>
    );
  }

  const handleRejectAll = () => {
    // Solo verificar que todos los vouchers pendientes tengan sus campos completos
    const pendingVouchers = paymentDetails.filter(detail => detail.estado === 'pendiente');
    const incompleteVouchers = pendingVouchers.filter(
      voucher => !voucher.montoPago || !voucher.nroOperacion || !voucher.tipoOperacion
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

  return (
    <>
      <div className="p-3 border-t border-gray-200 bg-white mt-auto space-y-3">
        {errorMessage && <ErrorMessage message={errorMessage} />}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Monto Total:
            </label>
            <input
              type="text"
              value={`S/ ${totalMonto}`}
              readOnly
              className="w-full sm:w-32 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              title="El monto total se calcula automáticamente sumando los montos individuales de cada voucher"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setErrorMessage('');
                try {
                  await onAcceptStatus();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : 'Error al procesar la aceptación');
                }
              }}
              className={`bg-green-500 text-white px-3 py-1.5 text-sm rounded hover:bg-green-600 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : totalPayments > 1 ? `Aceptar (${totalPayments})` : 'Aceptar'}
            </button>
            <button
              onClick={handleRejectAll}
              className={`bg-red-500 text-white px-3 py-1.5 text-sm rounded hover:bg-red-600 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : 'Rechazar Todo'}
            </button>
          </div>
        </div>
      </div>

      {showRejectModal && rejectType === 'partial' && (
        <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onCloseModal}>
          <div 
            className="fixed inset-0 flex items-center justify-center"
            style={{ top: `${window.scrollY}px` }}
          >
            <div
              className="bg-white w-[90%] max-w-md mx-auto relative p-6 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                Rechazo Parcial
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Esta acción rechazará el comprobante seleccionado.
                </p>
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm mb-4">
                    {errorMessage}
                  </div>
                )}
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 bg-white"
                  disabled={isLoading}
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
                {selectedRejectReason === "Otro (especificar)" && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Especifique el motivo del rechazo"
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={onCloseModal}
                    className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!selectedRejectReason) {
                        setErrorMessage('Debe seleccionar un motivo de rechazo');
                        return;
                      }
                      if (selectedRejectReason === "Otro (especificar)" && !customReason.trim()) {
                        setErrorMessage('Debe especificar el motivo del rechazo');
                        return;
                      }

                      const finalReason = selectedRejectReason === "Otro (especificar)"
                        ? customReason.trim()
                        : selectedRejectReason.trim();

                      setErrorMessage('');
                      onUpdateStatus('rechazado', {
                        montoTotal: '0',
                        vouchers: [],
                        motivo_rechazo: finalReason
                      }, 0);
                    }}
                    className={`px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTotalRejectModal && (
        <TotalRejectModal
          showModal={true}
          isLoading={isLoading}
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