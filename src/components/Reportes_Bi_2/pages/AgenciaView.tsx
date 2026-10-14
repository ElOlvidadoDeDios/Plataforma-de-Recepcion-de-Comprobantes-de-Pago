// src/views/AgenciaView.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { Building2, Users, ShieldAlert, RefreshCw, Copy, Download } from 'lucide-react';
import { Panel } from '../components/Panel';
import { WorkdayStrip } from '../components/WorkdayStrip';
import { fetchAgencia } from '../services/colocaciones.service';

// ============================================================================
// HOOKS Y COMPONENTES MAESTROS (DRAG & DROP / EXPORTACIÓN)
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string) {
  const [order, setOrder] = useState(initialOrder);
  const isModified = JSON.stringify(order) !== JSON.stringify(initialOrder);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === lockedCol) { e.preventDefault(); return; }
    e.dataTransfer.setData(`col_id_${tableId}`, id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData(`col_id_${tableId}`);
    if (!sourceId || sourceId === targetId || sourceId === lockedCol || targetId === lockedCol) return;
    const newOrder = [...order];
    newOrder.splice(order.indexOf(targetId), 0, newOrder.splice(order.indexOf(sourceId), 1)[0]);
    setOrder(newOrder);
  };
  return { order, handleDragStart, handleDragOver, handleDrop, resetOrder: () => setOrder(initialOrder), isModified, lockedCol };
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

