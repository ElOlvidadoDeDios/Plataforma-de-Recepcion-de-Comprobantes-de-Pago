import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getCronograma, CuotaCronograma } from '../../api/cronogramaApi';
import { DetalleCredito, ClienteResponse } from '../../api/customerConsultationAPI';
import logoDile from '../../logo_dile.webp';
import { CronogramaTable, DataRow, formatNumber } from './components/CronogramaTable';
import { sendWhatsAppMessage } from './components/WhatsAppService.tsx';

interface CronogramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestamo: DetalleCredito;
  clientData: ClienteResponse;
}

const CronogramaModal = ({ isOpen, onClose, prestamo, clientData }: CronogramaModalProps) => {
  const [cronograma, setCronograma] = useState<CuotaCronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [cronogramaPages, setCronogramaPages] = useState<CuotaCronograma[][]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCronograma = async () => {
      try {
        if (prestamo?.ID_PRESTAMO) {
          setLoading(true);
          const data = await getCronograma(prestamo.ID_PRESTAMO);
          setCronograma(data);
        }
      } catch (error) {
        console.error('Error al obtener el cronograma:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCronograma();
    }
  }, [isOpen, prestamo?.ID_PRESTAMO]);

  useEffect(() => {
    if (cronograma.length > 0) {
      calculateOptimalPages();
    }
  }, [cronograma]);

  const calculateOptimalPages = () => {
    const pageHeight = 1122; // ~297mm en píxeles
    const marginTop = 57; // ~15mm
    const marginBottom = 57; // ~15mm
    const availableHeight = pageHeight - marginTop - marginBottom;

    const headerHeight = 70;
    const partialClientInfoHeight = 60;
    const partialLoanInfoHeight = 50;
    const tableHeaderHeight = 32;
    const rowHeight = 24;
    const footerHeight = 20;

    const firstPageFixedContent = headerHeight + partialClientInfoHeight + partialLoanInfoHeight + tableHeaderHeight + footerHeight;
    const firstPageAvailableForRows = availableHeight - firstPageFixedContent;
    const firstPageRows = Math.floor(firstPageAvailableForRows / rowHeight);
    const limitedFirstPageRows = Math.min(firstPageRows, 30);

    const otherPagesFixedContent = headerHeight + tableHeaderHeight + footerHeight;
    const otherPagesAvailableForRows = availableHeight - otherPagesFixedContent;
    const otherPagesRows = Math.floor(otherPagesAvailableForRows / rowHeight);

    const pages: CuotaCronograma[][] = [];
    let currentIndex = 0;

    if (cronograma.length > 0) {
      const firstPageData = cronograma.slice(0, Math.min(limitedFirstPageRows, cronograma.length));
      pages.push(firstPageData);
      currentIndex = firstPageData.length;
    }

    while (currentIndex < cronograma.length) {
      const pageData = cronograma.slice(currentIndex, currentIndex + otherPagesRows);
      pages.push(pageData);
      currentIndex += pageData.length;
    }

    setCronogramaPages(pages);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          font-size: 10px;
        }
        .page-break {
          page-break-before: always;
        }
        .no-page-break {
          page-break-inside: avoid;
        }
        table {
          font-size: 9px;
        }
        th, td {
          padding: 3px !important;
          font-size: 9px !important;
        }
      }
    `
  });

  const handleExportExcel = () => {
    const dataToExport = {
      "Información del Cliente": [
        {
          "Cliente": clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO,
          "DNI": clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
          "Dirección": clientData.INFO_SOCIO.SOCIODEMOGRAFICO.DIRECCION,
          "Celular": clientData.INFO_SOCIO.CONTACTO.CELULAR,
          "Email": clientData.INFO_SOCIO.CONTACTO.EMAIL,
          "Estado": clientData.INFO_SOCIO.OTROS.ESTADO,
        }
      ],
      "Detalles del Préstamo": [{
        "ID Préstamo": prestamo.ID_PRESTAMO,
        "Monto": prestamo.MONTO,
        "Estado": prestamo.ESTADO,
        "Frecuencia": prestamo.FRECUENCIA,
        "Plazo": prestamo.PLAZO,
        "Tasa": prestamo.TASA,
        "Analista": prestamo.ANALISTA,
        "Otorga": prestamo.OTORGA,
      }],
      "Cronograma": cronograma
    };

    const wb = XLSX.utils.book_new();
    
    const wsCliente = XLSX.utils.json_to_sheet(dataToExport["Información del Cliente"]);
    XLSX.utils.book_append_sheet(wb, wsCliente, "Información Cliente");
    
    const wsPrestamo = XLSX.utils.json_to_sheet(dataToExport["Detalles del Préstamo"]);
    XLSX.utils.book_append_sheet(wb, wsPrestamo, "Detalles Préstamo");
    
    const wsCronograma = XLSX.utils.json_to_sheet(dataToExport["Cronograma"]);
    XLSX.utils.book_append_sheet(wb, wsCronograma, "Cronograma");
    
    XLSX.writeFile(wb, `Cronograma_${prestamo.ID_PRESTAMO}.xlsx`);
  };

  const generatePDF = async () => {
    if (printRef.current) {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      const pages = printRef.current.querySelectorAll('.pdf-page');
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const pageElement = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 800,
          height: 1100,
          windowWidth: 800,
          windowHeight: 1100
        });

        const imgData = canvas.toDataURL('image/png', 0.95);
        
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let yPosition = 10;
        
        if (imgHeight > pageHeight - 20) {
          const scaledHeight = pageHeight - 20;
          const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
          pdf.addImage(imgData, 'PNG', (pageWidth - scaledWidth) / 2, yPosition, scaledWidth, scaledHeight);
        } else {
          pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
        }
      }
      
      return pdf;
    }
    return null;
  };

  const handleDownloadPDF = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      pdf.save(`Cronograma_${prestamo.ID_PRESTAMO}.pdf`);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const pdf = await generatePDF();
      if (pdf) {
        // Descargar el PDF automáticamente
        pdf.save(`Cronograma_${prestamo.ID_PRESTAMO}.pdf`);
        
        // Esperar un momento para asegurar que se descargue
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Crear el mensaje
        const message = `Cronograma de pagos - ID Préstamo: ${prestamo.ID_PRESTAMO}\n\nLe adjunto el cronograma que acaba de descargarse.`;
        
        // Enviar el mensaje por WhatsApp
        const result = await sendWhatsAppMessage({
          phoneNumber: clientData.INFO_SOCIO.CONTACTO.CELULAR,
          message: message
        });

        if (!result.success) {
          console.error('Error al enviar WhatsApp:', result.error);
        }
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200">
          <button onClick={onClose} className="ml-auto block p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div ref={measureRef} className="invisible absolute -top-full">
            <div style={{ width: '210mm', fontSize: '10px' }}>
              <div className="h-20">Header</div>
              <div className="h-35">Client Info</div>
              <div className="h-30">Loan Info</div>
              <div className="h-8">Table Header</div>
              <div className="h-6">Table Row</div>
            </div>
          </div>

          <div ref={printRef} className="bg-white">
            <div className="pdf-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontSize: '10px' }}>
              <div className="flex items-center justify-between mb-6 no-page-break">
                <img src={logoDile} alt="Logo DILE" className="h-10 w-auto" />
                <div className="text-center flex-1">
                  <h2 className="text-xl font-bold text-cyan-800 mb-2">Cronograma de Pagos</h2>
                  <hr className="border-t-2 border-cyan-600 w-1/2 mx-auto" />
                </div>
                <div className="w-10"></div>
              </div>

              {/* Header con cuenta DILE y nombre del cliente */}
              <div className="mb-4 border-b-2 border-cyan-600 pb-3 no-page-break">
                <div className="flex items-center gap-8">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-600">Cuenta DILE:</span>
                    <span className="font-bold text-cyan-700">{clientData.INFO_SOCIO.OTROS.CUENTA_DILE || '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="font-medium text-gray-600">Cliente:</span>
                    <span className="font-bold text-cyan-700">{clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 mb-6 no-page-break">
                <div className="bg-white p-3 border-b-2 border-cyan-600">
                  <div className="space-y-3">
                    < div className="grid grid-cols-3 gap-4">
                      <DataRow
                      label="ID Préstamo"
                      value={prestamo.ID_PRESTAMO}
                      boldValue={true}
                    />
                    <DataRow
                      label="DNI"
                      value={clientData.INFO_SOCIO.DATOS_PERSONALES.DNI}
                    />
                      <DataRow
                      label="estado"
                      value={clientData.INFO_SOCIO.OTROS.ESTADO || '-'}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <DataRow
                      label="Celular"
                      value={clientData.INFO_SOCIO.CONTACTO.CELULAR}
                    />
                    <DataRow
                      label="Email"
                      value={clientData.INFO_SOCIO.CONTACTO.EMAIL}
                    />                   
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <DataRow
                      label="fecha inicio"
                      value={clientData.INFO_SOCIO.OTROS.FECHA_INICIO || '-'}
                    />
                    <DataRow
                      label="Monto"
                      value={`S/ ${formatNumber(prestamo.MONTO)}`}
                      highlight={true}
                    />
                  </div>
                    <div className="grid grid-cols-3 gap-4">
                      <DataRow
                        label="Plazo"
                        value={prestamo.PLAZO}
                      />
                      <DataRow
                        label="Tasa"
                        value={`${prestamo.TASA}%`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <DataRow
                        label="Frecuencia"
                        value={prestamo.FRECUENCIA}
                      />
                      <DataRow
                        label="Estado Prestamo"
                        value={prestamo.ESTADO}
                        status={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {!loading && cronogramaPages.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-cyan-700 mb-3 pb-2 border-b border-cyan-200">
                    Cronograma de Pagos
                  </h3>
                  <CronogramaTable cuotas={cronogramaPages[0]} />
                </div>
              )}

            </div>

            {!loading && cronogramaPages.slice(1).map((pageData, pageIndex) => (
              <div key={pageIndex + 1} className="pdf-page page-break bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontSize: '10px' }}>
                <div className="flex items-center justify-between mb-4 no-page-break">
                  <img src={logoDile} alt="Logo DILE" className="h-8 w-auto" />
                  <div className="text-center flex-1">
                    <h3 className="text-lg font-bold text-cyan-800">Cronograma de Pagos - Página {pageIndex + 2}</h3>
                    <p className="text-sm text-gray-600">Préstamo: {prestamo.ID_PRESTAMO}</p>
                  </div>
                  <div className="w-8"></div>
                </div>

                <CronogramaTable cuotas={pageData} />

              </div>
            ))}

            {loading && (
              <div className="pdf-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              disabled={loading}
            >
              Imprimir {cronogramaPages.length > 0 && `(${cronogramaPages.length} páginas)`}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              Descargar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={loading}
            >
              Exportar Excel
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              disabled={loading}
            >
              Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronogramaModal;