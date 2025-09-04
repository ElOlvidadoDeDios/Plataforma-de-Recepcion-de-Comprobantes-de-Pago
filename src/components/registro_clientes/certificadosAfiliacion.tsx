import { ReactElement, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
  const [dniFile, setDniFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!paymentFile || !dniFile) {
      alert("Por favor selecciona ambos archivos");
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
              🪪 DNI del socio
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded p-2"
              onChange={(e) => setDniFile(e.target.files?.[0] || null)}
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

// Componente de Ficha de Ingreso
function FichaIngreso(): ReactElement {
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase">FICHA DE INGRESO</h1>
        <div className="mt-2 text-sm">
          <p>COOPERATIVA DE AHORRO Y CRÉDITO DILE</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="border-2 border-black p-3">
          <h3 className="text-sm font-bold mb-3 uppercase">DATOS PERSONALES</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold mb-1">APELLIDO PATERNO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">APELLIDO MATERNO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">NOMBRES</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold mb-1">NRO D.I</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">ESTADO CIVIL</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">FECHA NACIMIENTO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">SEXO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold mb-1">PROFESIÓN</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">GRADO INSTRUCCIÓN</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">CENTRO TRABAJO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1">CARGO</p>
            <div className="border-b-2 border-black h-6"></div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1">DIRECCIÓN DE DOMICILIO</p>
            <div className="border-b-2 border-black h-6"></div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1">REFERENCIA</p>
            <div className="border-b-2 border-black h-6"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold mb-1">DEPARTAMENTO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">PROVINCIA</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">DISTRITO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold mb-1">TELÉFONO</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">EMAIL</p>
              <div className="border-b-2 border-black h-6"></div>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-xs font-semibold mb-1">OBSERVACIONES Y/O DECLARACIONES</p>
            <div className="border-2 border-black h-16"></div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-xs font-semibold mb-4">FIRMA Y HUELLA DEL AFILIADO</p>
            <div className="flex justify-center gap-12">
              <div className="text-center">
                <div className="border-2 border-black w-24 h-12 mb-2"></div>
                <p className="text-xs font-semibold">FIRMA</p>
              </div>
              <div className="text-center">
                <div className="border-2 border-black w-24 h-12 mb-2"></div>
                <p className="text-xs font-semibold">HUELLA</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs">Fecha: _______________</p>
        </div>
      </div>
    </div>
  );
}

function CertificadoAfiliacion() {
  return (
    <div className="w-[210mm] h-[297mm]">
      <div className="text-left text-base space-y-0.1 pl-8 mt-[50mm]">
        <p>CERTIFICADO N°</p>
        <p>APELLIDOS Y NOMBRES</p>
        <p>TIPO Y NRO DE DOCUMENTO</p>
        <p>N° CUENTA DE SOCIO</p>
        <p>APORTE INICIAL  S/</p>
        <p>FECHA DE EMISION</p>
        <p>RESPONSABLE</p>
      </div>
    </div>
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