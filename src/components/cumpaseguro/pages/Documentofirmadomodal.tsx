import React from 'react';
import { createPortal } from 'react-dom';
import { Poliza } from '../types';

interface DocumentoFirmadoModalProps {
  polizaActual: Poliza | null;
  documentoUrl: string;
  loadingDocumento: boolean;
  mensajeDocumento: string;
  documentoFirmado: boolean;
  verificandoFirma: boolean;
  anulandoPoliza: boolean;
  onVerificar: () => void;
  onAnular: () => void;
  onClose: () => void;
}

const DocumentoFirmadoModal: React.FC<DocumentoFirmadoModalProps> = ({
  polizaActual,
  documentoUrl,
  loadingDocumento,
  mensajeDocumento,
  documentoFirmado,
  verificandoFirma,
  anulandoPoliza,
  onVerificar,
  onAnular,
  onClose,
}) => {
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Documento de Contrato</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {loadingDocumento ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando documento...</p>
              </div>
            </div>
          ) : mensajeDocumento ? (
            <div className="flex items-center justify-center h-full bg-yellow-50">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-gray-500 text-sm mt-4">Por favor, espere a que el documento sea firmado digitalmente.</p>
              </div>
            </div>
          ) : documentoUrl ? (
            <iframe
              src={documentoUrl}
              className="w-full h-full"
              title="Documento de Contrato"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No se pudo cargar el documento</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => documentoUrl && window.open(documentoUrl, '_blank')}
              disabled={!documentoUrl}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Abrir en nueva pestaña
            </button>

            {/* Badge: Documento Validado (cuando status = "signed") */}
            {polizaActual?.firma?.data?.firm_easy?.status === 'signed' && (
              <span className="px-4 py-2 bg-green-100 text-green-800 border border-green-300 rounded font-semibold">
                ✅ Documento Validado
              </span>
            )}

            {/* Badge: Documento Firmado pero pendiente de validación */}
            {documentoFirmado && polizaActual?.firma?.data?.firm_easy?.status !== 'signed' && (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300 rounded font-semibold">
                📝 Documento Firmado - Pendiente Validación
              </span>
            )}

            {/* Badge: Pendiente de Firma */}
            {!documentoFirmado && mensajeDocumento && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded font-semibold text-sm">
                ⏳ Pendiente de Firma
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {/* Solo mostrar botones si el documento está firmado (documentoFirmado) y NO está validado (status !== "signed") */}
            {documentoFirmado && polizaActual?.firma?.data?.firm_easy?.status !== 'signed' && (
              <>
                {/* Botón Validar Documento */}
                <button
                  onClick={onVerificar}
                  disabled={verificandoFirma || anulandoPoliza}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {verificandoFirma ? 'Validando...' : '✔️ Validar Documento'}
                </button>

                {/* Botón Anular/Deshabilitar */}
                <button
                  onClick={onAnular}
                  disabled={verificandoFirma || anulandoPoliza}
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {anulandoPoliza ? 'Anulando...' : '❌ Deshabilitar Documento'}
                </button>
              </>
            )}

            {/* Botón Validar Firma (cuando NO está firmado aún) */}
            {!documentoFirmado && polizaActual?.firma?.data?.firm_easy?.status !== 'signed' && (
              <button
                onClick={onVerificar}
                disabled={verificandoFirma || loadingDocumento || !!mensajeDocumento || anulandoPoliza}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                title={mensajeDocumento ? 'No se puede verificar hasta que el documento esté disponible' : ''}
              >
                {verificandoFirma ? 'Validando...' : '🔄 Validar Firma'}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={verificandoFirma || anulandoPoliza}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DocumentoFirmadoModal;