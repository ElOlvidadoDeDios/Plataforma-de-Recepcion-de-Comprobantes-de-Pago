import React, { useState } from 'react';

/* ---------- Subcomponentes de UI (mismos que la versión Estándar) ---------- */

interface CampoProps {
  label: string;
  enabled: boolean;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const Campo: React.FC<CampoProps> = ({ label, enabled, value, onChange, readOnly = false }) => (
  <div>
    <label className="text-[10px] text-slate-600 block mb-0.5 whitespace-nowrap">{label}</label>
    {value !== undefined ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        disabled={readOnly || !enabled}
        className={`w-full px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 ${enabled && !readOnly ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
      />
    ) : (
      <input
        type="text"
        defaultValue="0.00"
        disabled={!enabled}
        className={`w-full px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 ${enabled ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
      />
    )}
  </div>
);

interface FilaTotalProps {
  label: string;
  bold?: boolean;
  enabled: boolean;
  value?: string;
  readOnly?: boolean;
}

const FilaTotal: React.FC<FilaTotalProps> = ({ label, bold, enabled, value, readOnly = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
    <p className={`text-[12px] ${bold ? 'font-bold' : 'font-semibold'} text-slate-800`}>{label}</p>
    {value !== undefined ? (
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        disabled={readOnly || !enabled}
        className={`w-full sm:w-32 px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 shrink-0 ${enabled && !readOnly ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
      />
    ) : (
      <input
        type="text"
        defaultValue="0.00"
        disabled={!enabled}
        className={`w-full sm:w-32 px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 shrink-0 ${enabled ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
      />
    )}
  </div>
);

interface BalanceSituacionSimplificadoProps {
  compact?: boolean;
  enabled?: boolean;
  onContinueSolicitud?: () => void;
}

export const BalanceSituacionSimplificado: React.FC<BalanceSituacionSimplificadoProps> = ({
  compact = false,
  enabled = false,
  onContinueSolicitud,
}) => {
  const [cajaBancos, setCajaBancos] = useState('0.00');
  const [ctasXCobrar, setCtasXCobrar] = useState('0.00');
  const [inventarios, setInventarios] = useState('0.00');

  const [maquinariasEquipos, setMaquinariasEquipos] = useState('0.00');
  const [terrenosInmuebles, setTerrenosInmuebles] = useState('0.00');

  const [deudaCortoPlazo, setDeudaCortoPlazo] = useState('0.00');
  const [deudaLargoPlazo, setDeudaLargoPlazo] = useState('0.00');

  const [ventas, setVentas] = useState('0.00');
  const [costoVentas, setCostoVentas] = useState('0.00');
  const [gastosOperativos, setGastosOperativos] = useState('0.00');
  const [asignacionFamiliar, setAsignacionFamiliar] = useState('0.00');

  const [cuotaPropuestaDile, setCuotaPropuestaDile] = useState('0.00');
  const [cuotasDile, setCuotasDile] = useState('0.00');
  const [otrasEntidades, setOtrasEntidades] = useState('0.00');

  const parseAmount = (value: string): number => {
    const normalized = value.replace(/,/g, '').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmount = (value: number): string => value.toFixed(2);

  const totalActivoCorriente = parseAmount(cajaBancos) + parseAmount(ctasXCobrar) + parseAmount(inventarios);
  const totalActivoNoCorriente = parseAmount(maquinariasEquipos) + parseAmount(terrenosInmuebles);
  const totalActivo = totalActivoCorriente + totalActivoNoCorriente;

  const totalPasivo = parseAmount(deudaCortoPlazo) + parseAmount(deudaLargoPlazo);
  const patrimonio = totalActivo - totalPasivo;
  const totalPasivoPatrimonio = totalPasivo + patrimonio;

  const resultadoNeto =
    parseAmount(ventas) -
    (parseAmount(costoVentas) + parseAmount(gastosOperativos) + parseAmount(asignacionFamiliar));

  const excedenteFinal =
    resultadoNeto - (parseAmount(cuotaPropuestaDile) + parseAmount(cuotasDile) + parseAmount(otrasEntidades));

  return (
    <div className={`w-full flex justify-center px-2 ${compact ? 'bg-transparent py-1' : 'bg-slate-100 min-h-screen py-4'}`}>
      <div className={`w-full border border-slate-300 bg-[#dce8f5] p-3 sm:p-4 ${compact ? '' : 'max-w-6xl'}`}>
        {/* Título */}
        <p className="text-[12px] text-slate-700 border-b border-slate-400 pb-1 mb-3">
          Balance de Situación (Simplificado)
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {/* ============ COLUMNA IZQUIERDA: ACTIVO / PASIVO / PATRIMONIO ============ */}
          <div className="space-y-3">
            <p className="font-bold text-[12px] text-slate-800">1) ACTIVO</p>

            <div className="space-y-2">
              <p className="font-bold text-[12px] text-slate-800">Activo Corriente</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Campo label="Caja o Bancos" enabled={enabled} value={cajaBancos} onChange={setCajaBancos} />
                <Campo label="CtasXCobrar" enabled={enabled} value={ctasXCobrar} onChange={setCtasXCobrar} />
                <Campo label="Inventarios" enabled={enabled} value={inventarios} onChange={setInventarios} />
                <Campo label="Total" enabled={enabled} value={formatAmount(totalActivoCorriente)} readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-[12px] text-slate-800">Activo No Corriente</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo label="Maquinarias y Equipos" enabled={enabled} value={maquinariasEquipos} onChange={setMaquinariasEquipos} />
                <Campo label="Terrenos e Inmuebles" enabled={enabled} value={terrenosInmuebles} onChange={setTerrenosInmuebles} />
                <Campo label="Total" enabled={enabled} value={formatAmount(totalActivoNoCorriente)} readOnly />
              </div>
            </div>

            <FilaTotal label="TOTAL Activo" bold enabled={enabled} value={formatAmount(totalActivo)} readOnly />

            <div className="space-y-2 pt-1">
              <p className="font-bold text-[12px] text-slate-800">2) PASIVO</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo label="Deuda Corto Plazo" enabled={enabled} value={deudaCortoPlazo} onChange={setDeudaCortoPlazo} />
                <Campo label="Deuda Largo Plazo" enabled={enabled} value={deudaLargoPlazo} onChange={setDeudaLargoPlazo} />
                <Campo label="Total" enabled={enabled} value={formatAmount(totalPasivo)} readOnly />
              </div>
            </div>

            <FilaTotal label="3) Patrimonio" bold enabled={enabled} value={formatAmount(patrimonio)} readOnly />
            <FilaTotal label="TOTAL Pasivo + Patrimonio" bold enabled={enabled} value={formatAmount(totalPasivoPatrimonio)} readOnly />
          </div>

          {/* ============ COLUMNA DERECHA: EVALUACIÓN ECONÓMICA ============ */}
          <div className="space-y-3">
            <p className="font-bold text-[12px] text-slate-800">EVALUACIÓN ECONÓMICA</p>
            <p className="font-bold text-[12px] text-slate-800">Rubros / Conceptos</p>

            <div className="space-y-3">
              <Campo label="Ventas" enabled={enabled} value={ventas} onChange={setVentas} />
              <Campo label="Costo de Ventas" enabled={enabled} value={costoVentas} onChange={setCostoVentas} />
              <Campo label="Gastos Operativos" enabled={enabled} value={gastosOperativos} onChange={setGastosOperativos} />
              <Campo label="Asignacion Fam." enabled={enabled} value={asignacionFamiliar} onChange={setAsignacionFamiliar} />
            </div>

            <div className="pt-2">
              <FilaTotal label="Resultado Neto" bold enabled={enabled} value={formatAmount(resultadoNeto)} readOnly />
            </div>

            <div className="space-y-3 pt-2">
              <Campo label="Cuota Propuesta Dile" enabled={enabled} value={cuotaPropuestaDile} onChange={setCuotaPropuestaDile} />
              <Campo label="Cuotas Dile" enabled={enabled} value={cuotasDile} onChange={setCuotasDile} />
              <Campo label="Otras Entidades" enabled={enabled} value={otrasEntidades} onChange={setOtrasEntidades} />
            </div>

            <div className="pt-2">
              <FilaTotal label="Excedente Final" bold enabled={enabled} value={formatAmount(excedenteFinal)} readOnly />
            </div>

            {/* Botón de acción */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onContinueSolicitud}
                className="w-full sm:w-40 px-3 py-2 rounded-sm border border-slate-400 bg-white text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-sm leading-tight transition"
              >
                Continuar Solicitud
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSituacionSimplificado;