import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ItemVenta {
  itm: number;
  producto: string;
  um: string;
  cantidad: number;
  pCosto: number;
  valorCalculado: number;
  pVenta: number;
  ventaDelMes: number;
  mg: number;
}

interface VentasModalProps {
  onClose: () => void;
}

const UNIDADES_MEDIDA = ['BOTELLA', 'UNIDAD', 'KG', 'LITRO', 'CAJA', 'PAQUETE'];

const VentasModal: React.FC<VentasModalProps> = ({ onClose }) => {
  const [producto, setProducto] = useState('');
  const [um, setUm] = useState(UNIDADES_MEDIDA[0]);
  const [cantidad, setCantidad] = useState('0');
  const [pCosto, setPCosto] = useState('0.00');
  const [pVenta, setPVenta] = useState('0.00');

  const [items, setItems] = useState<ItemVenta[]>([]);
  const [itmSeleccionado, setItmSeleccionado] = useState<number | null>(null);

  const totalValorCalculado = items.reduce((acc, it) => acc + it.valorCalculado, 0);
  const totalVentaDelMes = items.reduce((acc, it) => acc + it.ventaDelMes, 0);
  const margenPromedio = items.length > 0 ? items.reduce((acc, it) => acc + it.mg, 0) / items.length : 0;

  const limpiarFormulario = () => {
    setProducto('');
    setUm(UNIDADES_MEDIDA[0]);
    setCantidad('0');
    setPCosto('0.00');
    setPVenta('0.00');
    setItmSeleccionado(null);
  };

  const calcularFila = (cant: number, costo: number, venta: number) => {
    const valorCalculado = cant * costo;
    const ventaDelMes = cant * venta;
    const mg = costo > 0 ? ((venta - costo) / costo) * 100 : 0;
    return { valorCalculado, ventaDelMes, mg };
  };

  const handleActualizar = () => {
    if (!producto.trim()) return;
    const cant = parseFloat(cantidad) || 0;
    const costo = parseFloat(pCosto) || 0;
    const venta = parseFloat(pVenta) || 0;
    const { valorCalculado, ventaDelMes, mg } = calcularFila(cant, costo, venta);

    if (itmSeleccionado === null) {
      // Sin fila seleccionada: agrega un nuevo producto
      const nuevoItem: ItemVenta = {
        itm: items.length + 1,
        producto: producto.trim(),
        um,
        cantidad: cant,
        pCosto: costo,
        valorCalculado,
        pVenta: venta,
        ventaDelMes,
        mg,
      };
      setItems((prev) => [...prev, nuevoItem]);
    } else {
      // Con fila seleccionada: actualiza esa fila
      setItems((prev) =>
        prev.map((it) =>
          it.itm === itmSeleccionado
            ? { ...it, producto, um, cantidad: cant, pCosto: costo, valorCalculado, pVenta: venta, ventaDelMes, mg }
            : it
        )
      );
    }
    limpiarFormulario();
  };

  const handleSeleccionarFila = (item: ItemVenta) => {
    setItmSeleccionado(item.itm);
    setProducto(item.producto);
    setUm(item.um);
    setCantidad(String(item.cantidad));
    setPCosto(item.pCosto.toFixed(2));
    setPVenta(item.pVenta.toFixed(2));
  };

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
          <span className="text-[13px] font-semibold text-blue-700">Ventas</span>
          <span className="flex-1 border-t border-dashed border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        </div>

        {/* Formulario de captura */}
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div className="w-full sm:flex-1 sm:min-w-[160px]">
            <label className="text-[12px] text-slate-700 block mb-0.5">Producto</label>
            <input
              type="text"
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              className="w-full px-2 py-1 text-[12px] rounded border border-slate-400 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="w-full sm:w-32">
            <label className="text-[12px] text-slate-700 block mb-0.5">U.M.</label>
            <select
              value={um}
              onChange={(e) => setUm(e.target.value)}
              className="w-full px-2 py-1 text-[12px] rounded border border-slate-400 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="w-1/3 sm:w-20">
            <label className="text-[12px] text-slate-700 block mb-0.5">Cantidad</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="w-1/3 sm:w-24">
            <label className="text-[12px] text-slate-700 block mb-0.5">P.Costo</label>
            <input
              type="number"
              step="0.01"
              value={pCosto}
              onChange={(e) => setPCosto(e.target.value)}
              className="w-full px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="w-1/3 sm:w-24">
            <label className="text-[12px] text-slate-700 block mb-0.5">P.Venta</label>
            <input
              type="number"
              step="0.01"
              value={pVenta}
              onChange={(e) => setPVenta(e.target.value)}
              className="w-full px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Acción única: Actualizar */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleActualizar}
            className="text-[12px] font-semibold text-blue-700 hover:text-blue-900 underline"
          >
            Actualizar
          </button>
        </div>

        {/* Tabla de ítems */}
        <div className="border-2 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[640px]">
              <thead>
                <tr className="bg-[#eef2fb] text-slate-800 border-b border-slate-800">
                  <th className="text-left font-bold px-2 py-1 w-10">Itm</th>
                  <th className="text-left font-bold px-2 py-1">Producto</th>
                  <th className="text-left font-bold px-2 py-1 w-16">U.M.</th>
                  <th className="text-left font-bold px-2 py-1 w-16">Cantidad</th>
                  <th className="text-left font-bold px-2 py-1 w-16">P.Costo</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Valor Calculado</th>
                  <th className="text-left font-bold px-2 py-1 w-16">P.Venta</th>
                  <th className="text-left font-bold px-2 py-1 w-20">Venta del Mes</th>
                  <th className="text-left font-bold px-2 py-1 w-14">M.G.</th>
                </tr>
              </thead>
              <tbody className="bg-[#fdf6d3]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-32 text-center text-slate-400 italic text-[11px]">
                      Sin productos agregados
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
                        <td className="px-2 py-1">{it.producto}</td>
                        <td className="px-2 py-1">{it.um}</td>
                        <td className="px-2 py-1">{it.cantidad}</td>
                        <td className="px-2 py-1">{formatoMiles(it.pCosto)}</td>
                        <td className="px-2 py-1">{formatoMiles(it.valorCalculado)}</td>
                        <td className="px-2 py-1">{formatoMiles(it.pVenta)}</td>
                        <td className="px-2 py-1">{formatoMiles(it.ventaDelMes)}</td>
                        <td className="px-2 py-1">{it.mg.toFixed(1)}%</td>
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

        {/* Totales: Valor Calculado / Venta del Mes / M.G. promedio */}
        <div className="flex flex-wrap justify-end gap-2">
          <input
            type="text"
            readOnly
            value={formatoMiles(totalValorCalculado)}
            title="Total Valor Calculado"
            className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
          <input
            type="text"
            readOnly
            value={formatoMiles(totalVentaDelMes)}
            title="Total Venta del Mes"
            className="w-28 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
          <input
            type="text"
            readOnly
            value={`${margenPromedio.toFixed(1)}%`}
            title="M.G. Promedio"
            className="w-16 px-2 py-1 text-[12px] text-right rounded border border-slate-400 bg-[#fdf6d3] text-slate-800"
          />
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm border border-slate-400 bg-white text-blue-700 text-[12px] font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            Cerrar Ventas
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VentasModal;