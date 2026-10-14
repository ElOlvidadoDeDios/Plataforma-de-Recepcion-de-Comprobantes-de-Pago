//ProductividadDiaria.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LabelList } from 'recharts';
import ExcelJS from 'exceljs';
import { Filters } from '../utils/constants';
import { money, number } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { SectionBand } from '../components/SectionBand';
import { Panel } from '../components/Panel';
import { WorkdayStrip } from '../components/WorkdayStrip';
import { ShieldAlert, TrendingUp, Users, RefreshCw, Copy, Download } from 'lucide-react';
import { getGestionPreventiva, getProductividadDiaria } from '../services/productividad.service';

// ============================================================================
// HELPER DE EXPORTACIÓN (compartido)
// ============================================================================
async function exportToExcel(headers: string[], rows: any[][], sheetName: string, filename: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });

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

// ============================================================================
// HOOKS Y COMPONENTES MAESTROS DE EXPORTACIÓN Y ARRASTRE
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string = 'agency') {
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

// TABLA CON FONDOS OPACOS EN ENCABEZADOS Y ESPACIO DINÁMICO (DENSIDAD FLUIDA)
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
                  className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.align === 'left' ? 'text-left whitespace-normal min-w-[90px] md:min-w-[130px] max-w-[220px] leading-[1.15]' : 'text-right whitespace-nowrap font-mono'} ${col.align === 'center' ? 'text-center' : ''} ${col.cellBg ? col.cellBg(row) : ''}`}
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

// ============================================================================
// 1. VISTA PREVENTIVA (Gestión Preventiva)
// ============================================================================
const COL_PREV = ['agencia', 'socio', 'telefono', 'producto', 'analista', 'fecha_vencimiento', 'dias_para_vencimiento', 'saldo'];

export function PreventivaView({ filters }: { filters: Filters }) {
  const { data: creditos, isLoading, error } = useQuery({
    queryKey: ['gestion-preventiva'],
    queryFn: getGestionPreventiva
  });

  const cPrev = useColumnOrder(COL_PREV, 'prev', 'agencia');

  const safeCreditos = creditos || [];
  const datosFiltrados = filters.agency === 'Todas' 
    ? safeCreditos 
    : safeCreditos.filter((c: any) => c.agencia === filters.agency);

  const totalSaldo = datosFiltrados.reduce((acc: number, curr: any) => acc + Number(curr.saldo_formateado?.replace(/,/g, '') || 0), 0);

  if (isLoading) return <LoadingState />;
  if (error) return <div className="p-4 text-destructive font-semibold">Error al cargar datos del DWH.</div>;

  const defPrev = [
    Col('agencia', 'Agencia', r => <span className="font-medium">{r.agencia}</span>, r => r.agencia, () => 'Total General', 'left'),
    Col('socio', 'Socio', r => <span className="font-medium">{r.socio}</span>, r => r.socio, () => '', 'left'),
    Col('telefono', 'Teléfono', r => r.telefono, r => r.telefono, () => '', 'left'),
    Col('producto', 'Producto', r => <span className="text-muted-foreground">{r.producto}</span>, r => r.producto, () => '', 'left'),
    Col('analista', 'Analista', r => r.analista, r => r.analista, () => '', 'left'),
    Col('fecha_vencimiento', 'Vencimiento', r => r.fecha_vencimiento, r => r.fecha_vencimiento, () => '', 'left'),
    Col('dias_para_vencimiento', 'Días Faltantes', r => (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-sans ${r.dias_para_vencimiento === 0 ? 'bg-rose-500/20 text-rose-700' : r.dias_para_vencimiento <= 2 ? 'bg-amber-500/20 text-amber-800' : 'bg-sky-500/20 text-sky-700'}`}>
        {r.dias_para_vencimiento === 0 ? 'HOY' : `${r.dias_para_vencimiento} días`}
      </span>
    ), r => r.dias_para_vencimiento, () => '', 'center', undefined, <div className="leading-[1.15]">Días<br/>Faltantes</div>),
    Col('saldo', 'Saldo', r => <span className="font-bold text-rose-600">S/ {r.saldo_formateado}</span>, r => Number(r.saldo_formateado?.replace(/,/g, '') || 0), () => <span className="text-rose-600">{money(totalSaldo)}</span>)
  ];

  const colRender = cPrev.order.map(id => defPrev.find(c => c.id === id)!);

  const exportar = async (formato: 'excel' | 'clipboard') => {
    const headers = colRender.map(c => c.header);
    const rows = datosFiltrados.map((r:any) => colRender.map(col => col.raw(r)));
    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map((row: any[]) => row.join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      await exportToExcel(headers, rows, 'Preventiva', `Gestion_Preventiva_${filters.period}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" key={`${filters.period}-${filters.agency}`}>
      <WorkdayStrip periodo={filters.period} />
      <SectionBand tone="coral">Próximos a Vencer (5 Días)</SectionBand>
      <Panel title="Gestión Preventiva" icon={<ShieldAlert />} eyebrow="Cartera en riesgo inminente" action={<ExportActions control={cPrev} onExport={exportar} />}>
        {/* Usamos el nuevo DraggableTable para Preventiva */}
        <DraggableTable control={cPrev} columns={colRender} data={datosFiltrados} containerClass="max-h-[600px] pb-0" />
      </Panel>
    </div>
  );
}

// ============================================================================
// 2. VISTA DE PRODUCTIVIDAD DIARIA (En Vivo con Backend)
// ============================================================================
export function ProductividadDiaria({ filters }: { filters: Filters }) {
  const { data: diariaBD, isLoading, isError } = useQuery({
    queryKey: ['productividad-diaria', filters.period, filters.day],
    queryFn: () => getProductividadDiaria(filters.period, filters.day || 'Hoy'),
    enabled: filters.period !== 'Cargando...'
  });

  const { dailyRows, asesoresRows, fechaConsultada } = useMemo(() => {
    if (!diariaBD) return { dailyRows: [], asesoresRows: [], fechaConsultada: '' };
    let filteredAgencias = filters.agency === 'Todas' ? diariaBD.agencias || [] : (diariaBD.agencias || []).filter((r: any) => r.agency === filters.agency);
    let filteredAsesores = diariaBD.asesores || [];
    if (filters.agency !== 'Todas') filteredAsesores = filteredAsesores.filter((r: any) => r.agency === filters.agency);
    if (filters.advisor !== 'Todos') filteredAsesores = filteredAsesores.filter((r: any) => r.asesor === filters.advisor);
    
    const rawDate = diariaBD.fechaConsultada;
    const fecha = rawDate ? new Date(rawDate).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '';
    return { dailyRows: filteredAgencias, asesoresRows: filteredAsesores, fechaConsultada: fecha };
  }, [diariaBD, filters.agency, filters.advisor]);

  const countData = dailyRows.map((row: any) => ({ agency: row.agency, value: row.targetCount > 0 ? Math.round((row.achievedCount / row.targetCount) * 100) : 0 }));
  const amountData = dailyRows.map((row: any) => ({ agency: row.agency, value: row.targetAmount > 0 ? Math.round((row.achievedAmount / row.targetAmount) * 100) : 0 }));

  if (isLoading) return <LoadingState />;
  if (isError || !diariaBD) return <div className="p-4 text-destructive font-semibold">Error al cargar datos diarios.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" key={`${filters.period}-${filters.agency}-${filters.day}`}>
      <WorkdayStrip periodo={filters.period} />
      <SectionBand tone="blue">Productividad Diaria {fechaConsultada ? `· Mostrando corte al: ${fechaConsultada}` : ''}</SectionBand>

      <div className="grid gap-5 xl:grid-cols-2">
        <DailyTable title="Respecto a la Cantidad de Colocaciones" mode="count" data={dailyRows} period={filters.period} />
        <DailyTable title="Respecto al Monto de Colocaciones" mode="amount" data={dailyRows} period={filters.period} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ComplianceChart title="Cumplimiento Porcentual de la Meta (Cantidad)" data={countData} />
        <ComplianceChart title="Cumplimiento Porcentual de la Meta (Monto)" data={amountData} />
      </div>

      <div className="grid gap-5 xl:grid-cols-1">
        <AsesoresDiariosTable data={asesoresRows} period={filters.period} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. COMPONENTES HIJOS DINÁMICOS
// ----------------------------------------------------------------------------
const COL_DAILY = ['agency', 'target', 'projection', 'achieved', 'diffProj', 'diffMeta'];

function DailyTable({ title, mode, data, period }: { title: string; mode: 'count' | 'amount'; data: any[], period: string }) {
  const cDaily = useColumnOrder(COL_DAILY, `daily_${mode}`, 'agency');

  const t_target = data.reduce((acc, r) => acc + Number(mode === 'count' ? r.targetCount : r.targetAmount), 0);
  const t_projection = data.reduce((acc, r) => acc + Number(mode === 'count' ? r.projectionCount : r.projectionAmount), 0);
  const t_achieved = data.reduce((acc, r) => acc + Number(mode === 'count' ? r.achievedCount : r.achievedAmount), 0);
  
  // Cálculo crudo de diferencias
  const t_faltanteProj = t_projection - t_achieved;
  const t_faltanteMeta = t_target - t_achieved;

  const getTarget = (r:any) => Number(mode === 'count' ? r.targetCount : r.targetAmount);
  const getProj = (r:any) => Number(mode === 'count' ? r.projectionCount : r.projectionAmount);
  const getAchieved = (r:any) => Number(mode === 'count' ? r.achievedCount : r.achievedAmount);
  
  // Condicional de color basado en la imagen de Power BI
  const getDiffBg = (target: number, achieved: number) => {
    if (target === 0) return 'bg-rose-500/10 text-rose-700';
    const pct = (achieved / target) * 100;
    if (pct >= 100) return 'bg-emerald-500/15 text-emerald-800'; // Verde (Cumplido)
    if (pct >= 75) return 'bg-amber-500/20 text-amber-800';      // Naranja
    return 'bg-rose-500/15 text-rose-800';                       // Rojo
  };

  const getDiffIcon = (target: number, achieved: number) => {
    if (target === 0) return '❌';
    const pct = (achieved / target) * 100;
    if (pct >= 100) return '✅';
    if (pct >= 75) return '⚠️';
    return '❌';
  };

  const defDaily = [
    Col('agency', 'Agencia', r => <span className="font-medium">{r.agency}</span>, r => r.agency, () => 'Total', 'left'),
    Col('target', mode === 'count' ? '# Meta' : 'S/ Meta', r => mode === 'count' ? getTarget(r) : money(getTarget(r)), r => getTarget(r), () => mode === 'count' ? t_target : money(t_target)),
    Col('projection', mode === 'count' ? '# Proyección' : 'S/ Proyección', r => mode === 'count' ? getProj(r) : money(getProj(r)), r => getProj(r), () => mode === 'count' ? t_projection : money(t_projection)),
    Col('achieved', mode === 'count' ? '# Logrado' : 'S/ Logrado', r => <span className="font-bold text-emerald-600">{mode === 'count' ? getAchieved(r) : money(getAchieved(r))}</span>, r => getAchieved(r), () => <span className="font-bold text-emerald-600">{mode === 'count' ? t_achieved : money(t_achieved)}</span>),
    Col('diffProj', 'Faltante a Proyección', 
      r => {
        const diff = getProj(r) - getAchieved(r);
        return <span className="flex items-center justify-end gap-1.5">{mode === 'count' ? number(diff) : money(diff)} <span className="text-[9px]">{getDiffIcon(getProj(r), getAchieved(r))}</span></span>;
      }, 
      r => getProj(r) - getAchieved(r), 
      () => <span className="font-bold">{mode === 'count' ? number(t_faltanteProj) : money(t_faltanteProj)}</span>, 
      'right', 
      r => getDiffBg(getProj(r), getAchieved(r)),
      <div className="leading-[1.15] text-center"># Faltante a<br/>Proyección</div>
    ),
    Col('diffMeta', 'Faltante a Meta', 
      r => {
        const diff = getTarget(r) - getAchieved(r);
        return <span className="flex items-center justify-end gap-1.5">{mode === 'count' ? number(diff) : money(diff)} <span className="text-[9px]">{getDiffIcon(getTarget(r), getAchieved(r))}</span></span>;
      }, 
      r => getTarget(r) - getAchieved(r), 
      () => <span className="font-bold">{mode === 'count' ? number(t_faltanteMeta) : money(t_faltanteMeta)}</span>, 
      'right', 
      r => getDiffBg(getTarget(r), getAchieved(r)),
      <div className="leading-[1.15] text-center"># Faltante a<br/>Meta</div>
    )
  ];

  const colRender = cDaily.order.map(id => defDaily.find(c => c.id === id)!);

  const exportar = async (formato: 'excel' | 'clipboard') => {
    const headers = colRender.map(c => c.header);
    const rows = data.map((r:any) => colRender.map(col => col.raw(r)));
    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map(row => row.map(val => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      await exportToExcel(headers, rows, 'Reporte', `Productividad_${mode}_${period}`);
    }
  };

  return (
    <Panel title={title} icon={<TrendingUp />} eyebrow="Verde: >=100% || Naranja: >=75% || Rojo: <75%" action={<ExportActions control={cDaily} onExport={exportar} />}>
      <DraggableTable control={cDaily} columns={colRender} data={data} containerClass="max-h-[600px] pb-0" />
    </Panel>
  );
}

function ComplianceChart({ title, data }: { title: string; data: { agency: string; value: number }[] }) {
  const sortedData = data.slice().sort((a, b) => b.value - a.value);
  return (
    <Panel title={title} eyebrow="Porcentaje de avance respecto a la meta">
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ left: 20, right: 35, top: 10, bottom: 10 }}>
            <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="agency" width={95} tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val: any) => `${val ?? 0}%`} />
            <Bar dataKey="value" name="% Avanzado" fill="#1e3a8a" radius={[0, 3, 3, 0]} barSize={16}>
              <LabelList dataKey="value" position="right" formatter={(val: any) => `${val ?? 0}%`} style={{ fontSize: '10px', fill: '#334155', fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

const COL_ASESORES = ['asesor', 'operations', 'disbursements'];

function AsesoresDiariosTable({ data, period }: { data: any[], period: string }) {
  const cAsesores = useColumnOrder(COL_ASESORES, 'asesores', 'asesor');

  const t_ops = data.reduce((acc, r) => acc + Number(r.operations || 0), 0);
  const t_des = data.reduce((acc, r) => acc + Number(r.disbursements || 0), 0);

  const defAsesores = [
    Col('asesor', 'Asesor', r => <span className="font-medium">{r.asesor}</span>, r => r.asesor, () => 'Total', 'left'),
    Col('operations', 'Operaciones', r => r.operations, r => r.operations, () => t_ops),
    Col('disbursements', 'Desembolsos', r => money(r.disbursements), r => r.disbursements, () => money(t_des))
  ];

  const colRender = cAsesores.order.map(id => defAsesores.find(c => c.id === id)!);

  const exportar = async (formato: 'excel' | 'clipboard') => {
    const headers = colRender.map(c => c.header);
    const rows = data.map((r:any) => colRender.map(col => col.raw(r)));
    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      await exportToExcel(headers, rows, 'Asesores', `Productividad_Asesores_${period}`);
    }
  };

  return (
    <Panel title="Cantidad y Monto de Colocaciones por Asesor" icon={<Users />} eyebrow="Rendimiento individual diario" action={<ExportActions control={cAsesores} onExport={exportar} />}>
      {/* 🚀 Usamos DraggableTable también aquí para mantener el estándar visual */}
      <DraggableTable control={cAsesores} columns={colRender} data={data} containerClass="max-h-[600px] pb-0" />
    </Panel>
  );
}