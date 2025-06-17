import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ExcelJS from 'exceljs';
import { fetchPaymentHistory, PaymentHistoryRecord, PaymentHistoryResponse } from '../../api/paymentsApi';
import { AGENCIAS } from '../../types';

// Función para obtener el nombre de la agencia por su código
const getAgencyName = (agencyCode: string): string => {
  const entry = Object.entries(AGENCIAS).find(([, code]) => code === agencyCode);
  return entry ? entry[0] : agencyCode;
};

// Función para obtener el nombre del tipo de pago
const getTipoPagoTexto = (tipoPago: string): string => {
  const tipos = {
    'pago_normal': 'Pago Normal',
    'pago_liquida': 'Liquidación',
    'rechazo_total': 'Rechazo Total',
    'rechazo_parcial': 'Rechazo Parcial'
  };
  return tipos[tipoPago as keyof typeof tipos] || tipoPago;
};

// Función para obtener el nombre del tipo de operación
const getTipoOperacionTexto = (tipo: string) => {
  const textos = {
    'aceptacion_total': 'Aceptación Total',
    'rechazo_total': 'Rechazo Total',
    'rechazo_parcial': 'Rechazo Parcial',
    'modificacion_parcial': 'Modificación Parcial'
  };
  return textos[tipo as keyof typeof textos] || tipo;
};

// Función para calcular el monto real pagado (solo vouchers aceptados)
const calcularMontoRealPagado = (registro: PaymentHistoryRecord): number => {
  return registro.comprobante.vouchers_modificados
    .filter(voucher => voucher.estado_nuevo === 'aceptado')
    .reduce((total, voucher) => total + (voucher.monto_pago || 0), 0);
};

// Función para formatear fecha y hora
function formatearFechaYHora(fechaStr: string, horaStr: string) {
  const fecha = new Date(`${fechaStr}T${horaStr}`);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const hora = fecha.toTimeString().split(' ')[0];
  return `${dia}/${mes}/${anio} ${hora}`;
}

interface DatosPagoAplicado {
  fecha_pago: string;
  hora_pago: string;
  dni_cliente: string;
  nombre_cliente: string;
  credito_id: string;
  agencia: string;
  tipo_pago: string;
  tipo_operacion: string;
  estado_anterior: string;
  estado_final: string;
  monto_total_aplicado: number;
  vouchers_aceptados: number;
  vouchers_rechazados: number;
  procesado_por: string;
  email_procesador: string;
  detalle_vouchers: Array<{
    indice: number;
    nro_operacion: string;
    tipo_operacion: string;
    monto: number;
    estado: string;
  }>;
}

const ReportePagosAplicados: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [rangoExporte, setRangoExporte] = useState<'hoy' | 'rango' | 'todo'>('hoy');
  const [fechaInicioExporte, setFechaInicioExporte] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFinExporte, setFechaFinExporte] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [datosPagos, setDatosPagos] = useState<DatosPagoAplicado[]>([]);
  const [mostrandoVista, setMostrandoVista] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  // Función para obtener datos de pagos aplicados
  const obtenerDatosPagosAplicados = async (rango: 'hoy' | 'rango' | 'todo', fechaInicio?: string, fechaFin?: string): Promise<DatosPagoAplicado[]> => {
    try {
      let fechas = { fechaInicio: '', fechaFin: '' };
      
      switch (rango) {
        case 'hoy':
          const hoy = format(new Date(), 'yyyy-MM-dd');
          fechas = { fechaInicio: hoy, fechaFin: hoy };
          break;
        case 'rango':
          fechas = { fechaInicio: fechaInicio || '', fechaFin: fechaFin || '' };
          break;
        case 'todo':
          fechas = { fechaInicio: '2020-01-01', fechaFin: format(new Date(), 'yyyy-MM-dd') };
          break;
      }

      const response: PaymentHistoryResponse = await fetchPaymentHistory({
        fechaInicio: fechas.fechaInicio,
        fechaFin: fechas.fechaFin
      });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      // Filtrar solo pagos aceptados y procesar datos
      const pagosAplicados = response.data
        .filter(registro => {
          const tieneVouchersAceptados = registro.comprobante.vouchers_modificados.some(v => v.estado_nuevo === 'aceptado');
          const esAceptacionTotal = registro.tipo_operacion === 'aceptacion_total';
          const esRechazoParciálConAceptados = registro.tipo_operacion === 'rechazo_parcial' && tieneVouchersAceptados;
          
          return esAceptacionTotal || esRechazoParciálConAceptados;
        })
        .map(registro => {
          const vouchersAceptados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'aceptado');
          const vouchersRechazados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'rechazado');
          
          return {
            fecha_pago: registro.fecha_pago,
            hora_pago: registro.hora_pago,
            dni_cliente: registro.comprobante.dni,
            nombre_cliente: registro.comprobante.nombreSocio,
            credito_id: registro.comprobante.creditoId,
            agencia: getAgencyName(registro.agencia),
            tipo_pago: getTipoPagoTexto(registro.tipo_pago),
            tipo_operacion: getTipoOperacionTexto(registro.tipo_operacion),
            estado_anterior: registro.estadoGeneral_anterior,
            estado_final: registro.estadoGeneral_final,
            monto_total_aplicado: calcularMontoRealPagado(registro),
            vouchers_aceptados: vouchersAceptados.length,
            vouchers_rechazados: vouchersRechazados.length,
            procesado_por: registro.dni_usuario,
            email_procesador: registro.email,
            detalle_vouchers: vouchersAceptados.map(v => ({
              indice: v.indice,
              nro_operacion: v.nroOperacion || 'N/A',
              tipo_operacion: v.tipoOperacion || 'N/A',
              monto: v.monto_pago || 0,
              estado: v.estado_nuevo
            }))
          };
        });

      return pagosAplicados;
    } catch (error) {
      console.error('Error al obtener datos de pagos:', error);
      return [];
    }
  };

  // Función para exportar a Excel
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const datos = await obtenerDatosPagosAplicados(rangoExporte, fechaInicioExporte, fechaFinExporte);
      
      const workbook = new ExcelJS.Workbook();
      
      // Hoja principal de resumen
      const worksheetResumen = workbook.addWorksheet('Resumen de Pagos');
      
      // Agregar título y información del reporte
      worksheetResumen.addRow(['REPORTE DE PAGOS APLICADOS']);
      worksheetResumen.addRow([`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`]);
      
      let rangoTexto = '';
      switch (rangoExporte) {
        case 'hoy':
          rangoTexto = `Pagos aplicados hoy (${format(new Date(), 'dd/MM/yyyy')})`;
          break;
        case 'rango':
          rangoTexto = `Rango: ${fechaInicioExporte} a ${fechaFinExporte}`;
          break;
        case 'todo':
          rangoTexto = 'Todos los pagos aplicados';
          break;
      }
      worksheetResumen.addRow([`Período: ${rangoTexto}`]);
      worksheetResumen.addRow([`Total de registros: ${datos.length}`]);
      worksheetResumen.addRow([`Monto total aplicado: S/ ${datos.reduce((total, d) => total + d.monto_total_aplicado, 0).toFixed(2)}`]);
      worksheetResumen.addRow([]); // Fila vacía

      // Configurar encabezados
      worksheetResumen.addRow([
        'Fecha y Hora',
        'DNI Cliente',
        'Nombre Cliente',
        'Crédito ID',
        'Agencia',
        'Tipo Pago',
        'Tipo Operación',
        'Estado Anterior',
        'Estado Final',
        'Monto Aplicado',
        'Vouchers Aceptados',
        'Procesado Por',
        'Email Procesador'
      ]);

      // Agregar datos
      datos.forEach(pago => {
        worksheetResumen.addRow([
          formatearFechaYHora(pago.fecha_pago, pago.hora_pago),
          pago.dni_cliente,
          pago.nombre_cliente,
          pago.credito_id,
          pago.agencia,
          pago.tipo_pago,
          pago.tipo_operacion,
          pago.estado_anterior,
          pago.estado_final,
          pago.monto_total_aplicado,
          pago.vouchers_aceptados,
          pago.procesado_por,
          pago.email_procesador
        ]);
      });

      // Hoja detallada de vouchers
      const worksheetDetalle = workbook.addWorksheet('Detalle de Vouchers');
      worksheetDetalle.addRow([
        'DNI Cliente',
        'Nombre Cliente',
        'Crédito ID',
        'Fecha Pago',
        'Voucher #',
        'Nro Operación',
        'Tipo Operación',
        'Monto',
        'Estado',
        'Agencia',
        'Procesado Por'
      ]);

      datos.forEach(pago => {
        pago.detalle_vouchers.forEach(voucher => {
          worksheetDetalle.addRow([
            pago.dni_cliente,
            pago.nombre_cliente,
            pago.credito_id,
            formatearFechaYHora(pago.fecha_pago, pago.hora_pago),
            voucher.indice + 1,
            voucher.nro_operacion,
            voucher.tipo_operacion,
            voucher.monto,
            voucher.estado,
            pago.agencia,
            pago.procesado_por
          ]);
        });
      });

      // Dar formato a las columnas
      [worksheetResumen, worksheetDetalle].forEach(ws => {
        ws.columns.forEach(column => {
          column.width = 15;
        });
        
        // Estilo del encabezado
        const headerRow = ws.getRow(ws.rowCount > 10 ? 7 : 1);
        if (headerRow) {
          headerRow.font = { bold: true };
          headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
        }
      });

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fechaReporte = format(new Date(), 'yyyy-MM-dd_HHmm');
      let nombreArchivo = `Reporte_Pagos_Aplicados_${fechaReporte}`;
      
      if (rangoExporte === 'hoy') {
        nombreArchivo += '_Hoy';
      } else if (rangoExporte === 'rango') {
        nombreArchivo += `_${fechaInicioExporte}_a_${fechaFinExporte}`;
      } else {
        nombreArchivo += '_Todos';
      }
      
      a.download = `${nombreArchivo}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar vista previa
  const handleMostrarVista = async () => {
    setLoading(true);
    try {
      const datos = await obtenerDatosPagosAplicados(rangoExporte, fechaInicioExporte, fechaFinExporte);
      setDatosPagos(datos);
      setMostrandoVista(true);
      setExportModalOpen(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Configurar impresión
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 15mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          font-size: 10px;
        }
        table {
          font-size: 8px;
        }
        th, td {
          padding: 2px !important;
          font-size: 8px !important;
        }
      }
    `
  });

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generar Reporte de Pagos Aplicados</h3>
          <p className="text-gray-600 mb-6">Selecciona el rango de fechas y genera un reporte completo de los pagos aplicados</p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            📊 Generar Reporte
          </button>
          
          {datosPagos.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🖨️ Imprimir
            </button>
          )}
        </div>
      </div>

      {/* Vista previa de datos */}
      {mostrandoVista && datosPagos.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Vista Previa del Reporte</h3>
            <p className="text-sm text-gray-600">
              {datosPagos.length} registro{datosPagos.length !== 1 ? 's' : ''} |
              Total: S/ {datosPagos.reduce((total, d) => total + d.monto_total_aplicado, 0).toFixed(2)}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr className="bg-cyan-500 text-white">
                  <th className="px-3 py-2 text-left text-xs font-medium">Fecha y Hora</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Cliente</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">DNI</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Crédito ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Agencia</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Monto</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">Vouchers</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Procesado Por</th>
                </tr>
              </thead>
              <tbody>
                {datosPagos.map((pago, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs">{formatearFechaYHora(pago.fecha_pago, pago.hora_pago)}</td>
                    <td className="px-3 py-2 text-xs">{pago.nombre_cliente}</td>
                    <td className="px-3 py-2 text-xs font-mono">{pago.dni_cliente}</td>
                    <td className="px-3 py-2 text-xs font-mono">{pago.credito_id}</td>
                    <td className="px-3 py-2 text-xs">{pago.agencia}</td>
                    <td className="px-3 py-2 text-xs text-right font-medium">S/ {pago.monto_total_aplicado.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-center">
                      <span className="text-green-600">{pago.vouchers_aceptados} ✓</span>
                      {pago.vouchers_rechazados > 0 && <span className="text-red-600 ml-1">{pago.vouchers_rechazados} ✗</span>}
                    </td>
                    <td className="px-3 py-2 text-xs">{pago.procesado_por}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido para impresión */}
      <div ref={printRef} className="hidden print:block">
        <div className="p-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">REPORTE DE PAGOS APLICADOS</h1>
            <p className="text-sm text-gray-600">Generado el {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
          </div>
          
          {datosPagos.length > 0 && (
            <table className="w-full text-xs border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1">Fecha/Hora</th>
                  <th className="border p-1">Cliente</th>
                  <th className="border p-1">DNI</th>
                  <th className="border p-1">Crédito</th>
                  <th className="border p-1">Agencia</th>
                  <th className="border p-1">Monto</th>
                  <th className="border p-1">Vouchers</th>
                  <th className="border p-1">Procesado Por</th>
                </tr>
              </thead>
              <tbody>
                {datosPagos.map((pago, index) => (
                  <tr key={index}>
                    <td className="border p-1">{formatearFechaYHora(pago.fecha_pago, pago.hora_pago)}</td>
                    <td className="border p-1">{pago.nombre_cliente}</td>
                    <td className="border p-1">{pago.dni_cliente}</td>
                    <td className="border p-1">{pago.credito_id}</td>
                    <td className="border p-1">{pago.agencia}</td>
                    <td className="border p-1 text-right">S/ {pago.monto_total_aplicado.toFixed(2)}</td>
                    <td className="border p-1 text-center">{pago.vouchers_aceptados} ✓ {pago.vouchers_rechazados > 0 && `${pago.vouchers_rechazados} ✗`}</td>
                    <td className="border p-1">{pago.procesado_por}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de exportación */}
      {exportModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4" onClick={() => setExportModalOpen(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Configurar Reporte de Pagos</h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rango de fechas:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rango"
                      value="hoy"
                      checked={rangoExporte === 'hoy'}
                      onChange={(e) => setRangoExporte(e.target.value as 'hoy')}
                      className="mr-2"
                    />
                    📅 Pagos aplicados hoy ({format(new Date(), 'dd/MM/yyyy')})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rango"
                      value="rango"
                      checked={rangoExporte === 'rango'}
                      onChange={(e) => setRangoExporte(e.target.value as 'rango')}
                      className="mr-2"
                    />
                    📆 Rango de fechas personalizado
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rango"
                      value="todo"
                      checked={rangoExporte === 'todo'}
                      onChange={(e) => setRangoExporte(e.target.value as 'todo')}
                      className="mr-2"
                    />
                    📋 Todos los pagos aplicados
                  </label>
                </div>
              </div>

              {rangoExporte === 'rango' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input
                      type="date"
                      value={fechaInicioExporte}
                      onChange={(e) => setFechaInicioExporte(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input
                      type="date"
                      value={fechaFinExporte}
                      onChange={(e) => setFechaFinExporte(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleMostrarVista}
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? '⏳ Cargando...' : '👁️ Ver Vista Previa'}
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? '⏳ Exportando...' : '📊 Exportar Excel'}
                </button>
              </div>
              
              <button
                onClick={() => setExportModalOpen(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>

  );
};

export default ReportePagosAplicados;