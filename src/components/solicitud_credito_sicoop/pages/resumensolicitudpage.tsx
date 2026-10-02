import React, { useState } from 'react';
import { ArrowBigLeft, Lightbulb } from 'lucide-react';

/* ---------- Estilos base compartidos ---------- */
const inputBase =
  'h-[20px] w-full min-w-0 px-1 text-[12px] leading-none border border-[#a6a6a6] rounded-[1px] focus:outline-none focus:border-[#0078d7]';
const inputOn = 'bg-white text-black';
const inputOff = 'bg-[#eeeeee] text-[#333] cursor-default';

const btnBase =
  'h-8 w-full sm:w-[147px] rounded-[2px] border text-[12px] flex items-center justify-center relative transition-colors';
const btnOn =
  'border-[#adadad] bg-white text-[#222] hover:bg-[#e5f1fb] hover:border-[#0078d7]';
const btnOff = 'border-[#d6d6d6] bg-[#f4f4f4] text-[#9b9b9b] cursor-not-allowed';

/* ---------- Subcomponente: label + input en línea ---------- */
const CampoInfo: React.FC<{
  label: React.ReactNode;
  defaultValue: string;
  disabled?: boolean;
  align?: 'left' | 'right' | 'center';
  labelClass?: string;
}> = ({ label, defaultValue, disabled = false, align = 'right', labelClass = '' }) => (
  <div className="flex items-center min-w-0">
    <label
      className={`text-[12px] text-black shrink-0 whitespace-nowrap leading-tight pr-2 ${labelClass}`}
    >
      {label}
    </label>
    <input
      type="text"
      defaultValue={defaultValue}
      readOnly={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={`${inputBase} ${disabled ? inputOff : inputOn} ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
    />
  </div>
);

/* ---------- Anchos de label por columna (móvil / lg) ---------- */
const L1 = 'min-w-[104px] lg:min-w-[71px]';
const L2 = 'min-w-[104px] lg:min-w-[98px]';
const L3 = 'min-w-[104px] lg:min-w-[87px] lg:text-right';
const L4 = 'min-w-[104px] lg:min-w-[88px]';

interface FilaGarantia {
  nro: number;
  descripcion: string;
  monto: number;
}

interface ResumenSolicitudPageProps {
  compact?: boolean;
  onBack?: () => void;
  prestamo?: string;
  producto?: string;
  moneda?: string;
  montoSolicitud?: string;
  plazo?: string;
  cuota?: string;
  tea?: string;
  fechaPrimerPago?: string;
  montoNeto?: string;
}

const ResumenSolicitudPage: React.FC<ResumenSolicitudPageProps> = ({
  compact = false,
  onBack,
  prestamo = '',
  producto = '',
  moneda = 'Nuevos Soles',
  montoSolicitud = '0.00',
  plazo = '0',
  cuota = '0.00',
  tea = '0.00',
  fechaPrimerPago = '',
  montoNeto = '0.00',
}) => {
  const [garantias] = useState<FilaGarantia[]>([{ nro: 2, descripcion: 'Cuenta Reserva', monto: 0.0 }]);
  const [nroSeleccionado, setNroSeleccionado] = useState<number | null>(2);

  return (
    <div
      className={`w-full flex justify-center ${compact ? 'bg-transparent py-1 px-0' : 'bg-slate-200 min-h-screen py-3 px-2'}`}
      style={{ fontFamily: 'Tahoma, "Segoe UI", Verdana, sans-serif' }}
    >
      <div
        className={`w-full ${compact ? '' : 'max-w-[940px]'} bg-[#d6e4f2] border border-slate-300 shadow-sm px-4 pt-6 pb-4`}
      >
        {/* ============ Datos generales del préstamo ============ */}
        <div className="border border-[#bccbdb] px-6 pt-1.5 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,246fr)_minmax(0,203fr)_minmax(0,193fr)_minmax(0,147fr)] gap-x-6 gap-y-[6px]">
            {/* Fila 1 */}
            <CampoInfo label="Prestamo" defaultValue={prestamo} disabled align="left" labelClass={L1} />
            <CampoInfo label="Monto Solicitud" defaultValue={montoSolicitud} disabled labelClass={L2} />
            <CampoInfo label="Plazo" defaultValue={plazo} disabled labelClass={L3} />
            <CampoInfo label="Nro Aprob." defaultValue="1" disabled align="left" labelClass={L4} />

            {/* Fila 2 */}
            <CampoInfo label="Producto" defaultValue={producto} disabled align="left" labelClass={L1} />
            <CampoInfo label="Monto Neto" defaultValue={montoNeto} disabled labelClass={L2} />
            <CampoInfo label="Cuota" defaultValue={cuota} disabled labelClass={L3} />
            <CampoInfo
              label={
                <span className="text-[11px] leading-[1.1] block">
                  Nuevo(N)
                  <br />
                  Recurrente(R)
                </span>
              }
              defaultValue="N"
              disabled
              align="left"
              labelClass={L4}
            />

            {/* Fila 3 */}
            <CampoInfo label="Moneda" defaultValue={moneda} disabled align="left" labelClass={L1} />
            <CampoInfo label="TEA" defaultValue={tea} disabled labelClass={L2} />
            <CampoInfo label="Fec. 1erPago" defaultValue={fechaPrimerPago} disabled align="center" labelClass={L3} />
            <CampoInfo label="Aporte" defaultValue="0" labelClass={L4} />
          </div>
        </div>
        {/* ============ Parte inferior ============ */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,436px)_minmax(0,1fr)] gap-y-6">
          {/* ---- Columna izquierda ---- */}
          <div className="min-w-0">
            {/* Panel: tabla + totales */}
            <div className="border border-[#bccbdb] pt-3 pb-3 pl-6 pr-3.5">
              {/* Tabla de garantías */}
              <div className="mr-8 bg-[#a9a9a9] border border-black pb-[10px]">
                <table className="w-[85.5%] table-fixed border-collapse bg-white text-[12px]">
                  <colgroup>
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '61%' }} />
                    <col style={{ width: '26%' }} />
                  </colgroup>
                  <thead>
                    <tr className="h-[21px]">
                      <th className="text-left font-bold px-1 border border-[#808080] bg-white">Nro</th>
                      <th className="text-left font-bold px-1 border border-[#808080] bg-white">Descripcion</th>
                      <th className="text-center font-bold px-1 border border-[#808080] bg-white">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {garantias.map((g) => {
                      const sel = nroSeleccionado === g.nro;
                      return (
                        <tr
                          key={g.nro}
                          onClick={() => setNroSeleccionado(g.nro)}
                          className={`h-[24px] cursor-pointer ${sel ? 'bg-[#0078d7] text-white' : 'bg-white text-black'}`}
                        >
                          <td className="px-1 border border-[#c8c8c8] truncate">{g.nro}</td>
                          <td className="px-1 border border-[#c8c8c8] truncate">{g.descripcion}</td>
                          <td className="px-1 border border-[#c8c8c8] text-right">{g.monto.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr className="h-[24px] bg-white">
                      <td className="border border-[#c8c8c8]">&nbsp;</td>
                      <td className="border border-[#c8c8c8]" />
                      <td className="border border-[#c8c8c8]" />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_116px_26px] gap-x-2 gap-y-[9px] items-center">
                <label className="text-[12px] text-black leading-tight sm:pl-[min(93px,15%)]">Cursos-Capacitación</label>
                <input type="text" defaultValue="180.00" readOnly tabIndex={-1} className={`${inputBase} ${inputOff} text-right`} />
                <span />

                <label className="text-[12px] text-black leading-tight sm:pl-[min(93px,15%)]">Total Dscts</label>
                <input type="text" defaultValue="180.00" className={`${inputBase} ${inputOn} text-right`} />
                <span />

                <label className="text-[12px] text-black leading-tight sm:pl-[min(93px,15%)]">Total Cuentas x Cob.</label>
                <input type="text" defaultValue="0.00" className={`${inputBase} ${inputOn} text-right`} />
                <button
                  type="button"
                  title="Ver detalle"
                  className="h-[20px] w-[26px] rounded-[2px] border border-[#adadad] bg-white hover:bg-[#e5f1fb] text-[#333] text-[11px] font-bold leading-none flex items-center justify-center"
                >
                  ...
                </button>

                <label className="text-[12px] text-black leading-tight sm:pl-[min(93px,15%)]">Prestamos Deducidos</label>
                <input type="text" defaultValue="0.00" className={`${inputBase} ${inputOn} text-right`} />
                <span />

                <label className="text-[12px] text-black leading-tight sm:pl-[min(93px,15%)]">Total Neto</label>
                <input type="text" defaultValue="20,320.00" className={`${inputBase} ${inputOn} text-right`} />
                <span />
              </div>
            </div>

            {/* Recuperador */}
            <div className="mt-2 pl-6 pr-3.5 flex items-center">
              <label className="text-[12px] text-black shrink-0 whitespace-nowrap min-w-[101px] pr-2">Recuperador</label>
              <select className="h-[22px] w-full min-w-0 px-1 text-[12px] rounded-[1px] border border-[#a6a6a6] bg-white focus:outline-none focus:border-[#0078d7]">
                <option>ACEITUNO SALGUERO, DIEGO ARMANDO</option>
              </select>
            </div>

            {/* Botón Atrás */}
            <div className="mt-[22px] pl-6">
              <button
                type="button"
                title="Atrás"
                onClick={onBack}
                className="w-[77px] h-[34px] rounded-[2px] border border-[#c4c4c4] bg-gradient-to-b from-white to-[#e9e9e9] hover:from-[#eef6fd] hover:to-[#dcecfa] flex items-center justify-center"
              >
                <ArrowBigLeft className="w-7 h-7 text-[#6aa32a]" fill="#93c83e" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* ---- Columna derecha: acciones ---- */}
          <div className="flex flex-col gap-3 lg:gap-0 lg:items-end lg:pr-[65px] lg:pt-[1px]">
            <p className="font-bold text-[12px] text-black lg:mr-[117px] lg:mb-[20px]">Nro de Solicitud</p>

            <button type="button" className={`${btnBase} ${btnOn}`}>
              <Lightbulb className="w-4 h-4 text-amber-400 absolute left-2" fill="#fde047" />
              Procesar
            </button>

            <button type="button" disabled className={`${btnBase} ${btnOff} lg:mt-[18px]`}>
              Registrar Garantias
            </button>

            <button type="button" disabled className={`${btnBase} ${btnOff} lg:mt-[71px]`}>
              Imprimir Solicitud
            </button>

            <button type="button" className={`${btnBase} ${btnOn} lg:mt-[72px]`}>
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenSolicitudPage;