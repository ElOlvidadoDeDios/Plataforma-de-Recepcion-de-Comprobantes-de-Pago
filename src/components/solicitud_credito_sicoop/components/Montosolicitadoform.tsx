import React, { useContext, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../../contexts/AuthContext';
import { fetchActualizarCuota, fetchMontoMinimoMaximo, fetchPlazoMinimoMaximo, fetchValorCuota } from '../../../api/SimuladorApi';

/* ---------- Subcomponentes de UI ---------- */

interface CampoConLabelIzqProps {
  label: string;
  labelWidth?: string;
  defaultValue?: string;
  bold?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const CampoConLabelIzq: React.FC<CampoConLabelIzqProps> = ({
  label,
  labelWidth = 'w-28',
  defaultValue = '0.00',
  bold = false,
  value,
  onChange,
  readOnly = false,
}) => (
  <div className="flex items-center gap-2">
    <label className={`text-[12px] ${bold ? 'font-bold' : ''} text-slate-800 ${labelWidth} shrink-0`}>{label}</label>
    {value !== undefined ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`w-24 sm:w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 ${readOnly ? 'bg-slate-100 text-slate-600' : 'bg-white'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
      />
    ) : (
      <input
        type="text"
        defaultValue={defaultValue}
        className="w-24 sm:w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    )}
  </div>
);

interface CampoStackedProps {
  label: string;
  defaultValue?: string;
  labelColor?: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const CampoStacked: React.FC<CampoStackedProps> = ({
  label,
  defaultValue = '0.00',
  labelColor = 'text-slate-800',
  value,
  onChange,
  readOnly = false,
}) => (
  <div>
    <label className={`text-[11px] font-semibold ${labelColor} block mb-0.5 whitespace-nowrap`}>{label}</label>
    {value !== undefined ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`w-20 sm:w-24 px-2 py-1 text-[12px] text-right rounded border border-slate-400 ${readOnly ? 'bg-slate-100 text-slate-600' : 'bg-white'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
      />
    ) : (
      <input
        type="text"
        defaultValue={defaultValue}
        className="w-20 sm:w-24 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    )}
  </div>
);

interface MontoSolicitadoFormProps {
  compact?: boolean;
  onBack?: () => void;
  onNext?: (payload: MontoResumenPayload) => void;
  prestamoId?: string;
  productoId?: string;
  frecuenciaId?: string;
  monedaId?: string;
  cuotaTipo?: string;
  pagoTipo?: string;
  tipoDiaPago?: 'F' | 'V' | 'M';
  fechaPrimerPago?: string;
}

export interface MontoResumenPayload {
  montoSolicitado: string;
  nroCuotas: string;
  valorCuota: string;
  tea: string;
  tem: string;
  temMinimo: string;
  temMaximo: string;
  fechaPrimerPago: string;
}

const MontoSolicitadoForm: React.FC<MontoSolicitadoFormProps> = ({
  compact = false,
  onBack,
  onNext,
  prestamoId = '',
  productoId = '',
  frecuenciaId = '',
  monedaId = 'soles',
  cuotaTipo = '',
  pagoTipo = '',
  tipoDiaPago = 'F',
  fechaPrimerPago = '',
}) => {
  const { user } = useContext(AuthContext);

  const [montoSolicitado, setMontoSolicitado] = useState('0.00');
  const [montoMinimo, setMontoMinimo] = useState('0.00');
  const [montoMaximo, setMontoMaximo] = useState('0.00');

  const [nroCuotas, setNroCuotas] = useState('0');
  const [plazoMinimo, setPlazoMinimo] = useState('0');
  const [plazoMaximo, setPlazoMaximo] = useState('0');

  const [valorCuota, setValorCuota] = useState('0');
  const [tea, setTea] = useState('0.00');
  const [tem, setTem] = useState('0');
  const [temMinimo, setTemMinimo] = useState('0');
  const [temMaximo, setTemMaximo] = useState('0');
  const [temFueEditado, setTemFueEditado] = useState(false);

  const getAgenciaProcesada = (): string => {
    const age = user?.id_age || '';
    if (age === '06' || age === '07' || age === '10' || age === '11' || age === '12' || age === '13') {
      return '98';
    }
    return age;
  };

  const mapMonedaToApi = (value: string): string => {
    const val = value.toLowerCase();
    if (val === 'soles') return 'S';
    if (val === 'dolares') return 'D';
    return value;
  };

  const parseNumeric = (value: string): number => {
    const normalized = (value || '').toString().replace(/,/g, '').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getTodayDate = (): string => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
  };

  const formatDateForApiDateTime = (dateInput: string): string => {
    const trimmed = (dateInput || '').trim();
    if (!trimmed) return '';

    // Espera yyyy-MM-dd desde input date
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}/${month}/${year} 00:00:00`;
    }

    // Si ya viene en dd/MM/yyyy, normalizar a datetime
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return `${trimmed} 00:00:00`;
    }

    // Si ya viene con hora, se respeta
    if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    return `${trimmed} 00:00:00`;
  };

  useEffect(() => {
    const loadMontoMinMax = async () => {
      if (!prestamoId || !productoId || !frecuenciaId) return;
      const agencia = getAgenciaProcesada();
      if (!agencia) return;

      try {
        const data = await fetchMontoMinimoMaximo({
          COD_AGE: agencia,
          PRES: prestamoId,
          PROD: productoId,
          FRECU: frecuenciaId,
          MONEDA: mapMonedaToApi(monedaId),
        });

        const normalized = Array.isArray(data) ? data[0] : data;
        setMontoMinimo(normalized?.DESDE || '0.00');
        setMontoMaximo(normalized?.HASTA || '0.00');
      } catch {
        setMontoMinimo('0.00');
        setMontoMaximo('0.00');
      }
    };

    loadMontoMinMax();
  }, [prestamoId, productoId, frecuenciaId, monedaId, user?.id_age]);

  useEffect(() => {
    const loadPlazoMinMax = async () => {
      if (!prestamoId || !productoId || !frecuenciaId) return;
      const monto = Number.parseFloat(montoSolicitado.replace(/,/g, '').trim());
      if (!Number.isFinite(monto) || monto <= 0) {
        setPlazoMinimo('0');
        setPlazoMaximo('0');
        return;
      }

      const agencia = getAgenciaProcesada();
      if (!agencia) return;

      try {
        const data = await fetchPlazoMinimoMaximo({
          COD_AGE: agencia,
          PRES: prestamoId,
          PROD: productoId,
          FRECU: frecuenciaId,
          MONEDA: mapMonedaToApi(monedaId),
          MONTO: montoSolicitado,
        });

        const normalized = Array.isArray(data) ? data[0] : data;
        setPlazoMinimo(normalized?.DESDE || '0');
        setPlazoMaximo(normalized?.HASTA || '0');
      } catch {
        setPlazoMinimo('0');
        setPlazoMaximo('0');
      }
    };

    loadPlazoMinMax();
  }, [prestamoId, productoId, frecuenciaId, monedaId, montoSolicitado, user?.id_age]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const agencia = getAgenciaProcesada();
      const monto = parseNumeric(montoSolicitado);
      const plazo = Number.parseInt((nroCuotas || '').trim(), 10);

      if (!agencia || !prestamoId || !productoId || !frecuenciaId || !cuotaTipo || !pagoTipo) return;
      if (!(monto > 0) || !Number.isFinite(plazo) || plazo <= 0) return;

      try {
        const fechaInicioApi = formatDateForApiDateTime(getTodayDate());
        const fechaPrimerPagoApi = formatDateForApiDateTime(fechaPrimerPago || getTodayDate());

        const response = await fetchValorCuota({
          COD_AGE: agencia,
          PRES: prestamoId,
          PROD: productoId,
          FRECU: frecuenciaId,
          MONEDA: mapMonedaToApi(monedaId),
          PLAZO: plazo,
          MONTO: monto,
          TIPO_CUOTA: cuotaTipo,
          FECHA_INICIO: fechaInicioApi,
          FECHA_PRI: fechaPrimerPagoApi,
          DIA_FIJO: tipoDiaPago,
          CUENTA: '123456789',
          INT_PEND: 0,
          TIPO_PAGO: pagoTipo,
        });

        setValorCuota(response?.CUOTA_SEGURO || '0');
        setTea(response?.TEA || '0.00');
        setTem(response?.TEM || '0');
        setTemMinimo(response?.VARIA?.TEM_MIN || '0');
        setTemMaximo(response?.VARIA?.TEM_MAX || '0');
        setTemFueEditado(false);
      } catch {
        setValorCuota('0');
        setTea('0.00');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [prestamoId, productoId, frecuenciaId, monedaId, cuotaTipo, pagoTipo, tipoDiaPago, fechaPrimerPago, montoSolicitado, nroCuotas, user?.id_age]);

  useEffect(() => {
    if (!temFueEditado) return;

    const timer = setTimeout(async () => {
      const agencia = getAgenciaProcesada();
      const monto = parseNumeric(montoSolicitado);
      const plazo = Number.parseInt((nroCuotas || '').trim(), 10);
      const temValue = parseNumeric(tem);

      if (!agencia || !prestamoId || !productoId || !frecuenciaId || !cuotaTipo || !pagoTipo) return;
      if (!(monto > 0) || !Number.isFinite(plazo) || plazo <= 0 || !(temValue > 0)) return;

      try {
        const fechaInicioApi = formatDateForApiDateTime(getTodayDate());
        const fechaPrimerPagoApi = formatDateForApiDateTime(fechaPrimerPago || getTodayDate());

        const response = await fetchActualizarCuota({
          COD_AGE: agencia,
          PRES: prestamoId,
          PROD: productoId,
          FRECU: frecuenciaId,
          MONEDA: mapMonedaToApi(monedaId),
          PLAZO: plazo,
          MONTO: monto,
          TIPO_CUOTA: cuotaTipo,
          FECHA_INICIO: fechaInicioApi,
          FECHA_PRI: fechaPrimerPagoApi,
          DIA_FIJO: tipoDiaPago,
          CUENTA: '123456789',
          INT_PEND: 0,
          TIPO_PAGO: pagoTipo,
          TEM: tem,
        });

        setValorCuota(response?.CUOTA_SEGURO || response?.CUOTA || '0');
        setTea(response?.TEA || tea);
      } catch {
        // Mantener valor actual para no romper la edición visual del usuario
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [temFueEditado, tem, prestamoId, productoId, frecuenciaId, monedaId, cuotaTipo, pagoTipo, tipoDiaPago, fechaPrimerPago, montoSolicitado, nroCuotas, user?.id_age, tea]);

  return (
    <div className={`w-full flex justify-center px-2 ${compact ? 'bg-transparent py-1' : 'bg-slate-100 min-h-screen py-4'}`}>
      <div className={`w-full space-y-3 ${compact ? '' : 'max-w-5xl'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ============ Monto Solicitado ============ */}
          <div className="border border-slate-300 bg-[#eef3fb] rounded-sm overflow-hidden">
            <div className="bg-slate-600 text-white text-[12px] font-bold px-3 py-1.5">Monto Solicitado</div>

            <div className="p-3 space-y-4">
              {/* Fila: Monto Solicitado / Monto Mínimo / Monto Máximo */}
              <div className="flex flex-wrap items-end gap-3">
                <CampoConLabelIzq
                  label="Monto Solicitado"
                  labelWidth="w-28"
                  value={montoSolicitado}
                  onChange={setMontoSolicitado}
                />
                <CampoStacked label="Monto Mínimo" value={montoMinimo} readOnly />
                <CampoStacked label="Monto Máximo" value={montoMaximo} readOnly />
              </div>

              {/* Fila: Nro de Cuotas a Pagar / Plazo Mínimo / Plazo Máximo */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[12px] text-slate-800 w-28 shrink-0 leading-tight">
                    Nro de Cuotas a Pagar
                  </label>
                  <input
                    type="text"
                    value={nroCuotas}
                    onChange={(e) => setNroCuotas(e.target.value)}
                    className="w-24 sm:w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <CampoStacked label="Plazo Mínimo (MESES)" value={plazoMinimo} labelColor="text-purple-800" readOnly />
                <CampoStacked label="Plazo Máximo (MESES)" value={plazoMaximo} labelColor="text-purple-800" readOnly />
              </div>

              {/* Valor Cuota */}
              <CampoConLabelIzq label="Valor Cuota" labelWidth="w-28" value={valorCuota} readOnly />

              {/* TEA % */}
              <CampoConLabelIzq label="TEA  %" labelWidth="w-28" value={tea} bold readOnly />

              {/* Fila: TEM % / TEM Mínimo / TEM Máximo */}
              <div className="flex flex-wrap items-end gap-3">
                <CampoConLabelIzq
                  label="TEM  %"
                  labelWidth="w-28"
                  value={tem}
                  onChange={(value) => {
                    setTem(value);
                    setTemFueEditado(true);
                  }}
                  bold
                />
                <CampoStacked label="TEM Mínimo" value={temMinimo} readOnly />
                <CampoStacked label="TEM Máximo" value={temMaximo} readOnly />
              </div>
            </div>
          </div>

          {/* ============ Comentario de Evaluación ============ */}
          <div className="border border-slate-300 bg-[#eef3fb] rounded-sm overflow-hidden">
            <div className="bg-slate-600 text-white text-[12px] font-bold px-3 py-1.5">Comentario de Evaluación</div>
            <div className="p-3">
              <textarea
                rows={7}
                className="w-full px-2 py-1.5 text-[12px] rounded border border-slate-400 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between px-1 pt-1">
          <button
            type="button"
            title="Atrás"
            onClick={onBack}
            className="w-16 h-10 rounded border border-slate-400 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm transition"
          >
            <ArrowLeft className="w-6 h-6 text-lime-600" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            title="Continuar"
            onClick={() =>
              onNext?.({
                montoSolicitado,
                nroCuotas,
                valorCuota,
                tea,
                tem,
                temMinimo,
                temMaximo,
                fechaPrimerPago,
              })
            }
            className="w-16 h-10 rounded border border-slate-400 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm transition"
          >
            <ArrowRight className="w-6 h-6 text-green-600" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MontoSolicitadoForm;