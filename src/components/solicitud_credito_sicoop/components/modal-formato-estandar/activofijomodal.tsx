import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ItemActivoFijo {
  itm: number;
  tipoActivo: string;
  descripcion: string;
  antiguedad: number;
  usoPrevisto: number;
  cantidad: number;
  valorUnit: number;
  valorTotal: number;
  depreciacion: number;
}

interface ActivoFijoModalProps {
  onClose: () => void;
}

const TIPOS_ACTIVO = ['MAQUINARIAS Y EQUIPOS', 'MUEBLES Y ENSERES', 'EQUIPOS DE COMPUTO', 'VEHÍCULOS', 'HERRAMIENTAS'];

const ActivoFijoModal: React.FC<ActivoFijoModalProps> = ({ onClose }) => {
  const [tipoActivo, setTipoActivo] = useState(TIPOS_ACTIVO[0]);
  const [descripcion, setDescripcion] = useState('');
  const [antiguedad, setAntiguedad] = useState('0');
  const [usoPrevisto, setUsoPrevisto] = useState('0');
  const [cantidad, setCantidad] = useState('0');
  const [valorUnit, setValorUnit] = useState('0.00');

  const [items, setItems] = useState<ItemActivoFijo[]>([]);
  const [itmSeleccionado, setItmSeleccionado] = useState<number | null>(null);

  const total = items.reduce((acc, it) => acc + it.valorTotal, 0);

  const calcularDepreciacion = (valTotal: number, vidaUtilAnios: number) => {
    if (!vidaUtilAnios) return 0;
    // Depreciación mensual estimada (línea recta)
    return valTotal / (vidaUtilAnios * 12);
  };

  const limpiarFormulario = () => {
    setTipoActivo(TIPOS_ACTIVO[0]);
    setDescripcion('');
    setAntiguedad('0');
    setUsoPrevisto('0');
    setCantidad('0');
    setValorUnit('0.00');
    setItmSeleccionado(null);
  };

  const handleAgregar = () => {
    if (!descripcion.trim()) return;
    const ant = parseFloat(antiguedad) || 0;
    const uso = parseFloat(usoPrevisto) || 0;
    const cant = parseFloat(cantidad) || 0;
    const vUnit = parseFloat(valorUnit) || 0;
    const vTotal = cant * vUnit;

    const nuevoItem: ItemActivoFijo = {
      itm: items.length + 1,
      tipoActivo,
      descripcion: descripcion.trim(),
      antiguedad: ant,
      usoPrevisto: uso,
      cantidad: cant,
      valorUnit: vUnit,
      valorTotal: vTotal,
      depreciacion: calcularDepreciacion(vTotal, uso),
    };
    setItems((prev) => [...prev, nuevoItem]);
    limpiarFormulario();
  };

  const handleActualizar = () => {
    if (itmSeleccionado === null) return;
    const ant = parseFloat(antiguedad) || 0;
    const uso = parseFloat(usoPrevisto) || 0;
    const cant = parseFloat(cantidad) || 0;
    const vUnit = parseFloat(valorUnit) || 0;
    const vTotal = cant * vUnit;

    setItems((prev) =>
      prev.map((it) =>
        it.itm === itmSeleccionado
          ? {
              ...it,
              tipoActivo,
              descripcion,
              antiguedad: ant,
              usoPrevisto: uso,
              cantidad: cant,
              valorUnit: vUnit,
              valorTotal: vTotal,
              depreciacion: calcularDepreciacion(vTotal, uso),
            }
          : it
      )
    );
    limpiarFormulario();
  };

  const handleSeleccionarFila = (item: ItemActivoFijo) => {
    setItmSeleccionado(item.itm);
    setTipoActivo(item.tipoActivo);
    setDescripcion(item.descripcion);
    setAntiguedad(String(item.antiguedad));
    setUsoPrevisto(String(item.usoPrevisto));
    setCantidad(String(item.cantidad));
    setValorUnit(item.valorUnit.toFixed(2));
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
      <div className="w-full max-w-3xl bg-[#eef2fb] border border-slate-300 shadow-2xl rounded-sm p-3 space-y-3">
        {/* Título con línea decorativa */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-blue-700">Activo Fijo</span>
          <span className="flex-1 border-t border-dashed border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        </div>

        {/* Formulario de captura */}
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div className="w-full sm:w-44">
            <label className={labelClass}>Tipo de Activo</label>
            <select value={tipoActivo} onChange={(e) => setTipoActivo(e.target.value)} className={inputClass}>
              {TIPOS_ACTIVO.map((t) => (
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

          <div className="w-1/2 sm:w-20">
            <label className={labelClass}>Antiguedad</label>
            <input
              type="number"
              value={antiguedad}
              onChange={(e) => setAntiguedad(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/2 sm:w-24">
            <label className={labelClass}>Uso Previsto</label>
            <input
              type="number"
              value={usoPrevisto}
              onChange={(e) => setUsoPrevisto(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/2 sm:w-20">
            <label className={labelClass}>Cantidad</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </div>

          <div className="w-1/2 sm:w-24">
            <label className={labelClass}>Valor Unit.</label>
            <input
              type="number"
              step="0.01"
              value={valorUnit}
              onChange={(e) => setValorUnit(e.target.value)}
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
            <table className="w-full text-[11px] min-w-[680px]">
              <thead>
                <tr className="bg-[#eef2fb] text-slate-800 border-b border-slate-800">
                  <th className="text-left font-bold px-2 py-1 w-10">Itm</th>
                  <th className="text-left font-bold px-2 py-1 w-32">Tipo Activo</th>
                  <th className="text-left font-bold px-2 py-1">Descripción</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Antiguedad</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Uso Previsto</th>
                  <th className="text-left font-bold px-2 py-1 w-16">Cantidad</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Valor Unit.</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Valor Total</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Depreciación</th>
                </tr>
              </thead>
              <tbody className="bg-[#fdf6d3]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-32 text-center text-slate-400 italic text-[11px]">
                      Sin activos agregados
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
                          seleccionado ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-[#f7ecb8]'
                        }`}
                      >
                        <td className={`px-2 py-1 ${seleccionado ? 'text-white' : 'text-slate-800'}`}>{it.itm}</td>
                        <td className="px-2 py-1 truncate max-w-[8rem]">{it.tipoActivo}</td>
                        <td className={`px-2 py-1 ${seleccionado ? 'text-white' : 'text-slate-800'}`}>
                          {it.descripcion}
                        </td>
                        <td className="px-2 py-1">{it.antiguedad}</td>
                        <td className="px-2 py-1">{it.usoPrevisto}</td>
                        <td className="px-2 py-1">{it.cantidad}</td>
                        <td className="px-2 py-1">{formatoMiles(it.valorUnit)}</td>
                        <td className="px-2 py-1">{formatoMiles(it.valorTotal)}</td>
                        <td className="px-2 py-1">{it.depreciacion.toFixed(2)}</td>
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
            value={formatoMiles(total)}
            className="w-32 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm border border-slate-400 bg-white text-blue-700 text-[12px] font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            Cerrar Activo Fijo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActivoFijoModal;