import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { AGENCIAS } from '../../types';
import { UserRole } from '../../types/roles';
import { useAuth } from '../../hooks/useAuth';

interface ReportePagosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportePago {
  cuenta: string;
  razonSocial: string;
  total: number;
  fecha: string;
  agencia: string;
}

// Datos de desarrollo - se reemplazarán con la API externa
const getFechaDevelopment = () => new Date().toISOString().split('T')[0]; // Fecha de hoy

const datosDesarrollo: ReportePago[] = [
  {
    cuenta: "001234567",
    razonSocial: "JUAN PÉREZ GARCÍA",
    total: 1250.50,
    fecha: getFechaDevelopment(),
    agencia: "LIMA_CENTRO"
  },
  {
    cuenta: "001234568",
    razonSocial: "MARÍA RODRÍGUEZ LÓPEZ",
    total: 850.00,
    fecha: getFechaDevelopment(),
    agencia: "LIMA_CENTRO"
  },
  {
    cuenta: "001234569",
    razonSocial: "CARLOS MENDOZA SILVA",
    total: 2100.75,
    fecha: getFechaDevelopment(),
    agencia: "LIMA_NORTE"
  },
  {
    cuenta: "001234570",
    razonSocial: "ANA TORRES VEGA",
    total: 675.25,
    fecha: '2025-07-17',
    agencia: "LIMA_CENTRO"
  },
  {
    cuenta: "001234571",
    razonSocial: "LUIS GARCÍA MORALES",
    total: 1500.00,
    fecha: "2025-07-17",
    agencia: "LIMA_SUR"
  },
  {
    cuenta: "001234572",
    razonSocial: "MARIA MARTINEZ",
    total: 1000.00,
    fecha: "2025-07-17",
    agencia: "LIMA_SUR"
  },
  
];

