import React, { useState, useEffect } from 'react';
import UserFilter from './components/UserFilter';
import { createPortal } from 'react-dom';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { AGENCIAS, UserResponse, AgenciaCaja } from '../../types';
import { UserRole } from '../../types/roles';
import { useAuth } from '../../hooks/useAuth';
import { getMovimientosDiarios, MovimientoPrestamoDiario } from '../../api/paymentsApi';
import { fetchAllUsers } from '../../api/userApi';

interface ReportePagosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportePagosModal: React.FC<ReportePagosModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState('');
  const [reporteData, setReporteData] = useState<MovimientoPrestamoDiario[]>([]);
  const [agenciasUsuarioSeleccionado, setAgenciasUsuarioSeleccionado] = useState<AgenciaCaja[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<UserResponse[]>([]);

  // Determinar si el usuario es admin (puede ver todos los usuarios y agencias)
  const esAdmin = user?.role === UserRole.GERENTE_GENERAL || 
                  user?.role === UserRole.SUPER_ADMIN || 
                  user?.role === UserRole.JEFE_OPERACIONES;

  const esCajero = user?.role === UserRole.CAJERO;

  // Cargar usuarios disponibles solo para admins
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const usuarios = await fetchAllUsers();
        const usuariosFiltrados = usuarios.filter(
          (usuario) =>
            usuario.role === UserRole.CAJERO ||
            usuario.role === UserRole.ADMINISTRADOR ||
            usuario.role === UserRole.SUPER_ADMIN
        );
        setUsuariosDisponibles(usuariosFiltrados);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };

    if (esAdmin) {
      cargarUsuarios();
    }
  }, [esAdmin]);

  // Inicializar datos según el rol del usuario
  useEffect(() => {
    if (!user) return;

    if (esCajero) {
      // Para cajeros: usar su propia agencia y cargar automáticamente
      if (user.agencias && user.agencias.length > 0) {
        setAgenciaSeleccionada(user.agencias[0].agencia);
        setUsuarioSeleccionado(user.dni || '');
        setAgenciasUsuarioSeleccionado(user.agencias);
      }
    } else if (esAdmin) {
      // Para admins: inicializar con sus propios datos
      setUsuarioSeleccionado(user.dni || '');
      if (user.agencias && user.agencias.length > 0) {
        setAgenciasUsuarioSeleccionado(user.agencias);
        if (user.agencias.length === 1) {
          setAgenciaSeleccionada(user.agencias[0].agencia);
        }
      }
    }
  }, [user, esCajero, esAdmin]);

  // Manejar cambio de usuario seleccionado (solo para admins)
  useEffect(() => {
    if (!esAdmin || !usuarioSeleccionado) return;

    const selectedUser = usuariosDisponibles.find(u => u.dni === usuarioSeleccionado);
    if (selectedUser?.agencias) {
      const agencias = selectedUser.agencias;
      setAgenciasUsuarioSeleccionado(agencias);

      // Si el usuario tiene una sola agencia, seleccionarla automáticamente
      if (agencias.length === 1) {
        setAgenciaSeleccionada(agencias[0].agencia);
      } else {
        // Si tiene múltiples agencias, resetear para que seleccione una
        setAgenciaSeleccionada('');
      }
    } else {
      setAgenciasUsuarioSeleccionado([]);
      setAgenciaSeleccionada('');
    }
  }, [usuarioSeleccionado, usuariosDisponibles, esAdmin]);

  // Obtener agencias disponibles para mostrar en el select
  const agenciasDisponibles = React.useMemo(() => {
    if (esCajero) {
      // Cajeros: solo sus agencias
      return user?.agencias || [];
    } else if (esAdmin) {
      // Admins: agencias del usuario seleccionado
      return agenciasUsuarioSeleccionado;
    }
    return [];
  }, [esCajero, esAdmin, user?.agencias, agenciasUsuarioSeleccionado]);

  // Determinar si debe mostrar el select de agencias
  const mostrarSelectAgencia = () => {
    if (esCajero) {
      // Mostrar solo si el cajero tiene más de una agencia
      return (user?.agencias?.length || 0) > 1;
    } else if (esAdmin) {
      // Mostrar si el usuario seleccionado tiene más de una agencia
      return agenciasUsuarioSeleccionado.length > 1;
    }
    return false;
  };

  const cargarReporte = async () => {
    if (!usuarioSeleccionado || !agenciaSeleccionada) {
      setError('Debe seleccionar usuario y agencia');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const fecha = new Date(fechaSeleccionada).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '/');

      // Obtener los datos del usuario seleccionado para obtener cod_caja
      let cod_caja = '';
      
      if (esCajero) {
        // Para cajeros, usar su propio cod_caja
        cod_caja = user?.agencias?.find(ag => ag.agencia === agenciaSeleccionada)?.cod_caja || '';
      } else if (esAdmin) {
        // Para admins, obtener cod_caja del usuario seleccionado
        const selectedUser = usuariosDisponibles.find(u => u.dni === usuarioSeleccionado);
        cod_caja = selectedUser?.agencias?.find(ag => ag.agencia === agenciaSeleccionada)?.cod_caja || '';
      }

      console.log('Cargando reporte con:', { fecha, cod_caja, agencia: agenciaSeleccionada, usuario: usuarioSeleccionado });

      const response = await getMovimientosDiarios(fecha, cod_caja, agenciaSeleccionada);
      setReporteData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      setError('Error al cargar los datos del reporte');
      setReporteData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar reporte automáticamente cuando se tienen todos los datos necesarios
  useEffect(() => {
    if (isOpen && usuarioSeleccionado && agenciaSeleccionada && fechaSeleccionada) {
      cargarReporte();
    }
  }, [isOpen, usuarioSeleccionado, agenciaSeleccionada, fechaSeleccionada]);

  const totalGeneral = Array.isArray(reporteData) ? reporteData.reduce((sum, item) => {
    const total = parseFloat(item.TOTAL) || 0;
    return sum + total;
  }, 0) : 0;

  const exportarExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Pagos');
      
      // Información del encabezado
      worksheet.addRow(['REPORTE DE PAGOS - CUADRE DE CAJA']);
      worksheet.addRow([]);
      worksheet.addRow(['Fecha:', fechaSeleccionada]);

      if (agenciaSeleccionada) {
        const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0];
        worksheet.addRow(['Agencia:', nombreAgencia]);
      }

      // Información del usuario que genera el reporte
      const usuarioGenerador = esAdmin && usuarioSeleccionado !== user?.dni 
        ? usuariosDisponibles.find(u => u.dni === usuarioSeleccionado)
        : user;

      worksheet.addRow(['Usuario del reporte:', `${usuarioGenerador?.razon} - ${usuarioGenerador?.cargo || usuarioGenerador?.role}`]);
      worksheet.addRow(['Generado por:', `${user?.razon} - ${user?.cargo || user?.role}`]);
      worksheet.addRow(['Generado el:', new Date().toLocaleString('es-PE')]);
      worksheet.addRow([]);

      // Headers de la tabla
      const headerRow = worksheet.addRow([
        'FECHA_MOV', 'COD_AGENCIA', 'COD_CAJA', 'NRO_DOC', 'CAPITAL',
        'INTERES', 'MORA', 'SEGURO', 'PORTES', 'DESGRAV', 'APORTE',
        'TOTAL', 'MONEDA', 'TIPO_PAGO', 'GLOSA'
      ]);

      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0ea5e9' }
      };

      // Datos
      reporteData.forEach(item => {
        worksheet.addRow([
          item.FECHA_MOV,
          item.COD_AGENCIA,
          item.COD_CAJA,
          item.NRO_DOC,
          item.CAPITAL,
          item.INTERES,
          item.MORA,
          item.SEGURO,
          item.PORTES,
          item.DESGRAV,
          item.APORTE,
          item.TOTAL,
          item.MONEDA,
          item.TIPO_PAGO,
          item.GLOSA
        ]);
      });

      // Total
      worksheet.addRow([]);
      const totalRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', `TOTAL: ${totalGeneral.toFixed(2)}`, '', '', '']);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFffeb3b' }
      };

      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0];
      const nombreArchivo = `Cuadre_Caja_${fechaSeleccionada}${nombreAgencia ? `_${nombreAgencia}` : ''}.xlsx`;
      a.download = nombreArchivo;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar a Excel');
    }
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF('portrait');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE PAGOS - CUADRE DE CAJA', 10, 10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${fechaSeleccionada}`, 10, 18);

      if (agenciaSeleccionada) {
        const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0];
        doc.text(`Agencia: ${nombreAgencia}`, 10, 26);
      }

      // Información del usuario del reporte
      const usuarioGenerador = esAdmin && usuarioSeleccionado !== user?.dni 
        ? usuariosDisponibles.find(u => u.dni === usuarioSeleccionado)
        : user;

      doc.text(`Usuario del reporte: ${usuarioGenerador?.razon} - ${usuarioGenerador?.cargo || usuarioGenerador?.role}`, 10, 34);
      doc.text(`Generado por: ${user?.razon} - ${user?.cargo || user?.role}`, 10, 42);
      doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 10, 50);

      let yPosition = 65;
      const headers = ['FECHA', 'AGENCIA', 'CAJA', 'DOC', 'CAPITAL', 'INTERES', 'MORA', 'SEGURO', 'PORTES', 'DESGRAV', 'APORTE', 'TOTAL', 'MONEDA', 'TIPO', 'GLOSA'];
      const columnWidths = [14, 12, 10, 12, 11, 11, 9, 11, 9, 11, 11, 12, 10, 14, 22];

      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');

      let xPosition = 10;
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      doc.line(10, yPosition + 2, 200, yPosition + 2);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');

      reporteData.forEach((item) => {
        xPosition = 10;
        const values = [
          item.FECHA_MOV?.substring(0, 10) || '',
          item.COD_AGENCIA || '',
          item.COD_CAJA || '',
          item.NRO_DOC || '',
          item.CAPITAL || '0',
          item.INTERES || '0',
          item.MORA || '0',
          item.SEGURO || '0',
          item.PORTES || '0',
          item.DESGRAV || '0',
          item.APORTE || '0',
          item.TOTAL || '0',
          item.MONEDA || '',
          item.TIPO_PAGO || '',
          (item.GLOSA || '').substring(0, 22) + (item.GLOSA?.length > 22 ? '...' : '')
        ];

        values.forEach((value, index) => {
          doc.text(String(value), xPosition, yPosition);
          xPosition += columnWidths[index];
        });

        yPosition += 6;
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 10;
          xPosition = 10;
          doc.setFont('helvetica', 'bold');
          headers.forEach((header, index) => {
            doc.text(header, xPosition, yPosition);
            xPosition += columnWidths[index];
          });
          doc.line(10, yPosition + 2, 200, yPosition + 2);
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
        }
      });

      yPosition += 10;
      doc.line(10, yPosition, 200, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL GENERAL: S/ ${totalGeneral.toFixed(2)}`, 10, yPosition);

      const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0];
      const nombreArchivo = `Cuadre_Caja_${fechaSeleccionada}${nombreAgencia ? `_${nombreAgencia}` : ''}.pdf`;
      doc.save(nombreArchivo);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar a PDF');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Reporte de Pagos</h2>
            <p className="text-cyan-100 text-xs">Sistema de reportes externos</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors p-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {/* Filtros */}
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Filtros de Reporte</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📅 Fecha del Reporte</label>
                <input 
                  type="date" 
                  value={fechaSeleccionada} 
                  onChange={(e) => setFechaSeleccionada(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                  aria-label="Seleccionar fecha del reporte" 
                />
              </div>

              {/* Selector de Usuario - Solo para admins */}
              {esAdmin && (
                <div>
                  <UserFilter
                    filtroAgencia="por_usuario"
                    usuariosDisponibles={usuariosDisponibles}
                    cargandoUsuarios={loading}
                    usuarioSeleccionado={usuarioSeleccionado}
                    setUsuarioSeleccionado={setUsuarioSeleccionado}
                    setFiltroUsuario={(value) => console.log('Filtro usuario:', value)}
                    agenciasUsuarioSeleccionado={agenciasUsuarioSeleccionado}
                    setAgenciasUsuarioSeleccionado={setAgenciasUsuarioSeleccionado}
                    agenciaUsuarioEspecifica={agenciaSeleccionada}
                    setAgenciaUsuarioEspecifica={setAgenciaSeleccionada}
                    esAdmin={esAdmin}
                    esSuperAdmin={user?.role === UserRole.SUPER_ADMIN}
                  />
                </div>
              )}

              {/* Selector de Agencia - Solo si tiene múltiples agencias */}
              {mostrarSelectAgencia() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Agencia</label>
                  <select 
                    value={agenciaSeleccionada} 
                    onChange={(e) => setAgenciaSeleccionada(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                    aria-label="Seleccionar agencia"
                  >
                    <option value="">Seleccionar agencia</option>
                    {agenciasDisponibles.map((agencia) => (
                      <option key={agencia.agencia} value={agencia.agencia}>
                        {Object.entries(AGENCIAS).find(([_, code]) => code === agencia.agencia)?.[0] || agencia.agencia}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Información del usuario actual para cajeros */}
            {esCajero && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  👤 Usuario: <strong>{user?.razon}</strong> | 
                  🏢 Agencia: <strong>{Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0]}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600">Cargando reporte...</p>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Resumen del Reporte</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-blue-600">Total de registros</p>
                    <p className="text-lg font-bold text-blue-800">{reporteData.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Fecha consultada</p>
                    <p className="text-base font-semibold text-blue-800">{fechaSeleccionada}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Agencia</p>
                    <p className="text-base font-semibold text-blue-800">
                      {agenciaSeleccionada ? Object.entries(AGENCIAS).find(([_, code]) => code === agenciaSeleccionada)?.[0] : 'No seleccionada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Total general</p>
                    <p className="text-lg font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de datos */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-700">Detalle de Pagos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">FECHA_MOV</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">COD_AGENCIA</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">COD_CAJA</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">NRO_DOC</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">CAPITAL</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">INTERES</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">MORA</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">SEGURO</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">PORTES</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">DESGRAV</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">APORTE</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">TOTAL</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">MONEDA</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">TIPO_PAGO</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">GLOSA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reporteData.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="px-3 py-6 text-center text-gray-500 text-sm">
                            No se encontraron registros para los filtros seleccionados
                          </td>
                        </tr>
                      ) : (
                        reporteData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 py-1 text-xs text-gray-900">{item.FECHA_MOV}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.COD_AGENCIA}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.COD_CAJA}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.NRO_DOC}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.CAPITAL}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.INTERES}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.MORA}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.SEGURO}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.PORTES}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.DESGRAV}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.APORTE}</td>
                            <td className="px-2 py-1 text-xs font-semibold text-green-600">{item.TOTAL}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.MONEDA}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.TIPO_PAGO}</td>
                            <td className="px-2 py-1 text-xs text-gray-900">{item.GLOSA}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              {reporteData.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-yellow-800 text-sm">TOTAL GENERAL:</span>
                    <span className="text-lg font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row justify-between items-center border-t">
          <button 
            onClick={onClose} 
            className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors mb-2 sm:mb-0"
          >
            Cerrar
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={exportarExcel} 
              disabled={reporteData.length === 0 || loading} 
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                reporteData.length > 0 && !loading 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">Excel</span>
            </button>
            <button 
              onClick={exportarPDF} 
              disabled={reporteData.length === 0 || loading} 
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                reporteData.length > 0 && !loading 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportePagosModal;