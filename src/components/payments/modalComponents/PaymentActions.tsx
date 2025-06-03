import React from 'react';
import { motion } from 'framer-motion';

interface PaymentActionsProps {
  totalMonto: string;
  onMontoTotalChange: (value: string) => void;
  isPending: boolean;
  isLoading: boolean;
  isMobile: boolean;
  totalPayments: number;
  showRejectModal: boolean;
  selectedRejectReason: string;
  customReason: string;
  rejectType: 'partial' | 'total';
  onUpdateStatus: (estado: 'aceptado' | 'rechazado', data: {
    montoTotal: string;
    vouchers: {
      identificacion: { dni: string; fecha: string; hora: string; indice: number };
      detalles: { montoPago: string; nroOperacion: string; tipoOperacion: string };
    }[];
    motivo_rechazo?: string;
  }, indice: number) => void;
  onReject: () => void;
  onCloseModal: () => void;
  onConfirmReject: (rejectType: 'partial' | 'total') => void;
  setSelectedRejectReason: (value: string) => void;
  setCustomReason: (value: string) => void;
}

const rejectReasons = [
  "Imagen no legible",
  "Comprobante ya utilizado",
  "Imagen incorrecta o no válida",
  "Otro (especificar)"
];

export const PaymentActions: React.FC<PaymentActionsProps> = ({
  isPending,
  isLoading,
  totalPayments,
  showRejectModal,
  selectedRejectReason,
  customReason,
  rejectType,
  onUpdateStatus,
  onReject,
  onCloseModal,
  onConfirmReject,
  setSelectedRejectReason,
  setCustomReason,
  totalMonto,
  onMontoTotalChange,
}) => {
  if (!isPending) {
    return (
      <div className="p-4 border-t border-gray-200 bg-white mt-auto">
        <div className="text-center text-gray-600">
          Este pago ya ha sido {isPending ? 'pendiente' : 'procesado'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3 border-t border-gray-200 bg-white mt-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Monto Total:
            </label>
            <input
              type="number"
              step="0.01"
              value={totalMonto}
              onChange={(e) => onMontoTotalChange(e.target.value)}
              className="w-full sm:w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdateStatus('aceptado', {
                montoTotal: totalMonto,
                vouchers: []  // Se manejan en el modal principal
              }, 0);
            }}
            className={`bg-green-500 text-white px-3 py-1.5 text-sm rounded hover:bg-green-600 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : totalPayments > 1 ? `Aceptar (${totalPayments})` : 'Aceptar'}
          </button>
          <button
            onClick={() => {
              onConfirmReject('total'); // Establecer como rechazo total
              onReject(); // Abrir modal de rechazo
            }}
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

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onCloseModal}>
          <div 
            className="fixed inset-0 flex items-center justify-center"
            style={{ top: `${window.scrollY}px` }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-[90%] max-w-md mx-auto relative p-6 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                Motivo de Rechazo ({rejectType === 'partial' ? 'Rechazo Parcial' : 'Rechazo Total'})
              </h3>
              <div className="space-y-4">
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 bg-white"
                  disabled={isLoading}
                >
                  <option value="">Seleccione un motivo</option>
                  {rejectReasons.map((reason) => (
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
                    onClick={() => {
                      const finalReason = selectedRejectReason === "Otro (especificar)"
                        ? customReason.trim()
                        : selectedRejectReason.trim();

                      if (!finalReason) {
                        return;
                      }

                      onUpdateStatus('rechazado', {
                        montoTotal: '0',
                        vouchers: [],  // Los vouchers se manejan en el modal principal
                        motivo_rechazo: finalReason
                      }, 0);
                    }}
                    className={`px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : `Confirmar ${rejectType === 'partial' ? 'Rechazo Parcial' : 'Rechazo Total'}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
};