import React, { useState } from 'react';
import { InventarioModal } from './modal-formato-estandar/inventariomodal';
import ActivoFijoModal from './modal-formato-estandar/activofijomodal';
import PasivoModal from './modal-formato-estandar/pasivomodal';

/* ---------- Subcomponentes de UI ---------- */

const Campo: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div>
    <label className="text-[10px] text-slate-600 block mb-0.5 whitespace-nowrap">{label}</label>
    <input
      type="text"
      defaultValue="0.00"
      disabled={!enabled}
      className={`w-full px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 ${enabled ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
    />
  </div>
);

const CampoVacio: React.FC = () => <div className="hidden sm:block" />;

const FilaTotal: React.FC<{ label: string; bold?: boolean; enabled: boolean }> = ({ label, bold, enabled }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
    <p className={`text-[12px] ${bold ? 'font-bold' : 'font-semibold'} text-slate-800`}>{label}</p>
    <input
      type="text"
      defaultValue="0.00"
      disabled={!enabled}
      className={`w-full sm:w-32 px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 shrink-0 ${enabled ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
    />
  </div>
);

interface BalanceSituacionFormProps {
  enabled?: boolean;
  compact?: boolean;
}

const BalanceSituacionForm: React.FC<BalanceSituacionFormProps> = ({
  enabled = false,
  compact = false,
}) => {
  const [mostrarInventarioModal, setMostrarInventarioModal] = useState(false);
  const [mostrarActivoFijoModal, setMostrarActivoFijoModal] = useState(false);
  const [mostrarPasivoModal, setMostrarPasivoModal] = useState(false);
  const [sinInventario, setSinInventario] = useState(false);

  const handleClickInventario = () => {
    if (!enabled || sinInventario) return;
    setMostrarInventarioModal(true);
  };

  const handleClickActivoFijo = () => {
    if (!enabled) return;
    setMostrarActivoFijoModal(true);
  };

  const handleClickPasivo = () => {
    if (!enabled) return;
    setMostrarPasivoModal(true);
  };

  return (
    <>
      <div className={`w-full flex justify-center px-2 ${compact ? 'bg-transparent py-1' : 'bg-slate-100 min-h-screen py-4'}`}>
        <div className={`w-full border border-slate-300 bg-[#dce8f5] p-3 sm:p-4 ${compact ? '' : 'max-w-6xl'}`}>
        {/* Título */}
        <p className="text-[12px] text-slate-700 border-b border-slate-400 pb-1 mb-3">
          Balance de Situación (Estándar)
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {/* ============ COLUMNA IZQUIERDA: ACTIVO / PASIVO ============ */}
          <div className="space-y-3">
            <p className="font-bold text-[12px] text-slate-800">ACTIVO</p>

            <div className="space-y-2">
              <p className="font-bold text-[12px] text-slate-800">A). Activo Corriente</p>

              <div className="pl-2 space-y-2">
                <p className="text-[12px] font-semibold text-slate-700">Disponible</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Campo label="Efectivo" enabled={enabled} />
                  <Campo label="Cta de Ahorros" enabled={enabled} />
                  <Campo label="Otros" enabled={enabled} />
                  <Campo label="TotalDisponible" enabled={enabled} />
                </div>

                <FilaTotal label="Cuentas por Cobrar" enabled={enabled} />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleClickInventario}
                    className="text-[12px] text-blue-700 underline font-bold hover:text-blue-900"
                  >
                    Inventario
                  </button>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSinInventario(checked);
                        if (checked) {
                          setMostrarInventarioModal(false);
                        }
                      }}
                      disabled={!enabled}
                      className="w-3.5 h-3.5 accent-blue-700 disabled:cursor-not-allowed"
                    />
                    Sin Inventario
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Campo label="Mercadería" enabled={enabled} />
                  <Campo label="Materia Prima" enabled={enabled} />
                  <Campo label="Otros" enabled={enabled} />
                  <Campo label="TotalInventario" enabled={enabled} />
                </div>
              </div>

              <FilaTotal label="Total Activo Corriente" bold enabled={enabled} />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleClickActivoFijo}
                className="text-[12px] text-blue-700 underline font-bold hover:text-blue-900"
              >
              B). Activo No Corriente
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Campo label="Muebles y Enseres" enabled={enabled} />
                <Campo label="Maquinarias y Equipos" enabled={enabled} />
                <Campo label="Terrenos e Inmuebles" enabled={enabled} />
              </div>
            </div>

            <FilaTotal label="Total Activo No Corriente" bold enabled={enabled} />
            <FilaTotal label="TOTAL Activo" bold enabled={enabled} />

            <div className="space-y-2 pt-2">
              <p className="font-bold text-[12px] text-slate-800">PASIVO</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <button
                  type="button"
                  onClick={handleClickPasivo}
                  className="text-left text-[12px] text-blue-700 underline font-bold hover:text-blue-900"
                >
                  A). Pasivo
                </button>
                <input
                  type="text"
                  defaultValue="0.00"
                  disabled={!enabled}
                  className={`w-full sm:w-32 px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 shrink-0 ${enabled ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
                />
              </div>
              <FilaTotal label="B). Patrimonio" enabled={enabled} />
              <FilaTotal label="TOTAL Pasivo + Patrimonio" bold enabled={enabled} />
            </div>
          </div>

          {/* ============ COLUMNA DERECHA: EVALUACIÓN ECONÓMICA ============ */}
          <div className="space-y-3">
            <p className="font-bold text-[12px] text-slate-800">EVALUACIÓN ECONÓMICA</p>
            <p className="font-bold text-[12px] text-slate-800">Rubros / Conceptos</p>

            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <button type="button" className="text-left text-[12px] text-blue-700 underline font-bold hover:text-blue-900">
                    A) Ventas
                    </button>
                <input
                  type="text"
                  defaultValue="0.00"
                  disabled={!enabled}
                  className={`w-full sm:w-32 px-1.5 py-1 text-[11px] text-right rounded border border-slate-300 shrink-0 ${enabled ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600 cursor-not-allowed'}`}
                />
              </div>
              <FilaTotal label="B) Costo de Ventas" enabled={enabled} />
              <FilaTotal label="C) Utilidad Bruta" bold enabled={enabled} />

              <div className="space-y-2 pt-1">
                <button type="button" className="text-[12px] text-blue-700 underline font-bold hover:text-blue-900">
                   D) Gastos de Administración
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Campo label="Personal" enabled={enabled} />
                  <Campo label="Alquiler" enabled={enabled} />
                  <Campo label="Impuestos" enabled={enabled} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Campo label="Cuotas a Bancos" enabled={enabled} />
                  <Campo label="Otros" enabled={enabled} />
                  <Campo label="Total" enabled={enabled} />
                </div>
              </div>

              <FilaTotal label="E) Otros Ingresos" enabled={enabled} />
              <FilaTotal label="F) Utilidad Operativa" bold enabled={enabled} />

              <div className="space-y-2 pt-1">
                <button type="button" className="text-[12px] text-blue-700 underline font-bold hover:text-blue-900">
                    G) Gastos Familiares
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Campo label="Alimentación" enabled={enabled} />
                  <Campo label="Educación" enabled={enabled} />
                  <Campo label="Alquiler" enabled={enabled} />
                  <Campo label="Transporte" enabled={enabled} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Campo label="Salud" enabled={enabled} />
                  <Campo label="Otros Gastos" enabled={enabled} />
                  <CampoVacio />
                  <Campo label="Total" enabled={enabled} />
                </div>
              </div>

              <FilaTotal label="H) Saldo Disponible" bold enabled={enabled} />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                disabled={!enabled}
                className="flex-1 sm:flex-none sm:w-40 px-3 py-2 rounded-sm border border-slate-400 bg-white text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-sm leading-tight transition"
              >
                Visualizar Última Evaluación
              </button>
              <button
                type="button"
                disabled={!enabled}
                className="flex-1 sm:flex-none sm:w-40 px-3 py-2 rounded-sm border border-slate-400 bg-white text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-sm leading-tight transition"
              >
                Continuar Solicitud
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {mostrarInventarioModal && (
        <InventarioModal onClose={() => setMostrarInventarioModal(false)} />
      )}

      {mostrarActivoFijoModal && (
        <ActivoFijoModal onClose={() => setMostrarActivoFijoModal(false)} />
      )}

      {mostrarPasivoModal && <PasivoModal onClose={() => setMostrarPasivoModal(false)} />}
    </>
  );
};

export default BalanceSituacionForm;