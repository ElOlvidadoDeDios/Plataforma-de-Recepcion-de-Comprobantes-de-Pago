import React, { useState } from 'react';
import { createPortal } from 'react-dom';

type Garantia = 'si' | 'no';

interface ItemPasivo {
  itm: number;
  tipoDeuda: string;
  descripcion: string;
  tipoCredito: string;
  prestamoOriginal: number;
  montoPendiente: number;
  plazoPendiente: number;
  gar: Garantia;
  cuotaMensual: number;
  plazo: number;
}

interface PasivoModalProps {
  onClose: () => void;
}

const TIPOS_DEUDA = ['CORTO PLAZO', 'LARGO PLAZO'];

const PasivoModal: React.FC<PasivoModalProps> = ({ onClose }) => {
  const [tipoDeuda, setTipoDeuda] = useState(TIPOS_DEUDA[0]);
  const [descripcion, setDescripcion] = useState('');
  const [prestamoOriginal, setPrestamoOriginal] = useState('0.00');
  const [montoPendiente, setMontoPendiente] = useState('0.00');
  const [plazoPendiente, setPlazoPendiente] = useState('0');
  const [gar, setGar] = useState<Garantia>('no');
  const [cuotaMensual, setCuotaMensual] = useState('0.00');
  const [plazo, setPlazo] = useState('0');
  const [tipoCredito, setTipoCredito] = useState('');

  const [items, setItems] = useState<ItemPasivo[]>([]);
  const [itmSeleccionado, setItmSeleccionado] = useState<number | null>(null);

  // Otros pasivos (independientes de la tabla)
  const [otrosPasivosCP, setOtrosPasivosCP] = useState('0.00');
  const [otrosPasivosLP, setOtrosPasivosLP] = useState('0.00');

  const totalMontoPendiente = items.reduce((acc, it) => acc + it.montoPendiente, 0);
  const totalCuotaMensual = items.reduce((acc, it) => acc + it.cuotaMensual, 0);

  const limpiarFormulario = () => {
    setTipoDeuda(TIPOS_DEUDA[0]);
    setDescripcion('');
    setPrestamoOriginal('0.00');
    setMontoPendiente('0.00');
    setPlazoPendiente('0');
    setGar('no');
    setCuotaMensual('0.00');
    setPlazo('0');
    setTipoCredito('');
    setItmSeleccionado(null);
  };

  const handleAgregar = () => {
    if (!descripcion.trim()) return;
    const nuevoItem: ItemPasivo = {
      itm: items.length + 1,
      tipoDeuda,
      descripcion: descripcion.trim(),
      tipoCredito: tipoCredito.trim(),
      prestamoOriginal: parseFloat(prestamoOriginal) || 0,
      montoPendiente: parseFloat(montoPendiente) || 0,
      plazoPendiente: parseFloat(plazoPendiente) || 0,
      gar,
      cuotaMensual: parseFloat(cuotaMensual) || 0,
      plazo: parseFloat(plazo) || 0,
    };
    setItems((prev) => [...prev, nuevoItem]);
    limpiarFormulario();
  };

  const handleActualizar = () => {
    if (itmSeleccionado === null) return;
    setItems((prev) =>
      prev.map((it) =>
        it.itm === itmSeleccionado
          ? {
              ...it,
              tipoDeuda,
              descripcion,
              tipoCredito,
              prestamoOriginal: parseFloat(prestamoOriginal) || 0,
              montoPendiente: parseFloat(montoPendiente) || 0,
              plazoPendiente: parseFloat(plazoPendiente) || 0,
              gar,
              cuotaMensual: parseFloat(cuotaMensual) || 0,
              plazo: parseFloat(plazo) || 0,
            }
          : it
      )
    );
    limpiarFormulario();
  };

  const handleSeleccionarFila = (item: ItemPasivo) => {
    setItmSeleccionado(item.itm);
    setTipoDeuda(item.tipoDeuda);
    setDescripcion(item.descripcion);
    setTipoCredito(item.tipoCredito);
    setPrestamoOriginal(item.prestamoOriginal.toFixed(2));
    setMontoPendiente(item.montoPendiente.toFixed(2));
    setPlazoPendiente(String(item.plazoPendiente));
    setGar(item.gar);
    setCuotaMensual(item.cuotaMensual.toFixed(2));
    setPlazo(String(item.plazo));
  };

  const inputClass =
    'w-full px-2 py-1 text-[12px] rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'text-[12px] text-slate-700 block mb-0.5 whitespace-nowrap';

  const formatoMiles = (n: number) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-6xl bg-[#eef2fb] border border-slate-300 shadow-2xl rounded-sm p-3 space-y-3 max-h-[92vh] overflow-y-auto">
        {/* Título con línea decorativa */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-blue-700">Pasivo</span>
          <span className="flex-1 border-t border-dashed border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        </div>

        {/* Formulario de captura - fila 1 */}
        <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-2">
          <div className="w-full sm:w-28 sm:shrink-0">
            <label className={labelClass}>Tipo Deuda</label>
            <select value={tipoDeuda} onChange={(e) => setTipoDeuda(e.target.value)} className={inputClass}>
              {TIPOS_DEUDA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[180px]">
            <label className={labelClass}>Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="w-1/2 sm:w-24 sm:shrink-0">
            <label className={labelClass}>
              Préstamo
              <br />
              Original
            </label>
            <input
              type="number"
              step="0.01"
              value={prestamoOriginal}
              onChange={(e) => setPrestamoOriginal(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/2 sm:w-24 sm:shrink-0">
            <label className={labelClass}>Monto Pendiente</label>
            <input
              type="number"
              step="0.01"
              value={montoPendiente}
              onChange={(e) => setMontoPendiente(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/3 sm:w-20 sm:shrink-0">
            <label className={labelClass}>Plazo Pendiente</label>
            <input
              type="number"
              value={plazoPendiente}
              onChange={(e) => setPlazoPendiente(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/3 sm:w-auto sm:shrink-0">
            <label className={labelClass}>Gar</label>
            <div className="flex items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-1 text-[12px] text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="garantia"
                  checked={gar === 'si'}
                  onChange={() => setGar('si')}
                  className="w-3.5 h-3.5 accent-blue-700"
                />
                Si
              </label>
              <label className="inline-flex items-center gap-1 text-[12px] text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="garantia"
                  checked={gar === 'no'}
                  onChange={() => setGar('no')}
                  className="w-3.5 h-3.5 accent-blue-700"
                />
                No
              </label>
            </div>
          </div>

          <div className="w-1/2 sm:w-24 sm:shrink-0">
            <label className={labelClass}>Cuota Mensual</label>
            <input
              type="number"
              step="0.01"
              value={cuotaMensual}
              onChange={(e) => setCuotaMensual(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/2 sm:w-16 sm:shrink-0">
            <label className={labelClass}>Plazo</label>
            <input
              type="number"
              value={plazo}
              onChange={(e) => setPlazo(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>
        </div>

        {/* Formulario de captura - fila 2: Tipo de Crédito, alineado bajo Descripción */}
        <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-2">
          <div className="hidden sm:block sm:w-28 sm:shrink-0" />
          <div className="w-full sm:flex-1 sm:min-w-[180px] sm:max-w-[320px]">
            <label className={labelClass}>Tipo de Crédito</label>
            <input
              type="text"
              value={tipoCredito}
              onChange={(e) => setTipoCredito(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            onClick={handleActualizar}
            disabled={itmSeleccionado === null}
            className="text-[12px] font-semibold text-blue-700 hover:text-blue-900 underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleAgregar}
            className="text-[12px] font-semibold text-blue-700 hover:text-blue-900 underline"
          >
            Agregar
          </button>
        </div>

        {/* Tabla de ítems */}
        <div className="border-2 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[720px]">
              <thead>
                <tr className="bg-[#eef2fb] text-slate-800 border-b border-slate-800">
                  <th className="text-left font-bold px-2 py-1 w-10">Itm</th>
                  <th className="text-left font-bold px-2 py-1 w-24">Tipo Deuda</th>
                  <th className="text-left font-bold px-2 py-1">Descripción</th>
                  <th className="text-left font-bold px-2 py-1 w-24">Tipo Crédito</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Préstamo Original</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Monto Pendiente</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Plazo Pendiente</th>
                  <th className="text-left font-bold px-2 py-1 w-10">Gar</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Cuota Mensual</th>
                  <th className="text-left font-bold px-2 py-1 w-14">Plazo</th>
                </tr>
              </thead>
              <tbody className="bg-[#fdf6d3]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="h-32 text-center text-slate-400 italic text-[11px]">
                      Sin pasivos agregados
                    </td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const seleccionado = itmSeleccionado === it.itm;
                    return (
                      <tr
                        key={it.itm}
                        onClick={() => handleSeleccionarFila(it)}
                        className={`border-b border-slate-200 cursor-pointer ${
                          seleccionado ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-[#f7ecb8]'
                        }`}
                      >
                        <td className="px-2 py-1">{it.itm}</td>
                        <td className="px-2 py-1">{it.tipoDeuda}</td>
                        <td className="px-2 py-1">{it.descripcion}</td>
                        <td className="px-2 py-1">{it.tipoCredito}</td>
                        <td className="px-2 py-1">{formatoMiles(it.prestamoOriginal)}</td>
                        <td className="px-2 py-1">{formatoMiles(it.montoPendiente)}</td>
                        <td className="px-2 py-1">{it.plazoPendiente}</td>
                        <td className="px-2 py-1">{it.gar === 'si' ? 'Si' : 'No'}</td>
                        <td className="px-2 py-1">{formatoMiles(it.cuotaMensual)}</td>
                        <td className="px-2 py-1">{it.plazo}</td>
                      </tr>
                    );
                  })
                )}
                {/* Filas de relleno para conservar la altura de la tabla como en la imagen */}
                {items.length > 0 &&
                  items.length < 5 &&
                  Array.from({ length: 5 - items.length }).map((_, idx) => (
                    <tr key={`vacio-${idx}`} className="border-b border-slate-100">
                      <td className="px-2 py-1">&nbsp;</td>
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales: Monto Pendiente / Cuota Mensual */}
        <div className="flex justify-end gap-2">
          <input
            type="text"
            readOnly
            value={formatoMiles(totalMontoPendiente)}
            title="Total Monto Pendiente"
            className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
          <input
            type="text"
            readOnly
            value={formatoMiles(totalCuotaMensual)}
            title="Total Cuota Mensual"
            className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
        </div>

        {/* Otros Pasivos CP / LP */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-slate-800 w-32 shrink-0">Otros Pasivos CP</label>
            <input
              type="number"
              step="0.01"
              value={otrosPasivosCP}
              onChange={(e) => setOtrosPasivosCP(e.target.value)}
              className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-slate-800 w-32 shrink-0">Otros Pasivos LP</label>
            <input
              type="number"
              step="0.01"
              value={otrosPasivosLP}
              onChange={(e) => setOtrosPasivosLP(e.target.value)}
              className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm border border-slate-400 bg-white text-blue-700 text-[12px] font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            Cerrar Pasivo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PasivoModal;