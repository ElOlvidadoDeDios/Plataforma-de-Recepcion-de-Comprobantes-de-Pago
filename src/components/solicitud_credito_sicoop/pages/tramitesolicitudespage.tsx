import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import BuscadorSocioModal from '../components/buscadorsociomodal';
import { ActualizaDatosModal } from '../components/Actualizadatosmodal';
import BalanceSituacionForm from '../components/balancesituacionform';
import BalanceSituacionCompleto from '../components/balancesituacioncompleto';
import { BalanceSituacionSimplificado } from '../components/balancesituacionsimplificado';
import BalanceConsumoSinNegocio from '../components/balancesituacionconsumosinnegocio';
import MontoSolicitadoForm, { MontoResumenPayload } from '../components/Montosolicitadoform';
import ResumenSolicitudPage from './resumensolicitudpage';
import { ClienteBasico, GetFinalidad, getFinalidad } from '../services/buscarsocio.service';
import {
  fetchFechaPrimerPago,
  fetchFrecuenciaPago,
  fetchGetNomPrestamo,
  fetchTipodeproductoPrestamo,
  fetchTipoCondicionPago,
  fetchTipoCuota,
  FrecuenciaPago,
  GetNomPrestamo,
  Nombrecuota,
  Tipocondicionpago,
  TipoProductoPrestamo,
} from '../../../api/SimuladorApi';


type FormatoSolicitud = 'estandar' | 'simplificado' | 'completo' | 'consumo';
type TipoDiaPago = 'fijo' | 'variable' | 'fin_mes';

