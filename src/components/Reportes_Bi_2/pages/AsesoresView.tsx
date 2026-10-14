// src/views/AsesoresView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { Filters } from '../utils/constants';
import { money } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { SectionBand } from '../components/SectionBand';
import { Panel } from '../components/Panel';
import { WorkdayStrip } from '../components/WorkdayStrip';
import { Users, Clock3, ShieldAlert, RefreshCw, Copy, Download } from 'lucide-react';
import { fetchAsesores, fetchDiasLaborales } from '../services/asesores.service';

// ============================================================================
// HOOKS Y COMPONENTES MAESTROS
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string = 'asesor') {
  const [order, setOrder] = useState(initialOrder);
  const isModified = JSON.stringify(order) !== JSON.stringify(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [JSON.stringify(initialOrder)]);

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

// TABLA CON FONDOS OPACOS EN ENCABEZADOS Y ESPACIO DINÁMICO EN NOMBRES
function DraggableTable({ control, columns, data, containerClass, showFooter = true }: { control: any, columns: any[], data: any[], containerClass: string, showFooter?: boolean }) {
  return (
    // EL TRUCO ESTÁ AQUÍ: relative, overflow-auto y z-0
    <div className={`relative overflow-x-auto overflow-y-auto scrollbar-thin z-0 ${containerClass}`}>
      <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
        {/* THEAD tiene z-10 (Menor al z-40 del Header principal) */}
        <thead className="sticky top-0 z-10 shadow-sm">
          <tr className="border-b border-border">
            {columns.map(col => (
              <th 
                key={col.id} 
                draggable={col.id !== control.lockedCol} 
                onDragStart={(e) => control.handleDragStart(e, col.id)} 
                onDragOver={control.handleDragOver} 
                onDrop={(e) => control.handleDrop(e, col.id)}
                // BG SÓLIDO (bg-slate-50 o bg-white) OBLIGATORIO AQUÍ
                className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== control.lockedCol ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.align === 'left' ? 'text-left' : 'text-center'} ${col.bgClass || ''}`}
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
                <td 
                  key={`cell-${i}-${col.id}`} 
                  // TEXTO MULTILÍNEA PARA LOS NOMBRES
                  className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.align === 'left' ? 'text-left whitespace-normal min-w-[110px] md:min-w-[160px] max-w-[220px] leading-[1.15]' : 'text-right whitespace-nowrap font-mono'} ${col.align === 'center' ? 'text-center' : ''} ${col.cellBg ? col.cellBg(row) : ''}`}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          )) : (
            <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-muted-foreground italic">No hay registros para esta selección.</td></tr>
          )}
        </tbody>
        {showFooter && data.length > 0 && (
          <tfoot className="sticky bottom-0 z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
            <tr className="border-t-2 border-border font-bold">
              {columns.map(col => (
                <td 
                  key={`foot-${col.id}`} 
                  // BG SÓLIDO OBLIGATORIO AQUÍ
                  className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right font-mono'}`}
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

// Nueva firma de la fábrica de columnas (Separamos Header, Celda y Fondo de Celda)
const Col = (id: string, header: string, cell: (r:any)=>any, raw: (r:any)=>any, footer: ()=>any, align='right', cellBg?: (r:any)=>string, headerJSX?: React.ReactNode) => ({ id, header, headerJSX, cell, raw, footer, align, cellBg });


// ============================================================================
// VISTA PRINCIPAL DE ASESORES
// ============================================================================
export function AsesoresView({ filters }: { filters: Filters }) {
  const { data: asesoresBD, isLoading: loadAsesores, error: errAsesores } = useQuery({
    queryKey: ['indicadores-asesores', filters.period],
    queryFn: () => fetchAsesores(filters.period),
    enabled: !!filters.period && filters.period !== 'Cargando...'
  });

  const { data: diasBD, isLoading: loadDias } = useQuery({
    queryKey: ['dias-laborales', filters.period],
    queryFn: () => fetchDiasLaborales(filters.period),
    enabled: !!filters.period && filters.period !== 'Cargando...'
  });

  const datosProyectados = useMemo(() => {
    if (!asesoresBD) return [];
    const dataDias = Array.isArray(diasBD) ? diasBD[0] : (diasBD || {});
    const transcurridos = Math.max(1, Number(dataDias.transcurridos) || 12);
    const restantes = Number(dataDias.restantes) || 13;

    let datosFiltrados = filters.agency === 'Todas' ? asesoresBD : asesoresBD.filter((r: any) => r.agency === filters.agency);
    if (filters.advisor !== 'Todos') datosFiltrados = datosFiltrados.filter((r: any) => r.asesor === filters.advisor);

    return datosFiltrados.map((row: any) => {
      const logrado = Number(row.opAchieved || 0);
      const productividad = transcurridos > 0 ? (logrado / transcurridos) : 0;
      return { ...row, opProjection: logrado + Math.round(productividad * restantes) };
    });
  }, [asesoresBD, diasBD, filters.agency, filters.advisor]);

  const totales = useMemo(() => {
    const sum = (key: string) => datosProyectados.reduce((acc: number, curr: any) => acc + Number(curr[key] || 0), 0);
    const avg = (key: string) => datosProyectados.length > 0 ? sum(key) / datosProyectados.length : 0;
    const cartera = sum('cartera');
    const carteraInicio = sum('carteraInicio');

    return {
      cartera, carteraInicio, desembolsos: sum('desembolsos'), repagos: sum('repagos'),
      crecimientoBruto: sum('crecimientoBruto'), mora150: sum('mora150'), pctMora150: cartera > 0 ? (sum('mora150') / cartera) * 100 : 0,
      crecimientoNeto150: sum('crecimientoNeto150'), faltante20k: sum('faltante20k'), opAchieved: sum('opAchieved'), opProjection: sum('opProjection'),
      duracion: avg('duracion'), 
      sociosInicio: sum('sociosInicio'), sociosActual: sum('sociosActual'), sociosNuevos: sum('sociosNuevos'),
      sociosCancelados: sum('sociosCancelados'), sociosTraspasados: sum('sociosTraspasados'), sociosRecuperacion: sum('sociosRecuperacion'), sociosActivos: sum('sociosActivos'),
      moraCppActual: sum('moraCppActual'), pctMoraCpp: carteraInicio > 0 ? (sum('moraCppActual') / carteraInicio) * 100 : 0, metaMoraCpp: avg('metaMoraCpp'),
      excedentePctCpp: avg('excedentePctCpp'), excedenteSolesCpp: sum('excedenteSolesCpp'), moraDefActual: sum('moraDefActual'),
      pctMoraDef: carteraInicio > 0 ? (sum('moraDefActual') / carteraInicio) * 100 : 0, metaMoraDef: avg('metaMoraDef'),
      excedentePctDef: avg('excedentePctDef'), excedenteSolesDef: sum('excedenteSolesDef')
    };
  }, [datosProyectados]);

  // Funciones de formato de Monedas y Números
  const fmtMoney = (val: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(Number(val || 0));
  const fmtNum = (val: number) => new Intl.NumberFormat('es-PE').format(Number(val || 0));
  const fmtDec = (val: number) => Number(val || 0).toFixed(2);

  // =================================================================================
  // LÓGICA DE FONDOS DE CELDAS (Power BI Style: Verde, Amarillo, Rojo transparentes)
  // =================================================================================
  const getOpBg = (val: number) => val >= 25 ? 'bg-emerald-500/15 text-emerald-800' : val >= 20 ? 'bg-amber-500/20 text-amber-800' : 'bg-rose-500/15 text-rose-800';
  const getDurBg = (val: number) => val >= 6 ? 'bg-emerald-500/15 text-emerald-800' : 'bg-rose-500/15 text-rose-800';
  const getSocNuevosBg = (val: number) => val > 0 ? 'bg-emerald-500/15 text-emerald-800' : 'bg-rose-500/15 text-rose-800';
  const getExcBg = (val: number) => val <= 0 ? 'bg-emerald-500/15 text-emerald-800' : 'bg-rose-500/15 text-rose-800';
  const getCrecNetoBg = (val: number) => val >= 20000 ? 'bg-emerald-500/15 text-emerald-800' : val >= 0 ? 'bg-amber-500/20 text-amber-800' : 'bg-rose-500/15 text-rose-800';
  const getCarteraBg = (val: number) => val >= 200000 ? 'bg-emerald-500/15 text-emerald-800' : val >= 100000 ? 'bg-amber-500/20 text-amber-800' : 'bg-rose-500/15 text-rose-800';

  const getFaltanteColor = (val: number) => val <= 0 ? 'text-emerald-600 font-bold' : val <= 20000 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold';
  const getCrecNetoColor = (val: number) => val >= 20000 ? 'text-emerald-600 font-bold' : val >= 0 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold';

  const bgRojoMeta = 'bg-rose-500/10';
  const bgNaranjaMeta = 'bg-amber-500/15';
  const bgVerde = 'bg-emerald-500/10';

  // 🚀 DICCIONARIO MAESTRO DE COLUMNAS (Textos multilínea y fondos inyectados solo en celdas)
  const dict: Record<string, any> = {
    // Al quitar el "truncate", el nombre podrá saltar a 2 líneas, reduciendo dramáticamente su anchura
    asesor: Col('asesor', 'Asesor', r => <span className="font-sans font-medium">{r.asesor}</span>, r => r.asesor, () => <span className="font-sans">Total</span>, 'left'),
    asesorT3: Col('asesorT3', 'Asesor', r => <span className="font-sans font-medium">{r.asesor}</span>, r => r.asesor, () => <span className="font-sans">Promedio</span>, 'left'),
    asesorT7: Col('asesorT7', 'Asesor', r => <span className="font-sans font-medium">{r.asesor}</span>, r => r.asesor, () => <span className="font-sans">Total</span>, 'left'),

    // Tabla de Operaciones
    opAchieved: Col('opAchieved', 'A la Fecha', r => r.opAchieved, r => r.opAchieved, () => totales.opAchieved, 'center', undefined, <div className="leading-[1.15]">A la<br/>Fecha</div>, r => getOpBg(r.opAchieved)),
    opProjection: Col('opProjection', 'Proyección al Cierre', r => r.opProjection, r => r.opProjection, () => totales.opProjection, 'center', undefined, <div className="leading-[1.15]">Proyección<br/>al Cierre</div>, r => getOpBg(r.opProjection)),

    // Tabla de Duracion
    duracion: Col('duracion', 'Duración', r => fmtDec(r.duracion), r => r.duracion, () => fmtDec(totales.duracion), 'center', undefined, undefined, r => getDurBg(r.duracion)),

    // Tabla de Número de Socios (CON LAS NUEVAS COLUMNAS DE DWH)
    sociosInicio: Col('sociosInicio', 'Inicio de Mes', r => fmtNum(r.sociosInicio), r => r.sociosInicio, () => fmtNum(totales.sociosInicio), 'center', undefined, <div className="leading-[1.15]">Inicio de<br/>Mes</div>),
    sociosActual: Col('sociosActual', 'A la Fecha', r => fmtNum(r.sociosActual), r => r.sociosActual, () => fmtNum(totales.sociosActual), 'center', undefined, <div className="leading-[1.15]">A la<br/>Fecha</div>),
    sociosNuevos: Col('sociosNuevos', 'Socios Nuevos', r => r.sociosNuevos, r => r.sociosNuevos, () => fmtNum(totales.sociosNuevos), 'center', undefined, <div className="leading-[1.15]">Socios<br/>Nuevos</div>, r => getSocNuevosBg(r.sociosNuevos)),
    sociosRecuperacion: Col('sociosRecuperacion', 'Recuperados', r => fmtNum(r.sociosRecuperacion), r => r.sociosRecuperacion, () => fmtNum(totales.sociosRecuperacion), 'center'),
    sociosCancelados: Col('sociosCancelados', 'Cancelados', r => <span className="text-rose-600">{fmtNum(r.sociosCancelados)}</span>, r => r.sociosCancelados, () => <span className="text-rose-600">{fmtNum(totales.sociosCancelados)}</span>, 'center'),
    sociosTraspasados: Col('sociosTraspasados', 'Traspasados', r => fmtNum(r.sociosTraspasados), r => r.sociosTraspasados, () => fmtNum(totales.sociosTraspasados), 'center'),
    sociosActivos: Col('sociosActivos', 'Activos', r => <span className="font-semibold text-[hsl(var(--primary))]">{fmtNum(r.sociosActivos)}</span>, r => r.sociosActivos, () => <span className="font-semibold text-[hsl(var(--primary))]">{fmtNum(totales.sociosActivos)}</span>, 'center'),

    // Tablas de Moras
    carteraInicio: Col('carteraInicio', 'Cartera de Inicio', r => <span className="text-muted-foreground">{fmtMoney(r.carteraInicio)}</span>, r => r.carteraInicio, () => <span className="text-muted-foreground">{fmtMoney(totales.carteraInicio)}</span>, 'right', undefined, <div className="leading-[1.15]">Cartera de<br/>Inicio</div>),
    moraCppActual: Col('moraCppActual', 'Mora S/', r => fmtMoney(r.moraCppActual), r => r.moraCppActual, () => fmtMoney(totales.moraCppActual)),
    pctMoraCpp: Col('pctMoraCpp', 'Mora %', r => `${fmtDec(r.pctMoraCpp)}%`, r => r.pctMoraCpp / 100, () => `${fmtDec(totales.pctMoraCpp)}%`),
    metaMoraCpp: Col('metaMoraCpp', 'Meta %', r => <span className="text-muted-foreground">{fmtDec(r.metaMoraCpp)}%</span>, r => r.metaMoraCpp / 100, () => <span className="text-muted-foreground">{fmtDec(totales.metaMoraCpp)}%</span>),
    excedentePctCpp: Col('excedentePctCpp', 'Excedente %', r => `${fmtDec(r.excedentePctCpp)}%`, r => r.excedentePctCpp / 100, () => `${fmtDec(totales.excedentePctCpp)}%`, 'right', undefined, <div className="leading-[1.15]">Excedente<br/>%</div>, r => getExcBg(r.excedentePctCpp)),
    excedenteSolesCpp: Col('excedenteSolesCpp', 'Excedente S/', r => fmtMoney(r.excedenteSolesCpp), r => r.excedenteSolesCpp, () => fmtMoney(totales.excedenteSolesCpp), 'right', undefined, <div className="leading-[1.15]">Excedente<br/>S/</div>, r => getExcBg(r.excedenteSolesCpp)),

    moraDefActual: Col('moraDefActual', 'Mora S/', r => fmtMoney(r.moraDefActual), r => r.moraDefActual, () => fmtMoney(totales.moraDefActual)),
    pctMoraDef: Col('pctMoraDef', 'Mora %', r => `${fmtDec(r.pctMoraDef)}%`, r => r.pctMoraDef / 100, () => `${fmtDec(totales.pctMoraDef)}%`),
    metaMoraDef: Col('metaMoraDef', 'Meta %', r => <span className="text-muted-foreground">{fmtDec(r.metaMoraDef)}%</span>, r => r.metaMoraDef / 100, () => <span className="text-muted-foreground">{fmtDec(totales.metaMoraDef)}%</span>),
    excedentePctDef: Col('excedentePctDef', 'Excedente %', r => `${fmtDec(r.excedentePctDef)}%`, r => r.excedentePctDef / 100, () => `${fmtDec(totales.excedentePctDef)}%`, 'right', undefined, <div className="leading-[1.15]">Excedente<br/>%</div>, r => getExcBg(r.excedentePctDef)),
    excedenteSolesDef: Col('excedenteSolesDef', 'Excedente S/', r => fmtMoney(r.excedenteSolesDef), r => r.excedenteSolesDef, () => fmtMoney(totales.excedenteSolesDef), 'right', undefined, <div className="leading-[1.15]">Excedente<br/>S/</div>, r => getExcBg(r.excedenteSolesDef)),

    // Tabla 1: Cartera Comercial
    cartera: Col('cartera', 'Cartera', r => <span className="text-muted-foreground">{fmtMoney(r.cartera)}</span>, r => r.cartera, () => fmtMoney(totales.cartera)),
    desembolsos: Col('desembolsos', 'Desembolsos', r => fmtMoney(r.desembolsos), r => r.desembolsos, () => fmtMoney(totales.desembolsos)),
    repagos: Col('repagos', 'Repagos', r => <span className="text-muted-foreground">{fmtMoney(r.repagos)}</span>, r => r.repagos, () => <span className="text-muted-foreground">{fmtMoney(totales.repagos)}</span>),
    crecimientoBruto: Col('crecimientoBruto', 'Crecimiento', r => fmtMoney(r.crecimientoBruto), r => r.crecimientoBruto, () => fmtMoney(totales.crecimientoBruto)),
    mora150: Col('mora150', 'Mora 150', r => <span className="text-muted-foreground">{fmtMoney(r.mora150)}</span>, r => r.mora150, () => <span className="text-muted-foreground">{fmtMoney(totales.mora150)}</span>),
    pctMora150: Col('pctMora150', '% Mora150', r => <span className="text-muted-foreground">{fmtDec(r.pctMora150)}%</span>, r => r.pctMora150 / 100, () => <span className="text-muted-foreground">{fmtDec(totales.pctMora150)}%</span>, 'right', undefined, <div className="leading-[1.15]">%<br/>Mora150</div>),
    crecNeto150: Col('crecNeto150', 'Crec. Neto 150', r => <span className={getCrecNetoColor(r.crecimientoNeto150)}>{fmtMoney(r.crecimientoNeto150)}</span>, r => r.crecimientoNeto150, () => <span className={getCrecNetoColor(totales.crecimientoNeto150)}>{fmtMoney(totales.crecimientoNeto150)}</span>, 'right', undefined, <div className="leading-[1.15]">Crecimiento<br/>Neto 150</div>, r => getCrecNetoBg(r.crecimientoNeto150)),
    faltante20k: Col('faltante20k', 'Faltante a S/20K', r => <span className={getFaltanteColor(r.faltante20k)}>{fmtMoney(r.faltante20k)}</span>, r => r.faltante20k, () => <span className={getFaltanteColor(totales.faltante20k)}>{fmtMoney(totales.faltante20k)}</span>, 'right', undefined, <div className="leading-[1.15]">Faltante a<br/>S/20K</div>),

    // Tabla 7: Resumen de Bonos
    blankDuracion: Col('blankDuracion', 'Duración (Candado)', r => fmtDec(r.duracion), r => r.duracion, () => '', 'center', undefined, <div className="leading-[1.15]">Duración<br/>(Candado)</div>, r => getDurBg(r.duracion)),
    blankCartera: Col('blankCartera', 'Cartera (Condicional Adicional)', r => fmtMoney(r.cartera), r => r.cartera, () => '', 'right', undefined, <div className="leading-[1.15]">Cartera<br/>(Adicional)</div>, r => getCarteraBg(r.cartera)),
    blankOpAchieved: Col('blankOpAchieved', 'Nro Oper (Bono Base)', r => r.opAchieved, r => r.opAchieved, () => '', 'center', undefined, <div className="leading-[1.15]">Nro Oper<br/>(Bono Base)</div>, r => getOpBg(r.opAchieved)),
    blankOpProjection: Col('blankOpProjection', 'Nro Oper Proyeccion', r => r.opProjection, r => r.opProjection, () => '', 'center', undefined, <div className="leading-[1.15]">Nro Oper<br/>Proyección</div>, r => getOpBg(r.opProjection)),
    crecNeto150_T7: Col('crecNeto150_T7', 'Crecimiento Neto 150 (Mult.)', r => <span className={getCrecNetoColor(r.crecimientoNeto150)}>{fmtMoney(r.crecimientoNeto150)}</span>, r => r.crecimientoNeto150, () => '', 'right', undefined, <div className="leading-[1.15]">Crecimiento<br/>Neto 150 (Mult.)</div>, r => getCrecNetoBg(r.crecimientoNeto150)),
    sociosNuevos_T7: Col('sociosNuevos_T7', 'Socios Nuevos (Mult.)', r => r.sociosNuevos, r => r.sociosNuevos, () => '', 'center', undefined, <div className="leading-[1.15]">Socios Nuevos<br/>(Mult.)</div>, r => getSocNuevosBg(r.sociosNuevos)),
    excSolesCpp_T7: Col('excSolesCpp_T7', 'Excedente Mora CPP (Mult.)', r => fmtMoney(r.excedenteSolesCpp), r => r.excedenteSolesCpp, () => '', 'right', undefined, <div className="leading-[1.15]">Excedente Mora<br/>CPP (Mult.)</div>, r => getExcBg(r.excedentePctCpp)),
    excSolesDef_T7: Col('excSolesDef_T7', 'Excedente Mora Vencida (Mult.)', r => fmtMoney(r.excedenteSolesDef), r => r.excedenteSolesDef, () => '', 'right', undefined, <div className="leading-[1.15]">Excedente Mora<br/>Vencida (Mult.)</div>, r => getExcBg(r.excedentePctDef)),
  };

  // ==========================================
  // CONFIGURACIÓN DE LAS TABLAS
  // ==========================================
  const t1 = useColumnOrder(['asesor', 'cartera', 'desembolsos', 'repagos', 'crecimientoBruto', 'mora150', 'pctMora150', 'crecNeto150', 'faltante20k'], 't1', 'asesor');
  const t2 = useColumnOrder(['asesor', 'opAchieved', 'opProjection'], 't2', 'asesor');
  const t3 = useColumnOrder(['asesorT3', 'duracion'], 't3', 'asesorT3');
  const t4 = useColumnOrder(['asesor', 'sociosInicio', 'sociosActual', 'sociosNuevos', 'sociosRecuperacion', 'sociosCancelados', 'sociosTraspasados', 'sociosActivos'], 't4', 'asesor');
  const t5 = useColumnOrder(['asesor', 'carteraInicio', 'moraCppActual', 'pctMoraCpp', 'metaMoraCpp', 'excedentePctCpp', 'excedenteSolesCpp'], 't5', 'asesor');
  const t6 = useColumnOrder(['asesor', 'carteraInicio', 'moraDefActual', 'pctMoraDef', 'metaMoraDef', 'excedentePctDef', 'excedenteSolesDef'], 't6', 'asesor');
  const t7 = useColumnOrder(['asesorT7', 'blankDuracion', 'blankCartera', 'blankOpAchieved', 'blankOpProjection', 'crecNeto150_T7', 'sociosNuevos_T7', 'excSolesCpp_T7', 'excSolesDef_T7'], 't7', 'asesorT7');

  if (loadAsesores || loadDias || !asesoresBD) return <LoadingState />;
  if (errAsesores) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error de conexión al DWH.</div>;

  const exportar = async (columnKeys: string[], filename: string, formato: 'excel' | 'clipboard') => {
    const cols = columnKeys.map(k => dict[k]);
    const headers = cols.map(c => c.header);
    const rows = datosProyectados.map((r:any) => cols.map(col => col.raw(r)));
    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map((row: any) => row.map((val: any) => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Indicadores de Asesores';
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

  // Altura estricta para activar el Scroll vertical
  const containerClass = `max-h-[500px] pb-0`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <WorkdayStrip periodo={filters.period} />

      {/* 1. CARTERA COMERCIAL */}
      <SectionBand tone="green">CARTERA COMERCIAL</SectionBand>
      <Panel title="Todos los Indicadores de Bonificación" icon={<Users />} eyebrow="Cartera y Crecimiento Neto 150" action={<ExportActions control={t1} onExport={(f) => exportar(t1.order, 'Cartera_Comercial', f)} />}>
        <DraggableTable control={t1} columns={t1.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
      </Panel>

      {/* 2. TABLAS SECUNDARIAS (REESTRUCTURADAS PARA COMPARTIR EL ESPACIO CORRECTAMENTE) */}
      {/* 
         El grid responsive cambiará dependiendo del ancho de pantalla:
         - Móvil: 1 columna
         - Tablets/Laptops (xl): 2 columnas
         - Escritorio Ancho (2xl): 5 columnas -> Operaciones(1) + Duración(1) + Socios(3) 
      */}
      <div className="grid gap-5 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-5">
        
        <div className="2xl:col-span-1">
          <Panel title="Operaciones" icon={<Users />} action={<ExportActions control={t2} onExport={(f) => exportar(t2.order, 'Operaciones', f)} />}>
            <DraggableTable control={t2} columns={t2.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
          </Panel>
        </div>

        <div className="2xl:col-span-1">
          <Panel title="Duración" icon={<Clock3 />} action={<ExportActions control={t3} onExport={(f) => exportar(t3.order, 'Duracion', f)} />}>
            <DraggableTable control={t3} columns={t3.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
          </Panel>
        </div>

        {/* Esta tabla de Socios ocupará 3 espacios en pantallas muy grandes, dándole lugar a sus 7 columnas */}
        <div className="xl:col-span-2 2xl:col-span-3">
          <Panel title="Número de Socios" icon={<Users />} action={<ExportActions control={t4} onExport={(f) => exportar(t4.order, 'Socios', f)} />}>
            <DraggableTable control={t4} columns={t4.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
          </Panel>
        </div>
      </div>

      {/* 3. MORA CPP Y MORA VENCIDA */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Mora CPP" icon={<ShieldAlert />} action={<ExportActions control={t5} onExport={(f) => exportar(t5.order, 'Mora_CPP', f)} />}>
          <DraggableTable control={t5} columns={t5.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
        </Panel>

        <Panel title="Mora Vencida" icon={<ShieldAlert />} action={<ExportActions control={t6} onExport={(f) => exportar(t6.order, 'Mora_Vencida', f)} />}>
          <DraggableTable control={t6} columns={t6.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
        </Panel>
      </div>

      {/* 4. RESUMEN DE BONIFICACIÓN */}
      <SectionBand tone="blue">Resumen. Indicadores de Bonificación</SectionBand>
      <Panel title="Resumen" icon={<Users />} eyebrow="Bonos condicionados a Candado y Multiplicadores" action={<ExportActions control={t7} onExport={(f) => exportar(t7.order, 'Resumen_Bonificacion', f)} />}>
        <DraggableTable control={t7} columns={t7.order.map(k => dict[k])} data={datosProyectados} containerClass={containerClass} />
      </Panel>
    </div>
  );
}