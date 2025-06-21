import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays } from 'date-fns';
import Layout from './Layout';
import { PaymentHistoryRecord } from '../api/paymentsApi';
import { usePaymentHistory } from '../hooks/usePaymentHistory';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { AGENCIAS } from '../types';
import { PaymentImage } from './PaymentImage';
import InfiniteScrollIndicator from './shared/InfiniteScrollIndicator';
import ReportePagosAplicados from './reportes/ReportePagosAplicados';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/roles';


// Función para obtener el nombre de la agencia por su código
const getAgencyName = (agencyCode: string): string => {
  const entry = Object.entries(AGENCIAS).find(([, code]) => code === agencyCode);
  return entry ? entry[0] : agencyCode; // Si no encuentra el código, devuelve el código original
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


// Función para formatear la fecha y hora
function formatearFechaYHora(fechaStr: String, horaStr: String) {
  const fecha = new Date(`${fechaStr}T${horaStr}`);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const hora = fecha.toTimeString().split(' ')[0];
  return `${dia}/${mes}/${anio} ${hora}`;
}
// Función para calcular el monto real pagado (solo vouchers aceptados)
const calcularMontoRealPagado = (registro: PaymentHistoryRecord): number => {
  const vouchers = (registro as any).vouchers_modificados || registro.comprobante?.vouchers_modificados || [];
  return vouchers
    .filter((voucher: any) => voucher.estado_nuevo === 'aceptado')
    .reduce((total: number, voucher: any) => total + (voucher.monto_pago || 0), 0);
};

// Componente Modal para ver imagen del comprobante
const ImagenComprobanteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imagenUrl: string | null;
}> = ({ isOpen, onClose, imagenUrl }) => {
  if (!isOpen || !imagenUrl) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Comprobante de Pago</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="w-full h-[70vh]">
            <PaymentImage
              imageSource={imagenUrl}
              alt="Comprobante de pago del historial"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Componente Modal para ver detalles del comprobante
const DetalleComprobanteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  registro: PaymentHistoryRecord | null;
  onVerImagen: (imagenUrl: string) => void;
}> = ({ isOpen, onClose, registro, onVerImagen }) => {
  if (!isOpen || !registro) return null;

  const handleVerImagen = (rutaComprobante: string) => {
    onVerImagen(rutaComprobante);
  };

  const getTipoOperacionBadge = (tipo: string) => {
    const badges = {
      'aceptacion_total': 'bg-green-100 text-green-800',
      'rechazo_total': 'bg-red-100 text-red-800',
      'rechazo_parcial': 'bg-orange-100 text-orange-800',
      'modificacion_parcial': 'bg-blue-100 text-blue-800'
    };
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getTipoOperacionTexto = (tipo: string) => {
    const textos = {
      'aceptacion_total': 'Aceptación Total',
      'rechazo_total': 'Rechazo Total',
      'rechazo_parcial': 'Rechazo Parcial',
      'modificacion_parcial': 'Modificación Parcial'
    };
    return textos[tipo as keyof typeof textos] || tipo;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Detalle del Registro de Pago</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-900">Información del Cliente</h4>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-medium">Cliente:</span> {registro.comprobante.nombreSocio}</p>
                <p className="text-xs"><span className="font-medium">DNI:</span> {registro.comprobante.dni}</p>
                <p className="text-xs"><span className="font-medium">Crédito ID:</span> {registro.comprobante.creditoId}</p>
                <p className="text-xs">
                  <span className="font-medium">Tipo Pago:</span> {getTipoPagoTexto(registro.tipo_pago)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-900">Información del Proceso</h4>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-medium">Fecha/Hora:</span> {registro.fecha_pago} {registro.hora_pago}</p>
                <p className="text-xs"><span className="font-medium">Agencia:</span> {getAgencyName(registro.agencia)}</p>
                <p className="text-xs"><span className="font-medium">Procesado por:</span> {registro.dni_usuario}</p>
                <p className="text-xs"><span className="font-medium">Email:</span> {registro.email}</p>
              </div>
            </div>
          </div>

          {/* Tipo de operación y estados */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Detalles de la Operación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-xs text-gray-600">Tipo de Operación:</span>
                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTipoOperacionBadge(registro.tipo_operacion)}`}>
                  {getTipoOperacionTexto(registro.tipo_operacion)}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Estado Anterior:</span>
                <p className="font-medium text-red-600 text-xs">{registro.estadoGeneral_anterior}</p>
              </div>
              <div>
                <span className="text-xs text-gray-600">Estado Final:</span>
                <p className="font-medium text-green-600 text-xs">{registro.estadoGeneral_final}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-gray-600">Monto Real Pagado:</span>
              <p className="text-lg font-bold text-cyan-600">S/ {calcularMontoRealPagado(registro).toFixed(2)}</p>
            </div>
          </div>

          {/* Vouchers modificados */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Vouchers Procesados ({registro.comprobante.vouchers_modificados.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1.5 text-left text-xs font-medium">Voucher</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium">Estado Anterior</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium">Estado Nuevo</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium">Nro. Operación</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium">Tipo</th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium">Monto</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium">Motivo Rechazo</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium">Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {registro.comprobante.vouchers_modificados.map((voucher, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-xs">#{voucher.indice + 1}</td>
                      <td className="px-2 py-1.5 text-xs">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {voucher.estado_anterior}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          voucher.estado_nuevo === 'aceptado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {voucher.estado_nuevo}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-xs font-mono">{voucher.nroOperacion || '-'}</td>
                      <td className="px-2 py-1.5 text-xs">{voucher.tipoOperacion || '-'}</td>
                      <td className="px-2 py-1.5 text-right text-xs font-medium">
                        S/ {voucher.monto_pago?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-red-600">
                        {voucher.motivo_rechazo || '-'}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {voucher.ruta_comprobante && (
                          <button
                            onClick={() => handleVerImagen(voucher.ruta_comprobante)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-0.5 px-1.5 rounded text-xs transition-colors"
                            title="Ver imagen del comprobante"
                          >
                            📷 Ver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Componente de tarjeta para vista móvil
const PaymentCard: React.FC<{
  registro: PaymentHistoryRecord;
  onVerDetalle: (registro: PaymentHistoryRecord) => void;
}> = ({ registro, onVerDetalle }) => {
  const getTipoOperacionBadge = (tipo: string) => {
    const badges = {
      'aceptacion_total': 'bg-green-100 text-green-800',
      'rechazo_total': 'bg-red-100 text-red-800',
      'rechazo_parcial': 'bg-orange-100 text-orange-800',
      'modificacion_parcial': 'bg-blue-100 text-blue-800'
    };
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getTipoOperacionTexto = (tipo: string) => {
    const textos = {
      'aceptacion_total': 'Aceptación Total',
      'rechazo_total': 'Rechazo Total',
      'rechazo_parcial': 'Rechazo Parcial',
      'modificacion_parcial': 'Modificación Parcial'
    };
    return textos[tipo as keyof typeof textos] || tipo;
  };

  const vouchersAceptados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'aceptado');
  const vouchersRechazados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'rechazado');

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-3 border-l-4 border-cyan-500">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{registro.comprobante.nombreSocio}</h3>
          <p className="text-xs text-gray-600">DNI: {registro.comprobante.dni}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getTipoOperacionBadge(registro.tipo_operacion)}`}>
          {getTipoOperacionTexto(registro.tipo_operacion)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div className="col-span-2">
          <span className="text-gray-500">Fecha y Hora:</span>
          <p className="font-medium">{formatearFechaYHora(registro.fecha_pago, registro.hora_pago)}</p>
        </div>
        <div>
          <span className="text-gray-500">Monto Total:</span>
          <p className="font-medium text-sm">S/ {calcularMontoRealPagado(registro).toFixed(2)}</p>
        </div>
        <div>
          <span className="text-gray-500">Agencia:</span>
          <p className="font-medium">{getAgencyName(registro.agencia)}</p>
        </div>
        <div>
          <span className="text-gray-500">Tipo Pago:</span>
          <p className="font-medium">{getTipoPagoTexto(registro.tipo_pago)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>
          <span className="text-gray-500">Estado:</span>
          <p className="font-medium">{registro.estadoGeneral_anterior} → {registro.estadoGeneral_final}</p>
        </div>
        <div>
          <span className="text-gray-500">Vouchers:</span>
          <p className="font-medium">
            <span className="text-green-600">{vouchersAceptados.length} ✓</span>
            {vouchersRechazados.length > 0 && <span className="text-red-600 ml-2">{vouchersRechazados.length} ✗</span>}
          </p>
        </div>
      </div>

      <div className="text-xs mb-2">
        <span className="text-gray-500">Crédito ID:</span>
        <p className="font-medium">{registro.comprobante.creditoId}</p>
      </div>

      <button
        onClick={() => onVerDetalle(registro)}
        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-1.5 px-3 rounded-md text-xs font-medium transition-colors"
      >
        Ver Detalle Completo
      </button>
    </div>
  );
};

const PaymentHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { records, loading, error, loadingMore, pagination, loadHistory, loadMoreData, resetData } = usePaymentHistory();
  
  // Determinar permisos según rol del usuario
  const esAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const esSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const esUserPayment = user?.role === UserRole.PAYMENTS_USER;
  
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<PaymentHistoryRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dniFilter, setDniFilter] = useState('');
  const [tipoPagoFilter, setTipoPagoFilter] = useState<'pagos_aplicados' | 'pago_normal' | 'pago_liquida' | 'rechazo_total' | 'rechazo_parcial' | 'todos'>('pagos_aplicados');
  const [reporteModalOpen, setReporteModalOpen] = useState(false);

  // Detectar vista móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para cargar historial con filtros
  const handleLoadHistory = React.useCallback((resetPage: boolean = false) => {
    // ✅ Aplicar filtros automáticos según el rol del usuario
    let tipoPagoFiltro: 'pago_normal' | 'pago_liquida' | 'rechazo_total' | 'rechazo_parcial' | '' | undefined;
    let mostrarSoloPagosAplicados = false;
    
    // 🚨 LÓGICA DE FILTRADO POR TIPO DE PAGO
    switch (tipoPagoFilter) {
      case 'pagos_aplicados':
        // Por defecto: solo pagos aplicados
        mostrarSoloPagosAplicados = true;
        tipoPagoFiltro = '';
        break;
      case 'todos':
        // Ver todos los tipos de pago
        mostrarSoloPagosAplicados = false;
        tipoPagoFiltro = '';
        break;
      case 'pago_normal':
      case 'pago_liquida':
      case 'rechazo_total':
      case 'rechazo_parcial':
        // Filtro específico
        mostrarSoloPagosAplicados = false;
        tipoPagoFiltro = tipoPagoFilter;
        break;
      default:
        mostrarSoloPagosAplicados = true;
        tipoPagoFiltro = '';
        break;
    }

    const filters = {
      fechaInicio: startDate,
      fechaFin: endDate,
      dni: dniFilter || undefined,
      tipoPago: tipoPagoFiltro,
      mostrarSoloPagosAplicados,
      // 🔒 Si es usuario de pago, filtrar automáticamente por su DNI o email
      usuarioFiltro: esUserPayment ? (user?.dni || user?.email) : undefined
    };

    if (resetPage) {
      resetData();
    }
    
    loadHistory(filters, 1, false);
  }, [startDate, endDate, dniFilter, tipoPagoFilter, esUserPayment, user?.dni, user?.email, loadHistory, resetData]);

  // Función para cargar más datos cuando se hace scroll
  const handleLoadMore = React.useCallback(() => {
    // ✅ Aplicar misma lógica de filtrado que en handleLoadHistory
    let tipoPagoFiltro: 'pago_normal' | 'pago_liquida' | 'rechazo_total' | 'rechazo_parcial' | '' | undefined;
    let mostrarSoloPagosAplicados = false;
    
    switch (tipoPagoFilter) {
      case 'pagos_aplicados':
        mostrarSoloPagosAplicados = true;
        tipoPagoFiltro = '';
        break;
      case 'todos':
        mostrarSoloPagosAplicados = false;
        tipoPagoFiltro = '';
        break;
      case 'pago_normal':
      case 'pago_liquida':
      case 'rechazo_total':
      case 'rechazo_parcial':
        mostrarSoloPagosAplicados = false;
        tipoPagoFiltro = tipoPagoFilter;
        break;
      default:
        mostrarSoloPagosAplicados = true;
        tipoPagoFiltro = '';
        break;
    }

    const filters = {
      fechaInicio: startDate,
      fechaFin: endDate,
      dni: dniFilter || undefined,
      tipoPago: tipoPagoFiltro,
      mostrarSoloPagosAplicados,
      // 🔒 Si es usuario de pago, filtrar automáticamente por su DNI o email
      usuarioFiltro: esUserPayment ? (user?.dni || user?.email) : undefined
    };
    
    loadMoreData(filters);
  }, [startDate, endDate, dniFilter, tipoPagoFilter, esUserPayment, user?.dni, user?.email, loadMoreData]);

  const handleVerDetalle = (registro: PaymentHistoryRecord) => {
    setSelectedRegistro(registro);
    setModalOpen(true);
  };

  const handleVerImagen = (imagenUrl: string) => {
    setSelectedImageUrl(imagenUrl);
    setImageModalOpen(true);
  };

  // Cargar historial inicial y cuando cambien los filtros
  useEffect(() => {
    handleLoadHistory(true);
  }, [handleLoadHistory]);

  // 🚀 Hook para infinite scroll optimizado
  const { setSentinelRef } = useInfiniteScroll({
    hasNext: pagination.hasNext,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
    disabled: false,
    threshold: 300
  });

  const getTipoOperacionBadge = (tipo: string) => {
    const badges = {
      'aceptacion_total': 'bg-green-100 text-green-800',
      'rechazo_total': 'bg-red-100 text-red-800',
      'rechazo_parcial': 'bg-orange-100 text-orange-800',
      'modificacion_parcial': 'bg-blue-100 text-blue-800'
    };
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getTipoOperacionTexto = (tipo: string) => {
    const textos = {
      'aceptacion_total': 'Aceptación Total',
      'rechazo_total': 'Rechazo Total',
      'rechazo_parcial': 'Rechazo Parcial',
      'modificacion_parcial': 'Modificación Parcial'
    };
    return textos[tipo as keyof typeof textos] || tipo;
  };

  return (
    <Layout title="Historial de Pagos">
      <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Atención de Comprobantes</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Consulta el historial completo de pagos procesados desde la tabla de modificaciones</p>
            {/* 🔒 Indicador de filtro por rol */}
            {esUserPayment && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                👤 Mostrando solo tus pagos procesados
              </div>
            )}
            {(esAdmin || esSuperAdmin) && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                🌐 Viendo todos los pagos {esSuperAdmin ? '(Super Admin)' : '(Admin)'}
              </div>
            )}
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI Cliente</label>
            <input
              type="text"
              placeholder="Buscar por DNI..."
              value={dniFilter}
              onChange={(e) => setDniFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Tipo de Pago</label>
            <select
              value={tipoPagoFilter}
              onChange={(e) => setTipoPagoFilter(e.target.value as 'pagos_aplicados' | 'pago_normal' | 'pago_liquida' | 'rechazo_total' | 'rechazo_parcial' | 'todos')}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="pagos_aplicados">✅ Solo Pagos Aplicados </option>
              <option value="pago_normal">💰 Solo Pago Normal</option>
              <option value="pago_liquida">🔄 Solo Liquidación</option>
              <option value="rechazo_total">❌ Solo Rechazo Total</option>
              <option value="rechazo_parcial">⚠️ Solo Rechazo Parcial</option>
              <option value="todos">📋 Ver Todos los Tipos</option>
            </select>
            {tipoPagoFilter === 'pagos_aplicados'}
            {tipoPagoFilter === 'todos'}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No se encontraron registros para los filtros especificados</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={() => handleLoadHistory(true)}
              className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                Mostrando {records.length} registro{records.length !== 1 ? 's' : ''} de {pagination.total > 0 ? pagination.total : 'muchos'} total
              </p>
              
              {/* 🚀 BOTÓN DE EXPORTACIÓN */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReporteModalOpen(true)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  📊 Exportar Pagos
                </button>
              </div>
            </div>
            
            {/* Vista móvil - Tarjetas */}
            {isMobile ? (
              <div className="space-y-4">
                {records.map((registro, index) => (
                  <PaymentCard
                    key={`${registro.comprobante.dni}-${registro.fecha_pago}-${registro.hora_pago}-${index}`}
                    registro={registro}
                    onVerDetalle={handleVerDetalle}
                  />
                ))}
              </div>
            ) : (
              /* Vista desktop - Tabla mejorada */
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white">
                      <th className="px-2 py-1.5 text-left text-xs">Fecha y Hora</th>
                      <th className="px-2 py-1.5 text-left text-xs">DNI Cliente</th>
                      <th className="px-2 py-1.5 text-left text-xs">Cliente</th>
                      <th className="px-2 py-1.5 text-left text-xs">Monto Total</th>
                      <th className="px-2 py-1.5 text-left text-xs">Agencia</th>
                      <th className="px-2 py-1.5 text-left text-xs">Tipo Pago</th>
                      <th className="px-2 py-1.5 text-left text-xs">Tipo Operación</th>
                      <th className="px-2 py-1.5 text-left text-xs">Estado Final</th>
                      <th className="px-2 py-1.5 text-left text-xs">Crédito ID</th>
                      <th className="px-2 py-1.5 text-left text-xs">Aplicado por</th>
                      <th className="px-2 py-1.5 text-center text-xs">Vouchers</th>
                      <th className="px-2 py-1.5 text-center text-xs">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((registro, index) => {
                      const vouchersAceptados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'aceptado');
                      const vouchersRechazados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'rechazado');
                      
                      return (
                        <tr
                          key={`${registro.comprobante.dni}-${registro.fecha_pago}-${registro.hora_pago}-${index}`}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-2 py-1.5 text-xs">
                          <div>{formatearFechaYHora(registro.fecha_pago, registro.hora_pago)}</div>
                          </td>
                          <td className="px-2 py-1.5 text-xs font-medium">{registro.comprobante.dni}</td>
                          <td className="px-2 py-1.5 text-xs">{registro.comprobante.nombreSocio}</td>
                          <td className="px-2 py-1.5 text-xs text-left font-medium">
                            S/ {calcularMontoRealPagado(registro).toFixed(2)}
                          </td>
                          <td className="px-2 py-1.5 text-xs">{getAgencyName(registro.agencia)}</td>
                          <td className="px-2 py-1.5 text-xs">{getTipoPagoTexto(registro.tipo_pago)}</td>
                          <td className="px-2 py-1.5 text-left">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTipoOperacionBadge(registro.tipo_operacion)}`}>
                              {getTipoOperacionTexto(registro.tipo_operacion)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-left">
                            <span className="text-xs">
                              {registro.estadoGeneral_anterior} → <span className="font-medium">{registro.estadoGeneral_final}</span>
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-xs font-mono">
                            {registro.comprobante.creditoId}
                          </td>
                          <td className="px-2 py-1.5 text-xs">{registro.dni_usuario}</td>
                          <td className="px-2 py-1.5 text-center text-xs">
                            <div>
                              <span className="text-green-600 font-medium">{vouchersAceptados.length} ✓</span>
                              {vouchersRechazados.length > 0 && (
                                <span className="text-red-600 font-medium ml-2">{vouchersRechazados.length} ✗</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => handleVerDetalle(registro)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-white py-0.5 px-2 rounded text-xs font-medium transition-colors"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 🚀 Sentinel element para Intersection Observer */}
            {pagination.hasNext && (
              <div ref={setSentinelRef} className="h-4" />
            )}

            {/* 🚀 Indicador de infinite scroll */}
            <InfiniteScrollIndicator
              loading={loadingMore}
              hasMore={pagination.hasNext}
              total={pagination.total}
              itemName="registros"
            />
          </>
        )}
      </div>

      {/* Modal para ver detalle completo */}
      <DetalleComprobanteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        registro={selectedRegistro}
        onVerImagen={handleVerImagen}
      />
      
      {/* Modal para ver imagen del comprobante */}
      <ImagenComprobanteModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imagenUrl={selectedImageUrl}
      />

      {/* 🚀 MODAL DE REPORTE DE PAGOS APLICADOS */}
      {reporteModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4" onClick={() => setReporteModalOpen(false)}>
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Reporte de Pagos Aplicados</h2>
                <button
                  onClick={() => setReporteModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <ReportePagosAplicados />
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default PaymentHistoryPage;