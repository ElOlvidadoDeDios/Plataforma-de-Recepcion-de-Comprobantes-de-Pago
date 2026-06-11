import React from 'react';
import Layout from '../../Layout';
import SolicitudCreditoModal from './AprobacioncreditosModal';
import OtpModal from './OtpModal';
import { useAprobacionCreditos } from '../hooks/useAprobacionCreditos';
import { useNavigate } from 'react-router-dom';

const AprobacionCreditosTable: React.FC = () => {
  const {
    solicitudes,
    filteredSolicitudes,
    searchTerm,
    setSearchTerm,
    selectedAgencia,
    setSelectedAgencia,
    agencias,
    isLoading,
    error,
    selectedSolicitud,
    setSelectedSolicitud,
    isProcessing,
    showOtpModal,
    isValidatingOtp,
    otpError,
    pendingApproval,
    hasAccess,
    canApproveCreditApproval,
    cargarSolicitudes,
    handleVerDetalle,
    handleAprobar,
    handleValidateOtp,
    handleRechazar,
    handleAnular,
    handleImprimir,
    handleCloseOtpModal,
  } = useAprobacionCreditos();
  const navigate = useNavigate();
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
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-bold">APROBACION DE CREDITOS</h2>

              <div className="mt-4 sm:mt-0 flex items-center gap-2">
                {/* <button
                  onClick={() => navigate('/duplicados')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Duplicados</span>
                </button> */}

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
            {/* Barra de búsqueda */}
            {!isLoading && solicitudes.length > 0 && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por razón social, cuenta o nro solicitud..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/70 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Filtro de Agencias - Solo mostrar si hay más de una agencia */}
            {!isLoading && agencias.length > 1 && (
              <>
                {/* Vista móvil: Select */}
                <div className="block md:hidden bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <label className="block text-white text-sm font-medium mb-2">
                    Filtrar por Agencia
                  </label>
                  <select
                    value={selectedAgencia}
                    onChange={(e) => setSelectedAgencia(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white text-gray-700 font-medium text-sm border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all"
                  >
                    <option value="TODAS">
                      Todas las Agencias ({solicitudes.length})
                    </option>
                    {agencias.map((agencia) => {
                      const count = solicitudes.filter(sol => sol.AGENCIA_NOM === agencia).length;
                      return (
                        <option key={agencia} value={agencia}>
                          {agencia} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Vista desktop: Tabs */}
                <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedAgencia('TODAS')}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                        transition-all duration-200 transform hover:scale-105
                        ${selectedAgencia === 'TODAS'
                          ? 'bg-white text-cyan-700 shadow-lg ring-2 ring-white/50'
                          : 'bg-white/20 text-white hover:bg-white/30'
                        }
                      `}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Todas</span>
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-bold
                        ${selectedAgencia === 'TODAS'
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-white/30 text-white'
                        }
                      `}>
                        {solicitudes.length}
                      </span>
                    </button>
                    {agencias.map((agencia) => {
                      const count = solicitudes.filter(sol => sol.AGENCIA_NOM === agencia).length;
                      return (
                        <button
                          key={agencia}
                          onClick={() => setSelectedAgencia(agencia)}
                          className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                            transition-all duration-200 transform hover:scale-105
                            ${selectedAgencia === agencia
                              ? 'bg-white text-cyan-700 shadow-lg ring-2 ring-white/50'
                              : 'bg-white/20 text-white hover:bg-white/30'
                            }
                          `}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-semibold">{agencia}</span>
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-bold
                            ${selectedAgencia === agencia
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-white/30 text-white'
                            }
                          `}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
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
          ) : filteredSolicitudes.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="w-12 h-12 text-orange-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600 text-sm font-medium mb-1">No se encontraron resultados</p>
                <p className="text-gray-400 text-xs mb-3">Intenta con otro término de búsqueda</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vista móvil - Tarjetas (< md) */}
              <div className="md:hidden p-4 space-y-4 overflow-y-auto">
                {filteredSolicitudes.map((solicitud) => (
                  <button
                    key={solicitud.Nro}
                    onClick={() => handleVerDetalle(solicitud)}
                    disabled={isProcessing}
                    className="w-full text-left bg-white rounded-xl border-2 border-gray-200 shadow-md p-5 hover:border-cyan-400 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
                  >
                    <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-medium">#{solicitud.Nro}</span>
                          <span className="text-xs bg-cyan-50 text-cyan-600 font-medium px-2 py-1 rounded-full">
                            {solicitud.FECHA_SOL.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-base font-bold text-cyan-700 mb-1">{solicitud.NRO_SOL}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 break-words">{solicitud.NOMBRE}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <InfoField label="Cuenta" value={solicitud.CUENTA} />
                        <InfoField label="Moneda" value={solicitud.MONEDA} />
                      </div>

                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <InfoField
                            label="Monto Solicitado"
                            value={`S/ ${parseFloat(solicitud.MONTO_SOL).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            valueClass="text-base font-bold text-cyan-700"
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

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5 text-cyan-600">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro_sol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Sol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moneda</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TEA Interés</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSolicitudes.map((solicitud) => (
                      <tr
                        key={solicitud.Nro}
                        onClick={() => handleVerDetalle(solicitud)}
                        className="hover:bg-cyan-50 cursor-pointer transition-colors"
                        title="Clic para ver detalle"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{solicitud.Nro}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{solicitud.NRO_SOL}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.FECHA_SOL.split(' ')[0]}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.CUENTA}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{solicitud.NOMBRE}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">S/ {parseFloat(solicitud.MONTO_SOL).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{solicitud.MONEDA}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-600">S/ {parseFloat(solicitud.NETO).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{parseFloat(solicitud.TEA_INTERES).toFixed(2)}%</td>
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

      {showOtpModal && pendingApproval && (
        <OtpModal
          isOpen={showOtpModal}
          onClose={handleCloseOtpModal}
          onValidate={handleValidateOtp}
          isValidating={isValidatingOtp}
          errorMessage={otpError}
          solicitudNumero={pendingApproval.solicitud.NRO_SOL}
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