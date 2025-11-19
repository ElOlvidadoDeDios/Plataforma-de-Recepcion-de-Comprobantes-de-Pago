import { useRef } from 'react';
import { Printer } from 'lucide-react';

interface CronogramaPagosPDFProps {
  datos: any[];
}

export default function CronogramaPagosPDF({ datos }: CronogramaPagosPDFProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatNumber = (num: string | number): string => {
    if (!num) return '0.00';
    return parseFloat(num.toString()).toFixed(2);
  };


  const calcularTotales = (datos: any[]) => {
    const totales = {
      totalCuota: 0,
      capital: 0,
      interes: 0,
      aporte: 0,
      seguro: 0,
      portes: 0,
      desgrav: 0,
      interXcobrar: 0
    };

    datos.forEach((item: any) => {
      totales.totalCuota += parseFloat(item.TOTAL_CUOTA || 0);
      totales.capital += parseFloat(item.CAPITAL || 0);
      totales.interes += parseFloat(item.INTERES || 0);
      totales.aporte += parseFloat(item.APORTE || 0);
      totales.seguro += parseFloat(item.SEGURO || 0);
      totales.portes += parseFloat(item.PORTES || 0);
      totales.desgrav += parseFloat(item.DESGRAV || 0);
      totales.interXcobrar += parseFloat(item.INTER_XCOBRAR || 0);
    });

    return totales;
  };

  const handlePrint = () => {
    if (!datos || !Array.isArray(datos) || datos.length === 0) return;
    
    const primerRegistro = datos[0];
    const totales = calcularTotales(datos);
    const fechaHoy = new Date().toLocaleDateString('es-PE');
    const horaHoy = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    
    const printContent = `
      <div class="header">
        <div class="header-date">${fechaHoy}<br>${horaHoy}</div>
        <div class="header-oficina">${primerRegistro.AGENCIA || 'OFICINA PRINCIPAL'}</div>
      </div>
      
      <div class="title">PROPUESTA DE CREDITO</div>
      
      <div class="section">
        <div class="section-title">DATOS DEL TITULAR</div>
        <div class="info-grid">
          <span class="info-label">NOMBRES</span>
          <span class="info-value">${primerRegistro.RAZON || ''}</span>
          <span class="info-label">DOCUMENTO DE IDENTIDAD</span>
          <span class="info-value">${primerRegistro.DNI || ''}</span>
          <span class="info-label">N° DE CUENTA</span>
          <span class="info-value">${primerRegistro.CUENTA || ''}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">DATOS DE LA SIMULACION</div>
        <div class="simulacion-grid">
          <div class="sim-item">
            <span class="sim-label">PRESTAMO</span>
            <span class="sim-value">${primerRegistro.PRESTAMO || ''}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">MONTO</span>
            <span class="sim-value">${formatNumber(primerRegistro.MONTO)}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">PRODUCTO</span>
            <span class="sim-value">${primerRegistro.PRODUCTO || ''}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">N° DE CUOTAS</span>
            <span class="sim-value">${primerRegistro.PLAZO || ''}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">FRECUENCIA</span>
            <span class="sim-value">${primerRegistro.FRECUENCIA || ''}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">TASA REFERENCIAL</span>
            <span class="sim-value">${primerRegistro.TEM || ''}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">FECHA SIMULACION</span>
            <span class="sim-value">${formatDate(primerRegistro.FECHA)}</span>
          </div>
          <div class="sim-item">
            <span class="sim-label">MESES</span>
            <span class="sim-value"></span>
          </div>
          <div class="sim-item">
            <span class="sim-label">MONEDA</span>
            <span class="sim-value">${primerRegistro.MONEDA || ''}</span>
          </div>
        </div>
        <div class="total-intereses">
          <span>TOTAL INTERESES</span>
          <span>${formatNumber(primerRegistro.ACUINTERES)}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">CRONOGRAMA DE PAGOS</div>
        <table>
          <thead>
            <tr>
              <th>NRO</th>
              <th>FECHA VENC</th>
              <th>TOTAL</th>
              <th>CAPITAL</th>
              <th>INTERES</th>
              <th>APORTE</th>
              <th>SEGURO</th>
              <th>PORTES</th>
              <th>DESGRAV</th>
              <th>INT.XCOB.</th>
              <th>SALDO</th>
            </tr>
          </thead>
          <tbody>
            ${datos.map((item: any) => `
              <tr>
                <td>${item.NRO_CUO}</td>
                <td>${formatDate(item.FECHA_VCMTO)}</td>
                <td>${formatNumber(item.TOTAL_CUOTA)}</td>
                <td>${formatNumber(item.CAPITAL)}</td>
                <td>${formatNumber(item.INTERES)}</td>
                <td>${formatNumber(item.APORTE)}</td>
                <td>${formatNumber(item.SEGURO)}</td>
                <td>${formatNumber(item.PORTES)}</td>
                <td>${formatNumber(item.DESGRAV)}</td>
                <td>${formatNumber(item.INTER_XCOBRAR)}</td>
                <td>${formatNumber(item.SALDO)}</td>
              </tr>
            `).join('')}
            <tr class="totals-row">
              <td colspan="2" class="totals-label">TOTALES:</td>
              <td>${formatNumber(totales.totalCuota)}</td>
              <td>${formatNumber(totales.capital)}</td>
              <td>${formatNumber(totales.interes)}</td>
              <td>${formatNumber(totales.aporte)}</td>
              <td>${formatNumber(totales.seguro)}</td>
              <td>${formatNumber(totales.portes)}</td>
              <td>${formatNumber(totales.desgrav)}</td>
              <td>${formatNumber(totales.interXcobrar)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="condiciones">
        <div class="condiciones-title">Condiciones:</div>
        <p>* En caso usted realice la operación el cronograma definitivo será entregado previo al desembolso del crédito.</p>
        <p>* Las Cuotas han sido calculadas sobre la base de datos referenciales.</p>
        <p>* La determinación de la tasa de interés que aplicaría para el préstamo esta sujeta a evaluación crediticia.</p>
      </div>
    `;
    
    const windowPrint = window.open('', '', 'width=800,height=600');
    if (!windowPrint) return;
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Cronograma de Pagos</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              padding: 20px;
              background: white;
              line-height: 1.3;
              color: #333;
            }
            
            .header {
              text-align: right;
              margin-bottom: 5px;
            }
            
            .header-date {
              font-size: 8px;
              line-height: 1.2;
            }
            
            .header-oficina {
              font-weight: bold;
              font-size: 9px;
              margin-top: 2px;
            }
            
            .title {
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              margin: 20px 0 15px 0;
              border-top: 2px solid black;
              border-bottom: 2px solid black;
              padding: 8px 0;
            }
            
            .section {
              margin-bottom: 12px;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 9px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 3px 10px;
              margin-bottom: 8px;
            }
            
            .info-label {
              font-weight: normal;
            }
            
            .info-value {
              font-weight: normal;
            }
            
            .simulacion-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 3px 20px;
              margin-bottom: 8px;
            }
            
            .sim-item {
              display: flex;
              justify-content: space-between;
            }
            
            .sim-label {
              font-weight: normal;
            }
            
            .sim-value {
              font-weight: normal;
              text-align: right;
            }
            
            .total-intereses {
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
              padding-top: 5px;
              border-top: 1px solid #ccc;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 8px;
            }
            
            th {
              background-color: #f0f0f0;
              color: #000;
              padding: 4px 2px;
              text-align: center;
              font-weight: bold;
              border: 1px solid black;
              font-size: 7px;
            }
            
            td {
              padding: 3px 2px;
              text-align: right;
              border: 1px solid #ccc;
            }
            
            td:first-child,
            td:nth-child(2) {
              text-align: center;
            }
            
            .totals-row {
              font-weight: bold;
              background-color: #f0f0f0;
            }
            
            .totals-label {
              text-align: right !important;
              padding-right: 10px;
            }
            
            .condiciones {
              margin-top: 15px;
              font-size: 8px;
              line-height: 1.4;
            }
            
            .condiciones-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .condiciones p {
              margin: 3px 0;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 0.5in;
                font-size: 9px;
              }
              
              th {
                background-color: #000 !important;
                -webkit-print-color-adjust: exact;
                color: white !important;
              }
              
              .totals-row {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
              }
              
              table {
                font-size: 7px;
              }
            }

            @page {
              margin: 0.5in;
              size: A4;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    
    setTimeout(() => {
      windowPrint.print();
      // No cerrar automáticamente para permitir guardar como PDF
      // windowPrint.close();
    }, 500);
  };

  if (!datos || !Array.isArray(datos) || datos.length === 0) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No hay datos disponibles para mostrar el cronograma.</p>
      </div>
    );
  }

  const primerRegistro = datos[0];
  const totales = calcularTotales(datos);
  const fechaHoy = new Date().toLocaleDateString('es-PE');
  const horaHoy = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Botón de Imprimir */}
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
        >
          <Printer className="w-5 h-5" />
          Imprimir Cronograma
        </button>
      </div>

      {/* Contenido del Cronograma */}
      <div ref={printRef} className="bg-white p-4 sm:p-8 shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="text-right mb-2">
          <div className="text-xs leading-tight">{fechaHoy}<br />{horaHoy}</div>
          <div className="font-bold text-sm mt-1">{primerRegistro.AGENCIA || 'OFICINA PRINCIPAL'}</div>
        </div>

        {/* Título */}
        <div className="text-center font-bold text-lg my-5 border-t-2 border-b-2 border-black py-2">
          PROPUESTA DE CREDITO
        </div>

        {/* Datos del Titular */}
        <div className="mb-4">
          <div className="font-bold mb-2 text-sm">DATOS DEL TITULAR</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <span>NOMBRES</span>
            <span>{primerRegistro.RAZON || ''}</span>
            <span>DOCUMENTO DE IDENTIDAD</span>
            <span>{primerRegistro.DNI || ''}</span>
            <span>N° DE CUENTA</span>
            <span>{primerRegistro.CUENTA || ''}</span>
          </div>
        </div>

        {/* Datos de la Simulación */}
        <div className="mb-4">
          <div className="font-bold mb-2 text-sm">DATOS DE LA SIMULACION</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs mb-2">
            <div className="flex justify-between">
              <span>PRESTAMO</span>
              <span>{primerRegistro.PRESTAMO || ''}</span>
            </div>
            <div className="flex justify-between">
              <span>MONTO</span>
              <span>{formatNumber(primerRegistro.MONTO)}</span>
            </div>
            <div className="flex justify-between">
              <span>PRODUCTO</span>
              <span>{primerRegistro.PRODUCTO || ''}</span>
            </div>
            <div className="flex justify-between">
              <span>N° DE CUOTAS</span>
              <span>{primerRegistro.PLAZO || ''}</span>
            </div>
            <div className="flex justify-between">
              <span>FRECUENCIA</span>
              <span>{primerRegistro.FRECUENCIA || ''}</span>
            </div>
            <div className="flex justify-between">
              <span>TASA REFERENCIAL</span>
              <span>{primerRegistro.TEM || ''}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA SIMULACION</span>
              <span>{formatDate(primerRegistro.FECHA)}</span>
            </div>
            <div className="flex justify-between">
              <span>{primerRegistro.FRECUENCIA || ''}</span>
              <span></span>
            </div>
            <div className="flex justify-between">
              <span>MONEDA</span>
              <span>{primerRegistro.MONEDA || ''}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs mt-3 pt-2 border-t border-gray-300">
            <span>TOTAL INTERESES</span>
            <span>{formatNumber(primerRegistro.ACUINTERES)}</span>
          </div>
        </div>

        {/* Tabla de Cronograma */}
        <div className="mb-4">
          <div className="font-bold mb-2 text-sm">CRONOGRAMA DE PAGOS</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-black p-1 text-[10px]">NRO</th>
                  <th className="border border-black p-1 text-[10px]">FECHA VENC</th>
                  <th className="border border-black p-1 text-[10px]">TOTAL</th>
                  <th className="border border-black p-1 text-[10px]">CAPITAL</th>
                  <th className="border border-black p-1 text-[10px]">INTERES</th>
                  <th className="border border-black p-1 text-[10px]">APORTE</th>
                  <th className="border border-black p-1 text-[10px]">SEGURO</th>
                  <th className="border border-black p-1 text-[10px]">PORTES</th>
                  <th className="border border-black p-1 text-[10px]">DESGRAV</th>
                  <th className="border border-black p-1 text-[10px]">INT.XCOB.</th>
                  <th className="border border-black p-1 text-[10px]">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1 text-center">{item.NRO_CUO}</td>
                    <td className="border border-gray-300 p-1 text-center">{formatDate(item.FECHA_VCMTO)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.TOTAL_CUOTA)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.CAPITAL)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.INTERES)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.APORTE)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.SEGURO)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.PORTES)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.DESGRAV)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.INTER_XCOBRAR)}</td>
                    <td className="border border-gray-300 p-1 text-right">{formatNumber(item.SALDO)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="border border-gray-300 p-1 text-right pr-3 font-bold">TOTALES:</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.totalCuota)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.capital)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.interes)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.aporte)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.seguro)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.portes)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.desgrav)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatNumber(totales.interXcobrar)}</td>
                  <td className="border border-gray-300 p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Condiciones */}
        <div className="mt-4 text-xs">
          <div className="font-bold mb-2">Condiciones:</div>
          <p className="mb-1">* En caso usted realice la operación el cronograma definitivo será entregado previo al desembolso del crédito.</p>
          <p className="mb-1">* Las Cuotas han sido calculadas sobre la base de datos referenciales.</p>
          <p>* La determinación de la tasa de interés que aplicaría para el préstamo esta sujeta a evaluación crediticia.</p>
        </div>
      </div>
    </div>
  );
}