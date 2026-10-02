import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ItemGasto {
  itm: number;
  concepto: string;
  importe: number;
}

interface GastosModalProps {
  onClose: () => void;
}

const GASTOS_ADMINISTRATIVOS = ['AGUA', 'LUZ', 'TELÉFONO', 'INTERNET', 'ALQUILER LOCAL', 'OTROS'];
const GASTOS_FAMILIARES = ['AGUA', 'LUZ', 'TELÉFONO', 'ALIMENTACIÓN', 'EDUCACIÓN', 'SALUD', 'TRANSPORTE', 'OTROS'];

/* ---------- Subcomponente: una tabla de gastos (Administrativo o Familiar) ---------- */
const TablaGasto: React.FC<{
  titulo: string;
  opciones: string[];
}> = ({ titulo, opciones }) => {
  const [concepto, setConcepto] = useState(opciones[0]);
  const [importe, setImporte] = useState('0.00');
  const [items, setItems] = useState<ItemGasto[]>([]);

  const total = items.reduce((acc, it) => acc + it.importe, 0);

  const formatoMiles = (n: number) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const agregarItem = () => {
    const valor = parseFloat(importe) || 0;
    if (valor <= 0) return;
    setItems((prev) => [...prev, { itm: prev.length + 1, concepto, importe: valor }]);
    setImporte('0.00');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarItem();
    }
  };

  return (
    <div className="flex-1 min-w-0 space-y-2">
      {/* Selector + Importe */}
      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-[12px] text-slate-700 block mb-0.5">{titulo}</label>
          <select
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full px-2 py-1 text-[12px] rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {opciones.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24 shrink-0">
          <label className="text-[12px] text-slate-700 block mb-0.5">Importe</label>
          <input
            type="number"
            step="0.01"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            onKeyDown={handleKeyDown}
            title="Presiona Enter para agregar"
            className="w-full px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="border-2 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[220px]">
            <thead>
              <tr className="bg-[#eef2fb] text-slate-800 border-b border-slate-800">
                <th className="text-left font-bold px-2 py-1 w-10">Itm</th>
                <th className="text-left font-bold px-2 py-1">{titulo}</th>
                <th className="text-left font-bold px-2 py-1 w-20">Importe</th>
              </tr>
            </thead>
            <tbody className="bg-[#fdf6d3]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="h-40 text-center text-slate-400 italic text-[11px]">
                    Sin gastos agregados
                  </td>
                </tr>
              ) : (
                <>
                  {items.map((it) => (
                    <tr key={it.itm} className="border-b border-slate-200">
                      <td className="px-2 py-1">{it.itm}</td>
                      <td className="px-2 py-1">{it.concepto}</td>
                      <td className="px-2 py-1">{formatoMiles(it.importe)}</td>
                    </tr>
                  ))}
                  {items.length < 8 &&
                    Array.from({ length: 8 - items.length }).map((_, idx) => (
                      <tr key={`vacio-${idx}`} className="border-b border-slate-100">
                        <td className="px-2 py-1">&nbsp;</td>
                        <td className="px-2 py-1" />
                        <td className="px-2 py-1" />
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end">
        <input
          type="text"
          readOnly
          value={formatoMiles(total)}
          className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
        />
      </div>
    </div>
  );
};

const GastosModal: React.FC<GastosModalProps> = ({ onClose }) => {
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-[#eef2fb] border border-slate-300 shadow-2xl rounded-sm p-3 space-y-3 max-h-[92vh] overflow-y-auto">
        {/* Título con línea decorativa */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-blue-700">Gastos</span>
          <span className="flex-1 border-t border-dashed border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        </div>

        {/* Dos tablas lado a lado */}
        <div className="flex flex-col sm:flex-row gap-4">
          <TablaGasto titulo="Gasto Administrativo" opciones={GASTOS_ADMINISTRATIVOS} />
          <TablaGasto titulo="Gasto Familiar" opciones={GASTOS_FAMILIARES} />
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm border border-slate-400 bg-white text-blue-700 text-[12px] font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            Cerrar Gastos
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GastosModal;