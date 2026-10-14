// src/views/CanceladosView.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { RefreshCw, Copy, Download, SlidersHorizontal, Ban } from 'lucide-react';
import { money } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { Panel } from '../components/Panel';
import { fetchCancelados } from '../services/cancelados.service';

// ============================================================================
// HOOKS MAESTROS DE DRAG & DROP Y EXPORTACIÓN
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string = 'agencia') {
  const [order, setOrder] = useState(initialOrder);
  const isModified = JSON.stringify(order) !== JSON.stringify(initialOrder);
  const handleDragStart = (e: React.DragEvent, id: string) => { if (id === lockedCol) { e.preventDefault(); return; } e.dataTransfer.setData(`col_id_${tableId}`, id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, targetId: string) => { e.preventDefault(); const sourceId = e.dataTransfer.getData(`col_id_${tableId}`); if (!sourceId || sourceId === targetId || sourceId === lockedCol || targetId === lockedCol) return; const newOrder = [...order]; newOrder.splice(order.indexOf(targetId), 0, newOrder.splice(order.indexOf(sourceId), 1)[0]); setOrder(newOrder); };
  return { order, handleDragStart, handleDragOver, handleDrop, resetOrder: () => setOrder(initialOrder), isModified, lockedCol };
}

const ExportActions = ({ control, onExport }: { control: any, onExport: (format: 'excel' | 'clipboard') => void }) => (
  <div className="flex items-center gap-2">
    {control.isModified && <button onClick={control.resetOrder} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-foreground"><RefreshCw size={13} /> Restablecer</button>}
    <button onClick={() => onExport('clipboard')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-primary hover:border-primary/50"><Copy size={13} /> Copiar</button>
    <button onClick={() => onExport('excel')} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"><Download size={13} /> Excel</button>
  </div>
);

// ============================================================================
// COMPONENTE: TABLA CON DENSIDAD FLUIDA Y FONDOS SÓLIDOS (DRAGGABLE)
// ============================================================================
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
                className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== control.lockedCol ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'} ${col.bgClass || ''}`}
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
                  className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.align === 'left' ? 'text-left whitespace-normal min-w-[70px] md:min-w-[100px] max-w-[200px] leading-[1.15]' : 'text-right whitespace-nowrap font-mono'} ${col.align === 'center' ? 'text-center' : ''} ${col.cellBg ? col.cellBg(row) : ''}`}
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
                  className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right font-mono'} ${col.bgClass || ''}`}
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

// Nueva firma de la fábrica de columnas
const Col = (id: string, header: string, cell: (r:any)=>any, raw: (r:any)=>any, footer: ()=>any, align='right', cellBg?: (r:any)=>string, headerJSX?: React.ReactNode) => ({ id, header, headerJSX, cell, raw, footer, align, cellBg });

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
export function CanceladosView({ dbFilters }: { dbFilters: any }) {
  // ==========================================
  // ZONA 1: TODOS LOS HOOKS (Incondicionales)
  // ==========================================
  const [agency, setAgency] = useState('Todas');
  const [advisor, setAdvisor] = useState('Todos');
  const [tipoCancelacion, setTipoCancelacion] = useState('Todas');
  const [frecuencia, setFrecuencia] = useState('Todas');

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

  const { data: canceladosData, isLoading, error } = useQuery({
    queryKey: ['cancelados', agency, advisor, tipoCancelacion, frecuencia],
    queryFn: () => fetchCancelados({
      agencia: agency,
      asesor: advisor,
      tipo: tipoCancelacion,
      frecuencia: frecuencia
    })
  });

  const COL_KEYS = ['agencia', 'fechaCancelacion', 'asesor', 'cuenta', 'socio', 'pagare', 'producto', 'tipoFrecuencia', 'prestamo', 'saldoCancelacion', 'fechaOtorgamiento', 'tipoCancelacion', 'diferenciaDias', 'celular1', 'celular2', 'telefonoFijo1', 'telefonoFijo2'];
  const cTable = useColumnOrder(COL_KEYS, 'cancelados', 'agencia');

  // ==========================================
  // ZONA 2: LÓGICA Y FUNCIONES
  // ==========================================
  const tableData = canceladosData || [];

  const t_prestamo = tableData.reduce((acc: number, r: any) => acc + (r.Prestamo || 0), 0);
  const t_saldo = tableData.reduce((acc: number, r: any) => acc + (r.SaldoCancelacion || 0), 0);

  // Diccionario Maestro para Cancelados (Con Multilínea Dinámica)
  const dict: Record<string, any> = {
    agencia: Col('agencia', 'Agencia', r => <span className="font-semibold font-sans">{r.Agencia}</span>, r => r.Agencia, () => <span className="font-sans">{tableData.length} Créditos</span>, 'left'),
    fechaCancelacion: Col('fechaCancelacion', 'Fecha Cancelación', r => <span className="font-mono text-muted-foreground">{r.FechaCancelacion}</span>, r => r.FechaCancelacion, () => '', 'left', undefined, <div className="leading-[1.15]">Fecha<br/>Cancelación</div>),
    asesor: Col('asesor', 'Asesor', r => <span className="font-sans font-medium">{r.Asesor}</span>, r => r.Asesor, () => '', 'left'),
    cuenta: Col('cuenta', 'Cuenta', r => <span className="font-mono text-[10px]">{r.Cuenta}</span>, r => r.Cuenta, () => '', 'left'),
    socio: Col('socio', 'Socio', r => <span className="font-sans font-medium max-w-[150px] sm:max-w-[200px] truncate block" title={r.Socio}>{r.Socio}</span>, r => r.Socio, () => '', 'left'),
    pagare: Col('pagare', 'Pagaré', r => <span className="font-mono text-[10px]">{r.Pagare}</span>, r => r.Pagare, () => '', 'left'),
    producto: Col('producto', 'Producto', r => <span className="font-sans text-[10px] uppercase text-muted-foreground">{r.Producto}</span>, r => r.Producto, () => '', 'left'),
    tipoFrecuencia: Col('tipoFrecuencia', 'Frecuencia', r => <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-sans font-semibold">{r.TipoFrecuencia}</span>, r => r.TipoFrecuencia, () => '', 'center'),
    prestamo: Col('prestamo', 'Préstamo S/', r => <span className="font-mono">{money(r.Prestamo)}</span>, r => r.Prestamo, () => <span className="font-mono font-bold">{money(t_prestamo)}</span>, 'right', undefined, <div className="leading-[1.15]">Préstamo<br/>S/</div>),
    saldoCancelacion: Col('saldoCancelacion', 'Saldo Cancelación S/', r => <span className="font-mono">{money(r.SaldoCancelacion)}</span>, r => r.SaldoCancelacion, () => <span className="font-mono font-bold text-[hsl(var(--primary))]">{money(t_saldo)}</span>, 'right', undefined, <div className="leading-[1.15]">Saldo<br/>Cancelado S/</div>),
    fechaOtorgamiento: Col('fechaOtorgamiento', 'Otorgamiento', r => <span className="font-mono text-muted-foreground">{r.FechaOtorgamiento}</span>, r => r.FechaOtorgamiento, () => '', 'left'),
    tipoCancelacion: Col('tipoCancelacion', 'Tipo Cancelación', r => (
      <span className={`inline-block px-2 py-0.5 rounded-full font-sans text-[9px] font-bold ${r.TipoCancelacion === 'Cancelado con Anticipación' ? 'bg-emerald-500/20 text-emerald-700' : r.TipoCancelacion === 'Cancelado con Retraso' ? 'bg-rose-500/20 text-rose-700' : 'bg-blue-500/20 text-blue-700'}`}>
        {r.TipoCancelacion}
      </span>
    ), r => r.TipoCancelacion, () => '', 'center', undefined, <div className="leading-[1.15]">Tipo<br/>Cancelación</div>),
    diferenciaDias: Col('diferenciaDias', 'Dif. Días', r => <span className={`font-mono font-bold ${r.DiferenciaDias < 0 ? 'text-emerald-600' : r.DiferenciaDias > 0 ? 'text-rose-600' : ''}`}>{r.DiferenciaDias}</span>, r => r.DiferenciaDias, () => '', 'center', undefined, <div className="leading-[1.15]">Dif.<br/>Días</div>),
    celular1: Col('celular1', 'Celular 1', r => <span className="font-mono text-[10px]">{r.Celular1}</span>, r => r.Celular1, () => '', 'left'),
    celular2: Col('celular2', 'Celular 2', r => <span className="font-mono text-[10px]">{r.Celular2}</span>, r => r.Celular2, () => '', 'left'),
    telefonoFijo1: Col('telefonoFijo1', 'Teléfono Fijo 1', r => <span className="font-mono text-[10px]">{r.TelefonoFijo1}</span>, r => r.TelefonoFijo1, () => '', 'left', undefined, <div className="leading-[1.15]">Telf.<br/>Fijo 1</div>),
    telefonoFijo2: Col('telefonoFijo2', 'Teléfono Fijo 2', r => <span className="font-mono text-[10px]">{r.TelefonoFijo2}</span>, r => r.TelefonoFijo2, () => '', 'left', undefined, <div className="leading-[1.15]">Telf.<br/>Fijo 2</div>)
  };

  const colRender = cTable.order.map(id => dict[id]);

  const exportar = async (formato: 'excel' | 'clipboard') => {
    if (tableData.length === 0) return;
    const headers = colRender.map(c => c.header);
    const rows = tableData.map((r:any) => colRender.map(col => col.raw(r)));
    if (formato === 'clipboard') {
      const contenido = [headers.join('\t'), ...rows.map((row: any[]) => row.join('\t'))].join('\n');
      navigator.clipboard.writeText(contenido).then(() => alert('✅ Datos copiados al portapapeles.'));
    } else {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Créditos Cancelados No Renovados';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Cancelados_No_Renovados', { views: [{ state: 'frozen', ySplit: 1 }] });
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
        a.download = `Cancelados_No_Renovados_${agency}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert('❌ Error al generar el archivo Excel.');
      }
    }
  };

  // ==========================================
  // ZONA 3: RETORNOS ANTICIPADOS (Carga y Error)
  // ==========================================
  if (!dbFilters || isLoading) return <LoadingState />;
  if (error) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error al cargar datos históricos de cancelaciones.</div>;

  // Altura estricta para forzar el scroll vertical inquebrantable
  const containerClass = `max-h-[600px] pb-0`;

  // ==========================================
  // ZONA 4: RENDERIZADO PRINCIPAL
  // ==========================================
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* PANEL DE FILTROS EXCLUSIVO */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground ring-1 ring-border/50">
            <SlidersHorizontal size={14} className="text-[hsl(var(--primary))]" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Filtros de Búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agencia</label>
            <select value={agency} onChange={e => { setAgency(e.target.value); setAdvisor('Todos'); }} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
              <option value="Todas">Todas</option>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tipo de Cancelación</label>
            <select value={tipoCancelacion} onChange={e => setTipoCancelacion(e.target.value)} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
              <option value="Todas">Todas</option>
              <option value="Cancelado con Anticipación">Cancelado con Anticipación</option>
              <option value="Cancelado a Tiempo">Cancelado a Tiempo</option>
              <option value="Cancelado con Retraso">Cancelado con Retraso</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Frecuencia de Pago</label>
            <select value={frecuencia} onChange={e => setFrecuencia(e.target.value)} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
              <option value="Todas">Todas</option>
              <option value="SEMANAS">Semanas</option>
              <option value="MESES">Meses</option>
              <option value="DIAS">Días</option>
            </select>
          </div>
        </div>
      </div>

      <Panel title="Créditos Cancelados No Renovados (Últimos 6 meses)" icon={<Ban />} eyebrow="Oportunidades de retención y seguimiento" action={<ExportActions control={cTable} onExport={exportar} />}>
        {/* TABLA PRINCIPAL USANDO EL NUEVO COMPONENTE */}
        <DraggableTable control={cTable} columns={colRender} data={tableData} containerClass={containerClass} />
      </Panel>
    </div>
  );
}