import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Layout from '../Layout';
import { useNotifications } from '../../hooks/useNotifications';
import { ClienteBasico, ClienteResponse, TipoDocumento, searchClientes, searchClientesByDNI } from '../../api/customerConsultationAPI';
import { SessionManager } from '../../utils/sessionManager';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import SearchBar from '../customerConsultation/components/SearchBar';
import { CuotaDto, fetchCuotasPorDNI, PagoRequestDto, procesarPago } from '../../api/pagos_recaudadoresApi';
import { generateVoucherPDF } from './vaucher_pdf';
import ReportePagosModal from '../reportes/ReportePagosModal';

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
  const [montoTotal, setMontoTotal] = useState(0);
  const [montoPago, setMontoPago] = useState('0.00');
  const [isMontoPagoEdited, setIsMontoPagoEdited] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [, setLocationError] = useState<string | null>(null);
  const [, setIsGettingLocation] = useState(false);
  const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);
  // Refs
  const montoInputRef = useRef<HTMLInputElement>(null);
  const paymentInProgress = useRef(false);
  const renderCountRef = useRef(0);
  const Notification = useNotifications();

  // Limpiar pagarés
  const cleanPagarés = useCallback((rawPagarés: { [key: string]: CuotaDto[] }) => {
    const cleaned: { [key: string]: CuotaDto[] } = {};
    const seenKeys = new Set<string>();
    Object.entries(rawPagarés).forEach(([pagareKey, cuotas]) => {
      const cleanedKey = pagareKey.trim();
      // Filtrar cuotas con datos válidos
      const validCuotas = cuotas.filter(cuota => 
        cuota.Pagare != null && 
        cuota.NumeroCuota != null && 
        cuota.TotalCuota != null &&
        cuota.EstadoCuota != null
      );
      if (validCuotas.length === 0) return; // No agregar pagarés sin cuotas válidas
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
  }, []);

  // Debugging duplicados
  useEffect(() => {
    renderCountRef.current += 1;
    let hasDuplicates = false;
    Object.entries(pagarés).forEach(([, cuotas]) => {
      const seen = new Set<string>();
      const duplicates: any[] = [];
      cuotas.forEach(cuota => {
        const key = `${cuota.Pagare?.trim()}-${cuota.NumeroCuota}`;
        if (seen.has(key)) {
          duplicates.push({ Pagare: cuota.Pagare, NumeroCuota: cuota.NumeroCuota, FullData: cuota });
        } else {
          seen.add(key);
        }
      });
      if (duplicates.length > 0) hasDuplicates = true;
    });
    if (hasDuplicates) console.warn('⚠️ Duplicados detectados en pagarés');
  }, [pagarés]);

  // Geolocalización
  const getCurrentLocation = () => {
    return new Promise<void>((resolve, reject) => {
      setIsGettingLocation(true);
      setLocationError(null);
      if (!navigator.geolocation) {
        setLocationError('Geolocalización no disponible');
        setIsGettingLocation(false);
        reject('Geolocalización no disponible');
        return;
      }
      const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationError(null);
          setIsGettingLocation(false);
          resolve();
        },
        (error) => {
          let errorMessage = 'Error al obtener ubicación';
          switch (error.code) {
            case error.PERMISSION_DENIED: errorMessage = 'Permiso denegado'; break;
            case error.POSITION_UNAVAILABLE: errorMessage = 'Ubicación no disponible'; break;
            case error.TIMEOUT: errorMessage = 'Tiempo agotado'; break;
          }
          setLocationError(errorMessage);
          setIsGettingLocation(false);
          reject(errorMessage);
        },
        options
      );
    });
  };

  // Datos de sesión
  const { user } = useContext(AuthContext);
  const getUserSessionData = () => {
    return {
      COD_AGE: user?.agencias?.[0]?.agencia || '',
      COD_CAJA: user?.agencias?.[0]?.cod_caja || '',
      USER_CAJA: user?.agencias?.[0]?.user_caja || '',
    };
  };

  // Cargar datos guardados
  useEffect(() => {
    const loadSavedData = async () => {
      const savedCliente = SessionManager.getItem('clienteSeleccionado');
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
  }, [cleanPagarés]);

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
            SessionManager.setItem('clienteSeleccionado', JSON.stringify(clienteBasico));
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
  }, [searchQuery, tipoDocumento, cleanPagarés]);

  // Cálculo de montoTotal y sincronización con montoPago
  useEffect(() => {
    if (!pagareSeleccionado) {
      setMontoTotal(0);
      setMontoPago('0.00');
      setIsMontoPagoEdited(false);
      return;
    }

    const cuotas = pagarés[pagareSeleccionado] || [];
    const total = cuotas
      .filter(cuota => cuotasSeleccionadas.includes(Number(cuota.NumeroCuota)))
      .reduce((sum, cuota) => sum + (cuota.TotalCuota || 0), 0);

    setMontoTotal(total);

    if (!isMontoPagoEdited) {
      setMontoPago(total.toFixed(2));
    }
  }, [cuotasSeleccionadas, pagareSeleccionado, isMontoPagoEdited, pagarés]);

  // Handlers
  const handleClienteSelect = async (cliente: ClienteBasico) => {
    setIsLoading(true);
    try {
      setClienteSeleccionado(cliente);
      setResultadosBusqueda([]);
      SessionManager.setItem('clienteSeleccionado', JSON.stringify(cliente));
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

  const handleCuotaSelect = (numeroCuota: number) => {
    setCuotasSeleccionadas(prev =>
      prev.includes(numeroCuota)
        ? prev.filter(c => c !== numeroCuota)
        : [...prev, numeroCuota]
    );
  };

  const handleSelectAllCuotas = () => {
    if (!pagareSeleccionado) return;
    const cuotas = pagarés[pagareSeleccionado]?.map(c => Number(c.NumeroCuota)) || [];
    const nuevasCuotas = cuotasSeleccionadas.length === cuotas.length ? [] : cuotas;
    setCuotasSeleccionadas(nuevasCuotas);

    if (nuevasCuotas.length === 0) {
      setIsMontoPagoEdited(false);
      setMontoPago('0.00');
    } else if (!isMontoPagoEdited) {
      const total = pagarés[pagareSeleccionado]
        ?.filter(cuota => nuevasCuotas.includes(Number(cuota.NumeroCuota)))
        .reduce((sum, cuota) => sum + (cuota.TotalCuota || 0), 0) || 0;
      setMontoPago(total.toFixed(2));
    }
  };

  const handleMontoPagoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMontoPago(value);
      if (value && value !== '0.00') {
        setIsMontoPagoEdited(true);
      }
    }
  }, []);

  // Procesar pago
  const handlePagarCuotas = async () => {
    if (paymentInProgress.current) return;
    if (!pagareSeleccionado || !clienteSeleccionado || cuotasSeleccionadas.length === 0) return;

    const montoNum = parseFloat(montoPago) || 0;
    if (!/^\d+(\.\d{1,2})?$/.test(montoPago) || montoNum <= 0) {
      Notification.error('Monto inválido');
      return;
    }

    paymentInProgress.current = true;
    setIsProcessingPayment(true);

    try {
      await getCurrentLocation();

      if (!position) {
        setIsProcessingPayment(false);
        paymentInProgress.current = false;
        return;
      }

      const sessionData = getUserSessionData();
      const codAgeFinal = (sessionData.COD_AGE === '06' || sessionData.COD_AGE === '07' || sessionData.COD_AGE === "10"|| sessionData.COD_AGE === "11" || sessionData.COD_AGE === "12"|| sessionData.COD_AGE === "13") ? '98' : sessionData.COD_AGE;

      const pagoData: PagoRequestDto = {
        PAGARE: pagareSeleccionado,
        COD_AGE: codAgeFinal,
        COD_CAJA: sessionData.COD_CAJA,
        USER_CAJA: sessionData.USER_CAJA,
        DNI_SOCIO: clienteSeleccionado.NRO_DI,
        MONTO_SUG: montoTotal.toFixed(2),
        MONTO_PAG: montoNum.toFixed(2),
        LAT: position.lat.toString(),
        LNG: position.lng.toString(),
      };

      const result = await procesarPago(pagoData);

      if (result.status) {
        Notification.success(`Pago exitoso: S/ ${montoNum.toFixed(2)}`);

        if (result.detail) {
          generateVoucherPDF({
            ...result.detail,
            HORA_MOV: new Date().toLocaleTimeString("es-PE"),
          });
        }

        // Resetear todos los estados para una nueva búsqueda
        setSearchQuery('');
        setResultadosBusqueda([]);
        setClienteSeleccionado(null);
        setClientData(null);
        setPagarés({});
        setPagareSeleccionado(null);
        setCuotasSeleccionadas([]);
        setMontoTotal(0);
        setMontoPago('0.00');
        setIsMontoPagoEdited(false);
        SessionManager.removeItem('clienteSeleccionado');
      } else {
        Notification.error(result.message || 'Error en pago');
      }
    } catch (error) {
      Notification.error('Error de conexión');
    } finally {
      setIsProcessingPayment(false);
      paymentInProgress.current = false;
    }
  };

  // Componentes memoizados
  const PagareList = memo(() => (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-base md:text-lg">Pagarés Pendientes:</h3>
      <div className="flex flex-wrap gap-2">
        {Object.keys(pagarés).map((pagare, index) => {
          // Obtener el nombre del producto de la primera cuota del pagaré
          const nombreProducto = pagarés[pagare]?.[0]?.NombreProducto || 'N/A';
          
          return (
            <button
              key={`${pagare.trim()}-${index}`}
              onClick={() => {
                setPagareSeleccionado(pagare);
                setCuotasSeleccionadas([]);
                setIsMontoPagoEdited(false);
                setMontoPago('0.00');
              }}
              className={`px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-medium ${
                pagareSeleccionado === pagare ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
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

  const CuotasTable = memo(() => {
    if (!pagareSeleccionado) return null;
    const cuotas = pagarés[pagareSeleccionado] || [];

    // Filtrar cuotas válidas
    const uniqueCuotas = useMemo(() => {
      const seen = new Set<string>();
      return cuotas.filter(cuota => {
        const key = `${cuota.Pagare?.trim()}-${cuota.NumeroCuota}`;
        if (seen.has(key) || cuota.TotalCuota == null || cuota.NumeroCuota == null) return false;
        seen.add(key);
        return true;
      });
    }, [cuotas]);

    // Si no hay cuotas válidas, mostrar mensaje
    if (uniqueCuotas.length === 0) {
      return (
        <div className="text-center py-6 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-sm md:text-base">No hay cuotas válidas para este pagaré</p>
        </div>
      );
    }

    const todasCuotasSeleccionadas = uniqueCuotas.length > 0 && cuotasSeleccionadas.length === uniqueCuotas.length;

    return (
      <div className="mt-4 bg-white p-3 md:p-4 rounded-lg shadow-lg">
        <h3 className="font-semibold mb-3 text-base md:text-lg">
          Detalle de Cuotas - Pagaré: <span className="font-bold">{pagareSeleccionado }</span>
        </h3>

        <div className="md:hidden space-y-3">
          {uniqueCuotas.map((cuota, index) => (
            <div key={`${cuota.Pagare?.trim()}-${cuota.NumeroCuota}-${index}`} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={cuotasSeleccionadas.includes(Number(cuota.NumeroCuota))}
                    onChange={() => handleCuotaSelect(Number(cuota.NumeroCuota))}
                    className="h-4 w-4 mr-2"
                  />
                  <span className="font-medium">Cuota {cuota.NumeroCuota}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  cuota.EstadoCuota === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  cuota.EstadoCuota === 'Vencida' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {cuota.EstadoCuota || 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-gray-500">Vencimiento:</p><p>{cuota.FechaVencimiento || 'N/A'}</p></div>
                <div><p className="text-gray-500">total:</p><p>S/ {cuota.TotalCuota.toFixed(2)}</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 border">
                  <input
                    type="checkbox"
                    checked={todasCuotasSeleccionadas}
                    onChange={handleSelectAllCuotas}
                    className="h-4 w-4"
                  />
                </th>
                <th className="py-2 px-3 border">N° Cuota</th>
                <th className="py-2 px-3 border">Vencimiento</th>
                <th className="py-2 px-3 border">Capital</th>
                <th className="py-2 px-3 border">Interés</th>
                <th className="py-2 px-3 border">Mora</th>
                <th className="py-2 px-3 border">Total</th>
                <th className="py-2 px-3 border">Estado</th>
              </tr>
            </thead>
            <tbody>
              {uniqueCuotas.map((cuota, index) => (
                <tr key={`${cuota.Pagare?.trim()}-${cuota.NumeroCuota}-${index}`} className="hover:bg-gray-50">
                  <td className="py-2 px-3 border text-center">
                    <input
                      type="checkbox"
                      checked={cuotasSeleccionadas.includes(Number(cuota.NumeroCuota))}
                      onChange={() => handleCuotaSelect(Number(cuota.NumeroCuota))}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="py-2 px-3 border font-medium">{cuota.NumeroCuota}</td>
                  <td className="py-2 px-3 border">{cuota.FechaVencimiento || 'N/A'}</td>
                  <td className="py-2 px-3 border">S/ {cuota.CapitalPendiente != null ? cuota.CapitalPendiente.toFixed(2) : 'N/A'}</td>
                  <td className="py-2 px-3 border">S/ {cuota.InteresCuota != null ? cuota.InteresCuota.toFixed(2) : 'N/A'}</td>
                  <td className="py-2 px-3 border">S/ {cuota.MoraGenerada != null ? cuota.MoraGenerada.toFixed(2) : 'N/A'}</td>
                  <td className="py-2 px-3 border font-semibold">S/ {cuota.TotalCuota.toFixed(2)}</td>
                  <td className="py-2 px-3 border">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      cuota.EstadoCuota === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      cuota.EstadoCuota === 'Vencida' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {cuota.EstadoCuota || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className="font-bold text-sm md:text-base">
              Cuotas seleccionadas: {cuotasSeleccionadas.length} de {uniqueCuotas.length} 
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-600">
                Monto Sugerido (MONTO_SUG): S/ {montoTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Render principal
  return (
    <Layout title="Consulta y Pago de Cuotas">
      <div className="h-full w-full p-3 md:p-6 bg-gray-50">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">Consulta y Pago de Cuotas</h1>
        <div className="bg-white p-3 rounded-lg shadow mb-4">
          <SearchBar
            searchQuery={searchQuery}
            tipoDocumento={tipoDocumento}
            onSearchChange={setSearchQuery}
            onTipoDocumentoChange={setTipoDocumento}
          />
          <button
          onClick={() => setIsReporteModalOpen(true)}
          className=" 
              flex items-center justify-center gap-2
              bg-white text-blue-600
              border border-blue-600
              hover:bg-blue-50
              rounded-md
              px-4 py-2
              transition-all
              w-full sm:w-auto
              whitespace-nowrap
            "
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            <span>Reporte de Pagos</span>
          </button>
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
                  <p className="text-xs text-blue-600 mt-1">👆 Clic para consultar cuotas</p>
                </li>
              ))}
            </ul>
          </div>
        ) : clientData ? (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white p-3 md:p-4 rounded-lg shadow">
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

            {clientData && Object.keys(pagarés).length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <span className="font-bold text-sm text-gray-600">
                    Monto Sugerido: S/ {montoTotal.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-base md:text-lg text-blue-600">Monto a Pagar:</span>
                    <input
                      type="text"
                      step="0.01"
                      value={montoPago}
                      onChange={handleMontoPagoChange}
                      ref={montoInputRef}
                      placeholder="0.00"
                      className="w-24 px-2 py-1 border rounded text-base font-semibold text-blue-600"
                      disabled={isProcessingPayment}
                    />
                  </div>
                </div>
                <button
                  onClick={handlePagarCuotas}
                  disabled={cuotasSeleccionadas.length === 0 || isLoading || isProcessingPayment || parseFloat(montoPago) <= 0}
                  className={`px-4 py-2 md:px-6 md:py-3 rounded-lg text-white font-medium transition-all text-sm md:text-base ${
                    cuotasSeleccionadas.length > 0 && !isProcessingPayment && parseFloat(montoPago) > 0
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isProcessingPayment ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : 'Pagar Cuota(s)'}
                </button>
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
            <p className="text-sm md:text-base">👆 Ingrese DNI o nombre para buscar</p>
          </div>
        )}
      </div>
      {/* Modal de Reporte de Pagos */}
      <ReportePagosModal
        isOpen={isReporteModalOpen}
        onClose={() => setIsReporteModalOpen(false)}
      />
    </Layout>
  );
};

export default ConsultaCuotasSocios;