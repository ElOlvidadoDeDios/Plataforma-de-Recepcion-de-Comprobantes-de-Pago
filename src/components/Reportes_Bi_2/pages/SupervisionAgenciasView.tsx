//SupervisionAgenciasView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filters, View } from '../utils/constants';
import { money, number } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { SectionBand } from '../components/SectionBand';
import { Panel } from '../components/Panel';
import { TableShell } from '../components/TableShell';
import { StatusCell } from '../components/StatusCell';
import { WorkdayStrip } from '../components/WorkdayStrip';
import { RefreshCw, Copy, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { getSupervision } from '../services/supervision.service';

// ============================================================================
// COMPONENTES MAESTROS Y HOOKS
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string) {
  const [order, setOrder] = useState(initialOrder);
  const isModified = JSON.stringify(order) !== JSON.stringify(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [JSON.stringify(initialOrder)]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === 'agency') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(`col_id_${tableId}`, id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData(`col_id_${tableId}`);
    if (!sourceId || sourceId === targetId || sourceId === 'agency' || targetId === 'agency') return;

    const sourceIndex = order.indexOf(sourceId);
    const targetIndex = order.indexOf(targetId);
    const newOrder = [...order];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    setOrder(newOrder);
  };

  return { order, handleDragStart, handleDragOver, handleDrop, resetOrder: () => setOrder(initialOrder), isModified };
}

