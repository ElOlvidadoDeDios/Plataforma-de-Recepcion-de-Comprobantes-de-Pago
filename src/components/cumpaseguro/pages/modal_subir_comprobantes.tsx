import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, ImageIcon, CheckCircle } from 'lucide-react';
import { Poliza } from '../types';

interface ModalSubirComprobanteProps {
  poliza: Poliza;
  onClose: () => void;
  onSubir: (poliza: Poliza, file: File) => Promise<void>;
}

const ModalSubirComprobante: React.FC<ModalSubirComprobanteProps> = ({ poliza, onClose, onSubir }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showReplace, setShowReplace] = useState<boolean>(false);

  // Verificar si ya existe un voucher cargado
  const voucherExistente = poliza.voucher?.status && poliza.voucher?.data?.voucher;
  const voucherUrl = voucherExistente ? poliza.voucher?.data?.voucher?.voucher_aws : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un comprobante de pago');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await onSubir(poliza, selectedFile);
      // El cierre del modal y actualización se manejan en el componente padre
    } catch (err: any) {
      setError(err.message || 'Error al subir el comprobante');
      setUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                Subir Comprobante de Pago
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {poliza.titular.nombres} {poliza.titular.apellido_paterno}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Información de la póliza */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Documento:</span>
                <p className="font-medium text-gray-900">{poliza.titular.nro_documento}</p>
              </div>
              <div>
                <span className="text-gray-600">Tipo de Atención:</span>
                <p className="font-medium text-gray-900">{poliza.titular.tipo_atencion}</p>
              </div>
              <div>
                <span className="text-gray-600">Costo:</span>
                <p className="font-medium text-gray-900">S/ {poliza.titular.costo.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600">Agencia:</span>
                <p className="font-medium text-gray-900">{poliza.agencia_nom}</p>
              </div>
            </div>
          </div>

          {/* Área de carga de archivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de Pago *
            </label>

            {/* Mostrar voucher existente */}
            {voucherExistente && !showReplace ? (
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                {/* Preview del voucher existente */}
                <div className="mb-4">
                  <img
                    src={voucherUrl || ''}
                    alt="Voucher cargado"
                    className="w-full h-64 object-contain bg-white rounded-lg border border-gray-200"
                  />
                </div>

                {/* Información del voucher */}
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Voucher ya cargado</p>
                    <p className="text-xs text-gray-500">
                      Estado: {poliza.voucher?.data?.voucher?.estado}
                    </p>
                    {poliza.voucher?.data?.fecha_local && (
                      <p className="text-xs text-gray-500">
                        Fecha: {poliza.voucher.data.fecha_local} {poliza.voucher.data.hora_local}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botón para reemplazar */}
                <div className="text-center">
                  <button
                    onClick={() => setShowReplace(true)}
                    disabled={uploading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    Reemplazar Voucher
                  </button>
                </div>
              </div>
            ) : !selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="voucher-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="voucher-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-sm text-gray-600 mb-1">
                    Haz clic para seleccionar una imagen
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, JPEG (máx. 5MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                {/* Preview de la imagen */}
                <div className="mb-4">
                  <img
                    src={previewUrl}
                    alt="Preview del comprobante"
                    className="w-full h-64 object-contain bg-white rounded-lg border border-gray-200"
                  />
                </div>

                {/* Información del archivo */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Opción para cambiar archivo */}
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="voucher-change"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="voucher-change"
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50"
                  >
                    Cambiar imagen
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || !selectedFile}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {voucherExistente && showReplace ? 'Reemplazando...' : 'Subiendo...'}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {voucherExistente && showReplace ? 'Reemplazar Voucher' : 'Subir Comprobante'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalSubirComprobante;
