import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays } from 'date-fns';
import Layout from './Layout';
import { fetchPaymentHistory, PaymentHistoryRecord, PaymentHistoryResponse } from '../api/paymentsApi';
//import { useAuth } from '../hooks/useAuth';
import { PaymentImage } from './PaymentImage';

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
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Detalle del Registro de Pago</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900">Información del Cliente</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Cliente:</span> {registro.comprobante.nombreSocio}</p>
                <p><span className="font-medium">DNI:</span> {registro.comprobante.dni}</p>
                <p><span className="font-medium">Crédito ID:</span> {registro.comprobante.creditoId}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900">Información del Proceso</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Fecha/Hora:</span> {registro.fecha_pago} {registro.hora_pago}</p>
                <p><span className="font-medium">Agencia:</span> {registro.agencia}</p>
                <p><span className="font-medium">Procesado por:</span> {registro.dni_usuario}</p>
                <p><span className="font-medium">Email:</span> {registro.email}</p>
              </div>
            </div>
          </div>

          {/* Tipo de operación y estados */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg text-gray-900 mb-3">Detalles de la Operación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">Tipo de Operación:</span>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getTipoOperacionBadge(registro.tipo_operacion)}`}>
                  {getTipoOperacionTexto(registro.tipo_operacion)}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Estado Anterior:</span>
                <p className="font-medium text-red-600">{registro.estadoGeneral_anterior}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Estado Final:</span>
                <p className="font-medium text-green-600">{registro.estadoGeneral_final}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600">Monto Total Operación:</span>
              <p className="text-xl font-bold text-cyan-600">S/ {registro.monto_total_operacion?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Vouchers modificados */}
          <div>
            <h4 className="font-semibold text-lg text-gray-900 mb-4">Vouchers Procesados ({registro.comprobante.vouchers_modificados.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left text-sm font-medium">Voucher</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Estado Anterior</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Estado Nuevo</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Nro. Operación</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right text-sm font-medium">Monto</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Motivo Rechazo</th>
                    <th className="px-3 py-2 text-center text-sm font-medium">Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {registro.comprobante.vouchers_modificados.map((voucher, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">#{voucher.indice + 1}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {voucher.estado_anterior}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          voucher.estado_nuevo === 'aceptado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {voucher.estado_nuevo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">{voucher.nroOperacion || '-'}</td>
                      <td className="px-3 py-2 text-sm">{voucher.tipoOperacion || '-'}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium">
                        S/ {voucher.monto_pago?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-3 py-2 text-sm text-red-600">
                        {voucher.motivo_rechazo || '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {voucher.ruta_comprobante && (
                          <button
                            onClick={() => handleVerImagen(voucher.ruta_comprobante)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition-colors"
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-cyan-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{registro.comprobante.nombreSocio}</h3>
          <p className="text-sm text-gray-600">DNI: {registro.comprobante.dni}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getTipoOperacionBadge(registro.tipo_operacion)}`}>
          {getTipoOperacionTexto(registro.tipo_operacion)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Fecha:</span>
          <p className="font-medium">{registro.fecha_pago}</p>
        </div>
        <div>
          <span className="text-gray-500">Hora:</span>
          <p className="font-medium">{registro.hora_pago}</p>
        </div>
        <div>
          <span className="text-gray-500">Monto Total:</span>
          <p className="font-medium text-lg">S/ {registro.monto_total_operacion?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <span className="text-gray-500">Agencia:</span>
          <p className="font-medium">{registro.agencia}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
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

      <div className="text-sm mb-3">
        <span className="text-gray-500">Crédito ID:</span>
        <p className="font-medium">{registro.comprobante.creditoId}</p>
      </div>

      <button
        onClick={() => onVerDetalle(registro)}
        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
      >
        Ver Detalle Completo
      </button>
    </div>
  );
};

