import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { uploadVoucher } from '../../api/customerConsultationAPI';
import { useAuth } from '../../hooks/useAuth';
import { ClienteDesembolso } from '../../api/desembolsosApi';
import { AGENCIAS } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

const Notification = useNotifications();
interface SubirComprobanteDesembolsoModalProps {
  credito: ClienteDesembolso;
  onClose: () => void;
  onSuccess?: () => void;
}

const SubirComprobanteDesembolsoModal: React.FC<SubirComprobanteDesembolsoModalProps> = ({
  credito,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  /**
   * Función helper para obtener NOMBRE de agencia por ID
   * Igual que en geodileApi.ts y verificacionUbicacion.tsx
   */
  const obtenerNombreAgencia = (idAgencia: string): string => {
    if (!idAgencia) return 'SIN AGENCIA ASIGNADA';
    
    // Buscar directamente en el objeto AGENCIAS usando el ID
    const agenciasEntries = Object.entries(AGENCIAS);
    const agenciaEncontrada = agenciasEntries.find(([_, id]) => id === idAgencia);
    
    if (agenciaEncontrada) {
      return agenciaEncontrada[0]; // Retornar el NOMBRE (clave)
    }
    
    return `AGENCIA ID: ${idAgencia}`; // Fallback
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        Notification.warning('Por favor seleccione solo archivos de imagen (PNG, JPG, JPEG)');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Notification.warning('El archivo no debe superar 5MB');
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

  // Función para enviar el archivo
  const handleSubmit = async () => {
    if (!selectedFile) {
      Notification.warning('Por favor seleccione un archivo');
      return;
    }

    if (!user) {
      Notification.warning('Usuario no autenticado');
      return;
    }

    setIsLoading(true);

    try {
      // Obtener el nombre de la agencia desde el id_age del usuario
      const nombreAgencia = obtenerNombreAgencia(user.id_age || '');
      
      // Obtener fecha y hora actual
      const ahora = new Date();
      const FECHA_DESEMBOLSO = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
      const HORA_DESEMBOLSO = ahora.toTimeString().split(' ')[0]; // HH:MM:SS
      
      const voucherData = {
        DNI_SOCIO: credito.DATOS_SOCIO.DNI_SOCIO,
        PAGARE: credito.DATOS_DESEMBOLSO.PAGARE,
        AGENCIA: nombreAgencia, // ✅ CORREGIDO: usar nombre de agencia, no hardcodeado
        ANALISTA: user.dni,
        DATA: {
            nombre: credito.DATOS_SOCIO.RAZON,
            dni: credito.DATOS_SOCIO.DNI_SOCIO,
            pagare: credito.DATOS_DESEMBOLSO.PAGARE,
            agencia: credito.DATOS_RESPONSABLE.AGENCIA,
            producto: credito.DATOS_DESEMBOLSO.NOM_PROD,
            monto_aprobado: credito.DATOS_DESEMBOLSO.MONTO_APROB,
            monto_desembolsar: credito.DATOS_DESEMBOLSO.MONTO_NETO,
            analista: credito.DATOS_RESPONSABLE.ANALISTA,
            numero_cel_analista: credito.DATOS_RESPONSABLE.CELULAR,
            firmante: credito.DATOS_FIRMA.FIRMANTE,
            estado_firma: credito.DATOS_FIRMA.STATUS,
            email: credito.DATOS_FIRMA.EMAIL,
            fecha_creacion: credito.DATOS_FIRMA.FECHA_CREA,
            hora_creacion: credito.DATOS_FIRMA.HORA_CREA,
            fecha_validacion: credito.DATOS_FIRMA.FECHA_VALIDA,
            hora_validacion: credito.DATOS_FIRMA.HORA_VALIDA,
            titular_cuenta: credito.DATOS_BANCO.TITULAR,
            numero_cel_socio: credito.DATOS_FIRMA.CELULAR,
            banco: credito.DATOS_BANCO.BANCO,
            tipo_cuenta: credito.DATOS_BANCO.TIPO_CUENTA,
            numero_cuenta: credito.DATOS_BANCO.NUM_CUENTA,
            numero_cuenta_cci: credito.DATOS_BANCO.CCI,
            fecha_desembolso: FECHA_DESEMBOLSO,
            hora_desembolso: HORA_DESEMBOLSO
        }
      
      };

      const result = await uploadVoucher(voucherData, selectedFile);

      if (result.status) {
        Notification.success('Comprobante subido exitosamente');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.message || 'Error al subir comprobante');
      }

    } catch (error) {
      Notification.error('Error al enviar el archivo. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                📤 Subir Comprobante de Desembolso
              </h2>
              <p className="text-sm text-gray-600">
                Pagaré: {credito.DATOS_DESEMBOLSO.PAGARE}
              </p>
              <p className="text-sm text-gray-600">
                Cliente: {credito.DATOS_SOCIO.RAZON}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido principal */}
          <div className="space-y-4">
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
                      Tamaño: {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-cyan-600 hover:text-cyan-500">
                        Haga clic para seleccionar
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

            {/* Información del envío */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">Datos que se enviarán:</h3>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• DNI Socio: {credito.DATOS_SOCIO.DNI_SOCIO}</p>
                <p>• Pagaré: {credito.DATOS_DESEMBOLSO.PAGARE}</p>
                <p>• Agencia: {obtenerNombreAgencia(user?.id_age || '')}</p>
                <p>• Analista: {user?.dni || 'No disponible'}</p>
                <p>• Monto: S/ {credito.DATOS_DESEMBOLSO.MONTO_APROB}</p>
                <p>• Archivo: png o jpg</p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
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
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SubirComprobanteDesembolsoModal;