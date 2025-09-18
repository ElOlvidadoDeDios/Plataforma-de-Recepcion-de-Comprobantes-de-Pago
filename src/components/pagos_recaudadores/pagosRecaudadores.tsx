import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useNotifications } from '../../hooks/useNotifications';
import {
  ClienteBasico,
  ClienteResponse,
  TipoDocumento,
  searchClientes,
  searchClientesByDNI,
} from '../../api/customerConsultationAPI';
import { SessionManager } from '../../utils/sessionManager';
import SearchBar from '../customerConsultation/components/SearchBar';
 // Importar el componente SearchBar

// Interfaces necesarias
interface CuotaDto {
  Pagare: string;
  NumeroCuota: string;
  FechaVencimiento: string;
  EstadoCuota: string;
  CapitalPendiente: number;
  TotalCuota: number;
  InteresCuota: number;
  MoraGenerada: number;
}

interface ApiResponseDto {
  success: boolean;
  message: string;
  data: CuotaDto[];
}

interface PagoRequestDto {
  socioId: string;
  pagare: string;
  cuotas: number[];
  montoTotal: number;
  usuario: string;
}

interface PagoResponseDto {
  success: boolean;
  message: string;
  comprobante?: string;
}

const ConsultaCuotasSocios: React.FC = () => {
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(TipoDocumento.DNI);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ClienteBasico[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteBasico | null>(null);
  const [clientData, setClientData] = useState<ClienteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagarés, setPagarés] = useState<{ [key: string]: CuotaDto[] }>({});
  const [pagareSeleccionado, setPagareSeleccionado] = useState<string | null>(null);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState<number[]>([]);
  const [montoTotal, setMontoTotal] = useState<number>(0);
  const [comprobantePago, setComprobantePago] = useState<string | null>(null);

  const Notification = useNotifications();

  // Cargar datos guardados
  useEffect(() => {
    const loadSavedData = async () => {
      const savedCliente = SessionManager.getItem('clienteSeleccionado');
      if (savedCliente) {
        const cliente = JSON.parse(savedCliente);
        setClienteSeleccionado(cliente);
        try {
          setIsLoading(true);
          const detalleCliente = await searchClientesByDNI(cliente.NRO_DI);
          if (detalleCliente?.INFO_SOCIO) {
            setClientData(detalleCliente);
            await fetchCuotasPorDNI(cliente.NRO_DI);
          }
        } catch (error) {
          Notification.error('Error al cargar datos guardados.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadSavedData();
  }, []);

  // Búsqueda con SearchBar
  useEffect(() => {
    const controller = new AbortController();
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsLoading(true);
        setResultadosBusqueda([]);
        setClienteSeleccionado(null);
        setClientData(null);
        setPagarés({});
        setPagareSeleccionado(null);
        setCuotasSeleccionadas([]);
        setComprobantePago(null);

        try {
          if (tipoDocumento === TipoDocumento.DNI && /^\d{8}$/.test(searchQuery.trim())) {
            const detalleCliente = await searchClientesByDNI(searchQuery.trim());
            if (detalleCliente?.INFO_SOCIO) {
              const clienteBasico = {
                  NRO_DI: detalleCliente.INFO_SOCIO.DATOS_PERSONALES.DNI,
                  RAZON_SOCIAL: detalleCliente.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO,
              } as Partial<ClienteBasico>;
              setClienteSeleccionado(clienteBasico as ClienteBasico);
              setClientData(detalleCliente);
              SessionManager.setItem('clienteSeleccionado', JSON.stringify(clienteBasico));
              await fetchCuotasPorDNI(searchQuery.trim());
            } else {
              Notification.warning('No se encontró el socio con ese DNI.');
            }
          } else if (tipoDocumento === TipoDocumento.NOMBRE) {
            const result = await searchClientes(TipoDocumento.NOMBRE, searchQuery, controller.signal);
            setResultadosBusqueda(result?.data || []);
            if (result?.data?.length === 0) {
              Notification.info('No se encontraron resultados.');
            }
          }
        } catch (error: any) {
          if (!controller.signal.aborted) {
            Notification.error('Error en la búsqueda.');
          }
        } finally {
          setIsLoading(false);
        }
      } else if (searchQuery === '') {
        setResultadosBusqueda([]);
        setClienteSeleccionado(null);
        setClientData(null);
        setPagarés({});
        setPagareSeleccionado(null);
        setCuotasSeleccionadas([]);
        setComprobantePago(null);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(searchTimeout);
    };
  }, [searchQuery, tipoDocumento]);

  // Consultar cuotas por DNI
  const fetchCuotasPorDNI = async (dni: string) => {
    try {
      const response = await fetch(`http://n70fhxk0-3034.brs.devtunnels.ms/pagos-recaudadores/cuotas/${dni}`);
      const data: ApiResponseDto = await response.json();
      if (data.success && data.data) {
        const agrupadoPorPagare: { [key: string]: CuotaDto[] } = {};
        data.data.forEach(cuota => {
          if (!agrupadoPorPagare[cuota.Pagare]) {
            agrupadoPorPagare[cuota.Pagare] = [];
          }
          agrupadoPorPagare[cuota.Pagare].push(cuota);
        });
        setPagarés(agrupadoPorPagare);
        if (Object.keys(agrupadoPorPagare).length > 0) {
          setPagareSeleccionado(Object.keys(agrupadoPorPagare)[0]);
        }
        Notification.success(`Se encontraron cuotas para ${Object.keys(agrupadoPorPagare).length} pagaré(s).`);
      } else {
        Notification.warning(data.message || 'No se encontraron cuotas pendientes.');
        setPagarés({});
      }
    } catch (error) {
      Notification.error('Error al consultar cuotas.');
      setPagarés({});
    }
  };

  // Selección de cliente
  const handleClienteSelect = async (cliente: ClienteBasico) => {
    try {
      setIsLoading(true);
      setClienteSeleccionado(cliente);
      setResultadosBusqueda([]);
      SessionManager.setItem('clienteSeleccionado', JSON.stringify(cliente));
      const detalleCliente = await searchClientesByDNI(cliente.NRO_DI);
      if (detalleCliente?.INFO_SOCIO) {
        setClientData(detalleCliente);
        await fetchCuotasPorDNI(cliente.NRO_DI);
      } else {
        Notification.warning('No se encontraron detalles del cliente.');
      }
    } catch (error) {
      Notification.error('Error al consultar detalles del cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de cuotas
  const handleCuotaSelect = (numeroCuota: number) => {
    setCuotasSeleccionadas(prev =>
      prev.includes(numeroCuota) ? prev.filter(c => c !== numeroCuota) : [...prev, numeroCuota]
    );
  };

  const handleSelectAllCuotas = () => {
    if (!pagareSeleccionado) return;
    const cuotas = pagarés[pagareSeleccionado].map(c => Number(c.NumeroCuota));
    setCuotasSeleccionadas(prev => (prev.length === cuotas.length ? [] : cuotas));
  };

  // Calcular monto total
  useEffect(() => {
    if (!pagareSeleccionado) {
      setMontoTotal(0);
      return;
    }
    const total = pagarés[pagareSeleccionado]
      .filter(cuota => cuotasSeleccionadas.includes(Number(cuota.NumeroCuota)))
      .reduce((sum, cuota) => sum + cuota.TotalCuota, 0);
    setMontoTotal(total);
  }, [cuotasSeleccionadas, pagareSeleccionado, pagarés]);

  // Procesar pago
  const handlePagarCuotas = async () => {
    if (!pagareSeleccionado || !clienteSeleccionado || cuotasSeleccionadas.length === 0) return;
    try {
      setIsLoading(true);
      const cuotasAPagar = pagarés[pagareSeleccionado]
        .filter(cuota => cuotasSeleccionadas.includes(Number(cuota.NumeroCuota)))
        .map(cuota => Number(cuota.NumeroCuota));
      const pagoData: PagoRequestDto = {
        socioId: clienteSeleccionado.NRO_DI,
        pagare: pagareSeleccionado,
        cuotas: cuotasAPagar,
        montoTotal,
        usuario: 'USUARIO_ACTUAL',
      };
      const response = await fetch('http://n70fhxk0-3034.brs.devtunnels.ms/pagos-recaudadores/procesar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData),
      });
      const result: PagoResponseDto = await response.json();
      if (result.success) {
        Notification.success(`Pago exitoso: S/ ${montoTotal.toFixed(2)}`);
        setComprobantePago(result.comprobante || null);
        await fetchCuotasPorDNI(clienteSeleccionado.NRO_DI);
        setCuotasSeleccionadas([]);
      } else {
        Notification.error(result.message || 'Error al procesar el pago');
      }
    } catch (error) {
      Notification.error('Error de conexión al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  // Componente para listar pagarés
  const PagareList = () => (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-lg">Pagarés Pendientes:</h3>
      <div className="flex flex-wrap gap-2">
        {Object.keys(pagarés).map(pagare => (
          <button
            key={pagare}
            onClick={() => {
              setPagareSeleccionado(pagare);
              setCuotasSeleccionadas([]);
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              pagareSeleccionado === pagare ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {pagare} ({pagarés[pagare].length} cuotas)
          </button>
        ))}
      </div>
    </div>
  );

  // Componente para tabla de cuotas
  const CuotasTable = () => {
    if (!pagareSeleccionado) return null;
    const cuotas = pagarés[pagareSeleccionado];
    const todasCuotasSeleccionadas = cuotas.length > 0 && cuotasSeleccionadas.length === cuotas.length;

    return (
      <div className="mt-4 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-semibold mb-3 text-lg">
          Detalle de Cuotas - Pagaré: <span className="font-bold">{pagareSeleccionado}</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border">
                  <input
                    type="checkbox"
                    checked={todasCuotasSeleccionadas}
                    onChange={handleSelectAllCuotas}
                    className="h-4 w-4"
                  />
                </th>
                <th className="py-2 px-4 border">N° Cuota</th>
                <th className="py-2 px-4 border">Vencimiento</th>
                <th className="py-2 px-4 border">Capital</th>
                <th className="py-2 px-4 border">Interés</th>
                <th className="py-2 px-4 border">Mora</th>
                <th className="py-2 px-4 border">Total</th>
                <th className="py-2 px-4 border">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map(cuota => (
                <tr key={cuota.NumeroCuota} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border text-center">
                    <input
                      type="checkbox"
                      checked={cuotasSeleccionadas.includes(Number(cuota.NumeroCuota))}
                      onChange={() => handleCuotaSelect(Number(cuota.NumeroCuota))}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="py-2 px-4 border font-medium">{cuota.NumeroCuota}</td>
                  <td className="py-2 px-4 border">{cuota.FechaVencimiento}</td>
                  <td className="py-2 px-4 border">S/ {cuota.CapitalPendiente.toFixed(2)}</td>
                  <td className="py-2 px-4 border">S/ {cuota.InteresCuota.toFixed(2)}</td>
                  <td className="py-2 px-4 border">S/ {cuota.MoraGenerada.toFixed(2)}</td>
                  <td className="py-2 px-4 border font-semibold">S/ {cuota.TotalCuota.toFixed(2)}</td>
                  <td className="py-2 px-4 border">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        cuota.EstadoCuota === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : cuota.EstadoCuota === 'Vencida'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {cuota.EstadoCuota}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="font-bold">
              Cuotas seleccionadas: {cuotasSeleccionadas.length} de {cuotas.length}
            </span>
            <span className="font-bold text-lg text-blue-600">
              Monto Total: S/ {montoTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePagarCuotas}
            className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${
              cuotasSeleccionadas.length > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={cuotasSeleccionadas.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Pagar Cuota(s)'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Consulta y Pago de Cuotas">
      <div className="h-full w-full p-4 md:p-6 bg-gray-50">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Consulta y Pago de Cuotas
        </h1>

        {/* Integrar SearchBar */}
        <SearchBar
          searchQuery={searchQuery}
          tipoDocumento={tipoDocumento}
          onSearchChange={setSearchQuery}
          onTipoDocumentoChange={setTipoDocumento}
        />

        {/* Resultados o detalles */}
        {isLoading && !clientData ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">
              {tipoDocumento === TipoDocumento.DNI ? 'Consultando cuotas...' : 'Buscando socios...'}
            </span>
          </div>
        ) : resultadosBusqueda.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3 text-lg">Seleccione un Socio:</h3>
            <ul className="divide-y divide-gray-200">
              {resultadosBusqueda.map(cliente => (
                <li
                  key={cliente.NRO_DI}
                  onClick={() => handleClienteSelect(cliente)}
                  className="cursor-pointer p-4 hover:bg-blue-50 rounded-lg transition-colors border-l-4 border-transparent hover:border-blue-500"
                >
                  <p className="font-medium text-lg">{cliente.RAZON_SOCIAL}</p>
                  <p className="text-sm text-gray-500">DNI: {cliente.NRO_DI}</p>
                  <p className="text-xs text-blue-600 mt-1">👆 Clic para consultar cuotas</p>
                </li>
              ))}
            </ul>
          </div>
        ) : clientData ? (
          <div className="space-y-6">
            {/* Datos básicos del cliente */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold text-lg mb-2 text-green-700">✅ Socio Seleccionado</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p><strong>Nombre/Razón Social:</strong> {clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRE_COMPLETO}</p>
                  <p><strong>DNI:</strong> {clientData.INFO_SOCIO.DATOS_PERSONALES.DNI}</p>
                </div>
              </div>
            </div>

            {/* Comprobante de pago */}
            {comprobantePago && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">¡Pago realizado exitosamente!</h3>
                <p>Comprobante: {comprobantePago}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Se ha registrado el pago de {cuotasSeleccionadas.length} cuota(s) por S/ {montoTotal.toFixed(2)}
                </p>
              </div>
            )}

            {/* Listado de pagarés y tabla */}
            {Object.keys(pagarés).length > 0 ? (
              <>
                <PagareList />
                <CuotasTable />
              </>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-600">No se encontraron cuotas pendientes para este socio.</p>
              </div>
            )}
          </div>
        ) : searchQuery.length >= 3 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron resultados para: "<strong>{searchQuery}</strong>"</p>
            <p className="text-sm mt-2">Verifique el DNI o intente con otro nombre.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>👆 Ingrese un DNI o nombre para comenzar la búsqueda.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ConsultaCuotasSocios;
