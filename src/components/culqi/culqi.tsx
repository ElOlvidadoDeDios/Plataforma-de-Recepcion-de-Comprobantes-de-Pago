import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useAuth } from '../../hooks/useAuth';
import {
  DatosAdicionales_insert,
  CulqiResponse,
  obtenerInfoUsuario,
  obtenerTodosSocios,
  obtenerSociosPorAgencia,
  obtenerEstadisticasPorAgencia,
  contarTotalSocios,
  calcularMontoTotal,
  formatearMonto
} from '../../api/culqiApi';

interface CulquiPendientesProps {}

const CulquiPendientes: React.FC<CulquiPendientesProps> = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CulqiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'tabla' | 'estadisticas'>('tabla');

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.dni) {
      cargarDatos();
    }
  }, [user]);

  const cargarDatos = async () => {
    if (!user?.dni) return;

    setLoading(true);
    setError(null);

    try {
      const response = await DatosAdicionales_insert({ 
        USER: user.dni 
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar estados de carga y error
  if (loading) {
    return (
      <Layout title="Culquis Pendientes">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos de Culqi...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Culquis Pendientes">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={cargarDatos}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Culquis Pendientes">
        <div className="p-6 text-center text-gray-500">
          No hay datos disponibles
        </div>
      </Layout>
    );
  }

  // Obtener información del usuario y datos procesados
  const infoUsuario = obtenerInfoUsuario(data);
  const todosSocios = obtenerTodosSocios(data);
  const sociosPorAgencia = obtenerSociosPorAgencia(data);
  const estadisticas = obtenerEstadisticasPorAgencia(data);
  const totalSocios = contarTotalSocios(data);
  const montoTotal = calcularMontoTotal(data);

  // Componente para mostrar estadísticas resumen
  const ResumenEstadisticas = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <div className="bg-blue-500 p-2 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-blue-600">Total Socios</p>
            <p className="text-2xl font-bold text-blue-900">{totalSocios}</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center">
          <div className="bg-green-500 p-2 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-green-600">Monto Total</p>
            <p className="text-2xl font-bold text-green-900">S/ {montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center">
          <div className="bg-purple-500 p-2 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 011-1h4a2 2 0 011 1v12m-6 0v-4a2 2 0 011-1h2a2 2 0 011 1v4" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-purple-600">Agencias</p>
            <p className="text-2xl font-bold text-purple-900">{estadisticas.length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para mostrar tabla organizada por agencias (SuperAdmin) o vista normal
  const TablaSociosOrganizada = () => {
    if (!infoUsuario.esSuperAdmin) {
      // Vista normal para no SuperAdmin
      return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {infoUsuario.esAdminAgencia ? `Socios de ${infoUsuario.agencia}` :
               `Mis Socios Asignados - ${infoUsuario.agencia}`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analista</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todosSocios.map((socio, index) => (
                  <tr key={`${socio.CUENTA}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{socio.CUENTA}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{socio.RAZON_SOCIAL}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      S/ {formatearMonto(socio.MONTO_APROBADO).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        socio.ESTADO === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {socio.ESTADO}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{socio.ANA_ACTUAL}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Vista organizada por agencias para SuperAdmin
    return (
      <div className="space-y-6">
        {Object.entries(sociosPorAgencia).map(([agencia, socios]) => (
          <div key={agencia} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">🏢 {agencia}</h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="font-medium">{socios.length}</span> socios
                  </span>
                  <span className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="font-medium">S/ {socios.reduce((sum, s) => sum + formatearMonto(s.MONTO_APROBADO), 0).toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analista</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {socios.map((socio, index) => (
                    <tr key={`${socio.CUENTA}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{socio.CUENTA}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{socio.RAZON_SOCIAL}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        S/ {formatearMonto(socio.MONTO_APROBADO).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          socio.ESTADO === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {socio.ESTADO}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{socio.ANA_ACTUAL}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Componente con gráfico de barras para estadísticas
  const EstadisticasConGrafico = () => {
    // Ordenar estadísticas por monto total (mayor a menor)
    const estadisticasOrdenadas = estadisticas.sort((a, b) => b.montoTotal - a.montoTotal);
    const montoMaximo = Math.max(...estadisticasOrdenadas.map(e => e.montoTotal));
    
    return (
      <div className="space-y-6">
        {/* Gráfico de barras horizontales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Distribución de Montos por Agencia</h3>
          
          <div className="space-y-4">
            {estadisticasOrdenadas.map((estadistica, index) => {
              const porcentaje = (estadistica.montoTotal / montoMaximo) * 100;
              const colores = [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
                'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
              ];
              const color = colores[index % colores.length];
              
              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {estadistica.agencia}
                    </span>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {estadistica.cantidad} socios
                      </span>
                      <span className="font-semibold">
                        S/ {estadistica.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className={`${color} h-8 rounded-full transition-all duration-700 ease-out flex items-center shadow-sm`}
                      style={{ width: `${Math.max(porcentaje, 8)}%` }}
                    >
                      <span className="text-white text-sm font-medium ml-3">
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estadísticas detalladas en grid compacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estadisticasOrdenadas.map((estadistica, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{estadistica.agencia}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {estadistica.cantidad}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-green-600">
                    S/ {(estadistica.montoTotal / 1000).toFixed(0)}K
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-medium">
                    S/ {(estadistica.montoTotal / estadistica.cantidad / 1000).toFixed(1)}K
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-600 text-xs block mb-1">
                    Analistas ({estadistica.analistas.length}):
                  </span>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {estadistica.analistas.slice(0, 2).join(', ')}
                    {estadistica.analistas.length > 2 && ` +${estadistica.analistas.length - 2} más`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Culquis Pendientes">
      <div className="p-6">
        {/* Header con información del usuario y controles */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {infoUsuario.esSuperAdmin ? '🔑 Vista SuperAdmin - Todas las Agencias' :
                 infoUsuario.esAdminAgencia ? `🏢 Vista Admin - ${infoUsuario.agencia}` :
                 `👤 Vista Analista - ${infoUsuario.agencia}`}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {infoUsuario.tipoVista} • {totalSocios} socios • S/ {montoTotal.toLocaleString('es-PE')}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setVistaActual('tabla')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  vistaActual === 'tabla'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 {infoUsuario.esSuperAdmin ? 'Por Agencias' : 'Tabla'}
              </button>
              <button
                onClick={() => setVistaActual('estadisticas')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  vistaActual === 'estadisticas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Análisis
              </button>
              <button
                onClick={cargarDatos}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                🔄 {loading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de estadísticas */}
        <ResumenEstadisticas />

        {/* Contenido principal */}
        {vistaActual === 'tabla' ? <TablaSociosOrganizada /> : <EstadisticasConGrafico />}
      </div>
    </Layout>
  );
};

export default CulquiPendientes;