import { ReactElement, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNotifications } from '../../../hooks/useNotifications';
import { uploadAllFilesAtOnce, UploadFileData } from '../../../api/registroDeclientesApi';
import { DatosCertificado } from '../../../types/clienteData';
import afiliacionApi from '../../../api/afiliacionAPi';

interface ModalSubirDocumentosProps {
  onClose: () => void;
  datosCertificado?: DatosCertificado;
  onUploadSuccess?: () => void;
}

interface UploadedFiles {
  LINK_DNI_FRONTAL?: string
  LINK_DNI_POSTERIOR?: string
  LINK_VOUCHER_AFI?: string
}

export function ModalSubirDocumentos({
  onClose,
  datosCertificado,
  onUploadSuccess,
}: ModalSubirDocumentosProps): ReactElement {
  const Notification = useNotifications()

  const [dniFrontalFile, setDniFrontalFile] = useState<File | null>(null)
  const [dniReversoFile, setDniReversoFile] = useState<File | null>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [dniFrontalPreview, setDniFrontalPreview] = useState<string | null>(null)
  const [dniReversoPreview, setDniReversoPreview] = useState<string | null>(null)
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // Estado para mostrar URLs después de subir
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles | null>(null)
  const [showUploadSuccess, setShowUploadSuccess] = useState(false)

  const cliente = datosCertificado?.cliente
  const codUserOriginal = datosCertificado?.codUserOriginal
  const ageOriginal = datosCertificado?.ageOriginal

  // ── Helpers ────────────────────────────────────────────────────

  const createPreview = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileChange = async (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void,
  ) => {
    setFile(file)
    if (file) {
      const preview = await createPreview(file)
      setPreview(preview)
    } else {
      setPreview(null)
    }
  }

  // ── Submit ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!dniFrontalFile || !dniReversoFile || !paymentFile) {
      Notification.info('Por favor selecciona todos los archivos requeridos en el orden correcto')
      return
    }

    if (!cliente?.DOC_IDEN || !ageOriginal || !codUserOriginal) {
      Notification.error('Error: Faltan datos necesarios (DNI, agencia o analista).')
      return
    }

    setIsUploading(true)

    try {
      const uploadData: UploadFileData = {
        DNI_SOCIO: cliente.DOC_IDEN,
        AGENCIA: ageOriginal,
        ANALISTA: codUserOriginal,
      }

      const result = await uploadAllFilesAtOnce(uploadData, {
        dniFrontal: dniFrontalFile,
        dniReverso: dniReversoFile,
        voucher: paymentFile,
      })

      if (result.success) {
        Notification.success('✅ ¡Comprobantes subidos exitosamente!')
        
        // ✅ NUEVO: Llamar al nuevo API para obtener los URLs
        try {
          const imgResponse = await afiliacionApi.getImgSocioNew(cliente.DOC_IDEN)
          
          if (imgResponse && imgResponse.link) {
            setUploadedFiles(imgResponse.link)
            setShowUploadSuccess(true)
          } else {
            // Si no obtiene URLs del nuevo API, mostrar igualmente éxito
            setShowUploadSuccess(true)
          }
        } catch (error) {
          // Mostrar éxito aunque no se obtengan URLs
          setShowUploadSuccess(true)
        }
        
        onUploadSuccess?.()
        
        // Cerrar el modal después de 3 segundos
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        throw new Error(result.error || 'Error desconocido al subir comprobantes')
      }
    } catch (error) {
      console.error('Error completo:', error)
      Notification.error(
        `❌ Error al subir comprobantes: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      )
    } finally {
      setIsUploading(false)
    }
  }

  // ── Campo de archivo reutilizable ──────────────────────────────

  const CampoArchivo = ({
    numero,
    label,
    color,
    preview,
    file,
    onFileChange,
    onClear,
  }: {
    numero: number
    label: string
    color: 'blue' | 'green' | 'orange'
    preview: string | null
    file: File | null
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
  }) => {
    const colores = {
      blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700',   input: 'border-blue-300 focus:border-blue-500' },
      green:  { border: 'border-green-200',  bg: 'bg-green-50',  text: 'text-green-700',  btn: 'bg-green-600 hover:bg-green-700', input: 'border-green-300 focus:border-green-500' },
      orange: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700', input: 'border-orange-300 focus:border-orange-500' },
    }
    const c = colores[color]

    return (
      <div className={`p-4 border-2 ${c.border} rounded-lg ${c.bg}`}>
        <label className={`block text-sm font-bold ${c.text} mb-2`}>
          <span className="inline-flex items-center gap-2">
            <span className={`${c.btn.split(' ')[0]} text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold`}>
              {numero}
            </span>
            {label}
          </span>
        </label>

        {!preview ? (
          <input
            type="file"
            accept="image/*"
            className={`w-full border-2 ${c.input} rounded p-3 focus:outline-none`}
            onChange={onFileChange}
          />
        ) : (
          <div className="relative">
            <div className={`relative border-2 ${c.border} rounded-lg overflow-hidden bg-white`}>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setPreviewImage(preview)}
                title="Click para ver en grande"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(preview)}
                  className={`${c.btn} text-white p-2 rounded-full shadow-lg transition-colors`}
                  title="Ver imagen completa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                  title="Cambiar imagen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-green-600 text-sm mt-2">✅ {file?.name}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-center">📤 Subir Comprobantes de Afiliación</h2>
        </div>

        <div className="p-6">

          {/* SECCIÓN: Archivos subidos exitosamente */}
          {showUploadSuccess && uploadedFiles && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">✅</span>
                Comprobantes Subidos Exitosamente
              </h3>
              
              <div className="space-y-4">
                {/* DNI Frontal */}
                {uploadedFiles.LINK_DNI_FRONTAL && (
                  <div className="p-3 bg-white border border-green-300 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <span className="text-lg mr-2">🪪</span>
                      DNI Frontal
                    </h4>
                    <img
                      src={uploadedFiles.LINK_DNI_FRONTAL}
                      alt="DNI Frontal"
                      className="w-full h-40 object-contain rounded border border-green-200 mb-2 cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewImage(uploadedFiles.LINK_DNI_FRONTAL || null)}
                      title="Click para ver en grande"
                    />
                    <p className="text-xs text-gray-600 break-all font-mono">
                      <span className="font-semibold text-green-700">URL: </span>
                      {uploadedFiles.LINK_DNI_FRONTAL?.split('?')[0]}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedFiles.LINK_DNI_FRONTAL || '')
                        Notification.success('URL copiado al portapapeles')
                      }}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      📋 Copiar URL
                    </button>
                  </div>
                )}

                {/* DNI Reverso */}
                {uploadedFiles.LINK_DNI_POSTERIOR && (
                  <div className="p-3 bg-white border border-green-300 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <span className="text-lg mr-2">🪪</span>
                      DNI Reverso
                    </h4>
                    <img
                      src={uploadedFiles.LINK_DNI_POSTERIOR}
                      alt="DNI Reverso"
                      className="w-full h-40 object-contain rounded border border-green-200 mb-2 cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewImage(uploadedFiles.LINK_DNI_POSTERIOR || null)}
                      title="Click para ver en grande"
                    />
                    <p className="text-xs text-gray-600 break-all font-mono">
                      <span className="font-semibold text-green-700">URL: </span>
                      {uploadedFiles.LINK_DNI_POSTERIOR?.split('?')[0]}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedFiles.LINK_DNI_POSTERIOR || '')
                        Notification.success('URL copiado al portapapeles')
                      }}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      📋 Copiar URL
                    </button>
                  </div>
                )}

                {/* Comprobante */}
                {uploadedFiles.LINK_VOUCHER_AFI && (
                  <div className="p-3 bg-white border border-green-300 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <span className="text-lg mr-2">📄</span>
                      Comprobante de Pago
                    </h4>
                    <img
                      src={uploadedFiles.LINK_VOUCHER_AFI}
                      alt="Comprobante de Pago"
                      className="w-full h-40 object-contain rounded border border-green-200 mb-2 cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewImage(uploadedFiles.LINK_VOUCHER_AFI || null)}
                      title="Click para ver en grande"
                    />
                    <p className="text-xs text-gray-600 break-all font-mono">
                      <span className="font-semibold text-green-700">URL: </span>
                      {uploadedFiles.LINK_VOUCHER_AFI?.split('?')[0]}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedFiles.LINK_VOUCHER_AFI || '')
                        Notification.success('URL copiado al portapapeles')
                      }}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      📋 Copiar URL
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm text-center">
                  ℹ️ Los archivos se cerrarán automáticamente en 3 segundos, o haz click en <strong>Cerrar</strong>
                </p>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  onClick={onClose}
                >
                  ✅ Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Datos del socio */}
          {!showUploadSuccess && cliente && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Datos del Socio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Nombre:</span>
                  <p className="text-gray-800">
                    {`${cliente.APE_PAT || ''} ${cliente.APE_MAT || ''} ${cliente.NOMBRES || ''}`.trim()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">DNI:</span>
                  <p className="text-gray-800">{cliente.DOC_IDEN || 'No disponible'}</p>
                </div>
              </div>

              {(codUserOriginal || ageOriginal) && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">📋 Datos del Registro Original</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {codUserOriginal && (
                      <div>
                        <span className="font-medium text-green-700">Analista:</span>
                        <p className="text-gray-800">{codUserOriginal}</p>
                      </div>
                    )}
                    {ageOriginal && (
                      <div>
                        <span className="font-medium text-green-700">Agencia:</span>
                        <p className="text-gray-800">{ageOriginal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instrucciones */}
          {!showUploadSuccess && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Orden de Carga Obligatorio</h3>
              <ol className="list-decimal list-inside text-yellow-700 text-sm mt-2 space-y-1">
                <li>Primero: DNI cara frontal</li>
                <li>Segundo: DNI cara reverso</li>
                <li>Tercero: Comprobante de pago</li>
              </ol>
            </div>
          )}

          {/* Campos */}
          {!showUploadSuccess && (
            <div className="flex flex-col space-y-4">
              <CampoArchivo
                numero={1}
                label="🪪 DNI del socio - Cara frontal"
                color="blue"
                preview={dniFrontalPreview}
                file={dniFrontalFile}
                onFileChange={(e) => handleFileChange(e.target.files?.[0] || null, setDniFrontalFile, setDniFrontalPreview)}
                onClear={() => handleFileChange(null, setDniFrontalFile, setDniFrontalPreview)}
              />
              <CampoArchivo
                numero={2}
                label="🪪 DNI del socio - Cara reverso"
                color="green"
                preview={dniReversoPreview}
                file={dniReversoFile}
                onFileChange={(e) => handleFileChange(e.target.files?.[0] || null, setDniReversoFile, setDniReversoPreview)}
                onClear={() => handleFileChange(null, setDniReversoFile, setDniReversoPreview)}
              />
              <CampoArchivo
                numero={3}
                label="📄 Comprobante de pago"
                color="orange"
                preview={paymentPreview}
                file={paymentFile}
                onFileChange={(e) => handleFileChange(e.target.files?.[0] || null, setPaymentFile, setPaymentPreview)}
                onClear={() => handleFileChange(null, setPaymentFile, setPaymentPreview)}
              />
            </div>
          )}

          {/* Botones */}
          {!showUploadSuccess && (
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                  isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={handleSubmit}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Subiendo archivos...
                  </span>
                ) : (
                  '✅ Cargar Comprobantes'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview ampliado */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="Vista previa ampliada" className="max-w-full max-h-[85vh] object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center py-2 text-sm">
              Click fuera de la imagen o en la ✕ para cerrar
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}