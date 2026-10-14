// src/views/AvanceView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { RefreshCw, Copy, Download, SlidersHorizontal, Activity } from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { Panel } from '../components/Panel';
import { fetchAvance } from '../services/avance.service';

// ============================================================================
// HOOKS MAESTROS DE DRAG & DROP Y EXPORTACIÓN
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string = 'agencia') {
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
export function AvanceView({ dbFilters }: { dbFilters: any }) {
  // ==========================================
  // ZONA 1: TODOS LOS HOOKS (Incondicionales)
  // ==========================================
  const [agency, setAgency] = useState('Todas');
  const [advisor, setAdvisor] = useState('Todos');

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

  // 🚀 REFACTOR: el endpoint vive ahora en avanceService
  const { data: avanceData, isLoading, error } = useQuery({
    queryKey: ['avance', agency, advisor],
    queryFn: () => fetchAvance({
      agencia: agency,
      asesor: advisor
    })
  });

  const COL_KEYS = ['agencia', 'asesor', 'avanceCartera', 'cuenta', 'pagare', 'socio', 'celular1', 'celular2', 'telefonoFijo1', 'telefonoFijo2'];
  const cTable = useColumnOrder(COL_KEYS, 'avance', 'agencia');

  // ==========================================
  // ZONA 2: LÓGICA Y FUNCIONES
  // ==========================================
  const tableData = avanceData || [];

  const formatAvance = (val: number) => {
    const isDecimal = val <= 1 && val > 0;
    const valueToFormat = isDecimal ? val * 100 : val;
    return `${Number(valueToFormat).toFixed(0)}%`;
  };

  const getAvanceBg = (val: number) => {
      const pct = val <= 1 && val > 0 ? val * 100 : val;
      if(pct >= 100) return 'bg-emerald-500/20 text-emerald-700 font-bold';
      return 'bg-blue-500/10 text-blue-700 font-bold';
  };

  // Diccionario Maestro para Avance de Cartera
  const dict: Record<string, any> = {
    agencia: Col('agencia', 'Agencia', r => <span className="font-semibold font-sans">{r.Agencia}</span>, r => r.Agencia, () => <span className="font-sans">{tableData.length} Registros</span>, 'left'),
    asesor: Col('asesor', 'Asesor', r => <span className="font-sans font-medium">{r.Asesor}</span>, r => r.Asesor, () => '', 'left'),
    avanceCartera: Col('avanceCartera', 'Avance Cartera', r => <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans ${getAvanceBg(r.AvanceCartera)}`}>{formatAvance(r.AvanceCartera)}</span>, r => formatAvance(r.AvanceCartera), () => '', 'center', undefined, <div className="leading-[1.15]">Avance<br/>Cartera</div>),
    cuenta: Col('cuenta', 'Cuenta', r => <span className="font-mono text-[10px]">{r.Cuenta}</span>, r => r.Cuenta, () => '', 'left'),
    pagare: Col('pagare', 'Pagaré', r => <span className="font-mono text-[10px] text-muted-foreground">{r.Pagare}</span>, r => r.Pagare, () => '', 'left'),
    socio: Col('socio', 'Socio', r => <span className="font-sans font-medium max-w-[150px] sm:max-w-[200px] truncate block" title={r.Socio}>{r.Socio}</span>, r => r.Socio, () => '', 'left'),
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
        workbook.creator = 'Avance de Cartera';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Avance_Cartera', { views: [{ state: 'frozen', ySplit: 1 }] });
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
        a.download = `Avance_Cartera_${agency}_${Date.now()}.xlsx`;
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
  if (error) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error al cargar datos del avance de cartera.</div>;

  const containerClass = `max-h-[600px] pb-0`;

  // ==========================================
  // ZONA 4: RENDERIZADO PRINCIPAL
  // ==========================================
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* PANEL DE FILTROS REDUCIDO */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground ring-1 ring-border/50">
            <SlidersHorizontal size={14} className="text-[hsl(var(--primary))]" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Filtros de Búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agencia</label>
            <select value={agency} onChange={e => { setAgency(e.target.value); setAdvisor('Todos'); }} className="rounded-lg border border-border/50 bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
              <option value="Todas">Todas las Agencias</option>
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

      <Panel title="Avance de Cartera" icon={<Activity />} eyebrow="Progreso de pago por socio" action={<ExportActions control={cTable} onExport={exportar} />}>
        {/* USANDO EL COMPONENTE ESTANDARIZADO */}
        <DraggableTable control={cTable} columns={colRender} data={tableData} containerClass={containerClass} />
      </Panel>
    </div>
  );
}