const ReportePagosModal: React.FC<ReportePagosModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState('');
  const [reporteData, setReporteData] = useState<ReportePago[]>([]);
  const [loading, setLoading] = useState(false);

  // Configurar agencia según el rol del usuario
  useEffect(() => {
    if (user?.role === UserRole.CAJERO && user?.agencias && user.agencias.length >= 1) {
      // Para cajero: solo su agencia (no puede cambiarla)
      setAgenciaSeleccionada(user.agencias[0].agencia);
    } else {
      // Para otros roles: pueden ver todas las agencias
      setAgenciaSeleccionada('');
    }
  }, [user]);

  // Verificar si el usuario puede cambiar agencia (solo cajeros NO pueden)
  const puedeEditarAgencia = user?.role !== UserRole.CAJERO;

  // Obtener agencias disponibles según el rol
  const agenciasDisponibles = React.useMemo(() => {
    if (user?.role === UserRole.CAJERO) {
      return user.agencias || [];
    }
    // Jefa de operaciones, gerente y super admin pueden ver todas
    return Object.entries(AGENCIAS).map(([nombre, codigo]) => ({
      agencia: codigo,
      nombre
    }));
  }, [user]);

  // Cargar datos del reporte
  const cargarReporte = async () => {
    setLoading(true);
    try {
      // Simular llamada a API externa
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let datosFiltrados = datosDesarrollo;
      
      // Filtrar por agencia
      if (user?.role === UserRole.CAJERO) {
        // Cajero solo ve su agencia
        datosFiltrados = datosDesarrollo.filter(item => item.agencia === agenciaSeleccionada);
      } else if (agenciaSeleccionada) {
        // Otros roles pueden filtrar por agencia específica
        datosFiltrados = datosDesarrollo.filter(item => item.agencia === agenciaSeleccionada);
      }
      
      // Filtrar por fecha
      datosFiltrados = datosFiltrados.filter(item => item.fecha === fechaSeleccionada);
      
      setReporteData(datosFiltrados);
    } catch (error) {
      setReporteData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos automáticamente al abrir el modal o cambiar filtros
  useEffect(() => {
    if (isOpen) {
      cargarReporte();
    }
  }, [isOpen, fechaSeleccionada, agenciaSeleccionada]);

  // Calcular total general
  const totalGeneral = reporteData.reduce((sum, item) => sum + item.total, 0);

  // Función para exportar a Excel (similar al cronograma)
  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Pagos');

    // Configurar encabezados
    worksheet.addRow(['REPORTE DE PAGOS - CUADRE DE CAJA']);
    worksheet.addRow([]);
    worksheet.addRow(['Fecha:', fechaSeleccionada]);
    if (agenciaSeleccionada) {
      const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0];
      worksheet.addRow(['Agencia:', nombreAgencia]);
    }
    worksheet.addRow(['Generado por:', `${user?.razon} - ${user?.cargo || user?.role}`]);
    worksheet.addRow(['Generado el:', new Date().toLocaleString('es-PE')]);
    worksheet.addRow([]);

    // Encabezados de tabla
    const headerRow = worksheet.addRow(['Cuenta', 'Razón Social', 'Total', 'Fecha', 'Agencia']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0ea5e9' }
    };

    // Datos
    reporteData.forEach(item => {
      const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === item.agencia)?.[0];
      worksheet.addRow([
        item.cuenta,
        item.razonSocial,
        item.total,
        item.fecha,
        nombreAgencia
      ]);
    });

    // Fila de total
    worksheet.addRow([]);
    const totalRow = worksheet.addRow(['', '', 'TOTAL GENERAL:', totalGeneral, '']);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFffeb3b' }
    };

    // Ajustar ancho de columnas
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nombreArchivo = `Cuadre_Caja_${fechaSeleccionada}${agenciaSeleccionada ? `_${Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0]}` : ''}.xlsx`;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Función para exportar a PDF (manual sin autotable)
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE PAGOS - CUADRE DE CAJA', 20, 20);
    
    // Información del reporte
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaSeleccionada}`, 20, 35);
    if (agenciaSeleccionada) {
      const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0];
      doc.text(`Agencia: ${nombreAgencia}`, 20, 45);
    }
    doc.text(`Generado por: ${user?.razon} - ${user?.cargo || user?.role}`, 20, 55);
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 20, 65);

    // Tabla manual
    let yPosition = 80;
    
    // Encabezados de tabla
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Cuenta', 20, yPosition);
    doc.text('Razón Social', 60, yPosition);
    doc.text('Total', 120, yPosition);
    doc.text('Fecha', 150, yPosition);
    doc.text('Agencia', 180, yPosition);
    
    // Línea debajo de encabezados
    doc.line(20, yPosition + 2, 200, yPosition + 2);
    yPosition += 10;
    
    // Datos de la tabla
    doc.setFont('helvetica', 'normal');
    reporteData.forEach((item) => {
      const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === item.agencia)?.[0];
      
      doc.text(item.cuenta, 20, yPosition);
      doc.text(item.razonSocial.substring(0, 25), 60, yPosition); // Truncar si es muy largo
      doc.text(`S/ ${item.total.toFixed(2)}`, 120, yPosition);
      doc.text(item.fecha, 150, yPosition);
      doc.text((nombreAgencia || item.agencia).substring(0, 15), 180, yPosition);
      
      yPosition += 8;
      
      // Si llegamos al final de la página, crear nueva página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Total general
    yPosition += 10;
    doc.line(20, yPosition, 200, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GENERAL: S/ ${totalGeneral.toFixed(2)}`, 20, yPosition);

    // Descargar
    const nombreArchivo = `Cuadre_Caja_${fechaSeleccionada}${agenciaSeleccionada ? `_${Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0]}` : ''}.pdf`;
    doc.save(nombreArchivo);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Reporte de Pagos - Cuadre de Caja</h2>
            <p className="text-cyan-100 text-sm">Sistema de reportes externos</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Filtros */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Filtros de Reporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro de fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha del Reporte
                </label>
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Filtro de agencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 Agencia
                </label>
                <select
                  value={agenciaSeleccionada}
                  onChange={(e) => setAgenciaSeleccionada(e.target.value)}
                  disabled={!puedeEditarAgencia}
                  className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                    !puedeEditarAgencia ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  {puedeEditarAgencia && <option value="">Todas las agencias</option>}
                  {agenciasDisponibles.map((agencia) => (
                    <option key={agencia.agencia} value={agencia.agencia}>
                      {'nombre' in agencia ? agencia.nombre : Object.entries(AGENCIAS).find(([_, code]) => code === agencia.agencia)?.[0]}
                    </option>
                  ))}
                </select>
                {!puedeEditarAgencia && (
                  <p className="text-xs text-gray-500 mt-1">
                    🔒 Agencia bloqueada para usuarios de caja
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Área de resultados */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando reporte...</p>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Resumen del Reporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Total de registros</p>
                    <p className="text-2xl font-bold text-blue-800">{reporteData.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Fecha consultada</p>
                    <p className="text-lg font-semibold text-blue-800">{fechaSeleccionada}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Agencia</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {agenciaSeleccionada 
                        ? Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0] 
                        : 'Todas'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total general</p>
                    <p className="text-2xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de datos */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2">
                  <h3 className="font-semibold">Detalle de Pagos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón Social</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reporteData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No se encontraron registros para la fecha seleccionada
                          </td>
                        </tr>
                      ) : (
                        reporteData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.cuenta}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.razonSocial}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">S/ {item.total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.fecha}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {Object.entries(AGENCIAS).find(([_, code]) => code === item.agencia)?.[0]}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              {reporteData.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-yellow-800">TOTAL GENERAL:</span>
                    <span className="text-2xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Nota de desarrollo */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-orange-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-orange-800">Datos de Desarrollo</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Este reporte muestra datos de prueba.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con botones de acción */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cerrar
          </button>
          
          {reporteData.length > 0 && (
            <div className="flex space-x-3">
              <button
                onClick={exportarExcel}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar Excel
              </button>
              <button
                onClick={exportarPDF}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportePagosModal;