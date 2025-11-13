import { DesembolsoRealizado } from '../../api/HistorialDesolbolsosAPI';
import ExcelJS from 'exceljs';

interface ExportData {
  desembolsos: DesembolsoRealizado[];
  fecha: string;
}

export const exportDesembolsosToExcel = async ({ desembolsos, fecha }: ExportData) => {
  try {
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

    const headers = [
      'DNI',
      'Cuenta',
      'Razón Social',
      'Pagaré',
      'Fecha Otorga',
      'Monto Neto (S/)',
      'Producto',
      'Agencia',
      'Responsable',
      'Tiene Voucher'
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Desembolsos');

    // Anchos de columnas
    worksheet.getColumn(1).width = 12;
    worksheet.getColumn(2).width = 14;
    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(4).width = 14;
    worksheet.getColumn(5).width = 14;
    worksheet.getColumn(6).width = 18;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 25;
    worksheet.getColumn(10).width = 15;

    // Aplicar numFmt a nivel de columna para el monto (evita estilos duplicados y corrupción en styles.xml)
    worksheet.getColumn(6).numFmt = '#.##0,00';  // Separadores peruanos: . para miles, , para decimales

    // ===== FILA 1: TÍTULO =====
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'HISTORIAL DE DESEMBOLSOS REALIZADOS';
    titleCell.font = { bold: true, size: 14 };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;

    // ===== FILA 2: FECHA =====
    worksheet.mergeCells('A2:J2');
    const fechaCell = worksheet.getCell('A2');
    fechaCell.value = `Fecha de Búsqueda: ${fecha}`;
    fechaCell.font = { bold: true, size: 11 };
    fechaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    fechaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // ===== FILA 3: VACÍA =====
    worksheet.getRow(3).height = 5;

    // ===== FILA 4: ENCABEZADOS - CELDA POR CELDA =====
    const headerRow = worksheet.getRow(4);
    
    for (let i = 0; i < headers.length; i++) {
      const cell = headerRow.getCell(i + 1);
      cell.value = headers[i];
      cell.font = { bold: true, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B9BD5' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    headerRow.height = 35;

    // ===== FILAS DE DATOS - CELDA POR CELDA =====
    desembolsos.forEach((desembolso, index) => {
      const rowData = [
        desembolso.DNI || '',
        desembolso.CUENTA || '',
        desembolso.RAZON_SOCIAL || '',
        desembolso.PAGARE || '',
        formatearFecha(desembolso.OTORGA),
        parseFloat(desembolso.MONTO_NETO || '0'),
        desembolso.PRODUCTO || '',
        desembolso.AGENCIA || '',
        desembolso.RESPONSABLE || '',
        desembolso.ENLACE ? 'Sí' : 'No'
      ];
      
      const row = worksheet.getRow(5 + index);
      const fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2';
      
      for (let i = 0; i < rowData.length; i++) {
        const cell = row.getCell(i + 1);
        cell.value = rowData[i];
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor }
        };
        
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Columna 6 = Monto (índice 5): Ya no setear numFmt aquí, se hace en la columna
        if (i === 5) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.font = { bold: true };
        } 
        // Columnas de texto largo (índices 2, 6, 7, 8)
        else if ([2, 6, 7, 8].includes(i)) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
        // Resto centrado
        else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      
      row.height = 25;
    });

    // Calcular totales
    const totalMonto = desembolsos.reduce((total, d) => total + parseFloat(d.MONTO_NETO || '0'), 0);
    const dataEndRow = 4 + desembolsos.length;

    // Línea vacía
    worksheet.getRow(dataEndRow + 1).height = 5;

    // ===== FILA TOTAL =====
    const totalRowNumber = dataEndRow + 2;
    worksheet.mergeCells(`A${totalRowNumber}:E${totalRowNumber}`);
    
    const totalLabelCell = worksheet.getCell(`A${totalRowNumber}`);
    totalLabelCell.value = 'TOTAL DESEMBOLSADO:';
    totalLabelCell.font = { bold: true, size: 12 };
    totalLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalLabelCell.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };
    
    const totalMontoCell = worksheet.getCell(`F${totalRowNumber}`);
    totalMontoCell.value = totalMonto;
    totalMontoCell.font = { bold: true, size: 12 };
    totalMontoCell.numFmt = '#.##0,00';  // CAMBIADO: Separadores peruanos
    totalMontoCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    totalMontoCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalMontoCell.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };
    
    worksheet.getRow(totalRowNumber).height = 30;

    // ===== FILA CANTIDAD =====
    const cantidadRowNumber = totalRowNumber + 1;
    worksheet.mergeCells(`A${cantidadRowNumber}:E${cantidadRowNumber}`);
    
    const cantidadLabelCell = worksheet.getCell(`A${cantidadRowNumber}`);
    cantidadLabelCell.value = 'CANTIDAD DE DESEMBOLSOS:';
    cantidadLabelCell.font = { bold: true, size: 11 };
    cantidadLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    cantidadLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    cantidadLabelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    const cantidadValorCell = worksheet.getCell(`F${cantidadRowNumber}`);
    cantidadValorCell.value = desembolsos.length;
    cantidadValorCell.font = { bold: true, size: 11 };
    cantidadValorCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    cantidadValorCell.alignment = { horizontal: 'center', vertical: 'middle' };
    cantidadValorCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    worksheet.getRow(cantidadRowNumber).height = 28;

    // Escribir y descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Desembolsos_${fecha.replace(/\//g, '-')}.xlsx`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};