//EvolucionView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { ResponsiveContainer, ComposedChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, Line, Legend } from 'recharts';
import { LineChart, History, RefreshCw, Copy, Download, SlidersHorizontal } from 'lucide-react';
import { money } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { SectionBand } from '../components/SectionBand';
import { Panel } from '../components/Panel';
import { fetchEvolucion } from '../services/evolucion.service';

// ============================================================================
// HOOKS MAESTROS DE DRAG & DROP Y EXPORTACIÓN
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string = 'periodo') {
  const [order, setOrder] = useState(initialOrder);
  const isModified = JSON.stringify(order) !== JSON.stringify(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [JSON.stringify(initialOrder)]);

  const handleDragStart = (e: React.DragEvent, id: string) => { if (id === lockedCol) { e.preventDefault(); return; } e.dataTransfer.setData(`col_id_${tableId}`, id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, targetId: string) => { e.preventDefault(); const sourceId = e.dataTransfer.getData(`col_id_${tableId}`); if (!sourceId || sourceId === targetId || sourceId === lockedCol || targetId === lockedCol) return; const newOrder = [...order]; newOrder.splice(order.indexOf(targetId), 0, newOrder.splice(order.indexOf(sourceId), 1)[0]); setOrder(newOrder); };
  
  return { order, handleDragStart, handleDragOver, handleDrop, resetOrder: () => setOrder(initialOrder), isModified, lockedCol };
}

const ExportActions = ({ control, onExport }: { control: any, onExport: (format: 'excel' | 'clipboard') => void | Promise<void> }) => (
  <div className="flex items-center gap-2">
    {control.isModified && <button onClick={control.resetOrder} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-foreground"><RefreshCw size={13} /> Restablecer</button>}
    <button onClick={() => onExport('clipboard')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-primary hover:border-primary/50"><Copy size={13} /> Copiar</button>
    <button onClick={() => onExport('excel')} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"><Download size={13} /> Excel</button>
  </div>
);

// ============================================================================
// COMPONENTE: TABLA CON FONDOS SÓLIDOS Y DENSIDAD FLUIDA
// ============================================================================
function DraggableTable({ control, columns, data, containerClass, showFooter = false }: { control: any, columns: any[], data: any[], containerClass: string, showFooter?: boolean }) {
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
            <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-muted-foreground italic">No hay registros históricos disponibles.</td></tr>
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
                  {col.footer ? col.footer() : null}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

const Col = (id: string, header: string, cell: (r:any)=>any, raw: (r:any)=>any, footer: (()=>any) | null, align='right', cellBg?: (r:any)=>string, headerJSX?: React.ReactNode) => ({ id, header, headerJSX, cell, raw, footer, align, cellBg });

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
export function EvolucionView({ dbFilters }: { dbFilters: any }) {
  // ==========================================
  // ZONA 0: VARIABLES PREVIAS
  // ==========================================
  const periodosDisponibles = dbFilters?.periodos || [];
  const defaultEndMonth = periodosDisponibles[0];
  const defaultStartMonth = periodosDisponibles.length > 11 ? periodosDisponibles[11] : (periodosDisponibles[periodosDisponibles.length - 1] || '202508');
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // ==========================================
  // ZONA 1: ESTADOS Y QUERIES
  // ==========================================
  const [granularity, setGranularity] = useState<'Mensual' | 'Diario'>('Mensual');
  const [agency, setAgency] = useState('Todas');
  const [advisor, setAdvisor] = useState('Todos');
  const [dateRange, setDateRange] = useState({ start: defaultStartMonth, end: defaultEndMonth });

  const asesoresHistoricos = useMemo(() => {
    if (!dbFilters?.asesores) return [];
    let arr = dbFilters.asesores;
    if (agency !== 'Todas') {
      const agencyCodeMap: Record<string, string> = { 'Wanchaq': '01', 'San Jerónimo': '02', 'Quillabamba': '03', 'Sicuani': '04', 'Molino': '05', 'Juliaca': '06', 'Lima Los Olivos': '07', 'Tica Tica': '08', 'Magisterio': '09', 'Lima SJL': '10', 'Chiclayo': '11', 'Arequipa': '12', 'Pucallpa': '13' };
      arr = arr.filter((a: any) => String(a.IdSAgencia).trim() === agencyCodeMap[agency]);
    }
    const unique = new Map<string, string>();
    arr.forEach((a: any) => {
      const short = String(a.Asesor || '').trim();
      if (short) unique.set(String(a.AsesorNombresApellidos || short).trim(), short);
    });
    return Array.from(unique.entries()).map(([valorFiltro, textoVista]) => ({ valorFiltro, textoVista })).sort((a, b) => a.textoVista.localeCompare(b.textoVista));
  }, [dbFilters, agency]);

  const { data: evolucionBD, isLoading, error } = useQuery({
    queryKey: ['evolucion', granularity, agency, advisor, dateRange],
    queryFn: () => fetchEvolucion({
      agencia: agency,
      asesor: advisor,
      granularidad: granularity,
      desde: dateRange.start,
      hasta: dateRange.end
    }),
    enabled: !!dateRange.start && !!dateRange.end
  });

  const isMensual = granularity === 'Mensual';
  const isAsesor = advisor !== 'Todos';

  const chartData = evolucionBD || []; 
  
  // ==========================================
  // CONFIGURACIÓN DE COLORES Y COLUMNAS
  // ==========================================
  const getCrecimientoBg = (val: number) => val >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700';
  const getMoraBg = (val: number) => val > 15 ? 'bg-rose-500/15 text-rose-800 font-bold' : (val > 10 ? 'bg-amber-500/15 text-amber-800' : 'text-muted-foreground');

  const dict: Record<string, any> = {
    periodo: Col('periodo', isMensual ? 'Periodo' : 'Fecha', r => <span className="font-bold">{r.periodo}</span>, r => r.periodo, null, 'left'),
    etiquetaMes: Col('etiquetaMes', 'Etiqueta', r => <span className="font-medium text-muted-foreground">{r.etiqueta}</span>, r => r.etiqueta, null, 'left'),
    colocacionNumReal: Col('colocacionNumReal', 'Nro Oper.', r => <span className="font-mono text-blue-600 font-semibold">{r.colocacionNumReal}</span>, r => r.colocacionNumReal, null, 'right', undefined, <div className="leading-[1.15]">Nro<br/>Oper.</div>),
    colocacionNumMeta: Col('colocacionNumMeta', 'Meta Oper.', r => <span className="font-mono text-muted-foreground">{r.colocacionNumMeta}</span>, r => r.colocacionNumMeta, null, 'right', undefined, <div className="leading-[1.15]">Meta<br/>Oper.</div>),
    colocacionMonto: Col('colocacionMonto', 'Desembolsos S/', r => <span className="font-mono text-emerald-600 font-semibold">{money(r.colocacionMonto)}</span>, r => r.colocacionMonto, null, 'right', undefined, <div className="leading-[1.15]">Desembolsos<br/>S/</div>),
    colocacionMeta: Col('colocacionMeta', 'Meta S/', r => <span className="font-mono text-muted-foreground">{money(r.colocacionMeta)}</span>, r => r.colocacionMeta, null, 'right', undefined, <div className="leading-[1.15]">Meta<br/>S/</div>),
    repagos: Col('repagos', 'Repagos S/', r => <span className="font-mono text-rose-600 font-medium">{money(r.repagos)}</span>, r => r.repagos, null, 'right', undefined, <div className="leading-[1.15]">Repagos<br/>S/</div>),
    crecimientoBruto: Col('crecimientoBruto', 'Crecimiento Bruto', r => <span className="font-mono font-bold">{money(r.crecimientoBruto)}</span>, r => r.crecimientoBruto, null, 'right', r => getCrecimientoBg(r.crecimientoBruto), <div className="leading-[1.15]">Crecimiento<br/>Bruto</div>),
    carteraTotal: Col('carteraTotal', 'Cartera Total', r => <span className="font-mono">{money(r.carteraTotal)}</span>, r => r.carteraTotal, null, 'right', undefined, <div className="leading-[1.15]">Cartera<br/>Total</div>),
    mora31Total: Col('mora31Total', 'Mora > 30 Días', r => <span className="font-mono text-rose-600 font-medium">{money(r.mora31Total)}</span>, r => r.mora31Total, null, 'right', undefined, <div className="leading-[1.15]">Mora<br/>{'> 30 Días'}</div>),
    pctMora31: Col('pctMora31', '% Mora > 30', r => <span className="font-mono">{Number(r.pctMora31).toFixed(2)}%</span>, r => r.pctMora31 / 100, null, 'right', r => getMoraBg(r.pctMora31), <div className="leading-[1.15]">% Mora<br/>{'> 30'}</div>)
  };

  const baseColumns = ['periodo', 'etiquetaMes', 'colocacionNumReal', 'colocacionNumMeta', 'colocacionMonto', 'colocacionMeta', 'repagos', 'crecimientoBruto'];
  const allColumns = isMensual ? [...baseColumns, 'carteraTotal', 'mora31Total', 'pctMora31'] : baseColumns;
  const cTable = useColumnOrder(allColumns, 'historial', 'periodo');

  const handleGranularityChange = (val: 'Mensual' | 'Diario') => {
    setGranularity(val);
    if (val === 'Diario') setDateRange({ start: thirtyDaysAgo, end: today });
    else setDateRange({ start: defaultStartMonth, end: defaultEndMonth });
  };

  const colRender = cTable.order.map(id => dict[id]);

  const descargarExcel = async (filename: string, headers: string[], rows: any[][]) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Reporte Evolución';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Historial', { views: [{ state: 'frozen', ySplit: 1 }] });

    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };

    rows.forEach(row => worksheet.addRow(row));

    worksheet.columns.forEach((col, idx) => {
      const headerLen = String(headers[idx] ?? '').length;
      const maxDataLen = rows.reduce((max, row) => Math.max(max, String(row[idx] ?? '').length), 0);
      col.width = Math.min(Math.max(headerLen, maxDataLen) + 3, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportar = async (formato: 'excel' | 'clipboard') => {
    if (chartData.length === 0) return;
    const headers = colRender.map(c => c.header);
    const rows = chartData.map((r:any) => colRender.map(col => col.raw(r)));

    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map((row: any[]) => row.map(val => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      try {
        await descargarExcel(`Evolucion_${granularity}_${agency}_${new Date().getTime()}`, headers, rows);
      } catch (err) {
        console.error('Error generando el Excel:', err);
        alert('❌ Ocurrió un error al generar el archivo Excel.');
      }
    }
  };

  if (!dbFilters || isLoading) return <LoadingState />;
  if (error) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error al cargar datos históricos. Verifica la conexión al DWH.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground ring-1 ring-border/50">
            <SlidersHorizontal size={14} className="text-[hsl(var(--primary))]" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Laboratorio de Análisis Histórico</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Granularidad</label>
            <select value={granularity} onChange={e => handleGranularityChange(e.target.value as any)} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-[hsl(var(--primary))] transition-colors">
              <option value="Mensual">Mensual (Mes a Mes)</option>
              <option value="Diario">Diario (Día a Día)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Desde</label>
            {isMensual ? (
              <select value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
                {periodosDisponibles.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase transition-colors" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hasta</label>
            {isMensual ? (
              <select value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
                {periodosDisponibles.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase transition-colors" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agencia</label>
            <select value={agency} onChange={e => { setAgency(e.target.value); setAdvisor('Todos'); }} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
              <option value="Todas">Todas las agencias</option>
              {['Wanchaq', 'San Jerónimo', 'Quillabamba', 'Sicuani', 'Molino', 'Juliaca', 'Lima Los Olivos', 'Tica Tica', 'Magisterio', 'Lima SJL', 'Chiclayo', 'Arequipa', 'Pucallpa'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Asesor</label>
            <select value={advisor} onChange={e => setAdvisor(e.target.value)} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
              <option value="Todos">Todos</option>
              {asesoresHistoricos.map((a: any, i: number) => <option key={i} value={a.valorFiltro}>{a.textoVista}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={`grid gap-5 ${isMensual ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
        
        {/* 🚀 GRÁFICO 1 INTELIGENTE */}
        <Panel title={`Evolución de Colocaciones (${granularity})`} icon={<LineChart />} eyebrow={isAsesor ? "Monto Desembolsado vs Cantidad de Operaciones" : "Monto Desembolsado vs Meta Asignada"}>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorColocacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} />
                
                {/* Eje Izquierdo: Siempre Monto S/ */}
                <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                
                {/* Eje Derecho: Solo se activa si es Asesor (Nro Operaciones) */}
                {isAsesor && <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 10, fill: '#2563eb' }} />}
                
                <RechartsTooltip formatter={(val: any, name?: string | number) => String(name ?? '').includes('Operaciones') ? val : money(val)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                
                {/* Monto siempre se muestra como área verde en el Eje Izquierdo */}
                <Area yAxisId="left" type="monotone" dataKey="colocacionMonto" name="Desembolsos S/" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorColocacion)" />
                
                {!isAsesor && (
                  <Line yAxisId="left" type="step" dataKey="colocacionMeta" name="Meta Asignada S/" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                )}

                {isAsesor && (
                  <Bar yAxisId="right" dataKey="colocacionNumReal" name="Operaciones Real" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={isMensual ? 24 : 12} />
                )}

                {isAsesor && (
                  <Line yAxisId="right" type="step" dataKey="colocacionNumMeta" name="Meta Operaciones" stroke="#d97706" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {isMensual && (
          <Panel title="Crecimiento de Cartera y Riesgo" icon={<History />} eyebrow="Saldo de Cartera vs % Mora Mayor a 30 Días">
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                  <RechartsTooltip formatter={(val: any, name?: string | number) => String(name ?? '') === '% Mora > 30' ? `${Number(val).toFixed(2)}%` : money(val)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="carteraTotal" name="Cartera Total" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                  <Line yAxisId="right" type="monotone" dataKey="pctMora31" name="% Mora > 30" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
      </div>

      <SectionBand tone="blue">Registro y Datos Crudos Históricos</SectionBand>
      <Panel title={`Historial de Desempeño ${granularity}`} icon={<History />} eyebrow={`Datos detallados desde ${dateRange.start} hasta ${dateRange.end}`} action={<ExportActions control={cTable} onExport={exportar} />}>
        {/* Usamos nuestro DraggableTable con un max-h-[600px] para garantizar el Scroll Inquebrantable */}
        <DraggableTable control={cTable} columns={colRender} data={chartData} containerClass="max-h-[600px] pb-0" showFooter={false} />
      </Panel>
    </div>
  );
}