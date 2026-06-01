import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCombinedPermissions } from '../../../hooks/useCombinedPermissions';
import Layout from '../../Layout';
import SolicitudCreditoModal from './solicitudcreditosModal';
import { fetchSolicitudesCreditoPendientes, aprobarSolicitud, rechazarSolicitud, anularSolicitud, SolicitudCredito } from '../../../api/aprobacionCreditosAPI';

const AprobacionCreditosTable: React.FC = () => {
  const { user } = useAuth();
  const { canViewCreditApproval, canApproveCreditApproval } = useCombinedPermissions();
  const [solicitudes, setSolicitudes] = useState<SolicitudCredito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCredito | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasAccess = user?.role === 'SUPER_ADMIN' || canViewCreditApproval();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Obtener la agencia, cargo y user del usuario autenticado
      const agencia = user?.id_age || '';
      const cargo = user?.cargo || '';
      const usuario = user?.user || '';
      const response = await fetchSolicitudesCreditoPendientes(agencia, cargo, usuario);

      if (response.status) {
        setSolicitudes(response.data);
      } else {
        setError(response.message);
        setSolicitudes([]);
      }
    } catch (err) {
      setError('Error al cargar las solicitudes de crédito');
      setSolicitudes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAprobar = async (solicitud: SolicitudCredito, glosa: string) => {
    setIsProcessing(true);
    try {
      const response = await aprobarSolicitud(solicitud.NRO_SOL, glosa);
      if (response.status) {
        setError(null);
        alert('Solicitud aprobada exitosamente');
        setSelectedSolicitud(null);
        await cargarSolicitudes();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al aprobar la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRechazar = async (solicitud: SolicitudCredito, glosa: string) => {
    setIsProcessing(true);
    try {
      const response = await rechazarSolicitud(solicitud.NRO_SOL, glosa);
      if (response.status) {
        setError(null);
        alert('Solicitud rechazada exitosamente');
        setSelectedSolicitud(null);
        await cargarSolicitudes();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al rechazar la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnular = async (solicitud: SolicitudCredito, glosa: string) => {
    setIsProcessing(true);
    try {
      const response = await anularSolicitud(solicitud.NRO_SOL, glosa);
      if (response.status) {
        setError(null);
        alert('Solicitud anulada exitosamente');
        setSelectedSolicitud(null);
        await cargarSolicitudes();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al anular la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImprimir = (solicitud: SolicitudCredito) => {
    console.log('Imprimiendo solicitud:', solicitud);
    alert('Funci�n de impresi�n en desarrollo');
  };

  if (!hasAccess) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-red-500 mb-4">No tienes permisos para acceder a esta seccion.</p>
            <p className="text-gray-600 text-sm">
              Este modulo esta disponible solo para: Super Admin y Administrador.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="APROBACION DE CREDITOS" showBackButton={true}>
      <div className="h-full flex flex-col space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">APROBACION DE CREDITOS</h2>
            
            <button
              onClick={cargarSolicitudes}
              disabled={isLoading}
              className="mt-4 sm:mt-0 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden flex-1 flex flex-col">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-gray-500">Cargando solicitudes...</p>
              </div>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No hay solicitudes de credito para aprobar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Vista móvil - Tarjetas (< md) */}
              <div className="md:hidden p-4 space-y-4 overflow-y-auto">
                {solicitudes.map((solicitud) => (
                  <button
                    key={solicitud.Nro}
                    onClick={() => setSelectedSolicitud(solicitud)}
                    className="w-full text-left bg-white rounded-xl border-2 border-gray-200 shadow-md p-5 hover:border-green-400 hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    {/* Cabecera */}
                    <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-medium">#{solicitud.Nro}</span>
                          <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-full">
                            {solicitud.FECHA_SOL.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-base font-bold text-green-700 mb-1">{solicitud.NRO_SOL}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 break-words">{solicitud.NOMBRE}</p>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <InfoField label="Cuenta" value={solicitud.CUENTA} />
                        <InfoField label="Moneda" value={solicitud.MONEDA} />
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <InfoField
                            label="Monto Solicitado"
                            value={`S/ ${parseFloat(solicitud.MONTO_SOL).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            valueClass="text-base font-bold text-green-700"
                          />
                          <InfoField
                            label="Monto Neto"
                            value={`S/ ${parseFloat(solicitud.NETO).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            valueClass="text-base font-bold text-emerald-600"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <InfoField
                          label="TEA Interés"
                          value={`${parseFloat(solicitud.TEA_INTERES).toFixed(2)}%`}
                          valueClass="text-sm font-semibold text-orange-600"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5 text-green-600">
                      <span className="text-sm font-semibold">
                        {canApproveCreditApproval() ? 'Ver Detalles' : 'Solo lectura'}
                      </span>
                      {canApproveCreditApproval() && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Vista desktop - Tabla (≥ md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitud</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Sol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moneda</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TEA Interés</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {solicitudes.map((solicitud) => (
                      <tr
                        key={solicitud.Nro}
                        onClick={() => setSelectedSolicitud(solicitud)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        title="Clic para ver detalle"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{solicitud.Nro}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.NRO_SOL}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.FECHA_SOL.split(' ')[0]}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.CUENTA}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{solicitud.NOMBRE}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">S/ {parseFloat(solicitud.MONTO_SOL).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.MONEDA}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">S/ {parseFloat(solicitud.NETO).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{parseFloat(solicitud.TEA_INTERES).toFixed(2)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2" onClick={(e) => e.stopPropagation()}>
                          {canApproveCreditApproval() ? (
                            <button
                              onClick={() => setSelectedSolicitud(solicitud)}
                              className="text-blue-600 hover:text-blue-900 font-medium hover:underline"
                            >
                              Ver Detalles
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">Solo lectura</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedSolicitud && (
        <SolicitudCreditoModal
          solicitud={selectedSolicitud}
          onClose={() => setSelectedSolicitud(null)}
          onAprobar={handleAprobar}
          onDenegar={handleRechazar}
          onAnular={handleAnular}
          onImprimir={handleImprimir}
          canMakeAction={canApproveCreditApproval() && !isProcessing}
        />
      )}
    </Layout>
  );
};

const InfoField: React.FC<{ label: string; value: string; valueClass?: string }> = ({
  label,
  value,
  valueClass = 'text-sm text-gray-700',
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

export default AprobacionCreditosTable;
