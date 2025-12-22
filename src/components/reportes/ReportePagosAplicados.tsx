import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ExcelJS from 'exceljs';
import { fetchPaymentHistoryForReport, PaymentHistoryRecord, PaymentHistoryResponse } from '../../api/paymentsApi';
import { AGENCIAS, UserResponse, AgenciaCaja } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/roles';
import { fetchAllUsers } from '../../api/userApi';
import {
  ReportConfigModal,
  ReportPreview,
  PrintableReport
} from './components';
import { useNotifications } from '../../hooks/useNotifications';

const Notification=useNotifications();
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

// Tipos de pago válidos para reportes (solo pagos aplicados, no rechazos)
const TIPOS_PAGO_VALIDOS = ['pago_normal', 'pago_liquida'];

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
  agencia_codigo: string; // Código original de agencia
  cod_caja: string;
  user_caja: string;
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
    estado_anterior: string;
    motivo_rechazo: string;
    ruta_comprobante: string;
    fecha_voucher: string;
  }>;
}

// Tipo para filtros de tipo de pago (solo tipos válidos para reportes)
type TipoPagoFilter = 'todos' | 'pago_normal' | 'pago_liquida';

const ReportePagosAplicados: React.FC = () => {
  const { user } = useAuth();
  
  // Determinar opciones disponibles según el rol
  const esAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.GERENTE_GENERAL || user?.role === UserRole.JEFE_OPERACIONES;
  const esSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const esUserPayment = user?.role === UserRole.CAJERO || user?.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO;

  
  const [loading, setLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [rangoExporte, setRangoExporte] = useState<'hoy' | 'rango' | 'todo'>('hoy');
  const [fechaInicioExporte, setFechaInicioExporte] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFinExporte, setFechaFinExporte] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [datosPagos, setDatosPagos] = useState<DatosPagoAplicado[]>([]);
  const [mostrandoVista, setMostrandoVista] = useState(false);
  
  // Nuevas opciones de filtro - Super Admin por defecto ve TODAS las agencias
  const [filtroAgencia, setFiltroAgencia] = useState<'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia'>(
    esSuperAdmin ? 'todas' : 'mis_pagos'
  );
  const [agenciaEspecifica, setAgenciaEspecifica] = useState('');
  const [filtroTipoPago, setFiltroTipoPago] = useState<'todos' | 'pago_normal' | 'pago_liquida'>('todos');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  
  // 🆕 Estados para cargar usuarios disponibles (solo admin/super admin)
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<UserResponse[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [agenciasUsuarioSeleccionado, setAgenciasUsuarioSeleccionado] = useState<AgenciaCaja[]>([]);
  const [agenciaUsuarioEspecifica, setAgenciaUsuarioEspecifica] = useState('');
  

  // 🆕 Cargar usuarios disponibles para admin/super admin
  useEffect(() => {
    const cargarUsuarios = async () => {
      if (!esAdmin && !esSuperAdmin) return;
      
      setCargandoUsuarios(true);
      try {
        const usuarios = await fetchAllUsers();
        // 🎯 Filtrar solo usuarios que pueden hacer pagos
        const usuariosPagos = usuarios.filter(usuario => {
          const role = usuario.role;
          return role === UserRole.CAJERO || role === UserRole.SUPER_ADMIN || role === UserRole.GERENTE_GENERAL || role === UserRole.JEFE_OPERACIONES || role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO;
        });
        setUsuariosDisponibles(usuariosPagos);
      } catch (error) {
      } finally {
        setCargandoUsuarios(false);
      }
    };

    cargarUsuarios();
  }, [esAdmin, esSuperAdmin]);

  // Función para obtener datos de pagos aplicados
  const obtenerDatosPagosAplicados = async (
    rango: 'hoy' | 'rango' | 'todo',
    fechaInicio?: string,
    fechaFin?: string,
    filtroAgencia: 'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia' = 'mis_pagos',
    agenciaEspecifica?: string,
    filtroTipoPago: TipoPagoFilter = 'todos',
    filtroUsuario?: string,
    agenciaUsuario?: string
  ): Promise<DatosPagoAplicado[]> => {
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

      // 🚀 Usar API específica para reportes - SIN PAGINACIÓN
      const response: PaymentHistoryResponse = await fetchPaymentHistoryForReport({
        fechaInicio: fechas.fechaInicio,
        fechaFin: fechas.fechaFin,
        tipoPago: filtroTipoPago !== 'todos' ? filtroTipoPago : undefined,
        agencia: filtroAgencia === 'agencia_especifica' ? agenciaEspecifica :
                filtroAgencia === 'usuario_y_agencia' ? agenciaUsuario : undefined,
        usuario: (filtroAgencia === 'por_usuario' || filtroAgencia === 'usuario_y_agencia') ? filtroUsuario : undefined
      });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      // ✅ Los filtros principales se aplican en el backend
      // Solo aplicar filtros adicionales de frontend si es necesario
      const registrosFiltrados = response.data.filter(registro => {
        // 🚨 FILTRO CRÍTICO: Solo incluir tipos de pago válidos para reportes
        if (!TIPOS_PAGO_VALIDOS.includes(registro.tipo_pago)) {
          return false;
        }

        // Filtros por rol del usuario
        if (filtroAgencia === 'mis_pagos') {
          return registro.dni_usuario === user?.dni;
        } else if (filtroAgencia === 'mis_agencias') {
          const misAgencias = user?.agencias?.map(ag => ag.agencia) || [];
          return misAgencias.includes(registro.agencia);
        } else if (filtroAgencia === 'todas' && esAdmin) {
          return true; // Admin/SuperAdmin pueden ver todos
        }
        
        return true; // Para otros casos, mostrar todos los datos del backend
      });
      
      // Convertir a formato del reporte
      const pagosAplicados = registrosFiltrados.map(registro => {
        const vouchersAceptados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'aceptado');
        const vouchersRechazados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'rechazado');
        
        return {
          fecha_pago: registro.fecha_pago,
          hora_pago: registro.hora_pago,
          dni_cliente: registro.comprobante.dni,
          nombre_cliente: registro.comprobante.nombreSocio,
          credito_id: registro.comprobante.creditoId,
          agencia: getAgencyName(registro.agencia),
          agencia_codigo: registro.agencia,
          cod_caja: registro.cod_caja || '', // ✅ Corregido: usar campo directo
          user_caja: registro.user_caja || '', // ✅ Corregido: usar campo directo
          tipo_pago: getTipoPagoTexto(registro.tipo_pago),
          tipo_operacion: getTipoOperacionTexto(registro.tipo_operacion),
          estado_anterior: registro.estadoGeneral_anterior,
          estado_final: registro.estadoGeneral_final,
          monto_total_aplicado: calcularMontoRealPagado(registro),
          vouchers_aceptados: vouchersAceptados.length,
          vouchers_rechazados: vouchersRechazados.length,
          procesado_por: registro.dni_usuario,
          email_procesador: registro.email,
          // ✅ CORREGIDO: Incluir TODOS los vouchers, no solo los aceptados
          detalle_vouchers: registro.comprobante.vouchers_modificados.map(v => ({
            indice: v.indice,
            nro_operacion: v.nroOperacion || 'N/A',
            tipo_operacion: v.tipoOperacion || 'N/A',
            monto: v.monto_pago || 0,
            fecha_voucher: v.fecha_voucher || '',
            estado: v.estado_nuevo,
            estado_anterior: v.estado_anterior || '',
            motivo_rechazo: v.motivo_rechazo || '',
            ruta_comprobante: v.ruta_comprobante || ''
          }))
        };
      });
      return pagosAplicados;
    } catch (error) {
      return [];
    }
  };

  // Función para exportar a Excel
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const datos = await obtenerDatosPagosAplicados(
        rangoExporte,
        fechaInicioExporte,
        fechaFinExporte,
        filtroAgencia,
        agenciaEspecifica,
        filtroTipoPago,
        filtroUsuario,
        agenciaUsuarioEspecifica
      );
      
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
        'Código Caja',
        'Usuario Caja',
        'Tipo Pago',
        'Tipo Operación',
        'Monto Aplicado',
        'Vouchers Aceptados',
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
          pago.cod_caja,
          pago.user_caja,
          pago.tipo_pago,
          pago.tipo_operacion,
          pago.monto_total_aplicado,
          pago.vouchers_aceptados,
          pago.email_procesador
        ]);
      });

      // Hoja detallada de vouchers
      const worksheetDetalle = workbook.addWorksheet('Detalle de Vouchers');
      worksheetDetalle.addRow([
        'Fecha y Hora',
        'DNI Cliente',
        'Nombre Cliente',
        'Crédito ID',
        'Agencia',
        'Código Agencia',
        'Código Caja',
        'Usuario Caja',
        'Tipo Pago',
        'Tipo Operación',
        'Estado Anterior',
        'Estado Final',
        'Monto Total Aplicado',
        'Vouchers Aceptados',
        'Voucher N° de Total',
        'Procesado Por',
        'Email Procesador',
        'Estado Anterior Voucher',
        'Estado Nuevo Voucher',
        'Nro Operación',
        'Tipo Operación Voucher',
        'Monto Voucher'
      ]);

      // ✅ CORREGIDO: Agregar datos de vouchers - cada voucher en su propia fila
      let totalVouchersDetalle = 0;
      datos.forEach(pago => {
        
        if (pago.detalle_vouchers.length === 0) {
          // Si no hay vouchers, crear una fila con los datos básicos del pago
          totalVouchersDetalle++;
          worksheetDetalle.addRow([
            formatearFechaYHora(pago.fecha_pago, pago.hora_pago),
            pago.dni_cliente,
            pago.nombre_cliente,
            pago.credito_id,
            pago.agencia,
            pago.agencia_codigo,
            pago.cod_caja,
            pago.user_caja,
            pago.tipo_pago,
            pago.tipo_operacion,
            pago.estado_anterior,
            pago.estado_final,
            pago.monto_total_aplicado,
            pago.vouchers_aceptados,
            'N/A', // Voucher N° de Total (no hay vouchers)
            pago.procesado_por,
            pago.email_procesador,
            'N/A', // Estado Anterior Voucher
            'N/A', // Estado Nuevo Voucher
            'N/A', // Nro Operación
            'N/A', // Tipo Operación Voucher
            0      // Monto Voucher
          ]);
        } else {
          // ✅ CADA VOUCHER EN SU PROPIA FILA con datos completos del pago
          pago.detalle_vouchers.forEach((voucher, index) => {
            totalVouchersDetalle++;
            const voucherNumero = `${index + 1} de ${pago.detalle_vouchers.length}`;
            worksheetDetalle.addRow([
              formatearFechaYHora(pago.fecha_pago, pago.hora_pago),
              pago.dni_cliente,
              pago.nombre_cliente,
              pago.credito_id,
              pago.agencia,
              pago.agencia_codigo,
              pago.cod_caja,
              pago.user_caja,
              pago.tipo_pago,
              pago.tipo_operacion,
              pago.estado_anterior,
              pago.estado_final,
              pago.monto_total_aplicado,
              pago.vouchers_aceptados,
              voucherNumero, // ✅ Voucher N° de Total (ej: "1 de 2", "2 de 2")
              pago.procesado_por,
              pago.email_procesador,
              voucher.estado_anterior,
              voucher.estado,
              voucher.nro_operacion,
              voucher.tipo_operacion,
              voucher.monto
            ]);
          });
        }
      });
      
      // Dar formato a la hoja de resumen
      worksheetResumen.columns.forEach(column => {
        column.width = 15;
      });
      
      // Estilo del encabezado de la hoja de resumen (fila 7)
      const headerRowResumen = worksheetResumen.getRow(7);
      if (headerRowResumen) {
        headerRowResumen.font = { bold: true };
        headerRowResumen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
      }

      // Dar formato a la hoja de detalle
      worksheetDetalle.columns.forEach(column => {
        column.width = 15;
      });
      
      // Estilo del encabezado de la hoja de detalle (fila 1)
      const headerRowDetalle = worksheetDetalle.getRow(1);
      if (headerRowDetalle) {
        headerRowDetalle.font = { bold: true };
        headerRowDetalle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
      }

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
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar vista previa
  const handleMostrarVista = async () => {
    setLoading(true);
    try {
      const datos = await obtenerDatosPagosAplicados(
        rangoExporte,
        fechaInicioExporte,
        fechaFinExporte,
        filtroAgencia,
        agenciaEspecifica,
        filtroTipoPago,
        filtroUsuario,
        agenciaUsuarioEspecifica
      );
      setDatosPagos(datos);
      setMostrandoVista(true);
      setExportModalOpen(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const printComponentRef = useRef<HTMLDivElement>(null);

  // Configurar impresión con estilos para múltiples páginas
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 1.5cm;
      }
      @media print {
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        table {
          border-collapse: collapse !important;
          width: 100% !important;
          page-break-inside: auto;
        }
        thead {
          display: table-header-group;
        }
        tbody {
          display: table-row-group;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        td, th {
          border: 1px solid #000 !important;
          padding: 4px !important;
          font-size: 10px !important;
          vertical-align: top;
        }
        th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `
  });

  // Función para manejar el clic de imprimir
  const handlePrintClick = () => {
    if (!datosPagos || datosPagos.length === 0) {
      Notification.info('No hay datos para imprimir. Por favor, genere un reporte primero.');
      return;
    }
    handlePrint();
  };

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
              onClick={handlePrintClick}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🖨️ Imprimir
            </button>
          )}
        </div>
      </div>

      {/* Vista previa de datos */}
      <ReportPreview
        mostrandoVista={mostrandoVista}
        datosPagos={datosPagos}
      />

      {/* Modal de configuración */}
      <ReportConfigModal
        exportModalOpen={exportModalOpen}
        setExportModalOpen={setExportModalOpen}
        filtroAgencia={filtroAgencia}
        setFiltroAgencia={setFiltroAgencia}
        agenciaEspecifica={agenciaEspecifica}
        setAgenciaEspecifica={setAgenciaEspecifica}
        usuariosDisponibles={usuariosDisponibles}
        cargandoUsuarios={cargandoUsuarios}
        usuarioSeleccionado={usuarioSeleccionado}
        setUsuarioSeleccionado={setUsuarioSeleccionado}
        setFiltroUsuario={setFiltroUsuario}
        agenciasUsuarioSeleccionado={agenciasUsuarioSeleccionado}
        setAgenciasUsuarioSeleccionado={setAgenciasUsuarioSeleccionado}
        agenciaUsuarioEspecifica={agenciaUsuarioEspecifica}
        setAgenciaUsuarioEspecifica={setAgenciaUsuarioEspecifica}
        filtroTipoPago={filtroTipoPago}
        setFiltroTipoPago={setFiltroTipoPago}
        rangoExporte={rangoExporte}
        setRangoExporte={setRangoExporte}
        fechaInicioExporte={fechaInicioExporte}
        setFechaInicioExporte={setFechaInicioExporte}
        fechaFinExporte={fechaFinExporte}
        setFechaFinExporte={setFechaFinExporte}
        handleMostrarVista={handleMostrarVista}
        handleExportExcel={handleExportExcel}
        loading={loading}
        user={user}
        esAdmin={esAdmin}
        esSuperAdmin={esSuperAdmin}
        esUserPayment={esUserPayment}
      />

      {/* Componente para impresión (oculto) */}
      <PrintableReport
        ref={printComponentRef}
        datosPagos={datosPagos}
      />
    </div>

  );
};

export default ReportePagosAplicados;