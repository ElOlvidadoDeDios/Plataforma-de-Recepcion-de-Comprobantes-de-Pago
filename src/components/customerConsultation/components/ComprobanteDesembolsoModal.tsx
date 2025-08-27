import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DetalleCredito, ClienteResponse, checkVoucherExists, uploadVoucher } from '../../../api/customerConsultationAPI';
import { useAuth } from '../../../hooks/useAuth';

interface ComprobanteDesembolsoModalProps {
  credito: DetalleCredito;
  clientData: ClienteResponse;
  onClose: () => void;
  readOnly?: boolean; // Nuevo prop para modo solo lectura
}

const ComprobanteDesembolsoModal: React.FC<ComprobanteDesembolsoModalProps> = ({
  credito,
  clientData,
  onClose,
  readOnly = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [voucherExists, setVoucherExists] = useState<boolean>(false);
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [checkingVoucher, setCheckingVoucher] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Verificar si el voucher ya existe - Ahora usa el backend NestJS
  const checkVoucherExistsHandler = async () => {
    try {
      setCheckingVoucher(true);
      const result = await checkVoucherExists(
        clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
        credito.ID_PRESTAMO
      );



      // Si la API devuelve exists: true, significa que el voucher existe
      if (result.exists) {
        setVoucherExists(true);
        setVoucherUrl(result.url || ''); // Usar el URL si está disponible

      } else {
        setVoucherExists(false);
        setVoucherUrl('');

      }
    } catch (error) {

      // Si hay error, asumir que no existe
      setVoucherExists(false);
      setVoucherUrl('');
    } finally {
      setCheckingVoucher(false);
    }
  };

  // Verificar voucher al cargar el componente
  useEffect(() => {
    checkVoucherExistsHandler();
  }, []);

  // Manejar selección de archivo
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar si ya existe un voucher antes de procesar
      await checkVoucherExistsHandler();
      
      // Si después de verificar resulta que existe, no permitir subir
      if (voucherExists) {
        alert('El comprobante ya existe para este préstamo. No se puede subir un archivo nuevo.');
        if (event.target) {
          event.target.value = '';
        }
        return;
      }

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione solo archivos de imagen (PNG, JPG, JPEG)');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para enviar el archivo - Ahora usa el backend NestJS
  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Por favor seleccione un archivo');
      return;
    }

    if (!user) {
      alert('Usuario no autenticado');
      return;
    }

    setIsLoading(true);

    try {
      const voucherData = {
        DNI_SOCIO: clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
        PAGARE: credito.ID_PRESTAMO,
        AGENCIA: credito.AGENCIA,
        ANALISTA: user.dni
      };

      const result = await uploadVoucher(voucherData, selectedFile);

      if (result.status) {
        // Limpiar formulario pero no cambiar estado hasta verificar
        setSelectedFile(null);
        setPreviewImage('');
        
        // Verificar después de un breve delay para confirmar que realmente se guardó
        setTimeout(async () => {
          await checkVoucherExistsHandler();
          setIsLoading(false);
        }, 1500);
        
        // No cerrar inmediatamente para mostrar el resultado
        // onClose();
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      setIsLoading(false);
      alert('Error al enviar el archivo. Por favor intente nuevamente.');
    }
  };

  // Función para ver el comprobante existente
  const handleViewVoucher = () => {
    if (voucherUrl && voucherUrl.trim() !== '') {
      window.open(voucherUrl, '_blank');
    } else {
      alert('La URL del comprobante no está disponible en este momento. Por favor, contacte al administrador.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold ${voucherExists ? 'text-green-800' : 'text-gray-800'}`}>
                {readOnly
                  ? (voucherExists ? '✅ Comprobante de Desembolso' : '📋 Estado del Comprobante')
                  : (voucherExists ? '✅ Comprobante de Desembolso' : ' Subir Comprobante de Desembolso')
                }
              </h2>
              <p className="text-sm text-gray-600">
                Préstamo: {credito.ID_PRESTAMO}
              </p>
              <p className="text-sm text-gray-600">
                Cliente: {clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO}
              </p>
              {voucherExists && (
                <p className="text-sm text-green-600 font-semibold">
                  ✅ Comprobante ya enviado exitosamente
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={`${voucherExists ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido principal */}
          <div className="space-y-4">
            {checkingVoucher ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600">Verificando comprobante...</span>
              </div>
            ) : voucherExists ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-green-600 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Comprobante ya enviado
                </h3>
                <p className="text-sm text-green-600 mb-4">
                  El comprobante de desembolso para este préstamo ya ha sido subido anteriormente.
                </p>
                <button
                  onClick={handleViewVoucher}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Ver Comprobante
                </button>
              </div>
            ) : readOnly ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-600 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Desembolso aún no realizado
                </h3>
                <p className="text-sm text-yellow-600 mb-4">
                  Este préstamo aún no ha sido desembolsado, por lo que no hay comprobante disponible.
                </p>
                <p className="text-xs text-yellow-500">
                  El comprobante estará disponible una vez que se realice el desembolso.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar comprobante de transferencia
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <div className="space-y-2">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-40 mx-auto rounded"
                      />
                      <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                      <p className="text-xs text-gray-500">
                        Tamaño: {(selectedFile?.size || 0 / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className={`mx-auto h-12 w-12 ${voucherExists ? 'text-green-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <span className={`font-medium ${voucherExists ? 'text-green-600' : 'text-cyan-600 hover:text-cyan-500'}`}>
                          {voucherExists ? 'Comprobante ya existe' : 'Haga clic para seleccionar'}
                        </span>
                        <p className="text-xs mt-1">PNG, JPG, JPEG hasta 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Información del envío */}
            {!voucherExists && !readOnly && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-700 mb-2">Datos que se enviarán:</h3>
                <div className="text-xs text-blue-600 space-y-1">
                  <p>• DNI Socio: {clientData.INFO_SOCIO.DATOS_PERSONALES.DNI}</p>
                  <p>• Pagaré: {credito.ID_PRESTAMO}</p>
                  <p>• Agencia: {credito.AGENCIA} </p>
                  <p>• Analista: {user?.dni || 'No disponible'}</p>
                  <p>• Archivo: png o jpg</p>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {voucherExists ? 'Cerrar' : 'Cancelar'}
            </button>
            {!voucherExists && !readOnly && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Subir Comprobante'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ComprobanteDesembolsoModal;