import { DesembolsoRealizado } from '../../api/HistorialDesolbolsosAPI';

interface ExportData {
  desembolsos: DesembolsoRealizado[];
  fecha: string;
}

export const exportDesembolsosToPDF = ({ desembolsos, fecha }: ExportData) => {
  try {
    // Función auxiliar para formatear fecha (movida arriba para usarla en el template)
    const formatearFecha = (fechaStr: string) => {
      try {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-PE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch {
        return fechaStr;
      }
    };

    // Crear contenido HTML para el PDF (optimizado para impresión)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Historial de Desembolsos</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 0;
            font-size: 10px; /* Reducido para caber mejor en A4 */
            line-height: 1.2;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            background-color: #0891B2;
            color: white;
            padding: 10px;
            border-radius: 3px;
          }
          .title {
            font-size: 16px; /* Ajustado para no desbordar */
            font-weight: bold;
            margin-bottom: 3px;
          }
          .fecha {
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 9px; /* Más pequeño para más filas por página */
          }
          th, td {
            border: 1px solid #333; /* Bordes más oscuros para impresión */
            padding: 4px 6px; /* Padding reducido para ahorrar espacio */
            text-align: left;
            word-wrap: break-word; /* Evita desbordes en columnas largas */
            max-width: 0; /* Ayuda con wrap */
          }
          th {
            background-color: #0891B2;
            color: white;
            font-weight: bold;
            font-size: 9px;
          }
          tr:nth-child(even) {
            background-color: #f0f9ff;
          }
          .monto {
            text-align: right;
            font-weight: bold;
          }
          .total {
            text-align: right;
            font-weight: bold;
            font-size: 11px;
            margin: 15px 0;
            background-color: #f8f9fa;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
          }
          .total div {
            margin-bottom: 3px;
          }
          .total .monto-total {
            color: #0891B2;
            font-size: 12px;
          }
          /* Estilos específicos para impresión */
          @media print {
            body { 
              -webkit-print-color-adjust: exact; /* Mantiene colores de fondo */
              print-color-adjust: exact;
            }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            .header { page-break-after: avoid; }
            .total { page-break-before: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HISTORIAL DE DESEMBOLSOS REALIZADOS</div>
          <div class="fecha">Fecha de Búsqueda: ${fecha}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">DNI</th>
              <th style="width: 10%;">Cuenta</th>
              <th style="width: 15%;">Razón Social</th>
              <th style="width: 8%;">Pagaré</th>
              <th style="width: 10%;">Fecha Otorga</th>
              <th style="width: 10%;">Monto Neto (S/)</th>
              <th style="width: 12%;">Producto</th>
              <th style="width: 10%;">Agencia</th>
              <th style="width: 12%;">Responsable</th>
              <th style="width: 5%;">Voucher</th>
            </tr>
          </thead>
          <tbody>
            ${desembolsos.map((desembolso, index) => `
              <tr ${index % 2 === 0 ? '' : 'style="background-color: #f0f9ff;"'}>
                <td style="width: 8%;">${desembolso.DNI || ''}</td>
                <td style="width: 10%;">${desembolso.CUENTA || ''}</td>
                <td style="width: 15%;" title="${desembolso.RAZON_SOCIAL || ''}">${(desembolso.RAZON_SOCIAL || '').substring(0, 20)}${(desembolso.RAZON_SOCIAL || '').length > 20 ? '...' : ''}</td>
                <td style="width: 8%;">${desembolso.PAGARE || ''}</td>
                <td style="width: 10%;">${formatearFecha(desembolso.OTORGA)}</td>
                <td class="monto" style="width: 10%;">S/ ${parseFloat(desembolso.MONTO_NETO || '0').toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="width: 12%;" title="${desembolso.PRODUCTO || ''}">${(desembolso.PRODUCTO || '').substring(0, 15)}${(desembolso.PRODUCTO || '').length > 15 ? '...' : ''}</td>
                <td style="width: 10%;">${desembolso.AGENCIA || ''}</td>
                <td style="width: 12%;" title="${desembolso.RESPONSABLE || ''}">${(desembolso.RESPONSABLE || '').substring(0, 20)}${(desembolso.RESPONSABLE || '').length > 20 ? '...' : ''}</td>
                <td style="width: 5%;">${desembolso.ENLACE ? 'Sí' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          <div class="monto-total">TOTAL DESEMBOLSADO: S/ ${desembolsos.reduce((sum, d) => sum + parseFloat(d.MONTO_NETO || '0'), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div>CANTIDAD DE DESEMBOLSOS: ${desembolsos.length}</div>
        </div>
      </body>
      </html>
    `;

    // Crear nueva ventana y imprimir
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
      ventanaPDF.document.write(htmlContent);
      ventanaPDF.document.close();
      
      // Esperar un poco más para que cargue bien (aumentado a 800ms)
      setTimeout(() => {
        ventanaPDF.print();
        // Opcional: Cerrar la ventana después de imprimir (descomenta si quieres)
        // setTimeout(() => ventanaPDF.close(), 1000);
      }, 800);

      return true;
    } else {
      throw new Error('No se pudo abrir la ventana para generar el PDF');
    }
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    return false;
  }
};