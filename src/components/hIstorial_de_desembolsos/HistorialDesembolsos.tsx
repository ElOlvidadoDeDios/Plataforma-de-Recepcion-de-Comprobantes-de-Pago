import React, { useState, useEffect } from 'react';
import { DesembolsoRealizado, fetchDesembolsosRealizados } from '../../api/HistorialDesolbolsosAPI';
import { obtenerUrlFirmada } from '../../api/firmaDigitalApi';
import Layout from '../Layout';

import { exportDesembolsosToPDF } from './exportDesembolsoPDF';
import { exportDesembolsosToExcel } from './exportDesembolsosToExcel';

// Para el gráfico: Instala recharts si no lo tienes: npm install recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HistorialDesembolsosProps {}

const HistorialDesembolsos: React.FC<HistorialDesembolsosProps> = () => {
  const [desembolsos, setDesembolsos] = useState<DesembolsoRealizado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [imagenModal, setImagenModal] = useState<string | null>(null);
  const [loadingImagen, setLoadingImagen] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // Función para convertir fecha de YYYY-MM-DD a DD/MM/YYYY
  const convertirFecha = (fechaISO: string): string => {
    const [year, month, day] = fechaISO.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleBuscarDesembolsos = async () => {
    if (!fecha) {
      setError('Por favor selecciona una fecha');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const fechaFormateada = convertirFecha(fecha);
      const response = await fetchDesembolsosRealizados(fechaFormateada);

      if (response.status) {
        setDesembolsos(response.data);
        setError(null);
      } else {
        setError(response.message);
        setDesembolsos([]);
      }
    } catch (err) {
      setError('Error al cargar los desembolsos');
      setDesembolsos([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para asegurar que los gráficos se rendericen después del DOM
  useEffect(() => {
    if (desembolsos.length > 0) {
      // Esperar a que el DOM se haya renderizado completamente
      const timer = setTimeout(() => {
        setChartReady(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setChartReady(false);
    }
  }, [desembolsos.length]);

  // Hook adicional para resetear chartReady cuando se inicia una nueva búsqueda
  useEffect(() => {
    if (loading) {
      setChartReady(false);
    }
  }, [loading]);

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  };

  // Calcular total monto y cantidad
  const totalMonto = desembolsos.reduce((sum, d) => sum + parseFloat(d.MONTO_NETO || '0'), 0);
  const cantidadDesembolsos = desembolsos.length;

  // Preparar datos para gráfico agrupado por agencia
  const datosPorAgencia = desembolsos.reduce((acc: { [key: string]: { count: number; sum: number } }, desembolso) => {
    const agencia = desembolso.AGENCIA || 'Sin agencia';
    if (!acc[agencia]) {
      acc[agencia] = { count: 0, sum: 0 };
    }
    acc[agencia].count += 1;
    acc[agencia].sum += parseFloat(desembolso.MONTO_NETO || '0');
    return acc;
  }, {});

  // Convertir a array para el gráfico (ordenado por monto descendente)
  const chartData = Object.entries(datosPorAgencia)
    .map(([agencia, data]) => ({
      agencia: agencia,
      count: data.count,
      monto: data.sum
    }))
    .sort((a, b) => b.monto - a.monto);

  const abrirImagenModal = async (enlace: string) => {
    setLoadingImagen(enlace);

    try {
      const response = await obtenerUrlFirmada({
        URL: enlace
      });
      if (response.success && response.url) {
        setImagenModal(response.url);
      } else {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
        const urlCompleta = `${API_BASE_URL}/${enlace}`;
        console.warn('No se pudo obtener URL pública, usando URL original');
        setImagenModal(urlCompleta);
      }
    } catch (error) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
      const urlCompleta = `${API_BASE_URL}/${enlace}`;
      console.error('Error al obtener URL pública:', error);
      setImagenModal(urlCompleta);
    } finally {
      setLoadingImagen(null);
    }
  };

  const cerrarImagenModal = () => {
    setImagenModal(null);
  };

  function handleExportarPDF(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    if (desembolsos.length === 0) {
      setError('No hay datos para exportar a PDF');
      return;
    }
    const fechaFormateada = convertirFecha(fecha);
    exportDesembolsosToPDF({ desembolsos, fecha: fechaFormateada });
  }

  function handleExportarExcel(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    if (desembolsos.length === 0) {
      setError('No hay datos para exportar a Excel');
      return;
    }
    const fechaFormateada = convertirFecha(fecha);
    exportDesembolsosToExcel({ desembolsos, fecha: fechaFormateada });
  }

  return (
    <Layout title="Historial de Desembolsos">
      <div className="p-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Buscar Desembolsos</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handleBuscarDesembolsos}
              disabled={loading}
              className="bg-cyan-600 text-white px-6 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              onClick={handleExportarPDF}
              disabled={loading || desembolsos.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exportar a PDF
            </button>
            <button
              onClick={handleExportarExcel}
              disabled={loading || desembolsos.length === 0}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exportar a Excel
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Resultados */}
        {desembolsos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            {/* Resumen en cards */}
            <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Total Desembolsado</h4>
                <p className="text-2xl font-bold text-blue-600">
                  S/ {totalMonto.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-green-800 mb-1">Cantidad de Desembolsos</h4>
                <p className="text-2xl font-bold text-green-600">{cantidadDesembolsos}</p>
              </div>
            </div>

            {/* Gráficos agrupados por agencias - Solo renderizar cuando todo esté listo */}
            {!loading && desembolsos.length > 0 && chartData.length > 0 && chartReady && (
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Desembolsos por Agencia</h4>
                
                {/* Gráficos en una sola fila */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Gráfico de Cantidad */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h5 className="text-xs font-medium text-gray-600 mb-3">Cantidad de Desembolsos</h5>
                    <div className="w-full h-[280px] min-w-[300px] min-h-[280px]">
                      <ResponsiveContainer
                        width={400}
                        height={280}
                        minWidth={300}
                        minHeight={280}
                        aspect={undefined}
                      >
                        <BarChart data={chartData} width={400} height={280}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="agencia"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            fontSize={11}
                          />
                          <YAxis fontSize={11} />
                          <Tooltip
                            labelFormatter={(label) => `Agencia: ${label}`}
                            formatter={(value: number) => [value, 'Cantidad']}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="count" fill="#0891B2" name="Cantidad" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico de Monto */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h5 className="text-xs font-medium text-gray-600 mb-3">Monto Total Desembolsado</h5>
                    <div className="w-full h-[280px] min-w-[300px] min-h-[280px]">
                      <ResponsiveContainer
                        width={400}
                        height={280}
                        minWidth={300}
                        minHeight={280}
                        aspect={undefined}
                      >
                        <BarChart data={chartData} width={400} height={280}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="agencia"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            fontSize={11}
                          />
                          <YAxis
                            tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}K`}
                            fontSize={11}
                          />
                          <Tooltip
                            labelFormatter={(label) => `Agencia: ${label}`}
                            formatter={(value: number) => [`S/ ${value.toLocaleString('es-PE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}`, 'Monto']}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="monto" fill="#10B981" name="Monto (S/)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Tabla resumen por agencia */}
                <div className="mt-6">
                  <h5 className="text-xs font-medium text-gray-600 mb-3">Resumen por Agencia</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Agencia</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Cantidad</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Monto Total</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border-b">{item.agencia}</td>
                            <td className="px-3 py-2 text-right border-b">{item.count}</td>
                            <td className="px-3 py-2 text-right border-b">
                              S/ {item.monto.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="px-3 py-2 text-right border-b">
                              S/ {(item.monto / item.count).toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">
                Desembolsos Realizados ({desembolsos.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuenta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razón Social
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagaré
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Otorga
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Neto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {desembolsos.map((desembolso, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {desembolso.DNI}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {desembolso.CUENTA}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {desembolso.RAZON_SOCIAL}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {desembolso.PAGARE}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(desembolso.OTORGA)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        S/ {parseFloat(desembolso.MONTO_NETO).toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {desembolso.PRODUCTO}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {desembolso.AGENCIA}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {desembolso.RESPONSABLE}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {desembolso.ENLACE && (
                          <button
                            onClick={() => abrirImagenModal(desembolso.ENLACE)}
                            disabled={loadingImagen === desembolso.ENLACE}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {loadingImagen === desembolso.ENLACE ? (
                              <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                Cargando...
                              </>
                            ) : (
                              'Ver Voucher'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {!loading && desembolsos.length === 0 && !error && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              Selecciona una fecha y haz clic en "Buscar" para ver los desembolsos realizados.
            </p>
          </div>
        )}

        {/* Modal para mostrar imagen */}
        {imagenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">Voucher de Desembolso</h3>
                <button
                  onClick={cerrarImagenModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <img
                  src={imagenModal}
                  alt="Voucher de Desembolso"
                  className="max-w-full h-auto"
                  onError={() => {
                    setError('Error al cargar la imagen del voucher');
                    cerrarImagenModal();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistorialDesembolsos;