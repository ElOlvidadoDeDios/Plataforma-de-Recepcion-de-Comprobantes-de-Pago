import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DetalleCredito, ClienteResponse } from '../../../api/customerConsultationAPI';
import { obtenerUrlFirmada, verificarDocumentoFirmado, verDocumentoFirmado, deshabilitarDocumentoFirmado } from '../../../api/firmaDigitalApi';
import { captureDeviceInfo } from '../../../utils/deviceInfo';
import { isOtorgaToday, getOtorgaErrorMessage } from '../../../utils/dateValidation';

interface ValidarContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  credito: DetalleCredito;
  clientData: ClienteResponse;
  userDni: string;
  onValidar?: (credito: DetalleCredito) => void;
  onRechazar?: (credito: DetalleCredito, motivo: string) => void;
  onRefreshData?: () => void;
}

const ValidarContratoModal = ({
  isOpen,
  onClose,
  credito,
  clientData,
  userDni,
  onValidar,
  onRechazar,
  onRefreshData
}: ValidarContratoModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingValidar, setLoadingValidar] = useState(false);
  const [loadingRechazar, setLoadingRechazar] = useState(false);
  const [loadingDeshabilitar, setLoadingDeshabilitar] = useState(false);
  const [contratoUrl, setContratoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  // Cargar la URL del contrato al abrir el modal usando verDocumentoFirmado
  const cargarContrato = async () => {
    if (!credito.FIRM_DIGITAL?.ID_DOCUMENT) {
      setError('No hay documento para mostrar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Capturar información del dispositivo para el endpoint
      const deviceInfo = await captureDeviceInfo(`ver_documento_${credito.ID_PRESTAMO}`);

      // Primero llamar a verDocumentoFirmado para obtener el documento actualizado
      const verResponse = await verDocumentoFirmado({
        ID_DOCUMENT_FIRM: credito.FIRM_DIGITAL.ID_DOCUMENT,
        PAGARE: credito.ID_PRESTAMO,
        AGENCIA: credito.AGENCIA,
        USER: userDni || 'dni no identificado',
        INFO_DESK: deviceInfo
      } as any);

      if (verResponse.success && verResponse.data) {
        // Si hay URL_SIGNED_FILE en la respuesta o en los datos originales
        const urlFirmada = verResponse.data.URL_SIGNED_FILE || credito.FIRM_DIGITAL?.URL_SIGNED_FILE;
        
        if (urlFirmada) {
          // Intentar obtener la URL pública usando obtenerUrlFirmada
          const urlResponse = await obtenerUrlFirmada({
            URL: urlFirmada
          });

          if (urlResponse.success && urlResponse.url) {
            setContratoUrl(urlResponse.url);
          } else {
            // Si falla, usar la URL original
            setContratoUrl(urlFirmada);
          }
        } else {
          setError('El contrato aún no ha sido firmado. No hay documento para visualizar.');
        }
      } else {
        setError('No se pudo cargar el documento. Puede que aún no esté disponible.');
      }
    } catch (err) {
      setError('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  // Cargar contrato cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      cargarContrato();
    }
  }, [isOpen]);

  // Función para validar el contrato
  const handleValidar = async () => {
    // 🔴 VALIDACIÓN NUEVA: Verificar que OTORGA sea HOY
    if (!isOtorgaToday(credito.OTORGA)) {
      showNotification(getOtorgaErrorMessage(credito.OTORGA), 'error');
      return;
    }

    if (!credito.FIRM_DIGITAL?.ID_DOCUMENT) {
      showNotification('No hay documento para validar', 'error');
      return;
    }

    setLoadingValidar(true);

    try {
      // Capturar información del dispositivo
      const deviceInfo = await captureDeviceInfo(`validacion_contrato_${credito.ID_PRESTAMO}`);

      // Llamar al endpoint de verificación
      const response = await verificarDocumentoFirmado({
        ID_DOCUMENT_FIRM: credito.FIRM_DIGITAL.ID_DOCUMENT,
        PAGARE: credito.ID_PRESTAMO,
        AGENCIA: credito.AGENCIA,
        USER: userDni || 'dni no identificado',
        INFO_DESK: [deviceInfo]
      } as any);

      if (response.success) {
        if (response.data && response.data.status === false) {
          showNotification(response.data.message || 'El documento aún no ha sido firmado', 'info');
        } else {
          showNotification('Contrato validado exitosamente', 'success');
          
          if (onValidar) {
            onValidar(credito);
          }
          
          // Refrescar datos
          if (onRefreshData) {
            setTimeout(() => {
              onRefreshData();
            }, 500);
          }
          
          // Cerrar modal después de un momento
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        showNotification(`Error al validar el contrato: ${response.message}`, 'error');
      }
    } catch (err) {
      showNotification('Error al validar el contrato', 'error');
    } finally {
      setLoadingValidar(false);
    }
  };

  // Función para rechazar el contrato
  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      showNotification('Debe ingresar un motivo de rechazo', 'error');
      return;
    }

    setLoadingRechazar(true);

    try {
      // Aquí se llamaría al endpoint de rechazo
      // Por ahora simulamos la acción
      
      if (onRechazar) {
        onRechazar(credito, motivoRechazo);
      }
      
      showNotification('Contrato rechazado', 'success');
      
      // Refrescar datos
      if (onRefreshData) {
        setTimeout(() => {
          onRefreshData();
        }, 500);
      }
      
      // Cerrar modales
      setShowRechazarModal(false);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      showNotification('Error al rechazar el contrato', 'error');
    } finally {
      setLoadingRechazar(false);
    }
  };

  // Función para deshabilitar el documento firmado
  const handleDeshabilitarDocumento = async () => {
    if (!credito.FIRM_DIGITAL?.ID_DOCUMENT) {
      showNotification('No hay documento para deshabilitar', 'error');
      return;
    }

    // Confirmar la acción con el usuario
    if (!window.confirm('¿Está seguro de que desea deshabilitar este documento firmado? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoadingDeshabilitar(true);

    try {
      // Llamar al endpoint de deshabilitar documento
      const response = await deshabilitarDocumentoFirmado({
        PAGARE: credito.ID_PRESTAMO,
        ID_DOCUMENT: credito.FIRM_DIGITAL.ID_DOCUMENT
      });

      if (response.success) {
        showNotification('Documento deshabilitado exitosamente', 'success');
        
        // Refrescar datos
        if (onRefreshData) {
          setTimeout(() => {
            onRefreshData();
          }, 500);
        }
        
        // Cerrar modal después de un momento
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showNotification(`Error al deshabilitar el documento: ${response.message}`, 'error');
      }
    } catch (err) {
      showNotification('Error al deshabilitar el documento', 'error');
    } finally {
      setLoadingDeshabilitar(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotificationMessage(null);
    }, 3000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Validar Contrato</h2>
            <p className="text-sm text-blue-100">
              Préstamo: {credito.ID_PRESTAMO} | Cliente: {clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRES}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Información del contrato */}
        <div className="bg-blue-50 px-4 sm:px-6 py-3 border-b border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                PENDIENTE DE FIRMA
              </span>
            </div>
            <div>
              <span className="text-gray-600">Monto:</span>
              <span className="ml-2 font-semibold">S/ {credito.MONTO}</span>
            </div>
            <div>
              <span className="text-gray-600">Producto:</span>
              <span className="ml-2 font-semibold">{credito.PRODUCTO || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Agencia:</span>
              <span className="ml-2 font-semibold">{credito.AGENCIA}</span>
            </div>
          </div>
        </div>

        {/* Contenido - Visualización del contrato */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando contrato...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-2">Contrato Pendiente de Firma</p>
              <p className="text-gray-500 text-sm max-w-md">
                {error}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Use el botón "Validar" para verificar si el cliente ya firmó el documento.
              </p>
            </div>
          ) : contratoUrl ? (
            <div className="w-full h-[60vh] border rounded-lg overflow-hidden">
              <iframe
                src={contratoUrl}
                className="w-full h-full"
                title="Vista previa del contrato"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-2">Documento en Proceso</p>
              <p className="text-gray-500 text-sm max-w-md">
                El contrato ha sido generado y enviado al cliente para su firma.
                Use el botón "Validar" para verificar el estado de la firma.
              </p>
            </div>
          )}
        </div>

        {/* Notificación */}
        {notificationMessage && (
          <div className={`mx-4 sm:mx-6 mb-4 p-4 rounded-lg ${
            notificationType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            notificationType === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {notificationType === 'success' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notificationType === 'error' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {notificationType === 'info' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              <span>{notificationMessage}</span>
            </div>
          </div>
        )}

        {/* Footer con botones de acción */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row gap-3 justify-end">
          {/* Advertencia de fecha de otorga */}
          {!isOtorgaToday(credito.OTORGA) && (
            <div className="w-full flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                ⚠️ La fecha de otorga ({new Date(credito.OTORGA).toLocaleDateString('es-PE')}) no es hoy. Los contratos solo se pueden validar el día de otorga.
              </span>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={handleDeshabilitarDocumento}
            disabled={loadingDeshabilitar || loadingValidar}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:bg-red-300 flex items-center justify-center"
          >
            {loadingDeshabilitar ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deshabilitando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                Deshabilitar Doc Firmado
              </>
            )}
          </button>
          <button
            onClick={handleValidar}
            disabled={loadingValidar || loadingDeshabilitar || !isOtorgaToday(credito.OTORGA)}
            title={!isOtorgaToday(credito.OTORGA) ? getOtorgaErrorMessage(credito.OTORGA) : 'Validar contrato'}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loadingValidar ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verificando...
              </>
            ) : !isOtorgaToday(credito.OTORGA) ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 2.523a6 6 0 008.367 8.367z" clipRule="evenodd" />
                </svg>
                No disponible hoy
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verificar Documento Firmado
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Rechazo */}
      {showRechazarModal && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRechazarModal(false);
              setMotivoRechazo('');
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-500 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-bold">Rechazar Contrato</h3>
              <p className="text-sm text-red-100">Préstamo: {credito.ID_PRESTAMO}</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Por favor, indique el motivo del rechazo del contrato:
              </p>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Escriba el motivo del rechazo..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={() => {
                  setShowRechazarModal(false);
                  setMotivoRechazo('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={loadingRechazar || !motivoRechazo.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 flex items-center"
              >
                {loadingRechazar ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  'Confirmar Rechazo'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};

export default ValidarContratoModal;