const ExportActions = ({ control, onExport }: { control: any, onExport: (format: 'excel' | 'clipboard') => void }) => (
  <div className="flex items-center gap-2">
    {control.isModified && (
      <button onClick={control.resetOrder} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-foreground">
        <RefreshCw size={13} /> Restablecer
      </button>
    )}
    <button onClick={() => onExport('clipboard')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-primary hover:border-primary/50">
      <Copy size={13} /> Copiar
    </button>
    <button onClick={() => onExport('excel')} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700">
      <Download size={13} /> Excel
    </button>
  </div>
);

// DEFINICIÓN DE COLUMNAS INICIALES
const COL_T1_COMPLETA = ['agency', 'crecNeto', 'tea', 'metaOp', 'nroOp', 'plazo', 'socInicio', 'socActual', 'colocacion', 'cartera', 'moraCppMax', 'moraCppAct', 'moraDefMax', 'moraDefAct', 'repagos'];
const COL_T2_COMERCIAL = ['agency', 'crecNeto', 'tea', 'metaOp', 'nroOp', 'plazo', 'socInicio', 'socIniRecupe', 'socActual', 'socActivos', 'colocacion', 'repagos', 'cartera', 'moraCppMax', 'moraCppAct', 'pctMoraCpp', 'moraDefMax', 'moraDefAct', 'pctMoraDef'];
const COL_T3_RECUPERACION = ['agency', 'recuperador', 'crecNeto', 'cartInicio', 'moraCppMax', 'moraCppAct', 'moraDefMax', 'moraDefAct', 'repagos'];

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
export function SupervisionAgenciasView({ navigate, filters }: { navigate: (view: View) => void; filters: Filters }) {
  const { data: supervisionBD, isLoading, error } = useQuery({
    queryKey: ['indicadores-supervision', filters.period],
    queryFn: () => getSupervision(filters.period),
    enabled: !!filters.period && filters.period !== 'Cargando...'
  });

  const { dataCompleta, dataComercial, dataRecuperacion } = useMemo(() => {
    const filterByAgency = (arr: any[]) => filters.agency === 'Todas' ? arr : arr.filter((r: any) => r.agency === filters.agency);
    return {
      dataCompleta: filterByAgency(supervisionBD?.completa || []),
      dataComercial: filterByAgency(supervisionBD?.comercial || []),
      dataRecuperacion: filterByAgency(supervisionBD?.recuperacion || [])
    };
  }, [supervisionBD, filters.agency]);

  const totales = useMemo(() => {
    const sum = (arr: any[], key: string) => arr.reduce((acc, row) => acc + Number(row[key] || 0), 0);
    const wAvg = (arr: any[], valKey: string, weightKey: string) => {
      const totalWeight = sum(arr, weightKey);
      if (totalWeight === 0) return 0;
      const sumProduct = arr.reduce((acc, row) => acc + (Number(row[valKey] || 0) * Number(row[weightKey] || 0)), 0);
      return sumProduct / totalWeight;
    };

    const t2_cartera = sum(dataComercial, 'cartera');

    return {
      t1_crecNeto: sum(dataCompleta, 'crecimientoNeto150'),
      t1_tea: wAvg(dataCompleta, 'tea', 'amountAchieved'),
      t1_metaOp: sum(dataCompleta, 'opTarget'),
      t1_nroOp: sum(dataCompleta, 'opAchieved'),
      t1_plazo: wAvg(dataCompleta, 'plazo', 'opAchieved'),
      t1_socInicio: sum(dataCompleta, 'sociosInicio'),
      t1_socActual: sum(dataCompleta, 'sociosActual'),
      t1_colocacion: sum(dataCompleta, 'amountAchieved'),
      t1_cartera: sum(dataCompleta, 'cartera'),
      t1_moraCppMax: sum(dataCompleta, 'moraCppMax'),
      t1_moraCppAct: sum(dataCompleta, 'moraCppActual'),
      t1_moraDefMax: sum(dataCompleta, 'moraDefMax'),
      t1_moraDefAct: sum(dataCompleta, 'moraDefActual'),
      t1_repagos: sum(dataCompleta, 'repagos'),

      t2_crecNeto: sum(dataComercial, 'crecimientoNeto150'),
      t2_tea: wAvg(dataComercial, 'tea', 'amountAchieved'),
      t2_metaOp: sum(dataComercial, 'opTarget'),
      t2_nroOp: sum(dataComercial, 'opAchieved'),
      t2_plazo: wAvg(dataComercial, 'plazo', 'opAchieved'),
      t2_socInicio: sum(dataComercial, 'sociosInicio'),
      t2_socIniRecupe: sum(dataComercial, 'sociosInicio') - sum(dataComercial, 'sociosRecuperacion'),
      t2_socActual: sum(dataComercial, 'sociosActual'),
      t2_socActivos: sum(dataComercial, 'sociosActivos'),
      t2_colocacion: sum(dataComercial, 'amountAchieved'),
      t2_cartera,
      t2_moraCppMax: sum(dataComercial, 'moraCppMax'),
      t2_moraCppAct: sum(dataComercial, 'moraCppActual'),
      t2_pctMoraCpp: t2_cartera > 0 ? (sum(dataComercial, 'moraCppActual') / t2_cartera) * 100 : 0,
      t2_moraDefMax: sum(dataComercial, 'moraDefMax'),
      t2_moraDefAct: sum(dataComercial, 'moraDefActual'),
      t2_repagos: sum(dataComercial, 'repagos'),
      t2_pctMoraDef: t2_cartera > 0 ? (sum(dataComercial, 'moraDefActual') / t2_cartera) * 100 : 0,

      t3_crecNeto: sum(dataRecuperacion, 'crecimientoNeto150'),
      t3_cartInicio: sum(dataRecuperacion, 'carteraInicio'),
      t3_moraCppMax: sum(dataRecuperacion, 'moraCppMax'),
      t3_moraCppAct: sum(dataRecuperacion, 'moraCppActual'),
      t3_moraDefMax: sum(dataRecuperacion, 'moraDefMax'),
      t3_moraDefAct: sum(dataRecuperacion, 'moraDefActual'),
      t3_repagos: sum(dataRecuperacion, 'repagos')
    };
  }, [dataCompleta, dataComercial, dataRecuperacion]);

  const t1 = useColumnOrder(COL_T1_COMPLETA, 't1');
  const t2 = useColumnOrder(COL_T2_COMERCIAL, 't2');
  const t3 = useColumnOrder(COL_T3_RECUPERACION, 't3');

  const colDestacada = "bg-[hsl(35_80%_50%/.15)]";

  // ==========================================
  // LÓGICA DE COLORES Y ENCABEZADOS DE 2 LÍNEAS
  // ==========================================
  const defT1 = [
    { id: 'agency', header: 'Agencia', headerText: 'Agencia', className: 'font-bold text-left', cell: (r: any) => <div className="max-w-[70px] sm:max-w-[100px] md:max-w-none whitespace-normal leading-[1.15]" title={r.agency}>{r.agency}</div>, raw: (r: any) => r.agency, footer: () => 'Total' },
    { id: 'crecNeto', header: <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>, headerText: 'Crecimiento Neto 150', className: 'text-right font-semibold', 
      cell: (r: any) => <span className={r.crecimientoNeto150 < 0 ? 'text-rose-600' : 'text-emerald-600'}>{r.crecimientoNeto150 >= 0 ? '+' : ''}{money(r.crecimientoNeto150)}</span>, 
      raw: (r: any) => r.crecimientoNeto150, 
      footer: () => <span className={totales.t1_crecNeto < 0 ? 'text-rose-600' : 'text-emerald-600'}>{totales.t1_crecNeto >= 0 ? '+' : ''}{money(totales.t1_crecNeto)}</span> 
    },
    { id: 'tea', header: 'TEA', headerText: 'TEA', className: 'text-right font-mono', cell: (r: any) => Number(r.tea).toFixed(2), raw: (r: any) => r.tea, footer: () => totales.t1_tea.toFixed(2) },
    { id: 'metaOp', header: <div className="leading-[1.15]">Meta<br/>Ope</div>, headerText: 'Meta Ope', className: `text-right font-mono font-semibold ${colDestacada}`, cell: (r: any) => r.opTarget, raw: (r: any) => r.opTarget, footer: () => totales.t1_metaOp },
    { id: 'nroOp', header: <div className="leading-[1.15]">Nro<br/>Ope</div>, headerText: 'Nro Ope', className: 'text-right font-mono', cell: (r: any) => r.opAchieved, raw: (r: any) => r.opAchieved, footer: () => totales.t1_nroOp },
    { id: 'plazo', header: 'Plazo', headerText: 'Plazo', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.plazo < 6 ? 'text-rose-600' : 'text-emerald-600'}>{Number(r.plazo).toFixed(2)}</span>, 
      raw: (r: any) => r.plazo, 
      footer: () => <span className={totales.t1_plazo < 6 ? 'text-rose-600' : 'text-emerald-600'}>{totales.t1_plazo.toFixed(2)}</span> 
    },
    { id: 'socInicio', header: <div className="leading-[1.15]">Nro Socios<br/>de Inicio</div>, headerText: 'Nro Socios de Inicio', className: `text-right font-mono font-semibold ${colDestacada}`, cell: (r: any) => number(r.sociosInicio), raw: (r: any) => r.sociosInicio, footer: () => number(totales.t1_socInicio) },
    { id: 'socActual', header: <div className="leading-[1.15]">Nro Socios<br/>Actual</div>, headerText: 'Nro Socios Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.sociosActual >= r.sociosInicio ? 'text-emerald-600' : 'text-rose-600'}>{number(r.sociosActual)}</span>, 
      raw: (r: any) => r.sociosActual, 
      footer: () => <span className={totales.t1_socActual >= totales.t1_socInicio ? 'text-emerald-600' : 'text-rose-600'}>{number(totales.t1_socActual)}</span> 
    },
    { id: 'colocacion', header: 'Colocación', headerText: 'Colocación', className: 'text-right text-muted-foreground font-mono', cell: (r: any) => money(r.amountAchieved), raw: (r: any) => r.amountAchieved, footer: () => money(totales.t1_colocacion) },
    { id: 'cartera', header: 'Cartera', headerText: 'Cartera', className: 'text-right text-muted-foreground font-mono', cell: (r: any) => money(r.cartera), raw: (r: any) => r.cartera, footer: () => money(totales.t1_cartera) },
    { id: 'moraCppMax', header: <div className="leading-[1.15]">Mora CPP<br/>Máximo</div>, headerText: 'Mora CPP Máximo', className: `text-right font-semibold ${colDestacada}`, cell: (r: any) => money(r.moraCppMax), raw: (r: any) => r.moraCppMax, footer: () => money(totales.t1_moraCppMax) },
    { id: 'moraCppAct', header: <div className="leading-[1.15]">Mora CPP<br/>Actual</div>, headerText: 'Mora CPP Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.moraCppActual > r.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}>{money(r.moraCppActual)}</span>, 
      raw: (r: any) => r.moraCppActual, 
      footer: () => <span className={totales.t1_moraCppAct > totales.t1_moraCppMax ? 'text-rose-600' : 'text-emerald-600'}>{money(totales.t1_moraCppAct)}</span> 
    },
    { id: 'moraDefMax', header: <div className="leading-[1.15]">Mora Defic.<br/>Máximo</div>, headerText: 'Mora Deficiente Máximo', className: `text-right font-semibold ${colDestacada}`, cell: (r: any) => money(r.moraDefMax), raw: (r: any) => r.moraDefMax, footer: () => money(totales.t1_moraDefMax) },
    { id: 'moraDefAct', header: <div className="leading-[1.15]">Mora Defic.<br/>Actual</div>, headerText: 'Mora Deficiente Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.moraDefActual > r.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}>{money(r.moraDefActual)}</span>, 
      raw: (r: any) => r.moraDefActual, 
      footer: () => <span className={totales.t1_moraDefAct > totales.t1_moraDefMax ? 'text-rose-600' : 'text-emerald-600'}>{money(totales.t1_moraDefAct)}</span> 
    },
    { id: 'repagos', header: 'Repagos', headerText: 'Repagos', className: 'text-right text-muted-foreground font-mono', cell: (r: any) => money(r.repagos), raw: (r: any) => r.repagos, footer: () => money(totales.t1_repagos) }
  ];

  const defT2 = [
    { id: 'agency', header: 'Agencia', headerText: 'Agencia', className: 'font-bold text-left', cell: (r: any) => <div className="max-w-[60px] sm:max-w-[85px] md:max-w-none whitespace-normal leading-[1.15]" title={r.agency}>{r.agency}</div>, raw: (r: any) => r.agency, footer: () => 'Total' },
    { id: 'crecNeto', header: <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>, headerText: 'Crecimiento Neto 150', className: 'text-right font-semibold', 
      cell: (r: any) => <span className={r.crecimientoNeto150 < 0 ? 'text-rose-600' : 'text-emerald-600'}>{r.crecimientoNeto150 >= 0 ? '+' : ''}{money(r.crecimientoNeto150)}</span>, 
      raw: (r: any) => r.crecimientoNeto150, 
      footer: () => <span className={totales.t2_crecNeto < 0 ? 'text-rose-600' : 'text-emerald-600'}>{totales.t2_crecNeto >= 0 ? '+' : ''}{money(totales.t2_crecNeto)}</span> 
    },
    { id: 'tea', header: 'TEA', headerText: 'TEA', className: 'text-right font-mono', cell: (r: any) => Number(r.tea).toFixed(2), raw: (r: any) => r.tea, footer: () => totales.t2_tea.toFixed(2) },
    { id: 'metaOp', header: <div className="leading-[1.15]">Meta<br/>Ope</div>, headerText: 'Meta Ope', className: `text-right font-mono font-semibold ${colDestacada}`, cell: (r: any) => r.opTarget, raw: (r: any) => r.opTarget, footer: () => totales.t2_metaOp },
    { id: 'nroOp', header: <div className="leading-[1.15]">Nro<br/>Ope</div>, headerText: 'Nro Ope', className: 'text-right font-mono', cell: (r: any) => r.opAchieved, raw: (r: any) => r.opAchieved, footer: () => totales.t2_nroOp },
    { id: 'plazo', header: 'Plazo', headerText: 'Plazo', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.plazo < 6 ? 'text-rose-600' : 'text-emerald-600'}>{Number(r.plazo).toFixed(2)}</span>, 
      raw: (r: any) => r.plazo, 
      footer: () => <span className={totales.t2_plazo < 6 ? 'text-rose-600' : 'text-emerald-600'}>{totales.t2_plazo.toFixed(2)}</span> 
    },
    { id: 'socInicio', header: <div className="leading-[1.15]">Nro Socios<br/>inicio</div>, headerText: 'Nro Socios inicio', className: `text-right font-mono font-semibold ${colDestacada}`, cell: (r: any) => number(r.sociosInicio), raw: (r: any) => r.sociosInicio, footer: () => number(totales.t2_socInicio) },
    { id: 'socIniRecupe', header: <div className="leading-[1.15]">Nro Socios Ini<br/>- Recupe</div>, headerText: 'Nro Socios Ini - Recupe', className: 'text-right font-mono font-semibold', cell: (r: any) => number(r.sociosInicio - r.sociosRecuperacion), raw: (r: any) => r.sociosInicio - r.sociosRecuperacion, footer: () => number(totales.t2_socIniRecupe) },
    { id: 'socActual', header: <div className="leading-[1.15]">Nro Socios<br/>Actual</div>, headerText: 'Nro Socios Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.sociosActual >= (r.sociosInicio - r.sociosRecuperacion) ? 'text-emerald-600' : 'text-rose-600'}>{number(r.sociosActual)}</span>, 
      raw: (r: any) => r.sociosActual, 
      footer: () => <span className={totales.t2_socActual >= totales.t2_socIniRecupe ? 'text-emerald-600' : 'text-rose-600'}>{number(totales.t2_socActual)}</span> 
    },
    { id: 'socActivos', header: <div className="leading-[1.15]">Nro Socios<br/>Activos</div>, headerText: 'Nro Socios Activos', className: 'text-right font-mono', cell: (r: any) => number(r.sociosActivos), raw: (r: any) => r.sociosActivos, footer: () => number(totales.t2_socActivos) },
    { id: 'colocacion', header: 'Colocación', headerText: 'Colocación', className: 'text-right font-mono text-muted-foreground', cell: (r: any) => money(r.amountAchieved), raw: (r: any) => r.amountAchieved, footer: () => money(totales.t2_colocacion) },
    { id: 'repagos', header: 'Repagos', headerText: 'Repagos', className: 'text-right font-mono text-muted-foreground', cell: (r: any) => money(r.repagos), raw: (r: any) => r.repagos, footer: () => money(totales.t2_repagos) },
    { id: 'cartera', header: <div className="leading-[1.15]">Cartera<br/>Actual</div>, headerText: 'Cartera Actual', className: 'text-right font-mono text-muted-foreground', cell: (r: any) => money(r.cartera), raw: (r: any) => r.cartera, footer: () => money(totales.t2_cartera) },
    { id: 'moraCppMax', header: <div className="leading-[1.15]">Mora Piso<br/>Máximo</div>, headerText: 'Mora Piso Maximo', className: `text-right font-semibold ${colDestacada}`, cell: (r: any) => money(r.moraCppMax), raw: (r: any) => r.moraCppMax, footer: () => money(totales.t2_moraCppMax) },
    { id: 'moraCppAct', header: <div className="leading-[1.15]">Mora Piso<br/>Actual</div>, headerText: 'Mora Piso Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.moraCppActual > r.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}>{money(r.moraCppActual)}</span>, 
      raw: (r: any) => r.moraCppActual, 
      footer: () => <span className={totales.t2_moraCppAct > totales.t2_moraCppMax ? 'text-rose-600' : 'text-emerald-600'}>{money(totales.t2_moraCppAct)}</span> 
    },
    { id: 'pctMoraCpp', header: <div className="leading-[1.15]">% Mora<br/>Piso</div>, headerText: '% Mora Piso', className: 'text-right font-mono font-semibold', cell: (r: any) => `${Number(r.pctMoraCpp).toFixed(2)}%`, raw: (r: any) => r.pctMoraCpp / 100, footer: () => `${totales.t2_pctMoraCpp.toFixed(2)}%` },
    { id: 'moraDefMax', header: <div className="leading-[1.15]">Mora Defic.<br/>Máximo</div>, headerText: 'Mora Deficiente Maximo', className: `text-right font-semibold ${colDestacada}`, cell: (r: any) => money(r.moraDefMax), raw: (r: any) => r.moraDefMax, footer: () => money(totales.t2_moraDefMax) },
    { id: 'moraDefAct', header: <div className="leading-[1.15]">Mora Defic.<br/>Actual</div>, headerText: 'Mora Deficiente Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.moraDefActual > r.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}>{money(r.moraDefActual)}</span>, 
      raw: (r: any) => r.moraDefActual, 
      footer: () => <span className={totales.t2_moraDefAct > totales.t2_moraDefMax ? 'text-rose-600' : 'text-emerald-600'}>{money(totales.t2_moraDefAct)}</span> 
    },
    { id: 'pctMoraDef', header: <div className="leading-[1.15]">% Mora<br/>Deficiente</div>, headerText: '% Mora deficiente', className: 'text-right font-mono font-semibold', cell: (r: any) => `${Number(r.pctMoraDef).toFixed(2)}%`, raw: (r: any) => r.pctMoraDef / 100, footer: () => `${totales.t2_pctMoraDef.toFixed(2)}%` }
  ];

  const defT3 = [
    { id: 'agency', header: 'Agencia', headerText: 'Agencia', className: 'font-bold text-left', cell: (r: any) => <div className="max-w-[70px] sm:max-w-[90px] md:max-w-none whitespace-normal leading-[1.15]" title={r.agency}>{r.agency}</div>, raw: (r: any) => r.agency, footer: () => 'Total' },
    { id: 'recuperador', header: 'Recuperador', headerText: 'Recuperador', className: 'text-left text-muted-foreground', cell: (r: any) => <div className="max-w-[80px] sm:max-w-[120px] md:max-w-none whitespace-normal leading-[1.15]" title={r.recuperador}>{r.recuperador}</div>, raw: (r: any) => r.recuperador, footer: () => '' },
    { id: 'crecNeto', header: <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>, headerText: 'Crecimiento Neto 150', className: 'text-right font-semibold text-[hsl(var(--destructive))]', cell: (r: any) => `-${money(Math.abs(r.crecimientoNeto150))}`, raw: (r: any) => r.crecimientoNeto150, footer: () => <span className="text-[hsl(var(--destructive))]">-{money(Math.abs(totales.t3_crecNeto))}</span> },
    { id: 'cartInicio', header: <div className="leading-[1.15]">Cartera<br/>Inicio</div>, headerText: 'Cartera de Inicio', className: `text-right font-mono font-semibold ${colDestacada}`, cell: (r: any) => money(r.carteraInicio), raw: (r: any) => r.carteraInicio, footer: () => money(totales.t3_cartInicio) },
    { id: 'moraCppMax', header: <div className="leading-[1.15]">Mora CPP<br/>Máximo</div>, headerText: 'Mora CPP Máximo', className: `text-right font-semibold ${colDestacada}`, cell: (r: any) => money(r.moraCppMax), raw: (r: any) => r.moraCppMax, footer: () => money(totales.t3_moraCppMax) },
    { id: 'moraCppAct', header: <div className="leading-[1.15]">Mora CPP<br/>Actual</div>, headerText: 'Mora CPP Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.moraCppActual > r.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}>{money(r.moraCppActual)}</span>, 
      raw: (r: any) => r.moraCppActual, 
      footer: () => <span className={totales.t3_moraCppAct > totales.t3_moraCppMax ? 'text-rose-600' : 'text-emerald-600'}>{money(totales.t3_moraCppAct)}</span> 
    },
    { id: 'moraDefMax', header: <div className="leading-[1.15]">Mora Defic.<br/>Máximo</div>, headerText: 'Mora Deficiente Maximo', className: `text-right font-semibold ${colDestacada}`, cell: (r: any) => money(r.moraDefMax), raw: (r: any) => r.moraDefMax, footer: () => money(totales.t3_moraDefMax) },
    { id: 'moraDefAct', header: <div className="leading-[1.15]">Mora Defic.<br/>Actual</div>, headerText: 'Mora Deficiente Actual', className: 'text-right font-mono font-semibold', 
      cell: (r: any) => <span className={r.moraDefActual > r.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}>{money(r.moraDefActual)}</span>, 
      raw: (r: any) => r.moraDefActual, 
      footer: () => <span className={totales.t3_moraDefAct > totales.t3_moraDefMax ? 'text-rose-600' : 'text-emerald-600'}>{money(totales.t3_moraDefAct)}</span> 
    },
    { id: 'repagos', header: 'Repagos', headerText: 'Repagos', className: 'text-right text-muted-foreground font-mono', cell: (r: any) => money(r.repagos), raw: (r: any) => r.repagos, footer: () => money(totales.t3_repagos) }
  ];

  const colRenderT1 = t1.order.map(id => defT1.find(c => c?.id === id)!);
  const colRenderT2 = t2.order.map(id => defT2.find(c => c?.id === id)!);
  const colRenderT3 = t3.order.map(id => defT3.find(c => c?.id === id)!);

  const exportarTabla = async (tablaId: 't1' | 't2' | 't3', formato: 'excel' | 'clipboard') => {
    let rawCols: any[] = [];
    let rowsData: any[] = [];
    let filename = '';

    if (tablaId === 't1') { rawCols = colRenderT1; rowsData = dataCompleta; filename = `Agencia_Completa_${filters.period}`; }
    if (tablaId === 't2') { rawCols = colRenderT2; rowsData = dataComercial; filename = `Agencia_Comercial_${filters.period}`; }
    if (tablaId === 't3') { rawCols = colRenderT3; rowsData = dataRecuperacion; filename = `Recuperadores_${filters.period}`; }

    const headers = rawCols.map(c => c.headerText || c.header);
    const rows = rowsData.map(r => rawCols.map(col => col.raw(r)));

    if (formato === 'clipboard') {
      const contenido = [
        headers.join('\t'),
        ...rows.map(row => row.map(val => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))
      ].join('\n');

      navigator.clipboard.writeText(contenido).then(() => {
        alert('✅ Datos copiados. Ya puedes pegarlos en Excel o Word.');
      });
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte', { views: [{ state: 'frozen', ySplit: 1 }] });

      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };

      rows.forEach(row => worksheet.addRow(row));

      worksheet.columns.forEach((col, idx) => {
        const headerLen = String(headers[idx] ?? '').length;
        const maxDataLen = rows.reduce((max, row) => {
          const len = String(row[idx] ?? '').length;
          return len > max ? len : max;
        }, 0);
        col.width = Math.min(Math.max(headerLen, maxDataLen) + 2, 40);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading || !supervisionBD) return <LoadingState />;
  if (error) return <div className="p-5 text-red-500 font-bold border border-red-200 bg-red-50 rounded-xl">Error de conexión al DWH. Verifica la terminal del backend.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" key={`${filters.period}-${filters.agency}`}>
      <WorkdayStrip periodo={filters.period} />

      {/* 1. AGENCIA COMPLETA */}
      <SectionBand tone="blue">Agencia Completa: Comercial + Recuperadores</SectionBand>
      <Panel title="Indicadores por agencia" eyebrow="Crecimiento Neto 150 · Cartera y Mora" action={<ExportActions control={t1} onExport={(f) => exportarTabla('t1', f)} />}>
        {/* Contenedor centralizado para scroll inquebrantable */}
        <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
          <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="border-b border-border">
                {colRenderT1.map(col => (
                  <th key={col.id} draggable={col.id !== 'agency'} onDragStart={(e) => t1.handleDragStart(e, col.id)} onDragOver={t1.handleDragOver} onDrop={(e) => t1.handleDrop(e, col.id)} 
                    className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== 'agency' ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.className.includes('text-left') ? 'text-left' : 'text-center'} ${col.className.includes(colDestacada) ? colDestacada : ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {dataCompleta.map((r: any) => (
                <tr key={r.agency} onClick={() => navigate('agencia')} className="cursor-pointer hover:bg-muted/30 transition-colors">
                  {colRenderT1.map(col => (
                    <td key={`${r.agency}-${col.id}`} className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.className.includes('text-left') ? 'whitespace-normal min-w-[70px] md:min-w-[100px] leading-[1.15]' : 'whitespace-nowrap font-mono'} ${col.className}`}>{col.cell(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
              <tr className="border-t-2 border-border font-bold">
                {colRenderT1.map(col => (
                  <td key={`foot-${col.id}`} className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.className}`}>{col.footer()}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      {/* 2. AGENCIA COMERCIAL */}
      <SectionBand tone="green">Agencias - Parte Comercial</SectionBand>
      <Panel title="Indicadores por agencia" eyebrow="Analistas y Administradores" action={<ExportActions control={t2} onExport={(f) => exportarTabla('t2', f)} />}>
        <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
          <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="border-b border-border">
                {colRenderT2.map(col => (
                  <th key={col.id} draggable={col.id !== 'agency'} onDragStart={(e) => t2.handleDragStart(e, col.id)} onDragOver={t2.handleDragOver} onDrop={(e) => t2.handleDrop(e, col.id)} 
                    className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== 'agency' ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.className.includes('text-left') ? 'text-left' : 'text-center'} ${col.className.includes(colDestacada) ? colDestacada : ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {dataComercial.map((r: any) => (
                <tr key={r.agency} className="hover:bg-muted/30 transition-colors">
                  {colRenderT2.map(col => (
                    <td key={`${r.agency}-${col.id}`} className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.className.includes('text-left') ? 'whitespace-normal min-w-[70px] md:min-w-[100px] leading-[1.15]' : 'whitespace-nowrap font-mono'} ${col.className}`}>{col.cell(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
              <tr className="border-t-2 border-border font-bold">
                {colRenderT2.map(col => (
                  <td key={`foot-${col.id}`} className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.className}`}>{col.footer()}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      {/* 3. RECUPERADORES */}
      <SectionBand tone="coral">Agencias - Parte Recuperación</SectionBand>
      <Panel title="Recuperación por agencia" eyebrow="Cartera de inicio, mora deficiente y repagos" action={<ExportActions control={t3} onExport={(f) => exportarTabla('t3', f)} />}>
        <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
          <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="border-b border-border">
                {colRenderT3.map(col => (
                  <th key={col.id} draggable={col.id !== 'agency'} onDragStart={(e) => t3.handleDragStart(e, col.id)} onDragOver={t3.handleDragOver} onDrop={(e) => t3.handleDrop(e, col.id)} 
                    className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== 'agency' ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.className.includes('text-left') ? 'text-left' : 'text-center'} ${col.className.includes(colDestacada) ? colDestacada : ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {dataRecuperacion.map((r: any) => (
                <tr key={`${r.agency}-${r.recuperador}`} className="hover:bg-muted/30 transition-colors">
                  {colRenderT3.map(col => (
                    <td key={`${r.agency}-${col.id}`} className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.className.includes('text-left') ? 'whitespace-normal min-w-[70px] md:min-w-[120px] leading-[1.15]' : 'whitespace-nowrap font-mono'} ${col.className}`}>{col.cell(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
              <tr className="border-t-2 border-border font-bold">
                {colRenderT3.map(col => (
                  <td key={`foot-${col.id}`} className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.className}`}>{col.footer()}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}