const TramiteSolicitudesPage: React.FC = () => {
  const navigate = useNavigate();

  const normalizeToArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object') {
      const wrapped = value as Record<string, unknown>;
      if (Array.isArray(wrapped.data)) return wrapped.data as T[];
      if (Array.isArray(wrapped.result)) return wrapped.result as T[];
      if (Array.isArray(wrapped.results)) return wrapped.results as T[];
      return [value as T];
    }
    return [];
  };

  // Búsqueda de socio
  const [codigoSocio, setCodigoSocio] = useState('');
  const [nombreSocio, setNombreSocio] = useState('');
  const [formato, setFormato] = useState<FormatoSolicitud | null>(null);
  const [mostrarBuscadorSocio, setMostrarBuscadorSocio] = useState(false);
  const [mostrarActualizaDatos, setMostrarActualizaDatos] = useState(false);
  const [datosActualizados, setDatosActualizados] = useState(false);
  const [tramiteIniciado, setTramiteIniciado] = useState(false);
  const [mostrarMontoSolicitado, setMostrarMontoSolicitado] = useState(false);
  const [mostrarResumenSolicitud, setMostrarResumenSolicitud] = useState(false);
  const [socioDataSeleccionado, setSocioDataSeleccionado] = useState<ClienteBasico | null>(null);
  const [montoResumen, setMontoResumen] = useState<MontoResumenPayload>({
    montoSolicitado: '0.00',
    nroCuotas: '0',
    valorCuota: '0',
    tea: '0.00',
    tem: '0',
    temMinimo: '0',
    temMaximo: '0',
    fechaPrimerPago: '',
  });

  // Datos del trámite
  const [prestamo, setPrestamo] = useState('');
  const [producto, setProducto] = useState('');
  const [finalidad, setFinalidad] = useState('');
  const [moneda, setMoneda] = useState('soles');
  const [cuota, setCuota] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [pago, setPago] = useState('');

  const [prestamoOptions, setPrestamoOptions] = useState<GetNomPrestamo[]>([]);
  const [productoOptions, setProductoOptions] = useState<TipoProductoPrestamo[]>([]);
  const [cuotaOptions, setCuotaOptions] = useState<Nombrecuota[]>([]);
  const [frecuenciaOptions, setFrecuenciaOptions] = useState<FrecuenciaPago[]>([]);
  const [pagoOptions, setPagoOptions] = useState<Tipocondicionpago[]>([]);
  const [finalidadOptions, setFinalidadOptions] = useState<GetFinalidad[]>([]);

  // Días definidos
  const [tipoDia, setTipoDia] = useState<TipoDiaPago>('fijo');
  const [fechaPrimerPago, setFechaPrimerPago] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const inputClass =
    'w-full px-1.5 py-0.5 text-[11px] rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'text-[11px] font-semibold text-blue-900';

  const abrirBuscadorSocio = () => setMostrarBuscadorSocio(true);

  const socioSeleccionado = Boolean(codigoSocio && nombreSocio);
  const puedeTramitar = socioSeleccionado;
  const puedeEditarCampos = tramiteIniciado;
  const mostrarFormularioSeleccionado = formato !== null;
  const mostrarEvaluacionEconomica = !prestamo || prestamo === '47' || prestamo === '38';

  const handleSeleccionarSocio = (resultado: {
    cuenta: string;
    razonSocial: string;
    socioData?: ClienteBasico;
  }) => {
    setCodigoSocio(resultado.cuenta || '');
    setNombreSocio(resultado.razonSocial || '');
    setSocioDataSeleccionado(resultado.socioData || null);
    setDatosActualizados(false);
    setTramiteIniciado(false);
    setMostrarMontoSolicitado(false);
    setMostrarResumenSolicitud(false);
    setMostrarBuscadorSocio(false);
    setMostrarActualizaDatos(true);
  };

  const handleTramitar = () => {
    if (!puedeTramitar) return;
    setTramiteIniciado(true);
  };

  const handleIrMontoSolicitado = () => {
    if (!tramiteIniciado) return;
    setMostrarResumenSolicitud(false);
    setMostrarMontoSolicitado(true);
  };

  const handleContinuarSolicitudDesdeSimplificado = () => {
    // Sin validaciones por ahora: volver al bloque principal de datos del trámite
    setMostrarMontoSolicitado(false);
    setMostrarResumenSolicitud(false);
    setFormato(null);
  };

  const handleContinuarSolicitudDesdeCompleto = () => {
    // Sin validaciones por ahora: volver al bloque principal de datos del trámite
    setMostrarMontoSolicitado(false);
    setMostrarResumenSolicitud(false);
    setFormato(null);
  };

  const handleContinuarSolicitudDesdeConsumo = () => {
    // Sin validaciones por ahora: volver al bloque principal de datos del trámite
    setMostrarMontoSolicitado(false);
    setMostrarResumenSolicitud(false);
    setFormato(null);
  };

  const handleVolverPrincipal = () => {
    setMostrarResumenSolicitud(false);
    setMostrarMontoSolicitado(false);
  };

  const handleIrResumenSolicitud = () => {
    setMostrarMontoSolicitado(false);
    setMostrarResumenSolicitud(true);
  };

  const handleIrResumenSolicitudConDatos = (payload: MontoResumenPayload) => {
    setMontoResumen(payload);
    handleIrResumenSolicitud();
  };

  const handleVolverMontoDesdeResumen = () => {
    setMostrarResumenSolicitud(false);
    setMostrarMontoSolicitado(true);
  };

  const tipoDiaApi = tipoDia === 'fijo' ? 'F' : tipoDia === 'variable' ? 'V' : 'M';
  const prestamoNombre = prestamoOptions.find((p) => (p.ID_VALOR || p.TIPO_PRES) === prestamo)?.NOM_SUBTIPO_PRES || '';
  const productoNombre = productoOptions.find((p) => p.TIPO_PROD === producto)?.NOMBRE || '';
  const monedaNombre = moneda === 'dolares' ? 'Dólares Americanos' : 'Nuevos Soles';

  useEffect(() => {
    const loadCombosIniciales = async () => {
      try {
        const [prestamosData, cuotasData, pagosData] = await Promise.all([
          fetchGetNomPrestamo(),
          fetchTipoCuota(),
          fetchTipoCondicionPago(),
        ]);

        const prestamos = normalizeToArray<GetNomPrestamo>(prestamosData);
        const cuotas = normalizeToArray<Nombrecuota>(cuotasData);
        const pagos = normalizeToArray<Tipocondicionpago>(pagosData);

        setPrestamoOptions(prestamos);
        setCuotaOptions(cuotas);
        setPagoOptions(pagos);

        // Valores por defecto para habilitar cálculos del simulador
        if (cuotas.length > 0) {
          setCuota((prev) => prev || cuotas[0].TIPO_CUOTA);
        }
        if (pagos.length > 0) {
          setPago((prev) => prev || pagos[0].TIPO_CONDIPAGO);
        }
      } catch {
        setPrestamoOptions([]);
        setCuotaOptions([]);
        setPagoOptions([]);
      }
    };

    loadCombosIniciales();
  }, []);

  useEffect(() => {
    const loadProductos = async () => {
      if (!prestamo) {
        setProductoOptions([]);
        setFinalidadOptions([]);
        setProducto('');
        setFinalidad('');
        setFrecuencia('');
        setFrecuenciaOptions([]);
        return;
      }

      try {
        const data = await fetchTipodeproductoPrestamo(prestamo);
        setProductoOptions(normalizeToArray<TipoProductoPrestamo>(data));
      } catch {
        setProductoOptions([]);
      }
    };

    loadProductos();
  }, [prestamo]);

  useEffect(() => {
    const loadFinalidad = async () => {
      if (!prestamo) {
        setFinalidadOptions([]);
        setFinalidad('');
        return;
      }

      try {
        // PRES debe ser el ID_VALOR del préstamo seleccionado
        const response = await getFinalidad(prestamo);
        const data = response?.data || [];
        setFinalidadOptions(data);
      } catch {
        setFinalidadOptions([]);
      }
    };

    loadFinalidad();
  }, [prestamo]);

  useEffect(() => {
    const loadFrecuencias = async () => {
      if (!prestamo || !producto) {
        setFrecuenciaOptions([]);
        setFrecuencia('');
        return;
      }

      try {
        const data = await fetchFrecuenciaPago(prestamo, producto);
        setFrecuenciaOptions(normalizeToArray<FrecuenciaPago>(data));
      } catch {
        setFrecuenciaOptions([]);
      }
    };

    loadFrecuencias();
  }, [prestamo, producto]);

  useEffect(() => {
    const calcularFecha = async () => {
      if (!frecuencia || !fechaPrimerPago) return;
      try {
        const result = await fetchFechaPrimerPago({
          FECHA_PRI: fechaPrimerPago,
          CUOTA_FIJA: tipoDia === 'fijo' ? 'S' : 'N',
          FRECU: frecuencia,
        });

        if (result?.status && result.fecha_pri && result.fecha_pri !== fechaPrimerPago) {
          setFechaPrimerPago(result.fecha_pri);
        }
      } catch {
        // Silencioso para no interrumpir la edición manual de fecha
      }
    };

    calcularFecha();
  }, [frecuencia, tipoDia]);

  return (
    <Layout title="Solicitud de Crédito" showBackButton={true}>
      <div className="w-full h-full flex flex-col bg-slate-200 px-2 py-2">
        <div className="w-full flex-1 bg-[#dbe9f7] border border-slate-400 shadow-sm text-[12px] flex flex-col">
          <div className="px-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-400 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Regresar
            </button>
          </div>

          {/* Barra de título */}
          <div className="relative bg-white border-b border-slate-300 py-1.5 flex items-center justify-center shrink-0">
            <h1 className="font-bold text-slate-800 text-sm">Trámite de Solicitudes</h1>
          </div>

            <div className="flex-1 overflow-auto">
            {/* Búsqueda de Socio */}
            <div className="border-b border-slate-400 p-2">
              <div className="border border-slate-400 bg-[#eaf2fb] p-3">
                <p className={`${labelClass} mb-1.5`}>Búsqueda de Socio</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Mitad izquierda: código y nombre */}
                <div className="flex flex-col md:flex-row gap-2">
                    <input
                  type="text"
                  value={codigoSocio}
                  onClick={abrirBuscadorSocio}
                  onFocus={abrirBuscadorSocio}
                  readOnly
                  className={`${inputClass} w-full md:w-24 shrink-0`}
                  placeholder="Cuenta"
                  title="Haz clic para buscar socio"
                    />

                    <input
                  type="text"
                  value={nombreSocio}
                  readOnly
                  className={`${inputClass} w-full md:flex-1 md:min-w-[180px]`}
                  placeholder="Razón social"
                    />
                </div>

                {/* Mitad derecha: formatos y tramitar */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 shrink-0">
                  {[
                  { value: 'estandar', label: 'Formato Estándar' },
                  { value: 'completo', label: 'Formato Completo' },
                  { value: 'simplificado', label: 'Formato Simplificado' },
                  { value: 'consumo', label: 'Formato Consumo' },
                  ].map((item) => (
                        <label
                    key={item.value}
                    className="flex items-center gap-1.5"
                        >
                    <input
                            type="radio"
                                name="formato"
                              checked={formato === item.value}
                              onChange={() => setFormato(item.value as FormatoSolicitud)}
                            />
                    <span>{item.label}</span>
                        </label>
                  ))}
                    </div>

                    <button
                  type="button"
                  onClick={handleTramitar}
                  disabled={!puedeTramitar}
                  className="shrink-0 px-4 py-1.5 rounded bg-white border border-slate-400 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-sm w-full md:w-auto"
                    >
                  Tramitar
                    </button>
                </div>

                {!mostrarFormularioSeleccionado && (
                  <p className="mt-2 text-[11px] text-slate-600">
                    Selecciona un formato para mostrar su formulario.
                  </p>
                )}
              </div>
              </div>
            </div>

            {!mostrarMontoSolicitado && !mostrarResumenSolicitud && formato === 'estandar' && (
              <div className="px-2 pb-2">
                <div className="border border-slate-300 bg-[#eaf2fb] p-2">
                  {!puedeEditarCampos && (
                    <div className="mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                      Para habilitar edicion: 1) selecciona socio, 2) actualiza datos, 3) presiona Tramitar.
                    </div>
                  )}
                  <BalanceSituacionForm enabled={puedeEditarCampos} compact />
                </div>
              </div>
            )}

            {!mostrarMontoSolicitado && !mostrarResumenSolicitud && formato === 'simplificado' && (
              <div className="px-2 pb-2">
                <div className="border border-slate-300 bg-[#eaf2fb] p-2">
                  {!puedeEditarCampos && (
                    <div className="mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                      Para habilitar edicion: 1) selecciona socio, 2) actualiza datos, 3) presiona Tramitar.
                    </div>
                  )}
                  <BalanceSituacionSimplificado
                    compact
                    enabled={puedeEditarCampos}
                    onContinueSolicitud={handleContinuarSolicitudDesdeSimplificado}
                  />
                </div>
              </div>
            )}

            {!mostrarMontoSolicitado && !mostrarResumenSolicitud && formato === 'completo' && (
              <div className="px-2 pb-2">
                <div className="border border-slate-300 bg-[#eaf2fb] p-2">
                  {!puedeEditarCampos && (
                    <div className="mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                      Para habilitar edicion: 1) selecciona socio, 2) actualiza datos, 3) presiona Tramitar.
                    </div>
                  )}
                  <BalanceSituacionCompleto
                    compact
                    enabled={puedeEditarCampos}
                    onContinueSolicitud={handleContinuarSolicitudDesdeCompleto}
                  />
                </div>
              </div>
            )}

            {!mostrarMontoSolicitado && !mostrarResumenSolicitud && formato === 'consumo' && (
              <div className="px-2 pb-2">
                <div className="border border-slate-300 bg-[#eaf2fb] p-2">
                  {!puedeEditarCampos && (
                    <div className="mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                      Para habilitar edicion: 1) selecciona socio, 2) actualiza datos, 3) presiona Tramitar.
                    </div>
                  )}
                  <BalanceConsumoSinNegocio
                    compact
                    enabled={puedeEditarCampos}
                    onContinueSolicitud={handleContinuarSolicitudDesdeConsumo}
                  />
                </div>
              </div>
            )}

            {/* Cuerpo principal */}
            {!mostrarMontoSolicitado && !mostrarResumenSolicitud && !mostrarFormularioSeleccionado && (
            <div className="p-2 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3 flex-1">
              {/* Columna izquierda: Datos del trámite */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Préstamo</label>
                  <select
                    value={prestamo}
                    onChange={(e) => {
                      setPrestamo(e.target.value);
                      setProducto('');
                      setFrecuencia('');
                    }}
                    disabled={!puedeEditarCampos}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="">Seleccione...</option>
                    {prestamoOptions.map((opt, i) => (
                      <option key={`${opt.ID_VALOR || opt.TIPO_PRES}-${i}`} value={opt.ID_VALOR || opt.TIPO_PRES}>
                        {opt.NOM_SUBTIPO_PRES}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Producto</label>
                  <select
                    value={producto}
                    onChange={(e) => {
                      setProducto(e.target.value);
                      setFrecuencia('');
                    }}
                    disabled={!puedeEditarCampos || !prestamo}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="">Seleccione...</option>
                    {productoOptions.map((opt) => (
                      <option key={opt.TIPO_PROD} value={opt.TIPO_PROD}>
                        {opt.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Finalidad</label>
                  <select
                    value={finalidad}
                    onChange={(e) => setFinalidad(e.target.value)}
                    disabled={!puedeEditarCampos || !prestamo}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="">Seleccione...</option>
                    {finalidadOptions.map((opt) => (
                      <option key={opt.TIPO_FINALIDAD} value={opt.TIPO_FINALIDAD}>
                        {opt.NOM_FINALIDAD}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Moneda</label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    disabled={!puedeEditarCampos}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="soles">Nuevos Soles</option>
                    <option value="dolares">Dólares Americanos</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Cuota</label>
                  <select
                    value={cuota}
                    onChange={(e) => setCuota(e.target.value)}
                    disabled={!puedeEditarCampos}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="">Seleccione...</option>
                    {cuotaOptions.map((opt) => (
                      <option key={opt.TIPO_CUOTA} value={opt.TIPO_CUOTA}>
                        {opt.NOM_CUOTA}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Frecuencia</label>
                  <select
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value)}
                    disabled={!puedeEditarCampos || !prestamo || !producto}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="">Seleccione...</option>
                    {frecuenciaOptions.map((opt, i) => (
                      <option key={`${opt.COD_FREC}-${i}`} value={opt.COD_FREC}>
                        {opt.DES_FREC}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className={`${labelClass} sm:w-24 shrink-0`}>Pago</label>
                  <select
                    value={pago}
                    onChange={(e) => setPago(e.target.value)}
                    disabled={!puedeEditarCampos}
                    className={`${inputClass} sm:max-w-[220px]`}
                  >
                    <option value="">Seleccione...</option>
                    {pagoOptions.map((opt) => (
                      <option key={opt.TIPO_CONDIPAGO} value={opt.TIPO_CONDIPAGO}>
                        {opt.NOM_CONDIPAGO}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-3">
                {/* Evaluación Económica */}
                <div
                  className={`border border-slate-400 ${
                    mostrarEvaluacionEconomica ? '' : 'invisible pointer-events-none'
                  }`}
                  aria-hidden={!mostrarEvaluacionEconomica}
                >
                  <div className="bg-slate-600 text-white text-[11px] font-semibold px-2 py-1">
                    Evaluación Económica
                  </div>
                  <div className="p-2 space-y-1.5">
                    {[
                      { label: 'Total Ingresos' },
                      { label: 'Total Egresos' },
                      { label: 'Neto Percibido' },
                      { label: 'Capacidad de Pago' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-2">
                        <span className={labelClass}>{row.label}</span>
                        <input
                          type="text"
                          defaultValue="0.00"
                          disabled={!puedeEditarCampos}
                          className={`w-24 sm:w-28 px-1.5 py-0.5 text-[11px] text-right rounded border border-slate-400 ${puedeEditarCampos ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Días Definidos */}
                <div className="border border-slate-400">
                  <div className="bg-slate-600 text-white text-[11px] font-semibold px-2 py-1">
                    Dias Definidos
                  </div>
                  <div className="p-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {(
                        [
                          { value: 'fijo', label: 'Dia Fijo' },
                          { value: 'variable', label: 'Dia Variable' },
                          { value: 'fin_mes', label: 'Fin de Mes' },
                        ] as { value: TipoDiaPago; label: string }[]
                      ).map((d) => (
                        <label
                          key={d.value}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="tipoDia"
                            checked={tipoDia === d.value}
                            onChange={() => setTipoDia(d.value)}
                            disabled={!puedeEditarCampos}
                            className="w-3 h-3 accent-blue-700"
                          />
                          {d.label}
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <label className={`${labelClass} sm:w-28 shrink-0`}>Fecha de 1er Pago</label>
                      <input
                        type="date"
                        value={fechaPrimerPago}
                        onChange={(e) => setFechaPrimerPago(e.target.value)}
                        disabled={!puedeEditarCampos}
                        className={`${inputClass} sm:w-32`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {mostrarMontoSolicitado && (
              <div className="px-2 pb-2">
                <div className="border border-slate-300 bg-[#eaf2fb] p-2">
                  <MontoSolicitadoForm
                    compact
                    prestamoId={prestamo}
                    productoId={producto}
                    frecuenciaId={frecuencia}
                    monedaId={moneda}
                    cuotaTipo={cuota}
                    pagoTipo={pago}
                    tipoDiaPago={tipoDiaApi}
                    fechaPrimerPago={fechaPrimerPago}
                    onBack={handleVolverPrincipal}
                    onNext={handleIrResumenSolicitudConDatos}
                  />
                </div>
              </div>
            )}

            {mostrarResumenSolicitud && (
              <div className="px-2 pb-2">
                <div className="border border-slate-300 bg-[#eaf2fb] p-2">
                  <ResumenSolicitudPage
                    compact
                    onBack={handleVolverMontoDesdeResumen}
                    prestamo={prestamoNombre}
                    producto={productoNombre}
                    moneda={monedaNombre}
                    montoSolicitud={montoResumen.montoSolicitado}
                    plazo={montoResumen.nroCuotas}
                    cuota={montoResumen.valorCuota}
                    tea={montoResumen.tea}
                    fechaPrimerPago={montoResumen.fechaPrimerPago || fechaPrimerPago}
                    montoNeto={montoResumen.montoSolicitado}
                  />
                </div>
              </div>
            )}

            {/* Botón continuar */}
            {!mostrarMontoSolicitado && !mostrarResumenSolicitud && (
            <div className="px-2 pb-3 flex justify-end shrink-0">
              <button
                type="button"
                title="Continuar"
                onClick={handleIrMontoSolicitado}
                disabled={!tramiteIniciado}
                className={`w-9 h-8 rounded flex items-center justify-center shadow-sm transition ${tramiteIniciado ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {mostrarBuscadorSocio && (
        <BuscadorSocioModal
          onClose={() => setMostrarBuscadorSocio(false)}
          onSeleccionar={handleSeleccionarSocio}
        />
      )}

      {mostrarActualizaDatos && (
        <ActualizaDatosModal
          codigoSocio={codigoSocio}
          nombreSocio={nombreSocio}
          socioData={socioDataSeleccionado}
          onDatosActualizados={() => setDatosActualizados(true)}
          onClose={() => setMostrarActualizaDatos(false)}
        />
      )}
    </Layout>
  );
};

export default TramiteSolicitudesPage;


/* 

*/