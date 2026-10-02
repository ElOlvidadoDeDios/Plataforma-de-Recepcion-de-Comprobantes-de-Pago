import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Power } from 'lucide-react';
import { ClienteBasico, searchClientes, TipoDocumento } from '../services/buscarsocio.service';
import { useComboBoxData } from '../../../api/registroDeclientesApi';


type TipoBusqueda = 'cuenta' | 'dni' | 'razon_social';

interface ResultadoBusqueda {
  cuenta: string;
  razonSocial: string;
  estado: string;
  estadoCodigo: string;
  agencia: string;
  documento: string;
  socioData: ClienteBasico;
}

interface BuscadorSocioModalProps {
  onClose: () => void;
  onSeleccionar?: (resultado: ResultadoBusqueda) => void;
}

const BuscadorSocioModal: React.FC<BuscadorSocioModalProps> = ({ onClose, onSeleccionar }) => {
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>('cuenta');
  const { comboData } = useComboBoxData();

  // Campos de búsqueda
  const [cuenta, setCuenta] = useState('');
  const [dni, setDni] = useState('');
  const [razonSocial, setRazonSocial] = useState('');


  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const opciones: { value: TipoBusqueda; label: string }[] = [
    { value: 'cuenta', label: 'Por Cuenta' },
    { value: 'dni', label: 'Por DNI' },
    { value: 'razon_social', label: 'Por Razón Social' },
  ];

  const etiquetaBusqueda =
    tipoBusqueda === 'cuenta' ? 'Buscar por Cuenta' : tipoBusqueda === 'dni' ? 'Buscar por DNI' : 'Buscar por Razón Social';

  const inputClass =
    'px-2 py-1 text-[12px] rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500';

  const estadoSocioMap = useMemo(() => {
    const map = new Map<string, string>();
    (comboData?.ESTADO_SOCIO || []).forEach((estado) => {
      map.set(String(estado.EST_SOCIO).trim(), estado.NOM_ESOCIO);
    });
    return map;
  }, [comboData]);

  const getEstadoNombre = (codigo: string, fallback: string) =>
    estadoSocioMap.get(String(codigo || '').trim()) || fallback;

  const buscarSocios = async () => {
    try {
      setLoading(true);
      setError('');

      let tipoDocumento: TipoDocumento;
      let valorBusqueda = '';

      if (tipoBusqueda === 'cuenta') {
        tipoDocumento = TipoDocumento.CUENTA;
        valorBusqueda = cuenta.trim();
      } else if (tipoBusqueda === 'dni') {
        tipoDocumento = TipoDocumento.DNI;
        valorBusqueda = dni.trim();
      } else {
        tipoDocumento = TipoDocumento.NOMBRE;
        valorBusqueda = `${razonSocial}`.trim();
      }

      if (valorBusqueda.length < 3) {
        setResultados([]);
        setError('Ingrese al menos 3 caracteres para buscar.');
        return;
      }

      const response = await searchClientes(tipoDocumento, valorBusqueda);

      const mapped = (response.data || []).map((item) => ({
        cuenta: item.CUENTA || '',
        razonSocial: item.RAZON_SOCIAL || '',
        estado: item.EST_SOCIO || '',
        estadoCodigo: item.EST_SOCIO || '',
        agencia: item.NOM_AGE || '',
        documento: item.NRO_DI || '',
        socioData: item,
      }));

      setResultados(mapped);

      if (mapped.length === 0) {
        setError('No se encontraron socios con ese criterio.');
      }
    } catch (e: any) {
      setResultados([]);
      setError(e?.message || 'Error al buscar socios.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionar = (resultado: ResultadoBusqueda) => {
    onSeleccionar?.(resultado);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-[#a9d8bf] border border-emerald-800/30 shadow-2xl rounded-sm p-3 sm:p-4 space-y-3">
        {/* Tabs de tipo de búsqueda */}
        <div className="bg-[#c3e6d4] border border-emerald-800/20 rounded-sm px-3 py-2 flex flex-wrap items-center gap-x-6 gap-y-1.5">
          {opciones.map((op) => (
            <label
              key={op.value}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 cursor-pointer"
            >
              <input
                type="radio"
                name="tipoBusqueda"
                checked={tipoBusqueda === op.value}
                onChange={() => setTipoBusqueda(op.value)}
                className="w-3.5 h-3.5 accent-blue-700"
              />
              {op.label}
            </label>
          ))}
        </div>

        {/* Bloque de búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
          <div className="flex-1 border border-emerald-800/20 rounded-sm bg-[#c3e6d4] p-2.5 space-y-1.5">
            <p className="text-[12px] font-semibold text-slate-800">{etiquetaBusqueda}</p>

            {tipoBusqueda === 'cuenta' && (
              <input
                type="text"
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
                autoFocus
                className={`${inputClass} w-full sm:w-56`}
                placeholder="Número de cuenta"
              />
            )}

            {tipoBusqueda === 'dni' && (
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                autoFocus
                maxLength={8}
                className={`${inputClass} w-full sm:w-56`}
                placeholder="Número de DNI"
              />
            )}

            {tipoBusqueda === 'razon_social' && (
              <div className="flex flex-col sm:flex-row gap-1.5">
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  autoFocus
                  className={`${inputClass} flex-1`}
                  placeholder="Razón Social"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            title="Buscar"
            onClick={buscarSocios}
            className="shrink-0 w-full sm:w-11 h-9 rounded-sm bg-white border border-emerald-800/30 flex items-center justify-center hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            disabled={loading}
          >
            <Search className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {error && (
          <div className="px-2 py-1.5 rounded-sm bg-red-50 border border-red-200 text-red-700 text-[11px]">
            {error}
          </div>
        )}

        {/* Tabla de resultados */}
        <div className="border border-slate-800/60 bg-white rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[560px]">
              <thead>
                <tr className="bg-white text-slate-800 border-b border-slate-300">
                  <th className="text-left font-bold px-2 py-1.5 w-28">Cuenta</th>
                  <th className="text-left font-bold px-2 py-1.5">Razón Social</th>
                  <th className="text-left font-bold px-2 py-1.5 w-24">Estado</th>
                  <th className="text-left font-bold px-2 py-1.5 w-32">Agencia</th>
                  <th className="text-left font-bold px-2 py-1.5 w-28">Documento</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 text-[11px] py-10">
                      Buscando socios...
                    </td>
                  </tr>
                ) : resultados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 text-[11px] italic py-10">
                      Sin resultados. Ingresa un criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  resultados.map((r, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleSeleccionar(r)}
                      className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="px-2 py-1.5">{r.cuenta}</td>
                      <td className="px-2 py-1.5">{r.razonSocial}</td>
                      <td className="px-2 py-1.5">{getEstadoNombre(r.estadoCodigo, r.estado)}</td>
                      <td className="px-2 py-1.5">{r.agencia}</td>
                      <td className="px-2 py-1.5">{r.documento}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="h-2 bg-slate-100 border-t border-slate-200" />
        </div>

        {/* Footer con acciones */}
        <div className="flex justify-end items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-sm bg-white border border-slate-400 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-sm leading-tight"
          >
            Ver
            <br />
            Foto
            <br />
            Firma
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            className="w-11 h-11 rounded-sm bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-sm transition"
          >
            <Power className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BuscadorSocioModal;