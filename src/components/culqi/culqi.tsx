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
  const [busqueda, setBusqueda] = useState('');

  // Función para imprimir la tabla
  const imprimirTabla = () => {
    const contenidoImprimir = document.getElementById('tabla-imprimible');
    if (!contenidoImprimir) return;

    const ventanaImprimir = window.open('', '', 'height=600,width=800');
    if (!ventanaImprimir) return;

    ventanaImprimir.document.write('<html><head><title>Culquis Pendientes - Reporte</title>');
    ventanaImprimir.document.write('<style>');
    ventanaImprimir.document.write(`
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #1e40af; font-size: 24px; margin-bottom: 10px; }
      .info { color: #666; margin-bottom: 20px; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #f3f4f6; padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
      td { padding: 10px; border: 1px solid #ddd; font-size: 11px; }
      tr:nth-child(even) { background-color: #f9fafb; }
      .monto { font-weight: bold; color: #059669; }
      .estado-activo { background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 12px; font-size: 10px; }
      .estado-inactivo { background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 12px; font-size: 10px; }
      .fecha { text-align: right; color: #666; font-size: 12px; margin-top: 20px; }
      @media print {
        button { display: none; }
      }
    `);
    ventanaImprimir.document.write('</style></head><body>');
    ventanaImprimir.document.write(contenidoImprimir.innerHTML);
    ventanaImprimir.document.write('<div class="fecha">Fecha de impresión: ' + new Date().toLocaleString('es-PE') + '</div>');
    ventanaImprimir.document.write('</body></html>');
    
    ventanaImprimir.document.close();
    ventanaImprimir.focus();
    
    setTimeout(() => {
      ventanaImprimir.print();
      ventanaImprimir.close();
    }, 250);
  };

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
      <Layout title="Qullquis Pendientes">
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
      <Layout title="Qullquis Pendientes">
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
      <Layout title="Qullquis Pendientes">
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

  // Función para filtrar socios según búsqueda
  const filtrarSocios = (socios: any[]) => {
    if (!busqueda.trim()) return socios;
    
    const busquedaLower = busqueda.toLowerCase().trim();
    return socios.filter(socio => 
      socio.RAZON_SOCIAL?.toLowerCase().includes(busquedaLower) ||
      socio.CUENTA?.toString().includes(busquedaLower)
    );
  };

  // Aplicar filtro a todos los socios
  const todosSociosFiltrados = filtrarSocios(todosSocios);
  
  // Aplicar filtro a socios por agencia
  const sociosPorAgenciaFiltrados = Object.entries(sociosPorAgencia).reduce((acc, [agencia, socios]) => {
    const sociosFiltrados = filtrarSocios(socios as any[]);
    if (sociosFiltrados.length > 0) {
      acc[agencia] = sociosFiltrados;
    }
    return acc;
  }, {} as Record<string, any[]>);

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
        <>
          {/* Versión visible en pantalla */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {infoUsuario.esAdminAgencia ? `Socios de ${infoUsuario.agencia}` :
                 `Mis Socios Asignados - ${infoUsuario.agencia}`}
              </h3>
              {busqueda && (
                <p className="text-sm text-gray-600 mt-1">
                  Mostrando {todosSociosFiltrados.length} de {todosSocios.length} socios
                </p>
              )}
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
                  {todosSociosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No se encontraron socios que coincidan con "{busqueda}"
                      </td>
                    </tr>
                  ) : (
                    todosSociosFiltrados.map((socio, index) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Versión oculta para impresión */}
          <div id="tabla-imprimible" style={{ display: 'none' }}>
            <h1>Qullquis  Pendientes - {infoUsuario.esAdminAgencia ? `${infoUsuario.agencia}` : `Analista ${infoUsuario.agencia}`}</h1>
            <div className="info">
              <strong>Total de socios:</strong> {todosSociosFiltrados.length} | 
              <strong> Monto total:</strong> S/ {todosSociosFiltrados.reduce((sum, s) => sum + formatearMonto(s.MONTO_APROBADO), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              {busqueda && <span> | <strong>Filtrado por:</strong> "{busqueda}"</span>}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Razón Social</th>
                  <th>Monto Aprobado</th>
                  <th>Estado</th>
                  <th>Analista</th>
                </tr>
              </thead>
              <tbody>
                {todosSociosFiltrados.map((socio, index) => (
                  <tr key={`print-${socio.CUENTA}-${index}`}>
                    <td>{socio.CUENTA}</td>
                    <td>{socio.RAZON_SOCIAL}</td>
                    <td className="monto">S/ {formatearMonto(socio.MONTO_APROBADO).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={socio.ESTADO === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo'}>
                        {socio.ESTADO}
                      </span>
                    </td>
                    <td>{socio.ANA_ACTUAL}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    // Vista organizada por agencias para SuperAdmin
    const agenciasMostrar = Object.entries(sociosPorAgenciaFiltrados);
    
    return (
      <>
        {/* Versión visible en pantalla */}
        <div className="space-y-6">
          {agenciasMostrar.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No se encontraron socios que coincidan con "{busqueda}"
            </div>
          ) : (
            agenciasMostrar.map(([agencia, socios]) => (
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
            ))
          )}
        </div>

        {/* Versión oculta para impresión */}
        <div id="tabla-imprimible" style={{ display: 'none' }}>
          <h1>Qullquis  Pendientes - Vista SuperAdmin</h1>
          <div className="info">
            <strong>Total de socios:</strong> {Object.values(sociosPorAgenciaFiltrados).flat().length} | 
            <strong> Agencias:</strong> {agenciasMostrar.length}
            {busqueda && <span> | <strong>Filtrado por:</strong> "{busqueda}"</span>}
          </div>
          
          {agenciasMostrar.map(([agencia, socios]) => (
            <div key={`print-${agencia}`} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
              <h2 style={{ color: '#1e40af', fontSize: '18px', marginTop: '20px', marginBottom: '10px' }}>
                🏢 {agencia}
              </h2>
              <div className="info" style={{ marginBottom: '10px' }}>
                <strong>{socios.length} socios</strong> | 
                <strong> Total:</strong> S/ {socios.reduce((sum, s) => sum + formatearMonto(s.MONTO_APROBADO), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Cuenta</th>
                    <th>Razón Social</th>
                    <th>Monto Aprobado</th>
                    <th>Estado</th>
                    <th>Analista</th>
                  </tr>
                </thead>
                <tbody>
                  {socios.map((socio, index) => (
                    <tr key={`print-${agencia}-${socio.CUENTA}-${index}`}>
                      <td>{socio.CUENTA}</td>
                      <td>{socio.RAZON_SOCIAL}</td>
                      <td className="monto">S/ {formatearMonto(socio.MONTO_APROBADO).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={socio.ESTADO === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo'}>
                          {socio.ESTADO}
                        </span>
                      </td>
                      <td>{socio.ANA_ACTUAL}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </>
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
    <Layout title="Qullquis  Pendientes">
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
              {vistaActual === 'tabla' && (
                <button
                  onClick={imprimirTabla}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  🖨️ Imprimir
                </button>
              )}
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

        {/* Buscador */}
        {vistaActual === 'tabla' && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por razón social o número de cuenta..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {vistaActual === 'tabla' ? <TablaSociosOrganizada /> : <EstadisticasConGrafico />}
      </div>
    </Layout>
  );
};

export default CulquiPendientes;