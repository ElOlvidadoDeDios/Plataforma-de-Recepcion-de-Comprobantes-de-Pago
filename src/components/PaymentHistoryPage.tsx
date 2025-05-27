import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import Layout from './Layout';
import { fetchPaymentHistory, PaymentHistoryRecord, PaymentHistoryResponse } from '../api/paymentsApi';
// Componente Modal para ver comprobante
const ComprobanteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  comprobante: PaymentHistoryRecord['comprobante'] | null;
}> = ({ isOpen, onClose, comprobante }) => {
  if (!isOpen || !comprobante) return null;

  const isBase64 = comprobante.comprobantebase_64.startsWith('/9j/') || 
                   comprobante.comprobantebase_64.startsWith('data:');
  const imageSource = isBase64 
    ? `data:image/jpeg;base64,${comprobante.comprobantebase_64}` 
    : comprobante.comprobantebase_64;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Comprobante de Pago</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Cliente: {comprobante.nombreSocio} - DNI: {comprobante.dni}
          </p>
        </div>
        <div className="p-4">
          <img
            src={imageSource}
            alt="Comprobante de pago"
            className="w-full h-auto max-h-96 object-contain mx-auto"
            onError={(e) => {
              console.error('Error al cargar imagen');
              (e.target as HTMLImageElement).src = '/placeholder-comprobante.png';
            }}
          />
          <div className="mt-4 text-sm text-gray-600">
            <p>Fecha: {comprobante.fecha_comprobante}</p>
            <p>Hora: {comprobante.hora_comprobante}</p>
            <p>Estado anterior: {comprobante.estado_anterior}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta para vista móvil
const PaymentCard: React.FC<{
  registro: PaymentHistoryRecord;
  onVerComprobante: (comprobante: PaymentHistoryRecord['comprobante']) => void;
}> = ({ registro, onVerComprobante }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-cyan-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{registro.comprobante.nombreSocio}</h3>
          <p className="text-sm text-gray-600">DNI: {registro.comprobante.dni}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          registro.estado === 'aceptado'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {registro.estado.toUpperCase()}
        </span>
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
          <span className="text-gray-500">Monto:</span>
          <p className="font-medium text-lg">S/ {registro.monto}</p>
        </div>
        <div>
          <span className="text-gray-500">Agencia:</span>
          <p className="font-medium">{registro.agencia}</p>
        </div>
      </div>

      <div className="text-sm mb-3">
        <span className="text-gray-500">Crédito:</span>
        <p className="font-medium">ID: {registro.comprobante.creditoId}</p>
      </div>

      {registro.motivo_rechazo && (
        <div className="text-sm mb-3">
          <span className="text-gray-500">Motivo rechazo:</span>
          <p className="font-medium text-red-600">{registro.motivo_rechazo}</p>
        </div>
      )}

      <button
        onClick={() => onVerComprobante(registro.comprobante)}
        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
      >
        Ver Comprobante
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
  const [selectedComprobante, setSelectedComprobante] = useState<PaymentHistoryRecord['comprobante'] | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
        fechaFin: endDate
      });
      setHistorialPagos(response.data);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      setHistorialPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerComprobante = (comprobante: PaymentHistoryRecord['comprobante']) => {
    setSelectedComprobante(comprobante);
    setModalOpen(true);
  };

  useEffect(() => {
    loadHistorial();
  }, [startDate, endDate]);

  return (
    <Layout title="Historial de Pagos">
      <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
          <p className="text-sm text-gray-500">Consulta el historial completo de pagos procesados</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : historialPagos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No se encontraron pagos en el período seleccionado</p>
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
                    onVerComprobante={handleVerComprobante}
                  />
                ))}
              </div>
            ) : (
              /* Vista desktop - Tabla */
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white">
                      <th className="px-4 py-2 text-left">Fecha y Hora</th>
                      <th className="px-4 py-2 text-left">DNI</th>
                      <th className="px-4 py-2 text-left">Cliente</th>
                      <th className="px-4 py-2 text-right">Monto</th>
                      <th className="px-4 py-2 text-left">Agencia</th>
                      <th className="px-4 py-2 text-center">Estado</th>
                      <th className="px-4 py-2 text-left">Motivo Rechazo</th>
                      <th className="px-4 py-2 text-left">PAGARE</th>
                      <th className="px-4 py-2 text-center">APLICADO POR</th> 
                      <th className="px-4 py-2 text-center">Comprobante</th> 
 
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagos.map((registro, index) => (
                      <tr
                        key={`${registro.comprobante.dni}-${registro.fecha_pago}-${registro.hora_pago}-${index}`}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-2">
                          {registro.fecha_pago} <br/> {registro.hora_pago}
                        </td>
                        <td className="px-4 py-2">{registro.comprobante.dni}</td>
                        <td className="px-4 py-2">{registro.comprobante.nombreSocio}</td>
                        <td className="px-4 py-2 text-right font-medium">S/ {registro.monto}</td>
                        <td className="px-4 py-2">{registro.agencia}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            registro.estado === 'aceptado'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {registro.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-red-600">{registro.motivo_rechazo || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <div>{registro.comprobante.creditoId}</div>
                        </td>
                        <td className="px-4 py-2">{registro.dni_usuario}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleVerComprobante(registro.comprobante)}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white py-1 px-3 rounded text-sm font-medium transition-colors"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para ver comprobante */}
      <ComprobanteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        comprobante={selectedComprobante}
      />
    </Layout>
  );
};

export default PaymentHistoryPage;