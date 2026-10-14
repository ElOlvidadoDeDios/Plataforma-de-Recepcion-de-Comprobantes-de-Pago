// src/views/ColocacionesView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { Panel } from '../components/Panel';
import { WorkdayStrip } from '../components/WorkdayStrip';
import { SectionBand } from '../components/SectionBand';
import { Users, RefreshCw, Copy, Download } from 'lucide-react';
import { number } from '../utils/formatters';
import { fetchAgencia, fetchDiasLaborales } from '../services/colocaciones.service';

// ============================================================================
// HOOKS Y COMPONENTES MAESTROS DE EXPORTACIÓN Y ARRASTRE
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

    const sourceIndex = order.indexOf(sourceId);
    const targetIndex = order.indexOf(targetId);
    const newOrder = [...order];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    setOrder(newOrder);
  };

  const resetOrder = () => setOrder(initialOrder);
  return { order, handleDragStart, handleDragOver, handleDrop, resetOrder, isModified, lockedCol };
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

// EL SEMIDONUT SE MANTIENE INTACTO Y ANIMADO
const SemiDonut = ({ pct }: { pct: number }) => {
  const radius = 60;
  const circum = Math.PI * radius;
  const boundedPct = Math.min(100, Math.max(0, pct));
  const dashoffset = circum - (boundedPct / 100) * circum;
  const strokeColor = pct >= 70 ? "#16a34a" : (pct >= 50 ? "#f59e0b" : "#e11d48");

  return (
    <div className="relative flex flex-col items-center pt-2">
      <svg width="200" height="110" viewBox="0 0 150 85" className="overflow-visible">
        <path d="M 15 75 A 60 60 0 0 1 135 75" fill="none" stroke="#f1f5f9" strokeWidth="22" strokeLinecap="butt" />
        <path d="M 15 75 A 60 60 0 0 1 135 75" fill="none" stroke={strokeColor} strokeWidth="22" strokeLinecap="butt"
              strokeDasharray={circum} strokeDashoffset={dashoffset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute bottom-1 text-[40px] font-bold tracking-tight text-foreground">{Math.round(pct)}%</div>
      <div className="absolute bottom-1 left-2 text-[10px] font-bold text-rose-600">0%</div>
      <div className="absolute bottom-1 right-2 text-[10px] font-bold text-rose-600">100%</div>
    </div>
  );
};

// TABLA DINÁMICA DE DENSIDAD FLUIDA
function DraggableTable({ control, columns, data, containerClass, showFooter = true }: { control: any, columns: any[], data: any[], containerClass: string, showFooter?: boolean }) {
  return (
    <div className={`relative overflow-x-auto overflow-y-auto scrollbar-thin z-0 ${containerClass}`}>
      <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
        <thead className="sticky top-0 z-20 shadow-sm">
          <tr className="border-b border-border">
            {columns.map(col => (
              <th 
                key={col.id} 
                draggable={col.id !== control.lockedCol} 
                onDragStart={(e) => control.handleDragStart(e, col.id)} 
                onDragOver={control.handleDragOver} 
                onDrop={(e) => control.handleDrop(e, col.id)}
                className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== control.lockedCol ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'}`}
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
          <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
            <tr className="border-t-2 border-border font-bold">
              {columns.map(col => (
                <td 
                  key={`foot-${col.id}`} 
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

const Col = (id: string, header: string, cell: (r:any)=>any, raw: (r:any)=>any, footer: ()=>any, align='right', cellBg?: (r:any)=>string, headerJSX?: React.ReactNode) => ({ id, header, headerJSX, cell, raw, footer, align, cellBg });

const COL_KEYS = ['asesor', 'log', 'met', 'prod', 'proy', 'faltDia', 'faltExigente', 'categoria'];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function ColocacionesView({ filters }: { filters: any }) {
  const { data: agenciaData, isLoading: loadAgencia, isError: errorAgencia } = useQuery({
    queryKey: ['agencia', filters.period],
    queryFn: () => fetchAgencia(filters.period),
    enabled: filters.period !== 'Cargando...',
  });

  const { data: calData, isLoading: loadCal } = useQuery({
    queryKey: ['dias-laborales', filters.period],
    queryFn: () => fetchDiasLaborales(filters.period),
    enabled: filters.period !== 'Cargando...',
  });

  const { kpis, tableData, totalesTabla } = useMemo(() => {
    const comercialFiltered = (agenciaData?.comercial || []).filter((c: any) => {
      if (filters.agency !== 'Todas' && c.agency !== filters.agency) return false;
      if (filters.advisor !== 'Todos' && c.asesor !== filters.advisor) return false;
      return true;
    });

    const resumenFiltered = (agenciaData?.resumen || []).filter((r: any) => {
      if (filters.agency !== 'Todas' && r.agency !== filters.agency) return false;
      return true;
    });

    // 1. EL CALENDARIO OFICIAL
    const dataDias = Array.isArray(calData) ? calData[0] : (calData || {});
    const dTotales = Number(dataDias.totales || 25);
    const dTranscurridos = Number(dataDias.transcurridos || 23);
    const dRestantes = Number(dataDias.restantes || 2);

    // 2. EL SECRETO DE DAX (AVERAGEX)
    const horaPeru = new Date().toLocaleString("en-US", { timeZone: "America/Lima" });
    const horaActual = new Date(horaPeru).getHours();
    const diasProductividadDAX = horaActual < 19 ? dTranscurridos + 1 : dTranscurridos;

    // 3. LOGRADO Y META
    const logrado = comercialFiltered.reduce((acc: number, curr: any) => acc + Number(curr.opAchieved || 0), 0);

    const metaGlobal = filters.advisor === 'Todos'
      ? resumenFiltered.reduce((acc: number, curr: any) => acc + Number(curr.opTarget || 0), 0)
      : comercialFiltered.reduce((acc: number, curr: any) => acc + Number(curr.metaAsesor || 30), 0);

    const faltante = Math.max(0, metaGlobal - logrado);
    const cumplimiento = metaGlobal > 0 ? (logrado / metaGlobal) * 100 : 0;

    // 4. PROYECCIÓN DAX
    const prodGlobal = diasProductividadDAX > 0 ? (logrado / diasProductividadDAX) : 0;
    const proyRestanteGlobal = Math.round(prodGlobal * dRestantes);
    const proyeccionGlobal = logrado + proyRestanteGlobal;

    const proyFaltante = Math.max(0, metaGlobal - proyeccionGlobal);
    const proyCumplimiento = metaGlobal > 0 ? (proyeccionGlobal / metaGlobal) * 100 : 0;

    // 5. KPIs EN DÍAS LABORALES
    const credPorDiaHastaFecha = dTranscurridos > 0 ? Math.round(logrado / dTranscurridos) : 0;
    const credPorDiaRestantes = dRestantes > 0 ? Math.round(faltante / dRestantes) : 0;
    const credPorDiaReferencia = dTotales > 0 ? Math.round(metaGlobal / dTotales) : 0;
    const prodIdeal = dTotales > 0 ? (30 / dTotales).toFixed(2) : '1.20';

    // 6. DATOS PARA LA TABLA (Nivel Asesor)
    const tData = comercialFiltered.map((c: any) => {
      const log = Number(c.opAchieved || 0);
      const metAsesor = Number(c.metaAsesor || 30);

      const prod = diasProductividadDAX > 0 ? (log / diasProductividadDAX) : 0;
      const proyRestante = Math.round(prod * dRestantes);
      const proyTotalAsesor = log + proyRestante;

      const falt = Math.max(0, metAsesor - log);
      const faltDia = dRestantes > 0 ? (falt / dRestantes) : 0;
      const faltExigente = Math.ceil(faltDia);
      const pct = metAsesor > 0 ? (proyTotalAsesor / metAsesor) * 100 : 0;

      // Colores PBI Style para "Categoría / Estado"
      let badgeClass = "bg-rose-500/10 text-rose-700 font-semibold";
      if (pct >= 100) badgeClass = "bg-emerald-500/20 text-emerald-700 font-bold";
      else if (pct >= 85) badgeClass = "bg-amber-300/20 text-amber-900 font-semibold";

      return { asesor: c.asesor, log, met: metAsesor, prod, proy: proyTotalAsesor, falt, faltDia, faltExigente, badgeClass };
    }).sort((a: any, b: any) => b.log - a.log);

    const t_log = tData.reduce((acc: number, curr: any) => acc + curr.log, 0);
    const t_met = tData.reduce((acc: number, curr: any) => acc + curr.met, 0);
    const t_proy = tData.reduce((acc: number, curr: any) => acc + curr.proy, 0);
    const t_prod = tData.length > 0 ? tData.reduce((acc: number, curr: any) => acc + curr.prod, 0) / tData.length : 0;
    const t_faltDia = dRestantes > 0 ? Math.max(0, t_met - t_log) / dRestantes : 0;

    return {
      kpis: {
        logrado, meta: metaGlobal, faltante, cumplimiento,
        proyeccion: proyeccionGlobal, proyFaltante, proyCumplimiento,
        credPorDiaHastaFecha, credPorDiaRestantes, credPorDiaReferencia, prodIdeal
      },
      tableData: tData,
      totalesTabla: { t_log, t_met, t_proy, t_prod, t_faltDia }
    };
  }, [agenciaData, calData, filters.agency, filters.advisor]);

  const cTable = useColumnOrder(COL_KEYS, 'colocaciones', 'asesor');

  // ==========================================
  // CONFIGURACIÓN VISUAL DE COLUMNAS (Diccionario)
  // ==========================================
  const dict: Record<string, any> = {
    asesor: Col('asesor', 'Asesor', r => <span className="font-sans font-medium">{r.asesor}</span>, r => r.asesor, () => <span className="font-sans">Total {filters.advisor !== 'Todos' ? 'Asesor' : 'Agencia'}</span>, 'left'),
    log: Col('log', 'Logrado', r => <span className="text-emerald-600 font-bold">{r.log}</span>, r => r.log, () => <span className="text-emerald-600 font-bold">{totalesTabla.t_log}</span>),
    met: Col('met', 'Meta Asesor', r => <span className="text-muted-foreground">{r.met}</span>, r => r.met, () => <span>{totalesTabla.t_met}</span>, 'right', undefined, <div className="leading-[1.15]">Meta<br/>Asesor</div>),
    prod: Col('prod', 'Productividad', r => r.prod.toFixed(2), r => r.prod, () => totalesTabla.t_prod.toFixed(2)),
    proy: Col('proy', 'Proyección', r => r.proy, r => r.proy, () => totalesTabla.t_proy),
    faltDia: Col('faltDia', 'Faltante por Día Restante', r => <span className="text-rose-600">{r.faltDia.toFixed(2)}</span>, r => r.faltDia, () => <span className="text-rose-600">{totalesTabla.t_faltDia.toFixed(2)}</span>, 'right', undefined, <div className="leading-[1.15]">Faltante por<br/>Día Restante</div>),
    faltExigente: Col('faltExigente', 'Faltante Exigente / Día', r => <span className="font-bold">{r.faltExigente}</span>, r => r.faltExigente, () => <span className="text-muted-foreground">-</span>, 'right', undefined, <div className="leading-[1.15]">Faltante<br/>Exigente / Día</div>),
    categoria: Col('categoria', 'Categoría / Estado', 
      r => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans ${r.badgeClass}`}>
          Proyección: {r.met > 0 ? Math.round((r.proy / r.met) * 100) : 0}%
        </span>
      ), 
      r => r.met > 0 ? (r.proy / r.met) : 0, 
      () => <span className="font-sans">{Math.round(kpis.cumplimiento)}% Global</span>, 'center', undefined, <div className="leading-[1.15]">Categoría /<br/>Estado</div>)
  };

  const colRender = cTable.order.map(id => dict[id]);

  const exportar = async (formato: 'excel' | 'clipboard') => {
    const headers = colRender.map(c => c.header);
    const rows = tableData.map((r:any) => colRender.map(col => col.raw(r)));
    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map((row: any[]) => row.map(val => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Colocaciones';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Asesores', { views: [{ state: 'frozen', ySplit: 1 }] });
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
        a.download = `Desempeño_Asesores_${filters.period}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert('❌ Error al generar el archivo Excel.');
      }
    }
  };

  const tableContainerClass = `max-h-[600px] pb-0`;

  // ==========================================
  // ZONA 3: RETORNOS ANTICIPADOS (Carga y Error)
  // ==========================================
  if (loadAgencia || loadCal) return <div className="h-96 animate-pulse rounded-xl bg-muted/50"></div>;
  if (errorAgencia) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error al cargar los datos del DWH.</div>;

  // ==========================================
  // ZONA 4: RENDERIZADO PRINCIPAL
  // ==========================================
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <WorkdayStrip periodo={filters.period} />
      <SectionBand tone="coral">A NIVEL DE {filters.advisor !== 'Todos' ? 'ASESOR' : 'AGENCIA'}</SectionBand>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel title={filters.advisor !== 'Todos' ? `Hasta Hoy, ¿Cómo Va ${filters.advisor}?` : "Hasta Hoy, ¿Cómo Va mi Agencia?"}>
          <div className="flex flex-col items-center p-2">
            <div className="text-[11px] text-muted-foreground font-semibold mb-2 text-center">Cumplimiento Porcentual de la Meta Mensual</div>
            <SemiDonut pct={kpis.cumplimiento} />
            <div className="grid grid-cols-3 w-full text-center mt-6 pt-4">
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1">Logrado a la Fecha</div>
                <div className="text-3xl font-bold text-emerald-600 font-mono tracking-tighter">{number(kpis.logrado)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1">Faltante a la Meta</div>
                <div className="text-3xl font-bold text-rose-500 font-mono tracking-tighter">{number(kpis.faltante)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1">Meta</div>
                <div className="text-3xl font-bold text-foreground font-mono tracking-tighter">{number(kpis.meta)}</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title={filters.advisor !== 'Todos' ? `Al cierre de Mes, ¿Cómo Iría ${filters.advisor}?` : "Al cierre de Mes, ¿Cómo Iría mi Agencia?"}>
          <div className="flex flex-col items-center p-2">
            <div className="text-[11px] text-muted-foreground font-semibold mb-2 text-center">Proyección del Cumplimiento Porcentual de la Meta Mensual</div>
            <SemiDonut pct={kpis.proyCumplimiento} />
            <div className="grid grid-cols-3 w-full text-center mt-6 pt-4">
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1">Proyección (Logrado)</div>
                <div className="text-3xl font-bold text-emerald-600 font-mono tracking-tighter">{number(kpis.proyeccion)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1">Faltante Proyectado</div>
                <div className="text-3xl font-bold text-rose-500 font-mono tracking-tighter">{number(kpis.proyFaltante)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1">Meta</div>
                <div className="text-3xl font-bold text-foreground font-mono tracking-tighter">{number(kpis.meta)}</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="En términos de días laborales:">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center pt-2 pb-16">
          <div className="px-2">
            <div className="text-sm font-medium text-foreground mb-4 px-4">Hasta la fecha, es como si hubiese colocado ... créditos por día laboral</div>
            <div className="text-[44px] font-bold text-emerald-600 font-mono tracking-tighter">{kpis.credPorDiaHastaFecha}</div>
          </div>
          <div className="px-2 md:border-x border-border/60 flex flex-col items-center">
            <div className="text-sm font-medium text-foreground mb-4 px-4">Cada uno de estos días restantes, {filters.advisor !== 'Todos' ? 'tiene' : 'tengo'} que colocar ... créditos para llegar a {filters.advisor !== 'Todos' ? 'su' : 'mi'} meta</div>
            <div className="relative">
              <div className="text-[44px] font-bold text-rose-500 font-mono tracking-tighter">{kpis.credPorDiaRestantes}</div>
              <div className="absolute top-[110%] left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap bg-background border-2 border-foreground rounded px-4 py-2 text-[14px] font-bold text-foreground shadow-lg z-10">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-b-8 border-b-foreground w-0 h-0"></div>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-6 border-x-transparent border-b-6 border-b-background w-0 h-0"></div>
                Mi meta de hoy
              </div>
            </div>
          </div>
          <div className="px-2">
            <div className="text-sm font-medium text-foreground mb-4 px-4">Como referencia, si durante el mes coloco ... créditos por día laboral llego a mi meta</div>
            <div className="text-[44px] font-bold text-[#333333] font-mono tracking-tighter">{kpis.credPorDiaReferencia}</div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Desempeño a Nivel de Asesores"
        icon={<Users />}
        eyebrow={`Productividad ideal: ${kpis.prodIdeal} créditos / día`}
        action={<ExportActions control={cTable} onExport={(f) => exportar(f)} />}
      >
        <DraggableTable control={cTable} columns={colRender} data={tableData} containerClass={tableContainerClass} />
      </Panel>
    </div>
  );
}