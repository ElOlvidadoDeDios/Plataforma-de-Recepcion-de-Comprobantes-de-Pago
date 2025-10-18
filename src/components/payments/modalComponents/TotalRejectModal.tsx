import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
    {message}
  </div>
);

interface TotalRejectModalProps {
  showModal: boolean;
  isLoading: boolean;
  selectedReason: string;
  customReason: string;
  onClose: () => void;
  onConfirm: () => void;
  setSelectedReason: (value: string) => void;
  setCustomReason: (value: string) => void;
}

const rejectReasons = [
  "Imagen no legible",
  "Comprobante ya utilizado",
  "Imagen incorrecta o no válida",
  "Otro (especificar)"
];

export const TotalRejectModal: React.FC<TotalRejectModalProps> = ({
  showModal,
  isLoading,
  selectedReason,
  customReason,
  onClose,
  onConfirm,
  setSelectedReason,
  setCustomReason
}) => {
  const [errorMessage, setErrorMessage] = useState('');
  
  if (!showModal) return null;

  const handleConfirm = () => {
    if (!selectedReason) {
      setErrorMessage('Debe seleccionar un motivo de rechazo');
      return;
    }
    
    if (selectedReason === "Otro (especificar)" && !customReason.trim()) {
      setErrorMessage('Debe especificar el motivo de rechazo');
      return;
    }

    setErrorMessage('');
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-red-600">
                Rechazo Total de Pagos
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Esta acción rechazará todos los comprobantes pendientes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              disabled={isLoading}
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
            <ErrorMessage message={errorMessage} />
          )}
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Motivo del rechazo
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white disabled:opacity-50 disabled:bg-gray-50"
              disabled={isLoading}
            >
              <option value="">Seleccione un motivo</option>
              {rejectReasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {selectedReason === "Otro (especificar)" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Especifique el motivo
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describa detalladamente el motivo del rechazo..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                rows={4}
                disabled={isLoading}
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
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                'Confirmar Rechazo Total'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};