const PaymentHistoryPage: React.FC = () => {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [historialPagos, setHistorialPagos] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<PaymentHistoryRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dniFilter, setDniFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'aceptacion_total' | 'rechazo_total' | 'rechazo_parcial' | ''>('');

  // Detectar vista móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadHistorial = async () => {
    try {
      setLoading(true);
      const response: PaymentHistoryResponse = await fetchPaymentHistory({
        fechaInicio: startDate,
        fechaFin: endDate,
        dni: dniFilter || undefined,
        estado: estadoFilter || undefined
      });
      setHistorialPagos(response.data);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      setHistorialPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (registro: PaymentHistoryRecord) => {
    setSelectedRegistro(registro);
    setModalOpen(true);
  };

  const handleVerImagen = (imagenUrl: string) => {
    setSelectedImageUrl(imagenUrl);
    setImageModalOpen(true);
  };

  useEffect(() => {
    loadHistorial();
  }, [startDate, endDate, dniFilter, estadoFilter]);

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
          <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
          <p className="text-sm text-gray-500">Consulta el historial completo de pagos procesados desde la tabla de modificaciones</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Tipo de Operación</label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as 'aceptacion_total' | 'rechazo_total' | 'rechazo_parcial' | '')}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">📋 Todos los Tipos</option>
              <option value="aceptacion_total">✅ Aceptación Total</option>
              <option value="rechazo_total">❌ Rechazo Total</option>
              <option value="rechazo_parcial">⚠️ Rechazo Parcial</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : historialPagos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No se encontraron registros para los filtros especificados</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Mostrando {historialPagos.length} registro{historialPagos.length !== 1 ? 's' : ''} de historial
            </p>
            
            {/* Vista móvil - Tarjetas */}
            {isMobile ? (
              <div className="space-y-4">
                {historialPagos.map((registro, index) => (
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
                      <th className="px-4 py-2 text-left">Fecha y Hora</th>
                      <th className="px-4 py-2 text-left">DNI Cliente</th>
                      <th className="px-4 py-2 text-left">Cliente</th>
                      <th className="px-4 py-2 text-right">Monto Total</th>
                      <th className="px-4 py-2 text-left">Agencia</th>
                      <th className="px-4 py-2 text-center">Tipo Operación</th>
                      <th className="px-4 py-2 text-center">Estado Final</th>
                      <th className="px-4 py-2 text-left">Crédito ID</th>
                      <th className="px-4 py-2 text-center">Aplicado por</th>
                      <th className="px-4 py-2 text-center">Vouchers</th>
                      <th className="px-4 py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagos.map((registro, index) => {
                      const vouchersAceptados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'aceptado');
                      const vouchersRechazados = registro.comprobante.vouchers_modificados.filter(v => v.estado_nuevo === 'rechazado');
                      
                      return (
                        <tr
                          key={`${registro.comprobante.dni}-${registro.fecha_pago}-${registro.hora_pago}-${index}`}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-sm">
                            <div>{registro.fecha_pago}</div>
                            <div className="text-gray-500">{registro.hora_pago}</div>
                          </td>
                          <td className="px-4 py-2 font-medium">{registro.comprobante.dni}</td>
                          <td className="px-4 py-2">{registro.comprobante.nombreSocio}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            S/ {registro.monto_total_operacion?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-2">{registro.agencia}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTipoOperacionBadge(registro.tipo_operacion)}`}>
                              {getTipoOperacionTexto(registro.tipo_operacion)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="text-sm">
                              {registro.estadoGeneral_anterior} → <span className="font-medium">{registro.estadoGeneral_final}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-mono">
                            {registro.comprobante.creditoId}
                          </td>
                          <td className="px-4 py-2 text-sm">{registro.dni_usuario}</td>
                          <td className="px-4 py-2 text-center text-sm">
                            <div>
                              <span className="text-green-600 font-medium">{vouchersAceptados.length} ✓</span>
                              {vouchersRechazados.length > 0 && (
                                <span className="text-red-600 font-medium ml-2">{vouchersRechazados.length} ✗</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleVerDetalle(registro)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-white py-1 px-3 rounded text-sm font-medium transition-colors"
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
    </Layout>
  );
};

export default PaymentHistoryPage;