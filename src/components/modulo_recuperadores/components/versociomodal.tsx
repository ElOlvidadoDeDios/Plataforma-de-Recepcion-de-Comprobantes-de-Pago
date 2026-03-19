import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import type { SocioMora } from '../services/gestios_recuperadores.service';


interface Props {
  socio: SocioMora;
  onClose: () => void;
}

const VerSocioModal = ({ socio, onClose }: Props) => {
  const { CREDITO_MORA } = socio;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const periodo = `${year}${String(month).padStart(2, '0')}`;
  
  // Usar las gestiones que ya vienen con el socio
  const gestiones = socio.GESTION_MORA || [];
  const isLoading = false;

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-full md:max-w-4xl shadow-xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Detalle del socio</h2>
            <p className="text-xs text-gray-400 mt-0.5">{CREDITO_MORA.SOCIO}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Info crédito */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Pagaré', value: CREDITO_MORA.PAGARE },
              { label: 'Cuenta', value: CREDITO_MORA.CUENTA },
              { label: 'Por pagar', value: `S/ ${CREDITO_MORA.POR_PAGAR.toFixed(2)}` },
              { label: 'Días atraso', value: CREDITO_MORA.DIAS_ATRASO },
              { label: 'Cuotas', value: CREDITO_MORA.CUOTAS_PAGAR },
              { label: 'Saldo', value: `S/ ${CREDITO_MORA.SALDO_PRESENTE}` },
              { label: 'Producto', value: CREDITO_MORA.PRODUCTO },
              { label: 'Celular', value: CREDITO_MORA.CELULAR },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Selector periodo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Periodo de gestión
            </p>
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gestiones */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Gestiones del periodo {periodo}
            </p>
            {isLoading ? (
              <p className="text-xs text-gray-400">Cargando gestiones...</p>
            ) : gestiones?.length > 0 ? (
              <div className="space-y-2">
                {gestiones.map((g: any, i: number) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        g.ESTADO === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        g.ESTADO === 'CUMPLIDO' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>{g.ESTADO || 'DESCONOCIDO'}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Motivo del Retraso</p>
                      <p className="font-medium text-blue-700">{g.MOTIVO_RETRASO || 'Motivo no especificado'}</p>
                      <p className="text-gray-600"><span className="font-medium">Compromiso:</span> {g.COMPROMISO || 'Sin compromiso'}</p>
                      <p className="text-gray-500"><span className="font-medium">Fecha compromiso:</span> {g.FECHA_COMPROMISO || 'Sin fecha'}</p>
                      {g.RESPONSABLE && (
                        <p className="text-gray-500"><span className="font-medium">Responsable:</span> {g.RESPONSABLE}</p>
                      )}
                      <p className="text-gray-400 text-[10px]">ID: {g.ID_GESTION || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                Sin gestiones en este periodo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VerSocioModal;