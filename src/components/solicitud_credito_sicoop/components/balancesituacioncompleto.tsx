import React, { useState } from 'react';

/* ---------- Subcomponentes de UI (mismos que las versiones anteriores) ---------- */

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
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const FilaTotal: React.FC<FilaTotalProps> = ({ label, bold, enabled, value, onChange, readOnly = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
    <p className={`text-[12px] ${bold ? 'font-bold' : 'font-semibold'} text-slate-800`}>{label}</p>
    {value !== undefined ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
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

const SeccionLink: React.FC<{ label: string }> = ({ label }) => (
  <button type="button" className="text-[12px] text-blue-700 underline font-semibold hover:text-blue-900">
    {label}
  </button>
);

interface BalanceSituacionCompletoProps {
  compact?: boolean;
  enabled?: boolean;
  onContinueSolicitud?: () => void;
}

const BalanceSituacionCompleto: React.FC<BalanceSituacionCompletoProps> = ({
  compact = false,
  enabled = false,
  onContinueSolicitud,
}) => {
  const [cajaBancos, setCajaBancos] = useState('0.00');
  const [ctasXCobrar, setCtasXCobrar] = useState('0.00');
  const [inventarios, setInventarios] = useState('0.00');
  const [otrasCtasCorrientes, setOtrasCtasCorrientes] = useState('0.00');

  const [maqEquipos, setMaqEquipos] = useState('0.00');
  const [inmuebles, setInmuebles] = useState('0.00');
  const [otrosNoCorriente, setOtrosNoCorriente] = useState('0.00');

  const [ctasPorPagar, setCtasPorPagar] = useState('0.00');
  const [deudaCortoPlazo, setDeudaCortoPlazo] = useState('0.00');
  const [otrosPasivoCorriente, setOtrosPasivoCorriente] = useState('0.00');
  const [deudaLargoPlazo, setDeudaLargoPlazo] = useState('0.00');
  const [otrosPasivoNoCorriente, setOtrosPasivoNoCorriente] = useState('0.00');

  const [ventas, setVentas] = useState('0.00');
  const [costoVentas, setCostoVentas] = useState('0.00');
  const [gastosAdministrativos, setGastosAdministrativos] = useState('0.00');
  const [manoObra, setManoObra] = useState('0.00');
  const [otrosEgresos, setOtrosEgresos] = useState('0.00');
  const [imprevistos, setImprevistos] = useState('0.00');

  const [otrosIngresos, setOtrosIngresos] = useState('0.00');
  const [alimentacion, setAlimentacion] = useState('0.00');
  const [serviciosAlquiler, setServiciosAlquiler] = useState('0.00');
  const [eduSaludVestido, setEduSaludVestido] = useState('0.00');
  const [transporte, setTransporte] = useState('0.00');
  const [otrosFamiliar, setOtrosFamiliar] = useState('0.00');

  const [cuotaPropuestaDile, setCuotaPropuestaDile] = useState('0.00');
  const [cuotasDile, setCuotasDile] = useState('0.00');
  const [otrasEntidades, setOtrasEntidades] = useState('0.00');

  const parseAmount = (value: string): number => {
    const normalized = value.replace(/,/g, '').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmount = (value: number): string => value.toFixed(2);

  const totalActivoCorriente =
    parseAmount(cajaBancos) +
    parseAmount(ctasXCobrar) +
    parseAmount(inventarios) +
    parseAmount(otrasCtasCorrientes);

  const totalActivoNoCorriente =
    parseAmount(maqEquipos) +
    parseAmount(inmuebles) +
    parseAmount(otrosNoCorriente);

  const totalActivo = totalActivoCorriente + totalActivoNoCorriente;

  const totalPasivo =
    parseAmount(ctasPorPagar) +
    parseAmount(deudaCortoPlazo) +
    parseAmount(otrosPasivoCorriente) +
    parseAmount(deudaLargoPlazo) +
    parseAmount(otrosPasivoNoCorriente);

  const patrimonio = totalActivo - totalPasivo;
  const totalPasivoPatrimonio = totalPasivo + patrimonio;

  const totalEgresosOperativos =
    parseAmount(costoVentas) +
    parseAmount(gastosAdministrativos) +
    parseAmount(manoObra) +
    parseAmount(otrosEgresos) +
    parseAmount(imprevistos);

  const resultadoActividad = parseAmount(ventas) - totalEgresosOperativos;

  const asignacionFamiliar =
    parseAmount(alimentacion) +
    parseAmount(serviciosAlquiler) +
    parseAmount(eduSaludVestido) +
    parseAmount(transporte) +
    parseAmount(otrosFamiliar);

  const resultadoNeto = resultadoActividad + parseAmount(otrosIngresos) - asignacionFamiliar;

  const excedenteFinal =
    resultadoNeto -
    (parseAmount(cuotaPropuestaDile) + parseAmount(cuotasDile) + parseAmount(otrasEntidades));

  return (
    <div className={`w-full flex justify-center px-2 ${compact ? 'bg-transparent py-1' : 'bg-slate-100 min-h-screen py-4'}`}>
      <div className={`w-full border border-slate-300 bg-[#dce8f5] p-3 sm:p-4 ${compact ? '' : 'max-w-6xl'}`}>
        {/* Título */}
        <p className="text-[12px] text-slate-700 border-b border-slate-400 pb-1 mb-3">
          Balance de Situación (Completo)
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {/* ============ COLUMNA IZQUIERDA: ACTIVO / PASIVO / PATRIMONIO ============ */}
          <div className="space-y-3">
            <p className="font-bold text-[12px] text-slate-800">1) Activo</p>

            <div className="space-y-2">
              <SeccionLink label="Activo Corriente" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Campo label="Caja o Bancos" enabled={enabled} value={cajaBancos} onChange={setCajaBancos} />
                <Campo label="CtasXCobrar" enabled={enabled} value={ctasXCobrar} onChange={setCtasXCobrar} />
                <Campo label="Inventarios" enabled={enabled} value={inventarios} onChange={setInventarios} />
                <Campo label="Total" enabled={enabled} value={formatAmount(totalActivoCorriente)} readOnly />
              </div>
              <FilaTotal
                label="Otras Cuentas Corrientes"
                enabled={enabled}
                value={otrasCtasCorrientes}
                onChange={setOtrasCtasCorrientes}
              />
            </div>

            <div className="space-y-2">
              <SeccionLink label="Activo No Corriente" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Campo label="Maq y Equipos" enabled={enabled} value={maqEquipos} onChange={setMaqEquipos} />
                <Campo label="Inmuebles" enabled={enabled} value={inmuebles} onChange={setInmuebles} />
                <Campo label="Otros" enabled={enabled} value={otrosNoCorriente} onChange={setOtrosNoCorriente} />
                <Campo label="Total" enabled={enabled} value={formatAmount(totalActivoNoCorriente)} readOnly />
              </div>
            </div>

            <FilaTotal label="TOTAL Activo" bold enabled={enabled} value={formatAmount(totalActivo)} readOnly />

            <div className="space-y-2 pt-1">
              <p className="font-bold text-[12px] text-slate-800">2) Pasivo</p>

              <div className="space-y-2">
                <SeccionLink label="Pasivo Corriente" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Campo label="CtasPorPagar" enabled={enabled} value={ctasPorPagar} onChange={setCtasPorPagar} />
                  <Campo label="DeudaCortoPlazo" enabled={enabled} value={deudaCortoPlazo} onChange={setDeudaCortoPlazo} />
                  <Campo label="Otros" enabled={enabled} value={otrosPasivoCorriente} onChange={setOtrosPasivoCorriente} />
                </div>
              </div>

              <div className="space-y-2">
                <SeccionLink label="Pasivo No Corriente" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Campo label="DeudaLargoPlazo" enabled={enabled} value={deudaLargoPlazo} onChange={setDeudaLargoPlazo} />
                  <Campo label="Otros" enabled={enabled} value={otrosPasivoNoCorriente} onChange={setOtrosPasivoNoCorriente} />
                  <Campo label="Total Pasivo" enabled={enabled} value={formatAmount(totalPasivo)} readOnly />
                </div>
              </div>
            </div>

            <FilaTotal label="3) Patrimonio" bold enabled={enabled} value={formatAmount(patrimonio)} readOnly />
            <FilaTotal
              label="TOTAL Pasivo + Patrimonio"
              bold
              enabled={enabled}
              value={formatAmount(totalPasivoPatrimonio)}
              readOnly
            />
          </div>

          {/* ============ COLUMNA DERECHA: EVALUACIÓN ECONÓMICA ============ */}
          <div className="space-y-3">
            <p className="font-bold text-[12px] text-slate-800">Evaluación Económica</p>

            <div className="space-y-3">
              <FilaTotal label="Ventas" enabled={enabled} value={ventas} onChange={setVentas} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo label="Costo de Ventas" enabled={enabled} value={costoVentas} onChange={setCostoVentas} />
                <Campo
                  label="Gastos Administrativos"
                  enabled={enabled}
                  value={gastosAdministrativos}
                  onChange={setGastosAdministrativos}
                />
                <Campo label="Mano de Obra" enabled={enabled} value={manoObra} onChange={setManoObra} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo label="Otros Egresos" enabled={enabled} value={otrosEgresos} onChange={setOtrosEgresos} />
                <Campo label="Imprevistos" enabled={enabled} value={imprevistos} onChange={setImprevistos} />
                <Campo label="Egresos Operativos" enabled={enabled} value={formatAmount(totalEgresosOperativos)} readOnly />
              </div>
            </div>

            <FilaTotal
              label="Resultado de Actividad"
              bold
              enabled={enabled}
              value={formatAmount(resultadoActividad)}
              readOnly
            />

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo label="Otros Ingresos" enabled={enabled} value={otrosIngresos} onChange={setOtrosIngresos} />
                <Campo label="Alimentación" enabled={enabled} value={alimentacion} onChange={setAlimentacion} />
                <Campo label="Serv.y Alquiler" enabled={enabled} value={serviciosAlquiler} onChange={setServiciosAlquiler} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo
                  label="Edu.Salud Vestido"
                  enabled={enabled}
                  value={eduSaludVestido}
                  onChange={setEduSaludVestido}
                />
                <Campo label="Transporte" enabled={enabled} value={transporte} onChange={setTransporte} />
                <Campo label="Otros" enabled={enabled} value={otrosFamiliar} onChange={setOtrosFamiliar} />
              </div>
            </div>

            <FilaTotal label="Asignación Familiar" enabled={enabled} value={formatAmount(asignacionFamiliar)} readOnly />
            <FilaTotal label="Resultado Neto" bold enabled={enabled} value={formatAmount(resultadoNeto)} readOnly />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Campo
                label="Cuota Propuesta Dile"
                enabled={enabled}
                value={cuotaPropuestaDile}
                onChange={setCuotaPropuestaDile}
              />
              <Campo label="Cuotas Dile" enabled={enabled} value={cuotasDile} onChange={setCuotasDile} />
              <Campo label="Otras Entidades" enabled={enabled} value={otrasEntidades} onChange={setOtrasEntidades} />
            </div>

            <FilaTotal label="Excedente Final" bold enabled={enabled} value={formatAmount(excedenteFinal)} readOnly />

            {/* Botón de acción */}
            <div className="pt-1 flex sm:justify-end">
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

export default BalanceSituacionCompleto;