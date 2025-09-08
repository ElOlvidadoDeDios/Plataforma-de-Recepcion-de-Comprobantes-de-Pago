import { ReactElement, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FichaIngreso, CertificadoAfiliacion } from "./certificados/CertificadoAfiliacion";
import { DatosCertificado } from "../../types/clienteData";
import { uploadAllFilesAtOnce, UploadFileData } from "../../api/registroDeclientesApi";


// Modal para previsualizar el documento
function PreviewModal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactElement;
}): ReactElement {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (documentRef.current) {
      try {
        const canvas = await html2canvas(documentRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${title}.pdf`);
        onClose();
      } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF');
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        
        {/* Vista previa del documento */}
        <div className="border border-gray-300 mb-4 bg-white overflow-auto" style={{ minHeight: '600px' }}>
          <div 
            ref={documentRef}
            className="bg-white p-8"
            style={{
              width: '210mm',
              minHeight: '297mm',
              margin: '0 auto',
              fontSize: '12px',
              lineHeight: '1.4'
            }}
          >
            {children}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📄 Generar PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal para subir comprobantes
function Modal({
  onClose,
  datosCertificado,
}: {
  onClose: () => void;
  datosCertificado?: DatosCertificado;
}): ReactElement {
  const [dniFrontalFile, setDniFrontalFile] = useState<File | null>(null);
  const [dniReversoFile, setDniReversoFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const cliente = datosCertificado?.cliente;
  // ✅ CAPTURAR LOS DATOS DEL ANALISTA ORIGINAL Y AGENCIA ORIGINAL
  const codUserOriginal = datosCertificado?.codUserOriginal;
  const ageOriginal = datosCertificado?.ageOriginal;


  const handleSubmit = async () => {
    if (!dniFrontalFile || !dniReversoFile || !paymentFile) {
      alert("Por favor selecciona todos los archivos requeridos en el orden correcto");
      return;
    }

    if (!cliente?.DOC_IDEN || !ageOriginal || !codUserOriginal) {
      alert("Error: Faltan datos necesarios (DNI, agencia o analista). Por favor complete el registro del cliente.");
      return;
    }

    setIsUploading(true);
    
    try {
      // ✅ PREPARAR DATOS PARA LA API
      const uploadData: UploadFileData = {
        DNI_SOCIO: cliente.DOC_IDEN,      // DNI del socio
        AGENCIA: ageOriginal,             // Agencia original donde se registró
        ANALISTA: codUserOriginal         // Analista que originalmente registró
      };

      // ✅ SUBIR TODO EN UN SOLO PAYLOAD: datos + todas las imágenes juntas
      const result = await uploadAllFilesAtOnce(uploadData, {
        dniFrontal: dniFrontalFile,
        dniReverso: dniReversoFile,
        voucher: paymentFile
      });

      
      if (result.success) {
        
        let mensaje = `✅ ¡Comprobantes subidos exitosamente!
        
📋 Datos procesados:
• DNI Socio: ${uploadData.DNI_SOCIO}
• Agencia: ${uploadData.AGENCIA}
• Analista: ${uploadData.ANALISTA}

📤 Archivos subidos:
• DNI frontal: ${dniFrontalFile.name}
• DNI reverso: ${dniReversoFile.name}
• Voucher: ${paymentFile.name}`;

        // Si la respuesta contiene información adicional, mostrarla
        if (result.data && Array.isArray(result.data)) {
          mensaje += `\n\n📊 Respuesta de la DB (${result.data.length} elementos):`;
          result.data.forEach((item: any, index: number) => {
            mensaje += `\n• Archivo ${index + 1}: ${JSON.stringify(item)}`;
          });
        } else if (result.data) {
          mensaje += `\n\n📊 Respuesta de la DB:\n${JSON.stringify(result.data, null, 2)}`;
        }
        
        alert(mensaje);
        onClose();
      } else {
        // ❌ ERROR - Mostrar detalles del error Y de la respuesta de la DB
        console.error('❌ Upload fallido, detalles del error:', result.error);
        console.error('❌ Datos devueltos por la DB:', result.data);
        
        let mensajeError = `❌ Error subiendo comprobantes:\n${result.error || 'Error desconocido'}`;
        
        // Si hay datos adicionales en el error, mostrarlos para debug
        if (result.data) {
          mensajeError += `\n\n🔍 Datos de la DB para debug:\n${JSON.stringify(result.data, null, 2)}`;
        }
        
        throw new Error(mensajeError);
      }
    } catch (error) {
      console.error('❌ Error subiendo comprobantes:', error);
      alert(`❌ Error subiendo comprobantes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-center">
            📤 Subir Comprobantes de Afiliación
          </h2>
        </div>

        <div className="p-6">
          {/* Datos del cliente disponibles */}
          {cliente && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Datos Disponibles del Socio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Nombre completo:</span>
                  <p className="text-gray-800">{`${cliente.APE_PAT || ''} ${cliente.APE_MAT || ''} ${cliente.NOMBRES || ''}`.trim()}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">DNI:</span>
                  <p className="text-gray-800">{cliente.DOC_IDEN || 'No disponible'}</p>
                </div>
              </div>
              
              {/* ✅ MOSTRAR DATOS DEL ANALISTA ORIGINAL PARA REFERENCIA */}
              {(codUserOriginal || ageOriginal) && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">📋 Datos del Registro Original</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {codUserOriginal && (
                      <div>
                        <span className="font-medium text-green-700">Analista Original:</span>
                        <p className="text-gray-800">{codUserOriginal}</p>
                      </div>
                    )}
                    {ageOriginal && (
                      <div>
                        <span className="font-medium text-green-700">Agencia Original:</span>
                        <p className="text-gray-800">{ageOriginal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instrucciones */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Orden de Carga Obligatorio</h3>
            <p className="text-yellow-700 text-sm">
              Por favor, suba los archivos en este orden específico para mantener la organización correcta:
            </p>
            <ol className="list-decimal list-inside text-yellow-700 text-sm mt-2 space-y-1">
              <li>Primero: DNI cara frontal</li>
              <li>Segundo: DNI cara reverso</li>
              <li>Tercero: Comprobante de pago</li>
            </ol>
          </div>

          {/* Campos de carga en el orden correcto */}
          <div className="flex flex-col space-y-4">
            {/* 1. DNI Cara Frontal - PRIMERO */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <label className="block text-sm font-bold text-blue-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  🪪 DNI del socio - Cara frontal
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border-2 border-blue-300 rounded p-3 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDniFrontalFile(e.target.files?.[0] || null)}
                placeholder="Seleccionar imagen del DNI frontal..."
              />
              {dniFrontalFile && (
                <p className="text-green-600 text-sm mt-1">✅ {dniFrontalFile.name}</p>
              )}
            </div>

            {/* 2. DNI Cara Reverso - SEGUNDO */}
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <label className="block text-sm font-bold text-green-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  🪪 DNI del socio - Cara reverso
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border-2 border-green-300 rounded p-3 focus:border-green-500 focus:outline-none"
                onChange={(e) => setDniReversoFile(e.target.files?.[0] || null)}
              />
              {dniReversoFile && (
                <p className="text-green-600 text-sm mt-1">✅ {dniReversoFile.name}</p>
              )}
            </div>

            {/* 3. Comprobante de Pago - TERCERO */}
            <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
              <label className="block text-sm font-bold text-orange-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  📄 Comprobante de pago
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border-2 border-orange-300 rounded p-3 focus:border-orange-500 focus:outline-none"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
              />
              {paymentFile && (
                <p className="text-green-600 text-sm mt-1">✅ {paymentFile.name}</p>
              )}
            </div>
          </div>

          {/* Botones */}
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
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Subiendo archivos...
                </span>
              ) : (
                '💾 Guardar Comprobantes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Props del componente principal
interface CertificadosAfiliacionProps {
  datosCertificado?: DatosCertificado;
}

// Componente principal
export default function CertificadosAfiliacion({
  datosCertificado
}: CertificadosAfiliacionProps): ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCertificatePreviewModalOpen, setIsCertificatePreviewModalOpen] = useState(false);

  // Verificar si hay datos completos para generar documentos
  const tieneDAtoCompletos = datosCertificado &&
    datosCertificado.cliente &&
    datosCertificado.cliente.APE_PAT &&
    datosCertificado.cliente.NOMBRES &&
    datosCertificado.cliente.DOC_IDEN;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Certificados y Documentos
      </h1>

      {/* Mostrar estado de los datos */}
      {!tieneDAtoCompletos && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-center">
            ⚠️ <strong>Datos incompletos:</strong> Complete el registro del cliente en las pestañas "Datos" y "Dirección" para poder generar los documentos.
          </p>
        </div>
      )}

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setIsPreviewModalOpen(true)}
          disabled={!tieneDAtoCompletos}
          className={`px-6 py-3 text-white rounded-lg shadow transition duration-200 font-medium ${
            tieneDAtoCompletos
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          title={!tieneDAtoCompletos ? 'Complete los datos del cliente primero' : ''}
        >
          📄 Imprimir ficha de ingreso
        </button>
        <button
          onClick={() => setIsCertificatePreviewModalOpen(true)}
          disabled={!tieneDAtoCompletos}
          className={`px-6 py-3 text-white rounded-lg shadow transition duration-200 font-medium ${
            tieneDAtoCompletos
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          title={!tieneDAtoCompletos ? 'Complete los datos del cliente primero' : ''}
        >
          📋 Certificado de afiliación
        </button>
        <button
          className={`px-6 py-3 text-white rounded-lg shadow transition duration-200 font-medium ${
            tieneDAtoCompletos
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={() => setIsModalOpen(true)}
          disabled={!tieneDAtoCompletos}
          title={!tieneDAtoCompletos ? 'Complete los datos del cliente primero' : ''}
        >
          📤 Subir comprobantes de afiliación
        </button>
      </div>

      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} datosCertificado={datosCertificado} />}

      {isPreviewModalOpen && (
        <PreviewModal
          title="Ficha de Ingreso"
          onClose={() => setIsPreviewModalOpen(false)}
        >
          <FichaIngreso datosCertificado={datosCertificado} />
        </PreviewModal>
      )}

      {isCertificatePreviewModalOpen && (
        <PreviewModal
          title="Certificado de Afiliación"
          onClose={() => setIsCertificatePreviewModalOpen(false)}
        >
          <CertificadoAfiliacion datosCertificado={datosCertificado} />
        </PreviewModal>
      )}
    </div>
  );
}