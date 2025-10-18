import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClienteMora, creditAttentionApi } from '../../api/creditAttentionApi';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteMora | null;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  cliente
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mensaje predeterminado
const defaultMessage = cliente
  ? `🙋‍♀️ Estimado/a ${cliente.CREDITO_MORA.SOCIO}:
    📢 Le informamos que tu pago correspondiente al pagaré N° ${cliente.CREDITO_MORA.PAGARE} por un monto de S/ ${cliente.CREDITO_MORA.POR_PAGAR.toFixed(2)} con un atraso de ${cliente.CREDITO_MORA.DIAS_ATRASO} días. ⏰
    🙏 Agradecemos tu atención y te recomendamos realizar el pago a tiempo para evitar recargos. ⚠️

    💳 *Métodos de pago:*
    • 📱 *Billeteras de confianza:* (Yape / Plin)
      👉 Escanea el código QR adjunto para pagar fácilmente.
    • 🏦 *Transferencia bancaria:*

    🏦 *Cuentas Cooperativa DILE - Soles:*
        ─────────────────────
        *BANCO CONTINENTAL BBVA*
        👤 COOPERATIVA DE AHORRO Y CRÉDITO DILE  
        Cuenta Corriente: *0011-0200-0100089464-30*  
        CCI: *011-200-000100089464-30*

        *SCOTIABANK*
        👤 COOPERATIVA DE AHORRO Y CRÉDITO DE INTELECTUALES, LÍDERES Y EMPRESARIOS  
        Cuenta de Ahorros: *780-7794198*  
        CCI: *009-318-207807794198-71*

        💼 *Servicio de Recaudación BBVA*
        Nombre de Recaudo: COOPERATIVA DILE  
        Código de Recaudo: *14857*  
        Moneda: SOLES
        ──────────────────────

    ❓ Cualquier duda o inconveniente, no dudes en contactarnos. 📞 +51974768491  
    🤝 Atentamente,  
    *Cooperativa DILE*`
  : '';


  useEffect(() => {
    if (isOpen && cliente) {
      setMessage(defaultMessage);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen, cliente, defaultMessage]);

  // Función para formatear el número de teléfono con código de país
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remover espacios y caracteres especiales
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Si ya empieza con 51, devolverlo tal como está
    if (cleanNumber.startsWith('51')) {
      return cleanNumber;
    }
    
    // Si empieza con 9 (números de celular peruanos), agregar 51
    if (cleanNumber.startsWith('9') && cleanNumber.length === 9) {
      return `51${cleanNumber}`;
    }
    
    // Si no tiene código de país, agregar 51
    return `51${cleanNumber}`;
  };

  const handleSendMessage = async () => {
    if (!cliente || !message.trim()) {
      setErrorMessage('Debe ingresar un mensaje');
      return;
    }

    if (!cliente.CREDITO_MORA.CELULAR) {
      setErrorMessage('No se encontró número de celular para este cliente');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Usar número hardcodeado para pruebas, después usar el número formateado del cliente
      //const phoneNumber = "51931941085"; // Para pruebas
      const phoneNumber = formatPhoneNumber(cliente.CREDITO_MORA.CELULAR); // Para producción
      
      const response = await creditAttentionApi.sendWhatsAppMessage({
        number: phoneNumber,
        message: message.trim(),
        mediaUrl: "https://dile.com.pe/images/QR_dile_pagos.jpeg"
      });

      if (response.status === "ok") {
        setSuccessMessage('Mensaje enviado exitosamente');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMessage(response.message || 'Error al enviar el mensaje');
      }
    } catch (error: any) {
      setErrorMessage('Error al enviar el mensaje. Verifique la conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && cliente && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 sm:p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Enviar Mensaje WhatsApp</h2>
                      <p className="text-white/80 text-sm">
                        {cliente.CREDITO_MORA.SOCIO} - {cliente.CREDITO_MORA.CELULAR}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Información del cliente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Información del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Cliente:</span>
                      <p className="font-medium">{cliente.CREDITO_MORA.SOCIO}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Pagaré:</span>
                      <p className="font-medium">{cliente.CREDITO_MORA.PAGARE}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Cuotas por pagar:</span>
                      <p className="font-medium">{cliente.CREDITO_MORA.CUOTAS_PAGAR}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Monto pendiente:</span>
                      <p className="font-medium text-red-600">S/ {cliente.CREDITO_MORA.POR_PAGAR.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Información sobre la imagen QR */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Se incluirá imagen QR de pagos</h4>
                      <p className="text-sm text-blue-600">La imagen QR será enviada junto con el mensaje</p>
                    </div>
                  </div>
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mensaje que acompañará la imagen:
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                    placeholder="Escriba su mensaje aquí..."
                  />
                  <p className="text-xs text-gray-500">
                    Caracteres: {message.length}
                  </p>
                </div>

                {/* Mensajes de estado */}
                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800 font-medium">{successMessage}</span>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800 font-medium">{errorMessage}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones - Fixed at bottom */}
              <div className="flex-shrink-0 bg-white p-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                        <span>Enviar</span>
                      </>
                    )}
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

export default WhatsAppModal;