import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ItemInventario {
  itm: number;
  tipoProd: string;
  descripcion: string;
  um: string;
  cantidad: number;
  costo: number;
  valCalculado: number;
}

interface InventarioModalProps {
  onClose: () => void;
}

const TIPOS_PRODUCTO = ['MATERIA PRIMA', 'PRODUCTO TERMINADO', 'MERCADERÍA', 'INSUMOS'];
const UNIDADES_MEDIDA = ['BOTELLA', 'UNIDAD', 'KG', 'LITRO', 'CAJA', 'PAQUETE'];

export const InventarioModal: React.FC<InventarioModalProps> = ({ onClose }) => {
  const [tipoProducto, setTipoProducto] = useState(TIPOS_PRODUCTO[0]);
  const [descripcion, setDescripcion] = useState('');
  const [um, setUm] = useState(UNIDADES_MEDIDA[0]);
  const [cantidad, setCantidad] = useState('0');
  const [costo, setCosto] = useState('0.00');

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [itmSeleccionado, setItmSeleccionado] = useState<number | null>(null);

  const total = items.reduce((acc, it) => acc + it.valCalculado, 0);

  const limpiarFormulario = () => {
    setTipoProducto(TIPOS_PRODUCTO[0]);
    setDescripcion('');
    setUm(UNIDADES_MEDIDA[0]);
    setCantidad('0');
    setCosto('0.00');
    setItmSeleccionado(null);
  };

  const handleAgregar = () => {
    if (!descripcion.trim()) return;
    const cant = parseFloat(cantidad) || 0;
    const cst = parseFloat(costo) || 0;
    const nuevoItem: ItemInventario = {
      itm: items.length + 1,
      tipoProd: tipoProducto,
      descripcion: descripcion.trim(),
      um,
      cantidad: cant,
      costo: cst,
      valCalculado: cant * cst,
    };
    setItems((prev) => [...prev, nuevoItem]);
    limpiarFormulario();
  };

  const handleActualizar = () => {
    if (itmSeleccionado === null) return;
    const cant = parseFloat(cantidad) || 0;
    const cst = parseFloat(costo) || 0;
    setItems((prev) =>
      prev.map((it) =>
        it.itm === itmSeleccionado
          ? { ...it, tipoProd: tipoProducto, descripcion, um, cantidad: cant, costo: cst, valCalculado: cant * cst }
          : it
      )
    );
    limpiarFormulario();
  };

  const handleSeleccionarFila = (item: ItemInventario) => {
    setItmSeleccionado(item.itm);
    setTipoProducto(item.tipoProd);
    setDescripcion(item.descripcion);
    setUm(item.um);
    setCantidad(String(item.cantidad));
    setCosto(item.costo.toFixed(2));
  };

  const inputClass =
    'w-full px-2 py-1 text-[12px] rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'text-[12px] text-slate-700 block mb-0.5';

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-[#eef2fb] border border-slate-300 shadow-2xl rounded-sm p-3 space-y-3">
        {/* Título con línea decorativa */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-blue-700">Inventario</span>
          <span className="flex-1 border-t border-dashed border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        </div>

        {/* Formulario de captura */}
        <div className="flex flex-wrap items-end gap-2 sm:gap-2.5">
          <div className="w-full sm:w-28">
            <label className={labelClass}>Tipo de Producto</label>
            <select value={tipoProducto} onChange={(e) => setTipoProducto(e.target.value)} className={inputClass}>
              {TIPOS_PRODUCTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[120px]">
            <label className={labelClass}>Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="w-full sm:w-20">
            <label className={labelClass}>U.M.</label>
            <select value={um} onChange={(e) => setUm(e.target.value)} className={inputClass}>
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="w-1/2 sm:w-16">
            <label className={labelClass}>Cantidad</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/2 sm:w-20">
            <label className={labelClass}>Costo</label>
            <input
              type="number"
              step="0.01"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              className={`${inputClass} text-right`}
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
            <table className="w-full text-[11px] min-w-[480px]">
              <thead>
                <tr className="bg-[#eef2fb] text-slate-800 border-b border-slate-800">
                  <th className="text-left font-bold px-2 py-1 w-10">Itm</th>
                  <th className="text-left font-bold px-2 py-1 w-28">Tipo Prod</th>
                  <th className="text-left font-bold px-2 py-1">Descripción</th>
                  <th className="text-left font-bold px-2 py-1 w-16">U.M.</th>
                  <th className="text-left font-bold px-2 py-1 w-14">Cant.</th>
                  <th className="text-left font-bold px-2 py-1 w-16">Costo</th>
                  <th className="text-left font-bold px-2 py-1 w-24">Val.Calculado</th>
                </tr>
              </thead>
              <tbody className="bg-[#fdf6d3]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-slate-400 italic text-[11px]">
                      Sin productos agregados
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr
                      key={it.itm}
                      onClick={() => handleSeleccionarFila(it)}
                      className={`border-b border-slate-200 cursor-pointer hover:bg-[#f7ecb8] ${
                        itmSeleccionado === it.itm ? 'bg-[#f2e19a]' : ''
                      }`}
                    >
                      <td className="px-2 py-1">{it.itm}</td>
                      <td className="px-2 py-1">{it.tipoProd}</td>
                      <td className="px-2 py-1">{it.descripcion}</td>
                      <td className="px-2 py-1">{it.um}</td>
                      <td className="px-2 py-1">{it.cantidad}</td>
                      <td className="px-2 py-1">{it.costo.toFixed(2)}</td>
                      <td className="px-2 py-1">{it.valCalculado.toFixed(2)}</td>
                    </tr>
                  ))
                )}
                {/* Filas de relleno para conservar la altura de la tabla como en la imagen */}
                {items.length > 0 &&
                  items.length < 6 &&
                  Array.from({ length: 6 - items.length }).map((_, idx) => (
                    <tr key={`vacio-${idx}`} className="border-b border-slate-100">
                      <td className="px-2 py-1">&nbsp;</td>
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

        {/* Total */}
        <div className="flex justify-end">
          <input
            type="text"
            readOnly
            value={total.toFixed(2)}
            className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm border border-slate-400 bg-white text-blue-700 text-[12px] font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            Cerrar Inventario
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InventarioModal;