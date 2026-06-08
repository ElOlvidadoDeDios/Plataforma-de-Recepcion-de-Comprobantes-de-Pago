import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (codigo: string) => Promise<void>;
  isValidating: boolean;
  errorMessage: string;
  solicitudNumero: string;
}

const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  isValidating,
  errorMessage,
  solicitudNumero
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Focus en el primer input al abrir
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      
      // Limpiar OTP al abrir
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    // Solo números
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-validar cuando se complete el código
    if (index === 5 && value) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        onValidate(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Si está vacío, retroceder al anterior
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullCode = otp.join('');
      if (fullCode.length === 6) {
        onValidate(fullCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Solo números y máximo 6 dígitos
    if (/^\d{1,6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus en el siguiente input vacío o el último
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Auto-validar si se pegó un código completo
      if (digits.length === 6) {
        onValidate(newOtp.join(''));
      }
    }
  };

  const handleClose = () => {
    if (!isValidating) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Verificación OTP</h2>
                      <p className="text-white/80 text-sm">Solicitud: {solicitudNumero}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleClose}
                    disabled={isValidating}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Info */}
                <div className="text-center space-y-2">
                  <p className="text-gray-700 font-medium">
                    Se ha enviado un código de 6 dígitos a tu WhatsApp
                  </p>
                  <p className="text-gray-500 text-sm">
                    Ingresa el código para continuar con la aprobación
                  </p>
                </div>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={isValidating}
                      className={`
                        w-12 h-14 text-center text-2xl font-bold rounded-lg
                        border-2 transition-all
                        focus:outline-none focus:ring-2 focus:ring-cyan-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${digit 
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700' 
                          : 'border-gray-300 bg-white text-gray-700'
                        }
                        ${errorMessage 
                          ? 'border-red-500 bg-red-50' 
                          : ''
                        }
                      `}
                    />
                  ))}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                    >
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-700 text-sm flex-1">{errorMessage}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading State */}
                {isValidating && (
                  <div className="flex items-center justify-center gap-2 text-cyan-600">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Validando código...</span>
                  </div>
                )}

                {/* Help Text */}
                <div className="text-center space-y-2">
                  <p className="text-gray-500 text-xs">
                    ¿No recibiste el código?
                  </p>
                  <button
                    onClick={handleClose}
                    disabled={isValidating}
                    className="text-cyan-600 hover:text-cyan-700 text-sm font-medium underline disabled:opacity-50"
                  >
                    Solicitar nuevo código
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default OtpModal;