// DENSIDAD FLUIDA Y SCROLL VERTICAL INQUEBRANTABLE
function DraggableTable({ control, columns, data, containerClass, showFooter = true }: { control: any, columns: any[], data: any[], containerClass: string, showFooter?: boolean }) {
  return (
    <div className={`relative overflow-x-auto overflow-y-auto scrollbar-thin ${containerClass}`}>
      <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] whitespace-nowrap tracking-tight border-collapse">
        <thead className="sticky top-0 z-20">
          <tr className="border-b border-border shadow-sm">
            {columns.map(col => (
              <th 
                key={col.id} 
                draggable={col.id !== control.lockedCol} 
                onDragStart={(e) => control.handleDragStart(e, col.id)} 
                onDragOver={control.handleDragOver} 
                onDrop={(e) => control.handleDrop(e, col.id)}
                // El fondo bg-slate-50 o bg-white sólido evita que se transparente al hacer scroll
                className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== control.lockedCol ? 'cursor-grab active:cursor-grabbing hover:bg-slate-100 hover:text-foreground' : ''} ${col.align === 'left' ? 'text-left' : 'text-right'} ${col.bgClass || ''}`}
              >
                {col.headerJSX || col.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-border/60 bg-white">
          {data.length > 0 ? data.map((row: any, i: number) => (
            <tr key={`row-${i}`} className="hover:bg-muted/30 transition-colors">
              {columns.map(col => (
                <td key={`cell-${i}-${col.id}`} className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 whitespace-nowrap ${col.align === 'left' ? 'text-left' : 'text-right'} ${col.bgClass || ''}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          )) : (
            <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-muted-foreground italic">No hay registros para esta selección.</td></tr>
          )}
        </tbody>

        {showFooter && data.length > 0 && (
          <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
            <tr className="border-t-2 border-border font-bold">
              {columns.map(col => (
                <td 
                  key={`foot-${col.id}`} 
                  // Mantenemos el fondo sólido gris claro para el footer
                  className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.align === 'left' ? 'text-left' : 'text-right'} ${col.bgClass || ''}`}
                >
                  {col.footer()}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// Agregado headerJSX para mostrar textos en dos líneas
const Col = (id: string, header: string, cell: (r:any)=>any, raw: (r:any)=>any, footer: ()=>any, align='right', bgClass='', headerJSX?: React.ReactNode) => ({ id, header, headerJSX, cell, raw, footer, align, bgClass });

// ============================================================================
// VISTA PRINCIPAL DE AGENCIA
// ============================================================================
export function AgenciaView({ filters }: { filters: any }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agencia', filters.period],
    queryFn: () => fetchAgencia(filters.period),
    enabled: filters.period !== 'Cargando...',
  });

  const agenciaComercialRaw = useMemo(() => {
    let arr = data?.comercial || [];
    if (filters.agency !== 'Todas') arr = arr.filter((r: any) => String(r.agency || '').trim() === String(filters.agency).trim());
    return arr;
  }, [data?.comercial, filters.agency]);

  const comercialFiltered = useMemo(() => {
    let arr = agenciaComercialRaw;
    if (filters.advisor !== 'Todos') arr = arr.filter((r: any) => String(r.asesor || '').trim() === String(filters.advisor).trim());
    return arr;
  }, [agenciaComercialRaw, filters.advisor]);

  const recuperacionFiltered = useMemo(() => {
    let arr = data?.recuperacion || [];
    if (filters.agency !== 'Todas') arr = arr.filter((r: any) => String(r.agency || '').trim() === String(filters.agency).trim());
    if (filters.advisor !== 'Todos') arr = arr.filter((r: any) => String(r.recuperador || '').trim() === String(filters.advisor).trim());
    return arr;
  }, [data?.recuperacion, filters.agency, filters.advisor]);

  const totalesAgenciaGlobal = useMemo(() => {
    return agenciaComercialRaw.reduce((acc: any, curr: any) => ({
      crecimientoNeto150: acc.crecimientoNeto150 + Number(curr.crecimientoNeto150 || 0), amountAchieved: acc.amountAchieved + Number(curr.amountAchieved || 0),
      repagos: acc.repagos + Number(curr.repagos || 0), tea: acc.tea + Number(curr.tea || 0), opAchieved: acc.opAchieved + Number(curr.opAchieved || 0),
      sociosInicio: acc.sociosInicio + Number(curr.sociosInicio || 0), sociosRecuperacion: acc.sociosRecuperacion + Number(curr.sociosRecuperacion || 0), 
      sociosActual: acc.sociosActual + Number(curr.sociosActual || 0), sociosActivos: acc.sociosActivos + Number(curr.sociosActivos || 0),
      sociosCancelados: acc.sociosCancelados + Number(curr.sociosCancelados || 0),
      cartera: acc.cartera + Number(curr.cartera || 0), moraCppMax: acc.moraCppMax + Number(curr.moraCppMax || 0), moraCppActual: acc.moraCppActual + Number(curr.moraCppActual || 0),
      moraDefMax: acc.moraDefMax + Number(curr.moraDefMax || 0), moraDefActual: acc.moraDefActual + Number(curr.moraDefActual || 0),
    }), { crecimientoNeto150: 0, amountAchieved: 0, repagos: 0, tea: 0, opAchieved: 0, sociosInicio: 0, sociosRecuperacion: 0, sociosActual: 0, sociosActivos: 0, sociosCancelados: 0, cartera: 0, moraCppMax: 0, moraCppActual: 0, moraDefMax: 0, moraDefActual: 0 });
  }, [agenciaComercialRaw]);

  const totales = useMemo(() => {
    const acc = comercialFiltered.reduce((acc: any, curr: any) => ({
      crecimientoNeto150: acc.crecimientoNeto150 + Number(curr.crecimientoNeto150 || 0), amountAchieved: acc.amountAchieved + Number(curr.amountAchieved || 0),
      repagos: acc.repagos + Number(curr.repagos || 0), tea: acc.tea + Number(curr.tea || 0), opAchieved: acc.opAchieved + Number(curr.opAchieved || 0),
      sociosInicio: acc.sociosInicio + Number(curr.sociosInicio || 0), sociosRecuperacion: acc.sociosRecuperacion + Number(curr.sociosRecuperacion || 0), 
      sociosActual: acc.sociosActual + Number(curr.sociosActual || 0), sociosActivos: acc.sociosActivos + Number(curr.sociosActivos || 0),
      sociosCancelados: acc.sociosCancelados + Number(curr.sociosCancelados || 0),
      cartera: acc.cartera + Number(curr.cartera || 0), moraCppMax: acc.moraCppMax + Number(curr.moraCppMax || 0), moraCppActual: acc.moraCppActual + Number(curr.moraCppActual || 0),
      moraDefMax: acc.moraDefMax + Number(curr.moraDefMax || 0), moraDefActual: acc.moraDefActual + Number(curr.moraDefActual || 0), plazoTotal: acc.plazoTotal + Number(curr.plazo || 0),
    }), { crecimientoNeto150: 0, amountAchieved: 0, repagos: 0, tea: 0, opAchieved: 0, sociosInicio: 0, sociosRecuperacion: 0, sociosActual: 0, sociosActivos: 0, sociosCancelados: 0, cartera: 0, moraCppMax: 0, moraCppActual: 0, moraDefMax: 0, moraDefActual: 0, plazoTotal: 0 });

    const count = comercialFiltered.length;
    return { ...acc, tea: count > 0 ? acc.tea / count : 0, plazoPromedio: count > 0 ? acc.plazoTotal / count : 0, pctMoraCpp: acc.cartera > 0 ? (acc.moraCppActual / acc.cartera) * 100 : 0 };
  }, [comercialFiltered]);

  const totalesRec = useMemo(() => {
    return recuperacionFiltered.reduce((acc: any, curr: any) => ({
      crecimientoNeto150: acc.crecimientoNeto150 + Number(curr.crecimientoNeto150 || 0), repagos: acc.repagos + Number(curr.repagos || 0), carteraInicio: acc.carteraInicio + Number(curr.carteraInicio || 0),
      moraCppMax: acc.moraCppMax + Number(curr.moraCppMax || 0), moraCppActual: acc.moraCppActual + Number(curr.moraCppActual || 0), moraDefMax: acc.moraDefMax + Number(curr.moraDefMax || 0), moraDefActual: acc.moraDefActual + Number(curr.moraDefActual || 0),
    }), { crecimientoNeto150: 0, repagos: 0, carteraInicio: 0, moraCppMax: 0, moraCppActual: 0, moraDefMax: 0, moraDefActual: 0 });
  }, [recuperacionFiltered]);

  // Funciones de formato
  const fmtMoney = (val: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(Number(val || 0));
  const fmtNum = (val: number) => new Intl.NumberFormat('es-PE').format(Number(val || 0));
  const fmtDec = (val: number) => Number(val || 0).toFixed(2);
  const fmtPct = (val: number) => Number(val || 0).toFixed(2) + '%';

  const renderWithShare = (val: number, globalVal: number, isCurrency = true) => {
    const safeVal = Number(val || 0); const safeGlobal = Number(globalVal || 0);
    if (filters.advisor === 'Todos' || safeGlobal === 0) return isCurrency ? fmtMoney(safeVal) : fmtNum(safeVal);
    return `${isCurrency ? fmtMoney(safeVal) : fmtNum(safeVal)} (${Number((safeVal / safeGlobal) * 100 || 0).toFixed(1)}%)`;
  };

  const totCrecNeto1 = totales.crecimientoNeto150 + (filters.advisor === 'Todos' ? totalesRec.crecimientoNeto150 : 0);
  const totRepagos1 = totales.repagos + (filters.advisor === 'Todos' ? totalesRec.repagos : 0);
  const totMoraCppMax1 = totales.moraCppMax + (filters.advisor === 'Todos' ? totalesRec.moraCppMax : 0);
  const totMoraCppAct1 = totales.moraCppActual + (filters.advisor === 'Todos' ? totalesRec.moraCppActual : 0);
  const totMoraDefMax1 = totales.moraDefMax + (filters.advisor === 'Todos' ? totalesRec.moraDefMax : 0);
  const totMoraDefAct1 = totales.moraDefActual + (filters.advisor === 'Todos' ? totalesRec.moraDefActual : 0);

  // Totales Socios
  const t1_sociosIniRecupe = (totales.sociosInicio - totales.sociosRecuperacion);
  const t1_socActual = totales.sociosActual;

  const dataT1 = [{
    agencia: filters.agency === 'Todas' ? 'TODA LAS AGENCIAS' : filters.agency,
    crecNeto: totCrecNeto1, colocacion: totales.amountAchieved, repagos: totRepagos1,
    tea: totales.tea, opAchieved: totales.opAchieved, plazo: totales.plazoPromedio, 
    sociosInicio: totales.sociosInicio, sociosIniRecupe: t1_sociosIniRecupe, sociosActual: t1_socActual, sociosActivos: totales.sociosActivos, 
    cartera: totales.cartera, moraCppMax: totMoraCppMax1, moraCppActual: totMoraCppAct1, moraDefMax: totMoraDefMax1, moraDefActual: totMoraDefAct1
  }];

  // ==========================================
  // LÓGICA DE COLORES EXACTA Y DOS LÍNEAS
  // ==========================================
  const colDestacada = "bg-[hsl(35_80%_50%/.15)]"; // Naranja claro de las metas

  const defT1 = [
    Col('agencia', 'Agencia', r => <div className="font-bold max-w-[80px] sm:max-w-[120px] md:max-w-none truncate" title={r.agencia}>{r.agencia}</div>, r => r.agencia, () => null, 'left'),
    Col('crecNeto', 'Crecimiento Neto 150', r => <span className={`font-semibold ${r.crecNeto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{renderWithShare(r.crecNeto, totalesAgenciaGlobal.crecimientoNeto150)}</span>, r => r.crecNeto, () => null, 'right', '', <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>),
    Col('colocacion', 'Colocación', r => <span className="font-mono">{renderWithShare(r.colocacion, totalesAgenciaGlobal.amountAchieved)}</span>, r => r.colocacion, () => null),
    Col('repagos', 'Repagos', r => <span className="font-mono">{renderWithShare(r.repagos, totalesAgenciaGlobal.repagos)}</span>, r => r.repagos, () => null),
    Col('tea', 'TEA', r => <span className="font-mono">{fmtDec(r.tea)}</span>, r => r.tea, () => null),
    Col('nroOpe', 'Nro Ope', r => <span className="font-mono">{renderWithShare(r.opAchieved, totalesAgenciaGlobal.opAchieved, false)}</span>, r => r.opAchieved, () => null, 'right', '', <div className="leading-[1.15]">Nro<br/>Ope</div>),
    Col('plazo', 'Plazo', r => <span className="font-mono font-semibold text-[hsl(138_72%_35%)]">{fmtDec(r.plazo)}</span>, r => r.plazo, () => null),
    Col('socInicio', 'Nro Socios de Inicio', r => <span className="font-mono font-semibold">{fmtNum(r.sociosInicio)}</span>, r => r.sociosInicio, () => null, 'right', colDestacada, <div className="leading-[1.15]">Nro Socios<br/>de Inicio</div>),
    Col('socIniRecupe', 'Nro Socios Ini - Recupe', r => <span className="font-mono font-semibold">{fmtNum(r.sociosIniRecupe)}</span>, r => r.sociosIniRecupe, () => null, 'right', '', <div className="leading-[1.15]">Nro Socios Ini<br/>- Recupe</div>),
    Col('socActual', 'Nro Socios', r => <span className={`font-mono font-semibold ${r.sociosActual < r.sociosIniRecupe ? 'text-rose-600' : 'text-emerald-600'}`}>{renderWithShare(r.sociosActual, totalesAgenciaGlobal.sociosActual, false)}</span>, r => r.sociosActual, () => null, 'right', '', <div className="leading-[1.15]">Nro<br/>Socios</div>),
    Col('socActivos', 'Nro Socios Activos', r => <span className="font-mono font-semibold">{fmtNum(r.sociosActivos)}</span>, r => r.sociosActivos, () => null, 'right', '', <div className="leading-[1.15]">Nro Socios<br/>Activos</div>),
    Col('cartera', 'Cartera', r => <span className="font-mono text-muted-foreground">{renderWithShare(r.cartera, totalesAgenciaGlobal.cartera)}</span>, r => r.cartera, () => null),
    Col('cppMax', 'Mora CPP Maximo', r => <span className="font-mono font-semibold">{fmtMoney(r.moraCppMax)}</span>, r => r.moraCppMax, () => null, 'right', colDestacada, <div className="leading-[1.15]">Mora CPP<br/>Máximo</div>),
    Col('cppAct', 'Mora CPP Actual', r => <span className={`font-mono font-semibold ${r.moraCppActual > r.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(r.moraCppActual)}</span>, r => r.moraCppActual, () => null, 'right', '', <div className="leading-[1.15]">Mora CPP<br/>Actual</div>),
    Col('defMax', 'Mora Def. Maximo', r => <span className="font-mono font-semibold">{fmtMoney(r.moraDefMax)}</span>, r => r.moraDefMax, () => null, 'right', colDestacada, <div className="leading-[1.15]">Mora Deficiente<br/>Máximo</div>),
    Col('defAct', 'Mora Def. Actual', r => <span className={`font-mono font-semibold ${r.moraDefActual > r.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(r.moraDefActual)}</span>, r => r.moraDefActual, () => null, 'right', '', <div className="leading-[1.15]">Mora Deficiente<br/>Actual</div>)
  ];

  const defT2 = [
    Col('asesor', 'Asesor', r => <div className="font-medium max-w-[80px] sm:max-w-[140px] md:max-w-none truncate" title={r.asesor}>{r.asesor}</div>, r => r.asesor, () => 'Total Comercial', 'left'),
    Col('crecNeto', 'Crec. Neto 150', r => <span className={`font-semibold ${r.crecimientoNeto150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(r.crecimientoNeto150)}</span>, r => r.crecimientoNeto150, () => <span className={`font-semibold ${totales.crecimientoNeto150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(totales.crecimientoNeto150)}</span>, 'right', '', <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>),
    Col('colocacion', 'Colocación', r => <span className="font-mono text-muted-foreground">{fmtMoney(r.amountAchieved)}</span>, r => r.amountAchieved, () => <span className="font-mono">{fmtMoney(totales.amountAchieved)}</span>),
    Col('repagos', 'Repagos', r => <span className="font-mono text-muted-foreground">{fmtMoney(r.repagos)}</span>, r => r.repagos, () => <span className="font-mono">{fmtMoney(totales.repagos)}</span>),
    Col('tea', 'TEA', r => <span className="font-mono font-semibold">{fmtDec(r.tea)}</span>, r => r.tea, () => <span className="font-mono font-semibold">{fmtDec(totales.tea)}</span>),
    Col('nroOpe', 'Nro Ope', r => <span className={`font-mono font-semibold ${r.opAchieved < 15 ? 'text-rose-600' : ''}`}>{fmtNum(r.opAchieved)}</span>, r => r.opAchieved, () => <span className="font-mono font-bold">{fmtNum(totales.opAchieved)}</span>, 'right', '', <div className="leading-[1.15]">Nro<br/>Ope</div>),
    Col('plazo', 'Plazo', r => <span className={`font-mono font-semibold ${r.plazo < 6 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtDec(r.plazo)}</span>, r => r.plazo, () => <span className="font-mono font-bold">{fmtDec(totales.plazoPromedio)}</span>),
    Col('socInicio', 'Nro Soc. Inicio', r => <span className="font-mono font-semibold">{fmtNum(r.sociosInicio)}</span>, r => r.sociosInicio, () => <span className="font-mono font-semibold">{fmtNum(totales.sociosInicio)}</span>, 'right', colDestacada, <div className="leading-[1.15]">Nro Socios<br/>de Inicio</div>),
    Col('socIniRecupe', 'Nro Socios Ini - Recupe', r => <span className="font-mono">{fmtNum(r.sociosInicio - r.sociosRecuperacion)}</span>, r => r.sociosInicio - r.sociosRecuperacion, () => <span className="font-mono font-bold">{fmtNum(totales.sociosInicio - totales.sociosRecuperacion)}</span>, 'right', '', <div className="leading-[1.15]">Nro Socios Ini<br/>- Recupe</div>),
    Col('socActual', 'Nro Socios', r => <span className={`font-mono font-semibold ${r.sociosActual < (r.sociosInicio - r.sociosRecuperacion) ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtNum(r.sociosActual)}</span>, r => r.sociosActual, () => <span className={`font-mono font-semibold ${totales.sociosActual < (totales.sociosInicio - totales.sociosRecuperacion) ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtNum(totales.sociosActual)}</span>, 'right', '', <div className="leading-[1.15]">Nro<br/>Socios</div>),
    Col('socActivos', 'Nro Socios Activos', r => <span className="font-mono">{fmtNum(r.sociosActivos)}</span>, r => r.sociosActivos, () => <span className="font-mono font-bold">{fmtNum(totales.sociosActivos)}</span>, 'right', '', <div className="leading-[1.15]">Nro Socios<br/>Activos</div>),
    Col('cartera', 'Cartera', r => <span className="font-mono text-muted-foreground">{fmtMoney(r.cartera)}</span>, r => r.cartera, () => <span className="font-mono text-muted-foreground">{fmtMoney(totales.cartera)}</span>),
    Col('cppMax', 'Mora CPP Max', r => <span className="font-mono font-semibold">{fmtMoney(r.moraCppMax)}</span>, r => r.moraCppMax, () => <span className="font-mono font-semibold">{fmtMoney(totales.moraCppMax)}</span>, 'right', colDestacada, <div className="leading-[1.15]">Mora CPP<br/>Máximo</div>),
    Col('cppAct', 'Mora Piso Actual', r => <span className={`font-mono font-semibold ${r.moraCppActual > r.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(r.moraCppActual)}</span>, r => r.moraCppActual, () => <span className={`font-mono font-semibold ${totales.moraCppActual > totales.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(totales.moraCppActual)}</span>, 'right', '', <div className="leading-[1.15]">Mora Piso<br/>Actual</div>),
    Col('pctCpp', '% Mora Piso', r => <span className="font-mono font-semibold text-muted-foreground">{fmtPct(r.pctMoraCpp)}</span>, r => r.pctMoraCpp / 100, () => <span className="font-mono font-bold">{fmtPct(totales.pctMoraCpp)}</span>, 'right', '', <div className="leading-[1.15]">% Mora<br/>Piso</div>),
    Col('defMax', 'Mora Def. Max', r => <span className="font-mono font-semibold">{fmtMoney(r.moraDefMax)}</span>, r => r.moraDefMax, () => <span className="font-mono font-semibold">{fmtMoney(totales.moraDefMax)}</span>, 'right', colDestacada, <div className="leading-[1.15]">Mora Deficiente<br/>Máximo</div>),
    Col('defAct', 'Mora Def. Actual', r => <span className={`font-mono font-semibold ${r.moraDefActual > r.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(r.moraDefActual)}</span>, r => r.moraDefActual, () => <span className={`font-mono font-semibold ${totales.moraDefActual > totales.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(totales.moraDefActual)}</span>, 'right', '', <div className="leading-[1.15]">Mora Deficiente<br/>Actual</div>),
    Col('socCancelados', 'Nro Socios Cancelados', r => <span className="font-mono text-muted-foreground">{fmtNum(r.sociosCancelados)}</span>, r => r.sociosCancelados, () => <span className="font-mono font-bold">{fmtNum(totales.sociosCancelados)}</span>, 'right', '', <div className="leading-[1.15]">Nro Socios<br/>Cancelados</div>),
    Col('socRecuperacion', 'Nro Socios Recuperación', r => <span className="font-mono text-muted-foreground">{fmtNum(r.sociosRecuperacion)}</span>, r => r.sociosRecuperacion, () => <span className="font-mono font-bold">{fmtNum(totales.sociosRecuperacion)}</span>, 'right', '', <div className="leading-[1.15]">Nro Socios<br/>Recuperación</div>)
  ];

  const defT3 = [
    Col('recuperador', 'Recuperador', r => <div className="font-medium max-w-[80px] sm:max-w-[120px] md:max-w-none truncate" title={r.recuperador}>{r.recuperador}</div>, r => r.recuperador, () => 'Total Recuperación', 'left'),
    Col('crecNeto', 'Crec. Neto 150', r => <span className={`font-semibold ${r.crecimientoNeto150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(r.crecimientoNeto150)}</span>, r => r.crecimientoNeto150, () => <span className={`font-semibold ${totalesRec.crecimientoNeto150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(totalesRec.crecimientoNeto150)}</span>, 'right', '', <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>),
    Col('carteraInicio', 'Cartera de Inicio', r => <span className="font-mono text-muted-foreground">{fmtMoney(r.carteraInicio)}</span>, r => r.carteraInicio, () => <span className="font-mono text-muted-foreground">{fmtMoney(totalesRec.carteraInicio)}</span>, 'right', '', <div className="leading-[1.15]">Cartera de<br/>Inicio</div>),
    Col('cppMax', 'Mora CPP Maximo', r => <span className="font-mono font-semibold">{fmtMoney(r.moraCppMax)}</span>, r => r.moraCppMax, () => <span className="font-mono font-semibold">{fmtMoney(totalesRec.moraCppMax)}</span>, 'right', colDestacada, <div className="leading-[1.15]">Mora CPP<br/>Máximo</div>),
    Col('cppAct', 'Mora CPP Actual', r => <span className={`font-mono font-semibold ${r.moraCppActual > r.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(r.moraCppActual)}</span>, r => r.moraCppActual, () => <span className={`font-mono font-semibold ${totalesRec.moraCppActual > totalesRec.moraCppMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(totalesRec.moraCppActual)}</span>, 'right', '', <div className="leading-[1.15]">Mora CPP<br/>Actual</div>),
    Col('defMax', 'Mora Defic. Maximo', r => <span className="font-mono font-semibold">{fmtMoney(r.moraDefMax)}</span>, r => r.moraDefMax, () => <span className="font-mono font-semibold">{fmtMoney(totalesRec.moraDefMax)}</span>, 'right', colDestacada, <div className="leading-[1.15]">Mora Deficiente<br/>Máximo</div>),
    Col('defAct', 'Mora Defic. Actual', r => <span className={`font-mono font-semibold ${r.moraDefActual > r.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(r.moraDefActual)}</span>, r => r.moraDefActual, () => <span className={`font-mono font-semibold ${totalesRec.moraDefActual > totalesRec.moraDefMax ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(totalesRec.moraDefActual)}</span>, 'right', '', <div className="leading-[1.15]">Mora Deficiente<br/>Actual</div>),
    Col('repagos', 'Repagos', r => <span className="font-mono text-muted-foreground">{fmtMoney(r.repagos)}</span>, r => r.repagos, () => <span className="font-mono text-muted-foreground">{fmtMoney(totalesRec.repagos)}</span>)
  ];

  // ==========================================
  // HOOKS
  // ==========================================
  const t1 = useColumnOrder(defT1.map(c => c.id), 't1', 'agencia');
  const t2 = useColumnOrder(defT2.map(c => c.id), 't2', 'asesor');
  const t3 = useColumnOrder(defT3.map(c => c.id), 't3', 'recuperador');

  // ==========================================
  // RETORNOS DE CARGA / ERROR
  // ==========================================
  if (isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted/50"></div>;
  if (isError || !data) return <div className="text-destructive font-semibold">Error al cargar la información de la agencia.</div>;

  const exportar = async (tablaId: 't1'|'t2'|'t3', formato: 'excel' | 'clipboard') => {
    let rawCols: any[] = []; let rowsData: any[] = []; let filename = '';
    if (tablaId === 't1') { rawCols = t1.order.map(id => defT1.find(c => c.id === id)!); rowsData = dataT1; filename = 'Agencia_Completa'; }
    if (tablaId === 't2') { rawCols = t2.order.map(id => defT2.find(c => c.id === id)!); rowsData = comercialFiltered; filename = 'Agencia_Comercial'; }
    if (tablaId === 't3') { rawCols = t3.order.map(id => defT3.find(c => c.id === id)!); rowsData = recuperacionFiltered; filename = 'Agencia_Recuperacion'; }

    const headers = rawCols.map(c => c.header);
    const rows = rowsData.map((r:any) => rawCols.map(col => col.raw(r)));

    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map(row => row.map(val => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados. Ya puedes pegarlos en Excel o Word.'));
    } else {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Agencia';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Data', { views: [{ state: 'frozen', ySplit: 1 }] });
        worksheet.addRow(headers);
        rows.forEach((row: any[]) => worksheet.addRow(row));

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };

        worksheet.columns.forEach((col: any) => {
          let maxLen = 10;
          col.eachCell?.({ includeEmpty: false }, (cell: any) => {
            const len = String(cell.value ?? '').length;
            if (len > maxLen) maxLen = len;
          });
          col.width = maxLen + 4;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${filters.period}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert('❌ Error al generar el archivo Excel.');
      }
    }
  };

  // 14 FILAS DE SCROLL (aprox 40px por fila = 560px)
  // Limita la altura a 400px o 500px para que se active el scroll interno de la tabla
  const containerClass = `pb-0 ${filters.agency === 'Todas' ? 'max-h-[500px]' : 'max-h-[600px]'}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <WorkdayStrip periodo={filters.period} />

      {/* 1. AGENCIA COMPLETA (Fila Resumen) */}
      <Panel title={filters.advisor !== 'Todos' ? `Agencia Completa · Aporte de ${filters.advisor}` : "Agencia Completa: Comercial + Recuperador"} icon={<Building2 />} action={<ExportActions control={t1} onExport={(f) => exportar('t1', f)} />}>
        <DraggableTable control={t1} columns={t1.order.map(id => defT1.find(c => c.id === id)!)} data={dataT1} containerClass="overflow-x-auto pb-4" showFooter={false} />
      </Panel>

      {/* 2. AGENCIA COMERCIAL */}
      <Panel title="Agencia - Parte Comercial" subtitle="Desempeño individual por Asesor" icon={<Users />} action={<ExportActions control={t2} onExport={(f) => exportar('t2', f)} />}>
        <DraggableTable control={t2} columns={t2.order.map(id => defT2.find(c => c.id === id)!)} data={comercialFiltered} containerClass={containerClass} />
      </Panel>

      {/* 3. AGENCIA RECUPERACIÓN */}
      {filters.advisor === 'Todos' && (
        <Panel title="Agencia - Parte Recuperación" icon={<ShieldAlert />} action={<ExportActions control={t3} onExport={(f) => exportar('t3', f)} />}>
          <DraggableTable control={t3} columns={t3.order.map(id => defT3.find(c => c.id === id)!)} data={recuperacionFiltered} containerClass="overflow-x-auto pb-4" />
        </Panel>
      )}
    </div>
  );
}