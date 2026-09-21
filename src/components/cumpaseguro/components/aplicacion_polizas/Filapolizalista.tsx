import React from 'react';
import { Building2, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { colorPorNombre, iniciales, nombreCompleto } from './Helpers';
import { PolizaPorAplicar } from '../../AplicacionPolizas.types';


interface FilaPolizaListaProps {
  poliza: PolizaPorAplicar;
  onClick: () => void;
}

const FilaPolizaLista: React.FC<FilaPolizaListaProps> = ({ poliza, onClick }) => {
  const { titular, agencia_nom, fecha_hora_local, firma, voucher } = poliza;
  const estaFirmado = firma?.data?.firm_easy?.status === 'signed';
  const tieneVoucher = Boolean(voucher?.data?.voucher?.voucher_aws);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      {/* Columna 1: Avatar + Nombre + DNI */}
      <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${colorPorNombre(
            titular?.nombres || ''
          )}`}
        >
          {iniciales(titular)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
            {nombreCompleto(titular)}
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            {titular?.tipo_documento || 'DNI'}: <span className="font-semibold">{titular?.nro_documento}</span>
          </p>
        </div>
      </div>

      {/* Columna 2: Agencia y Fecha */}
      <div className="flex flex-col text-xs text-slate-600 sm:w-1/4">
        <span className="font-medium text-slate-800 flex items-center gap-1 truncate">
          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          {agencia_nom || 'Sin Agencia'}
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 shrink-0" />
          {fecha_hora_local || 'N/D'}
        </span>
      </div>

      {/* Columna 3: Costo & Badges Firma y Voucher */}
      <div className="flex flex-wrap items-center gap-2 sm:w-1/3 justify-start sm:justify-end">
        {titular?.costo !== undefined && (
          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs">
            S/ {titular.costo}
          </span>
        )}

        {/* Badge Firma */}
        {estaFirmado ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Firmado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            Firma pend.
          </span>
        )}

        {/* Badge Voucher */}
        {tieneVoucher ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            Voucher ok
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            Sin voucher
          </span>
        )}

        <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors shrink-0 ml-1">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default FilaPolizaLista;