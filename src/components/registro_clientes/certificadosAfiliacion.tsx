import { ReactElement, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FichaIngreso, CertificadoAfiliacion } from "./certificados/CertificadoAfiliacion";


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
}: {
  onClose: () => void;
}): ReactElement {
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [dniFrontalFile, setDniFrontalFile] = useState<File | null>(null);
  const [dniReversoFile, setDniReversoFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!paymentFile || !dniFrontalFile || !dniReversoFile) {
      alert("Por favor selecciona todos los archivos requeridos");
      return;
    }
    alert("Comprobantes subidos exitosamente");
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">
          Subir comprobantes de afiliación
        </h2>
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📄 Comprobante de pago
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded p-2"
              onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🪪 DNI del socio - Cara frontal
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded p-2"
              onChange={(e) => setDniFrontalFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🪪 DNI del socio - Cara reverso
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded p-2"
              onChange={(e) => setDniReversoFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleSubmit}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Componente principal
export default function CertificadosAfiliacion(): ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCertificatePreviewModalOpen, setIsCertificatePreviewModalOpen] = useState(false);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Certificados y Documentos
      </h1>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setIsPreviewModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 font-medium"
        >
          📄 Imprimir ficha de ingreso
        </button>
        <button
          onClick={() => setIsCertificatePreviewModalOpen(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition duration-200 font-medium"
        >
          📋 Certificado de afiliación
        </button>
        <button
          className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition duration-200 font-medium"
          onClick={() => setIsModalOpen(true)}
        >
          📤 Subir comprobantes de afiliación
        </button>
      </div>

      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}

      {isPreviewModalOpen && (
        <PreviewModal
          title="Ficha de Ingreso"
          onClose={() => setIsPreviewModalOpen(false)}
        >
          <FichaIngreso />
        </PreviewModal>
      )}

      {isCertificatePreviewModalOpen && (
        <PreviewModal
          title="Certificado de Afiliación"
          onClose={() => setIsCertificatePreviewModalOpen(false)}
        >
          <CertificadoAfiliacion />
        </PreviewModal>
      )}
    </div>
  );
}