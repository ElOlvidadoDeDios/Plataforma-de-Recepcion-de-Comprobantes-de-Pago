import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCombinedPermissions } from '../../../hooks/useCombinedPermissions';
import Layout from '../../Layout';
import SolicitudCreditoModal from './solicitudcreditosModal';

interface SolicitudCredito {
  Nro: string;
  NRO_SOL: string;
  FECHA_SOL: string;
  CUENTA: string;
  NOMBRE: string;
  MONTO_SOL: string;
  MONEDA: string;
  NETO: string;
  cod_cargo: string;
  TEM: string;
  TEA_INTERES: string;
  CUO_SEGURO: string;
}

const SolicitudCreditoTable: React.FC = () => {
  const { user } = useAuth();
  const { canViewCreditRequest, canMakeCreditRequest } = useCombinedPermissions();
  const [solicitudes, setSolicitudes] = useState<SolicitudCredito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCredito | null>(null);

  const hasAccess = user?.role === 'SUPER_ADMIN' || canViewCreditRequest();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Conectar con API cuando esté lista
      setSolicitudes([]);
    } catch (err) {
      setError('Error al cargar las solicitudes de crédito');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAprobar = (sol: SolicitudCredito, glosa: string) => {
    console.log('Aprobar:', sol.NRO_SOL, '| Glosa:', glosa);
    setSelectedSolicitud(null);
  };

  const handleDenegar = (sol: SolicitudCredito, glosa: string) => {
    console.log('Denegar:', sol.NRO_SOL, '| Glosa:', glosa);
    setSelectedSolicitud(null);
  };

  const handleAnular = (sol: SolicitudCredito, glosa: string) => {
    console.log('Anular:', sol.NRO_SOL, '| Glosa:', glosa);
    setSelectedSolicitud(null);
  };

  const handleImprimir = (sol: SolicitudCredito) => {
    console.log('Imprimir:', sol.NRO_SOL);
  };

  const fmt = (n: string | number) => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!hasAccess) {
    return (
      <Layout title="Acceso Denegado" showBackButton>
        <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-red-500 mb-4">No tienes permisos para acceder a esta sección.</p>
            <p className="text-gray-600 text-sm">
              Este módulo está disponible solo para: Super Admin, Administrador y Analista de Créditos I.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const isEmpty = !isLoading && solicitudes.length === 0;

  return (
    <Layout title="SOLICITUD DE CRÉDITO" showBackButton>
      <div className="h-full flex flex-col space-y-4">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6 rounded-xl shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg sm:text-2xl font-bold tracking-wide">SOLICITUD DE CRÉDITO</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              {canMakeCreditRequest() && (
                <button className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Solicitud
                </button>
              )}
              <button
                onClick={cargarSolicitudes}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
            <div className="text-center">
              <svg className="w-10 h-10 text-blue-400 mx-auto mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-gray-500 text-sm">Cargando solicitudes...</p>
            </div>
          </div>
        )}

        {/* ── Vacío ── */}
        {isEmpty && (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-sm font-medium">No hay solicitudes de crédito</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            MÓVIL — tarjetas  (oculto en md+)
        ════════════════════════════════════════ */}
        {!isLoading && solicitudes.length > 0 && (
          <div className="flex flex-col gap-4 md:hidden px-1">
            {solicitudes.map((sol) => (
              <button
                key={sol.Nro}
                onClick={() => setSelectedSolicitud(sol)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-md p-5 hover:border-blue-400 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-medium">#{sol.Nro}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-full">
                        {sol.FECHA_SOL.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-base font-bold text-blue-700 mb-1">{sol.NRO_SOL}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 break-words">{sol.NOMBRE}</p>
                  </div>
                </div>

                {/* Grid de datos mejorado */}
                <div className="space-y-3 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <CardRow label="Cuenta" value={sol.CUENTA} valueClass="text-sm font-medium text-gray-900" />
                    <CardRow label="Moneda" value={sol.MONEDA} valueClass="text-sm font-medium text-gray-900" />
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <CardRow
                        label="Monto Solicitado"
                        value={`S/ ${fmt(sol.MONTO_SOL)}`}
                        valueClass="text-base font-bold text-blue-700"
                      />
                      <CardRow
                        label="Monto Neto"
                        value={`S/ ${fmt(sol.NETO)}`}
                        valueClass="text-base font-bold text-green-600"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <CardRow
                      label="TEA Interés"
                      value={`${parseFloat(sol.TEA_INTERES).toFixed(2)}%`}
                      valueClass="text-sm font-semibold text-orange-600"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5 text-blue-600">
                  <span className="text-sm font-semibold">Ver detalle</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════
            DESKTOP — tabla  (oculto en < md)
        ════════════════════════════════════════ */}
        {!isLoading && solicitudes.length > 0 && (
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Nro', 'Solicitud', 'Fecha', 'Cuenta', 'Razón Social', 'Monto Sol.', 'Moneda', 'Neto', 'TEA %', 'Acciones'].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {solicitudes.map((sol) => (
                    <tr
                      key={sol.Nro}
                      onClick={() => setSelectedSolicitud(sol)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      title="Clic para ver detalle"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{sol.Nro}</td>
                      <td className="px-4 py-3 text-sm text-blue-600 font-medium whitespace-nowrap">{sol.NRO_SOL}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{sol.FECHA_SOL.split(' ')[0]}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{sol.CUENTA}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">{sol.NOMBRE}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">S/ {fmt(sol.MONTO_SOL)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{sol.MONEDA}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">S/ {fmt(sol.NETO)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{parseFloat(sol.TEA_INTERES).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedSolicitud(sol)}
                            className="text-blue-600 hover:text-blue-900 font-medium text-xs hover:underline"
                          >
                            Ver
                          </button>
                          {canMakeCreditRequest() && (
                            <button
                              onClick={() => setSelectedSolicitud(sol)}
                              className="text-gray-500 hover:text-gray-800 font-medium text-xs hover:underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      <SolicitudCreditoModal
        solicitud={selectedSolicitud}
        onClose={() => setSelectedSolicitud(null)}
        onAprobar={handleAprobar}
        onDenegar={handleDenegar}
        onAnular={handleAnular}
        canMakeAction={canMakeCreditRequest()}
      />
    </Layout>
  );
};

/* ── Subcomponente interno para las tarjetas móvil ── */
const CardRow: React.FC<{ label: string; value: string; valueClass?: string }> = ({
  label,
  value,
  valueClass = 'text-sm text-gray-800 font-medium',
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
    <span className={`${valueClass} break-words`}>{value}</span>
  </div>
);

export default SolicitudCreditoTable;