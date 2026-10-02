import React, { useState } from 'react';

/* ---------- Subcomponente: fila simple label + input ---------- */

interface FilaLineaProps {
  label: string;
  bold?: boolean;
  editable?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const FilaLinea: React.FC<FilaLineaProps> = ({ label, bold = false, editable = true, value, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <label className={`text-[12px] ${bold ? 'font-bold' : 'font-semibold'} text-slate-800`}>{label}</label>
    {value !== undefined ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!editable}
        disabled={!editable}
        className={`w-32 sm:w-36 px-2 py-1 text-[12px] text-right rounded border shrink-0 ${
          editable
            ? 'border-slate-400 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500'
            : 'border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed'
        }`}
      />
    ) : (
      <input
        type="text"
        defaultValue="0.00"
        disabled={!editable}
        className={`w-32 sm:w-36 px-2 py-1 text-[12px] text-right rounded border shrink-0 ${
          editable
            ? 'border-slate-400 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500'
            : 'border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed'
        }`}
      />
    )}
  </div>
);

interface BalanceConsumoSinNegocioProps {
  compact?: boolean;
  enabled?: boolean;
  onContinueSolicitud?: () => void;
}

const BalanceConsumoSinNegocio: React.FC<BalanceConsumoSinNegocioProps> = ({
  compact = false,
  enabled = false,
  onContinueSolicitud,
}) => {
  const [ingresosPrincipales, setIngresosPrincipales] = useState('0.00');
  const [otrosIngresosNetos, setOtrosIngresosNetos] = useState('0.00');
  const [imprevistos, setImprevistos] = useState('0.00');

  const [alimentacion, setAlimentacion] = useState('0.00');
  const [serviciosAlquiler, setServiciosAlquiler] = useState('0.00');
  const [eduSaludVestido, setEduSaludVestido] = useState('0.00');
  const [transporte, setTransporte] = useState('0.00');
  const [otros, setOtros] = useState('0.00');

  const [cuotaPropuestaDile, setCuotaPropuestaDile] = useState('0.00');
  const [cuotasDile, setCuotasDile] = useState('0.00');
  const [cuotasOtrasEntidades, setCuotasOtrasEntidades] = useState('0.00');

  const parseAmount = (value: string): number => {
    const normalized = value.replace(/,/g, '').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmount = (value: number): string => value.toFixed(2);

  const resultadoActividad =
    parseAmount(ingresosPrincipales) + parseAmount(otrosIngresosNetos) - parseAmount(imprevistos);

  const asignacionFamiliar =
    parseAmount(alimentacion) +
    parseAmount(serviciosAlquiler) +
    parseAmount(eduSaludVestido) +
    parseAmount(transporte) +
    parseAmount(otros);

  const resultadoNeto = resultadoActividad - asignacionFamiliar;

  const excedenteFinal =
    resultadoNeto -
    (parseAmount(cuotaPropuestaDile) + parseAmount(cuotasDile) + parseAmount(cuotasOtrasEntidades));

  return (
    <div className={`w-full flex justify-center px-2 ${compact ? 'bg-transparent py-1' : 'bg-slate-100 min-h-screen py-4'}`}>
      <div className={`w-full border border-slate-300 bg-[#dce8f5] p-3 sm:p-4 ${compact ? '' : 'max-w-4xl'}`}>
        {/* Título */}
        <p className="text-[12px] text-slate-700 border-b border-slate-400 pb-1 mb-3">
          Balance de Situación (Consumo Sin Negocio)
        </p>

        <p className="font-bold text-[12px] text-slate-800 mb-3">Evaluación Económica</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          {/* ---- Fila 1: contenido principal de cada columna ---- */}
          <div className="space-y-6">
            <div className="space-y-3">
              <FilaLinea
                label="Ingresos Principales"
                editable={enabled}
                value={ingresosPrincipales}
                onChange={setIngresosPrincipales}
              />
              <FilaLinea
                label="Otros Ingresos Netos"
                editable={enabled}
                value={otrosIngresosNetos}
                onChange={setOtrosIngresosNetos}
              />
              <FilaLinea label="Imprevistos" editable={enabled} value={imprevistos} onChange={setImprevistos} />
              <FilaLinea label="Resultado de Actividad" bold editable={false} value={formatAmount(resultadoActividad)} />
            </div>

            <div className="space-y-3">
              <FilaLinea label="Alimentación" editable={enabled} value={alimentacion} onChange={setAlimentacion} />
              <FilaLinea
                label="Servicios y Alquiler"
                editable={enabled}
                value={serviciosAlquiler}
                onChange={setServiciosAlquiler}
              />
              <FilaLinea
                label="Edu. Salud Vestido"
                editable={enabled}
                value={eduSaludVestido}
                onChange={setEduSaludVestido}
              />
              <FilaLinea label="Transporte" editable={enabled} value={transporte} onChange={setTransporte} />
              <FilaLinea label="Otros" editable={enabled} value={otros} onChange={setOtros} />
              <FilaLinea label="Asignación Familiar" bold editable={false} value={formatAmount(asignacionFamiliar)} />
            </div>
          </div>

          <div className="space-y-3">
            <FilaLinea
              label="Cuota Propuesta Dile"
              editable={enabled}
              value={cuotaPropuestaDile}
              onChange={setCuotaPropuestaDile}
            />
            <FilaLinea label="Cuotas Dile" editable={enabled} value={cuotasDile} onChange={setCuotasDile} />
            <FilaLinea
              label="Cuotas Otras Entidades"
              editable={enabled}
              value={cuotasOtrasEntidades}
              onChange={setCuotasOtrasEntidades}
            />
          </div>

          {/* ---- Fila 2: Resultado Neto y Excedente Final, misma fila de grid = misma altura ---- */}
          <div>
            <FilaLinea label="Resultado Neto" bold editable={false} value={formatAmount(resultadoNeto)} />
          </div>
          <div>
            <FilaLinea label="Excedente Final" bold editable={false} value={formatAmount(excedenteFinal)} />
          </div>

          {/* ---- Fila 3: botón, ocupa ambas columnas, pegado a la esquina inferior derecha ---- */}
          <div className="sm:col-span-2 flex justify-end pt-1">
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
  );
};

export default BalanceConsumoSinNegocio;