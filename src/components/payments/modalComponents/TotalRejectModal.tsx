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
    <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose}>
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
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            Rechazo Total de Pagos
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Esta acción rechazará todos los comprobantes pendientes con el mismo motivo.
          </p>
          <div className="space-y-4">
            {errorMessage && (
              <ErrorMessage message={errorMessage} />
            )}
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 bg-white"
              disabled={isLoading}
            >
              <option value="">Seleccione un motivo</option>
              {rejectReasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            {selectedReason === "Otro (especificar)" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Especifique el motivo del rechazo"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                disabled={isLoading}
              />
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : 'Confirmar Rechazo Total'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};