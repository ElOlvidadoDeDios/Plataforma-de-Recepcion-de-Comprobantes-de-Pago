import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCombinedPermissions } from '../../../hooks/useCombinedPermissions';
import Layout from '../../Layout';

interface SolicitudCredito {
  nro: number;
  solicitud: string;
  fecha: string;
  cuenta: string;
  razonSocial: string;
  montoSol: number;
  moneda: string;
  neto: number;
  teaInteres: number;
}

const SolicitudCreditoTable: React.FC = () => {
  const { user } = useAuth();
  const { canViewCreditRequest, canMakeCreditRequest } = useCombinedPermissions();
  const [solicitudes, setSolicitudes] = useState<SolicitudCredito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar permisos - SUPER_ADMIN siempre tiene acceso
  const hasAccess = user?.role === 'SUPER_ADMIN' || canViewCreditRequest();

  // Cargar datos (por ahora vacío, se llenará después)
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

  // Si no tiene acceso
  if (!hasAccess) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
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

  return (
    <Layout title="SOLICITUD DE CRÉDITO" showBackButton={true}>
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">SOLICITUD DE CRÉDITO</h2>
            
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {canMakeCreditRequest() && (
                <button className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm">Nueva Solicitud</span>
                </button>
              )}
              
              <button
                onClick={cargarSolicitudes}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm">{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
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
                <p className="text-gray-500">No hay solicitudes de crédito</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuenta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razón Social
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Sol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Moneda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Neto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TEA Interés
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.nro} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {solicitud.nro}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {solicitud.solicitud}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {solicitud.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {solicitud.cuenta}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {solicitud.razonSocial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        S/ {solicitud.montoSol.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {solicitud.moneda}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        S/ {solicitud.neto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {solicitud.teaInteres.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 font-medium">
                          Ver
                        </button>
                        {canMakeCreditRequest() && (
                          <button className="text-gray-600 hover:text-gray-900 font-medium">
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SolicitudCreditoTable;
