import React, { useState, useEffect, useMemo, memo } from 'react';
import Layout from '../Layout';
import { useNotifications } from '../../hooks/useNotifications';
import { ClienteBasico, ClienteResponse, TipoDocumento, searchClientes, searchClientesByDNI } from '../../api/customerConsultationAPI';
import { SessionManager } from '../../utils/sessionManager';
import SearchBar from '../customerConsultation/components/SearchBar';
import { CuotaDto, fetchCuotasPorDNI } from '../../api/pagos_recaudadoresApi';

const VisualizacionCuotas: React.FC = () => {
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(TipoDocumento.DNI);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ClienteBasico[]>([]);
  const [, setClienteSeleccionado] = useState<ClienteBasico | null>(null);
  const [clientData, setClientData] = useState<ClienteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagarés, setPagarés] = useState<{ [key: string]: CuotaDto[] }>({});
  const [pagareSeleccionado, setPagareSeleccionado] = useState<string | null>(null);

  const Notification = useNotifications();

  // Limpiar pagarés
  const cleanPagarés = (rawPagarés: { [key: string]: CuotaDto[] }) => {
    const cleaned: { [key: string]: CuotaDto[] } = {};
    const seenKeys = new Set<string>();
    Object.entries(rawPagarés).forEach(([pagareKey, cuotas]) => {
      const cleanedKey = pagareKey.trim();
      const validCuotas = cuotas.filter(cuota => 
        cuota.Pagare != null && 
        cuota.NumeroCuota != null && 
        cuota.TotalCuota != null &&
        cuota.EstadoCuota != null
      );
      if (validCuotas.length === 0) return;
      if (seenKeys.has(cleanedKey)) {
        const merged = [...(cleaned[cleanedKey] || []), ...validCuotas];
        cleaned[cleanedKey] = merged.filter((cuota, idx, self) =>
          idx === self.findIndex(c =>
            `${c.Pagare?.trim()}-${c.NumeroCuota}` === `${cuota.Pagare?.trim()}-${cuota.NumeroCuota}`
          )
        );
      } else {
        seenKeys.add(cleanedKey);
        cleaned[cleanedKey] = validCuotas.filter((cuota, idx, self) =>
          idx === self.findIndex(c =>
            `${c.Pagare?.trim()}-${c.NumeroCuota}` === `${cuota.Pagare?.trim()}-${cuota.NumeroCuota}`
          )
        );
      }
    });
    return cleaned;
  };

  // Cargar datos guardados
  useEffect(() => {
    const loadSavedData = async () => {
      const savedCliente = SessionManager.getItem('clienteSeleccionado_vista');
      if (!savedCliente) return;
      const cliente = JSON.parse(savedCliente);
      setClienteSeleccionado(cliente);
      try {
        setIsLoading(true);
        const detalleCliente = await searchClientesByDNI(cliente.NRO_DI);
        if (detalleCliente?.INFO_SOCIO) {
          setClientData(detalleCliente);
          const cuotasRaw = await fetchCuotasPorDNI(cliente.NRO_DI);
          const cuotasLimpias = cleanPagarés(cuotasRaw);
          setPagarés(cuotasLimpias);
          if (Object.keys(cuotasLimpias).length > 0) {
            setPagareSeleccionado(Object.keys(cuotasLimpias)[0]);
          }
        }
      } catch (error) {
        Notification.error('Error al cargar datos guardados');
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedData();
  }, []);

  // Búsqueda de clientes
  useEffect(() => {
    const controller = new AbortController();
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setResultadosBusqueda([]);
        return;
      }
      setIsLoading(true);
      try {
        if (tipoDocumento === TipoDocumento.DNI && /^\d{8}$/.test(searchQuery.trim())) {
          const detalleCliente = await searchClientesByDNI(searchQuery.trim());
          if (detalleCliente?.INFO_SOCIO) {
            const clienteBasico = {
              NRO_DI: detalleCliente.INFO_SOCIO.DATOS_PERSONALES.DNI,
              RAZON_SOCIAL: detalleCliente.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO,
            } as ClienteBasico;
            setClienteSeleccionado(clienteBasico);
            setClientData(detalleCliente);
            SessionManager.setItem('clienteSeleccionado_vista', JSON.stringify(clienteBasico));
            const cuotasRaw = await fetchCuotasPorDNI(searchQuery.trim());
            const cuotasLimpias = cleanPagarés(cuotasRaw);
            setPagarés(cuotasLimpias);
            if (Object.keys(cuotasLimpias).length > 0) {
              setPagareSeleccionado(Object.keys(cuotasLimpias)[0]);
            } else {
              Notification.info('No hay cuotas asociadas a este socio');
            }
          } else {
            Notification.warning('Socio no encontrado');
          }
        } else if (tipoDocumento === TipoDocumento.NOMBRE) {
          const result = await searchClientes(TipoDocumento.NOMBRE, searchQuery, controller.signal);
          setResultadosBusqueda(result?.data || []);
          if (result?.data?.length === 0) Notification.info('Sin resultados');
        } else if (tipoDocumento === TipoDocumento.CUENTA) {
          const result = await searchClientes(TipoDocumento.CUENTA, searchQuery, controller.signal);
          setResultadosBusqueda(result?.data || []);
          if (result?.data?.length === 0) Notification.info('Sin resultados para la cuenta');
        }
      } catch (error) {
        if (!controller.signal.aborted) Notification.error('Error en búsqueda');
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(searchTimeout);
    };
  }, [searchQuery, tipoDocumento]);

  // Handler selección de cliente
  const handleClienteSelect = async (cliente: ClienteBasico) => {
    setIsLoading(true);
    try {
      setClienteSeleccionado(cliente);
      setResultadosBusqueda([]);
      SessionManager.setItem('clienteSeleccionado_vista', JSON.stringify(cliente));
      const detalleCliente = await searchClientesByDNI(cliente.NRO_DI);
      if (detalleCliente?.INFO_SOCIO) {
        setClientData(detalleCliente);
        const cuotasRaw = await fetchCuotasPorDNI(cliente.NRO_DI);
        const cuotasLimpias = cleanPagarés(cuotasRaw);
        setPagarés(cuotasLimpias);
        if (Object.keys(cuotasLimpias).length > 0) {
          setPagareSeleccionado(Object.keys(cuotasLimpias)[0]);
        } else {
          Notification.info('No hay cuotas asociadas a este socio');
        }
      }
    } catch (error) {
      Notification.error('Error al consultar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  // Componente lista de pagarés
  const PagareList = memo(() => (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-base md:text-lg">Créditos del Socio:</h3>
      <div className="flex flex-wrap gap-2">
        {Object.keys(pagarés).map((pagare, index) => {
          const nombreProducto = pagarés[pagare]?.[0]?.NombreProducto || 'N/A';
          
          return (
            <button
              key={`${pagare.trim()}-${index}`}
              onClick={() => setPagareSeleccionado(pagare)}
              className={`px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-medium transition-colors ${
                pagareSeleccionado === pagare 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-bold">{pagare}</div>
                <div className="text-xs opacity-75">{nombreProducto}</div>
                <div className="text-xs">({pagarés[pagare].length} cuotas)</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  ));

  // Componente tabla de cuotas (SOLO VISTA)
  const CuotasTable = memo(() => {
    if (!pagareSeleccionado) return null;
    const cuotas = pagarés[pagareSeleccionado] || [];

    const uniqueCuotas = useMemo(() => {
      const seen = new Set<string>();
      return cuotas.filter(cuota => {
        const key = `${cuota.Pagare?.trim()}-${cuota.NumeroCuota}`;
        if (seen.has(key) || cuota.TotalCuota == null || cuota.NumeroCuota == null) return false;
        seen.add(key);
        return true;
      });
    }, [cuotas]);

    if (uniqueCuotas.length === 0) {
      return (
        <div className="text-center py-6 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-sm md:text-base">No hay cuotas válidas para este crédito</p>
        </div>
      );
    }

    // Calcular totales
    const totalCapital = uniqueCuotas.reduce((sum, c) => sum + (c.CapitalPendiente || 0), 0);
    const totalInteres = uniqueCuotas.reduce((sum, c) => sum + (c.InteresCuota || 0), 0);
    const totalMora = uniqueCuotas.reduce((sum, c) => sum + (c.MoraGenerada || 0), 0);
    const totalGeneral = uniqueCuotas.reduce((sum, c) => sum + (c.TotalCuota || 0), 0);

    return (
      <div className="mt-4 bg-white p-3 md:p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-base md:text-lg">
            Detalle de Cuotas - Crédito: <span className="font-bold text-blue-600">{pagareSeleccionado}</span>
          </h3>
 
        </div>

        {/* Vista móvil */}
        <div className="md:hidden space-y-3">
          {uniqueCuotas.map((cuota, index) => (
            <div key={`${cuota.Pagare?.trim()}-${cuota.NumeroCuota}-${index}`} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg">Cuota {cuota.NumeroCuota}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cuota.EstadoCuota === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  cuota.EstadoCuota === 'Vencida' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {cuota.EstadoCuota || 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-gray-500">Vencimiento:</p><p className="font-medium">{cuota.FechaVencimiento || 'N/A'}</p></div>
                <div><p className="text-gray-500">Capital:</p><p className="font-medium">S/ {(cuota.CapitalPendiente || 0).toFixed(2)}</p></div>
                <div><p className="text-gray-500">Interés:</p><p className="font-medium">S/ {(cuota.InteresCuota || 0).toFixed(2)}</p></div>
                <div><p className="text-gray-500">Mora:</p><p className="font-medium">S/ {(cuota.MoraGenerada || 0).toFixed(2)}</p></div>
              </div>
              <div className="mt-2 pt-2 border-t">
                <p className="text-gray-500 text-sm">Total de la Cuota:</p>
                <p className="font-bold text-lg text-blue-600">S/ {cuota.TotalCuota.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Vista desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 border font-semibold">N° Cuota</th>
                <th className="py-2 px-3 border font-semibold">Vencimiento</th>
                <th className="py-2 px-3 border font-semibold">Capital</th>
                <th className="py-2 px-3 border font-semibold">Interés</th>
                <th className="py-2 px-3 border font-semibold">Mora</th>
                <th className="py-2 px-3 border font-semibold">Total</th>
                <th className="py-2 px-3 border font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {uniqueCuotas.map((cuota, index) => (
                <tr key={`${cuota.Pagare?.trim()}-${cuota.NumeroCuota}-${index}`} className="hover:bg-blue-50 transition-colors">
                  <td className="py-2 px-3 border text-center font-bold">{cuota.NumeroCuota}</td>
                  <td className="py-2 px-3 border text-center">{cuota.FechaVencimiento || 'N/A'}</td>
                  <td className="py-2 px-3 border text-right">S/ {(cuota.CapitalPendiente || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right">S/ {(cuota.InteresCuota || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right">S/ {(cuota.MoraGenerada || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 border text-right font-semibold text-blue-600">S/ {cuota.TotalCuota.toFixed(2)}</td>
                  <td className="py-2 px-3 border text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cuota.EstadoCuota === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      cuota.EstadoCuota === 'Vencida' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {cuota.EstadoCuota || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Fila de totales */}
              <tr className="bg-blue-50 font-bold">
                <td className="py-2 px-3 border text-center" colSpan={2}>TOTALES</td>
                <td className="py-2 px-3 border text-right">S/ {totalCapital.toFixed(2)}</td>
                <td className="py-2 px-3 border text-right">S/ {totalInteres.toFixed(2)}</td>
                <td className="py-2 px-3 border text-right">S/ {totalMora.toFixed(2)}</td>
                <td className="py-2 px-3 border text-right text-blue-600">S/ {totalGeneral.toFixed(2)}</td>
                <td className="py-2 px-3 border"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resumen de totales para móvil */}
        <div className="md:hidden mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <h4 className="font-bold mb-2 text-center">Resumen Total</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-gray-600">Capital Total:</p><p className="font-bold">S/ {totalCapital.toFixed(2)}</p></div>
            <div><p className="text-gray-600">Interés Total:</p><p className="font-bold">S/ {totalInteres.toFixed(2)}</p></div>
            <div><p className="text-gray-600">Mora Total:</p><p className="font-bold">S/ {totalMora.toFixed(2)}</p></div>
            <div><p className="text-gray-600">Total General:</p><p className="font-bold text-lg text-blue-600">S/ {totalGeneral.toFixed(2)}</p></div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            ℹ️ Este es un módulo de <strong>solo visualización</strong>.
          </p>
        </div>
      </div>
    );
  });

  // Render principal
  return (
    <Layout title="Visualización de Cuotas">
      <div className="h-full w-full p-3 md:p-6 bg-gray-50">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-center text-gray-800">
            👁️ Visualización de Cuotas
          </h1>
        </div>

        <div className="bg-white p-3 rounded-lg shadow mb-4">
          <SearchBar
            searchQuery={searchQuery}
            tipoDocumento={tipoDocumento}
            onSearchChange={setSearchQuery}
            onTipoDocumentoChange={setTipoDocumento}
          />
        </div>

        {isLoading && !clientData ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 text-sm md:text-base">
              {tipoDocumento === TipoDocumento.DNI ? 'Consultando cuotas...' : 'Buscando socios...'}
            </span>
          </div>
        ) : resultadosBusqueda.length > 0 ? (
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="font-semibold mb-3 text-base md:text-lg">Seleccione un Socio:</h3>
            <ul className="divide-y divide-gray-200">
              {resultadosBusqueda.map(cliente => (
                <li
                  key={cliente.NRO_DI}
                  onClick={() => handleClienteSelect(cliente)}
                  className="cursor-pointer p-3 hover:bg-blue-50 rounded-lg transition-colors border-l-4 border-transparent hover:border-blue-500"
                >
                  <p className="font-medium text-base md:text-lg">{cliente.RAZON_SOCIAL}</p>
                  <p className="text-sm text-gray-500">DNI: {cliente.NRO_DI}</p>
                  <p className="text-xs text-blue-600 mt-1">CUENTA {cliente.CUENTA}</p>
                  <p className="text-xs text-blue-600 mt-1">👆 Clic para ver cuotas</p>
                </li>
              ))}
            </ul>
          </div>
        ) : clientData ? (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white p-3 md:p-4 rounded-lg shadow border-l-4 border-green-500">
              <h2 className="font-bold text-base md:text-lg mb-2 text-green-700">✅ Socio Seleccionado</h2>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="text-sm md:text-base"><strong>Nombre:</strong> {clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO}</p>
                  <p className="text-sm md:text-base"><strong>DNI:</strong> {clientData.INFO_SOCIO.DATOS_PERSONALES.DNI}</p>
                </div>
              </div>
            </div>

            {Object.keys(pagarés).length > 0 ? (
              <>
                <div className="bg-white p-3 md:p-4 rounded-lg shadow">
                  <PagareList />
                </div>
                <CuotasTable />
              </>
            ) : (
              <div className="text-center py-6 bg-white rounded-lg shadow">
                <p className="text-gray-600 text-sm md:text-base">No hay cuotas pendientes para este socio</p>
              </div>
            )}
          </div>
        ) : searchQuery.length >= 3 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm md:text-base">Sin resultados para: "<strong>{searchQuery}</strong>"</p>
            <p className="text-xs md:text-sm mt-2">Verifique el DNI o nombre</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm md:text-base">👆 Ingrese DNI, nombre o cuenta para buscar</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VisualizacionCuotas;