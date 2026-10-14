//GerenciaView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, Legend, Area, Cell } from 'recharts';
import { TrendingUp, Target, Building2, AlertTriangle, RefreshCw, Copy, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { Filters } from '../utils/constants';
import { money } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { SectionBand } from '../components/SectionBand';
import { Panel } from '../components/Panel';
import { KpiCard } from '../components/KpiCard';
import { WorkdayStrip } from '../components/WorkdayStrip';
import { fetchIndicadoresGerencia } from '../services/indicadoresgerencia.service';
import { TableShell } from '../components/TableShell';

// ============================================================================
// COMPONENTES MAESTROS Y HOOKS
// ============================================================================
function HalfGauge({ value, title, color = '#16a34a' }: { value: number; title: string; color?: string }) {
  const radius = 70;
  const stroke = 22;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="relative flex items-end justify-center overflow-hidden" style={{ width: '180px', height: '90px' }}>
        <svg width="180" height="180" className="absolute top-0">
          <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} strokeLinecap="round" />
          <path 
            d="M 20 90 A 70 70 0 0 1 160 90" 
            fill="none" 
            stroke={color} 
            strokeWidth={stroke} 
            strokeLinecap="round" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute bottom-1 text-center text-3xl font-bold tracking-tight">{value}%</div>
        <div className="absolute bottom-0 left-2 text-[10px] text-muted-foreground">0%</div>
        <div className="absolute bottom-0 right-2 text-[10px] text-muted-foreground">100%</div>
      </div>
    </div>
  );
}

const ORDEN_INICIAL_COMERCIAL = ['agency', 'cartera', 'crecimiento', 'nroOper', 'desembolsos', 'repagos', 'duracion', 'moraCPP', 'pctMora', 'moraDef', 'crecNeto150'];

function useColumnOrder(initialOrder: string[]) {
  const [order, setOrder] = useState(initialOrder);
  const isModified = JSON.stringify(order) !== JSON.stringify(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [JSON.stringify(initialOrder)]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === 'agency') { e.preventDefault(); return; }
    e.dataTransfer.setData('col_id', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('col_id');
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

const ExportActions = ({ onExport, extraAction }: { onExport: (format: 'excel' | 'clipboard') => void | Promise<void>, extraAction?: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    {extraAction}
    <button onClick={() => onExport('clipboard')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-primary hover:border-primary/50" title="Copiar al portapapeles">
      <Copy size={13} /> Copiar
    </button>
    <button onClick={() => onExport('excel')} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700" title="Descargar como Excel (.xlsx)">
      <Download size={13} /> Excel
    </button>
  </div>
);

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
export function GerenciaView({ filters }: { filters: Filters }) {
  const [tipoCartera, setTipoCartera] = useState<'comercial' | 'normalizacion'>('comercial');
  const { order, handleDragStart, handleDragOver, handleDrop, resetOrder, isModified } = useColumnOrder(ORDEN_INICIAL_COMERCIAL);

  const { data: indicadoresBD, isLoading, error } = useQuery({
    queryKey: ['indicadores-gerencia', filters.period],
    queryFn: () => fetchIndicadoresGerencia(filters.period),
    enabled: !!filters.period && filters.period !== 'Cargando...'
  });

  const { datosFiltrados, datosNormalizacion } = useMemo(() => {
    const com = indicadoresBD?.comercial || [];
    const norm = indicadoresBD?.normalizacion || [];
    return {
      datosFiltrados: filters.agency === 'Todas' ? com : com.filter((r: any) => r.agency === filters.agency),
      datosNormalizacion: filters.agency === 'Todas' ? norm : norm.filter((r: any) => r.agency === filters.agency)
    };
  }, [indicadoresBD, filters.agency]);

  const tComercial = useMemo(() => {
    const totalOpLogradas = datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.opAchieved || 0), 0);
    const totalOpMeta = datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.opTarget || 0), 0);
    const totalMontoLogrado = datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.amountAchieved || 0), 0);
    const totalMontoMeta = datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.amountTarget || 0), 0);
    const totCartera = datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.cartera || 0), 0);
    const totMoraCPP = datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.moraCPP_soles || 0), 0);
    const totDuracionPonderada = datosFiltrados.reduce((sum: number, r: any) => sum + (Number(r.duration || 0) * Number(r.opAchieved || 0)), 0);

    return {
      totalOpLogradas, totalOpMeta,
      pctAvanceOperaciones: totalOpMeta > 0 ? Math.round((totalOpLogradas / totalOpMeta) * 100) : 0,
      totalMontoLogrado, totalMontoMeta,
      pctAvanceMontos: totalMontoMeta > 0 ? Math.round((totalMontoLogrado / totalMontoMeta) * 100) : 0,
      totCartera,
      totCrecimientoBruto: datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.crecimientoBruto || 0), 0),
      totRepagos: datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.repagos || 0), 0),
      totMoraCPP,
      totMoraDeficiente: datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.moraDeficiente_soles || 0), 0),
      totCrecimientoNeto150: datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.crecimientoNeto150 || 0), 0),
      totExcedenteMora: datosFiltrados.reduce((sum: number, r: any) => sum + Number(r.excedente || 0), 0),
      avgPctMora: totCartera > 0 ? (totMoraCPP / totCartera) * 100 : 0,
      avgDuracion: totalOpLogradas > 0 ? (totDuracionPonderada / totalOpLogradas) : 0
    };
  }, [datosFiltrados]);

  const tNorm = useMemo(() => {
    const totNormCartera = datosNormalizacion.reduce((sum: number, r: any) => sum + Number(r.cartera || 0), 0);
    const totNormMoraCPP = datosNormalizacion.reduce((sum: number, r: any) => sum + Number(r.moraCPP_soles || 0), 0);
    return {
      totNormCartera, totNormMoraCPP,
      totNormRepagos: datosNormalizacion.reduce((sum: number, r: any) => sum + Number(r.repagos || 0), 0),
      totNormMoraDef: datosNormalizacion.reduce((sum: number, r: any) => sum + Number(r.moraDeficiente_soles || 0), 0),
      totNormCrecNeto30: datosNormalizacion.reduce((sum: number, r: any) => sum + Number(r.crecNeto30 || 0), 0),
      avgNormPctMora: totNormCartera > 0 ? (totNormMoraCPP / totNormCartera) * 100 : 0
    };
  }, [datosNormalizacion]);

  const todasComercial = indicadoresBD?.comercial || [];

  // ==========================================
  // LÓGICA DE COLORES Y ENCABEZADOS COMPACTOS
  // ==========================================
  const defColumnasComercial = [
    { id: 'agency', header: 'Agencia', headerText: 'Agencia', align: 'left', cell: (row: any) => <div className="font-semibold max-w-[70px] sm:max-w-[100px] md:max-w-none whitespace-normal leading-[1.15]" title={row.agency}>{row.agency}</div>, footer: () => 'Total Comercial' },
    { id: 'cartera', header: 'Cartera', headerText: 'Cartera', align: 'right', cell: (row: any) => money(row.cartera), footer: () => money(tComercial.totCartera) },
    { id: 'crecimiento', header: <div className="leading-[1.15]">Crecimiento<br/>Bruto</div>, headerText: 'Crecimiento', align: 'right', 
      cell: (row: any) => <span className={`font-semibold ${row.crecimientoBruto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{row.crecimientoBruto >= 0 ? '+' : ''}{money(row.crecimientoBruto)}</span>, 
      footer: () => <span className={tComercial.totCrecimientoBruto >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{tComercial.totCrecimientoBruto >= 0 ? '+' : ''}{money(tComercial.totCrecimientoBruto)}</span> 
    },
    { id: 'nroOper', header: <div className="leading-[1.15]">Nro<br/>Oper</div>, headerText: 'Nro Oper', align: 'center', cell: (row: any) => <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">{row.opAchieved}</span>, footer: () => tComercial.totalOpLogradas },
    { id: 'desembolsos', header: 'Desembolsos', headerText: 'Desembolsos', align: 'right', cell: (row: any) => money(row.amountAchieved), footer: () => money(tComercial.totalMontoLogrado) },
    { id: 'repagos', header: 'Repagos', headerText: 'Repagos', align: 'right', cell: (row: any) => money(row.repagos), footer: () => money(tComercial.totRepagos) },
    { id: 'duracion', header: 'Duración', headerText: 'Duración', align: 'center', cell: (row: any) => <span className="font-mono text-muted-foreground">{Number(row.duration).toFixed(2)}</span>, footer: () => <span className="font-mono text-muted-foreground">{tComercial.avgDuracion.toFixed(2)}</span> },
    { id: 'moraCPP', header: <div className="leading-[1.15]">Mora<br/>CPP</div>, headerText: 'Mora CPP', align: 'right', cell: (row: any) => <span className={row.cpp > 10 ? 'text-rose-600 font-bold' : 'text-muted-foreground'}>{money(row.moraCPP_soles)}</span>, footer: () => money(tComercial.totMoraCPP) },
    { id: 'pctMora', header: <div className="leading-[1.15]">%<br/>Mora</div>, headerText: '% Mora', align: 'right', cell: (row: any) => <span className={`px-1.5 py-0.5 rounded ${row.cpp > 10 ? 'bg-rose-500/10 text-rose-600 font-bold' : 'font-semibold text-emerald-600'}`}>{Number(row.cpp).toFixed(2)}%</span>, footer: () => `${tComercial.avgPctMora.toFixed(2)}%` },
    { id: 'moraDef', header: <div className="leading-[1.15]">Mora<br/>Defic.</div>, headerText: 'Mora Defic.', align: 'right', cell: (row: any) => <span className="text-muted-foreground">{money(row.moraDeficiente_soles)}</span>, footer: () => money(tComercial.totMoraDeficiente) },
    { id: 'crecNeto150', header: <div className="leading-[1.15]">Crec. Neto<br/>150</div>, headerText: 'Crec. Neto 150', align: 'right', 
      cell: (row: any) => <span className={`font-bold ${row.crecimientoNeto150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{row.crecimientoNeto150 >= 0 ? '+' : ''}{money(row.crecimientoNeto150)}</span>, 
      footer: () => <span className={tComercial.totCrecimientoNeto150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{tComercial.totCrecimientoNeto150 >= 0 ? '+' : ''}{money(tComercial.totCrecimientoNeto150)}</span> 
    }
  ];

  const columnasRender = order.map(id => defColumnasComercial.find(c => c.id === id)!);

  const descargarExcel = async (filename: string, headers: string[], rows: any[][]) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Reporte Gerencia';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Reporte');
    worksheet.addRow(headers);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
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

  const exportarTabla = async (tablaId: 'matriz' | 'cantidad' | 'monto' | 'mora', formato: 'excel' | 'clipboard') => {
    let rawHeaders: string[] = [];
    let rows: any[][] = [];
    let filename = `Reporte_${tablaId}_${filters.period}`;

    if (tablaId === 'matriz') {
      filename = `Matriz_${tipoCartera}_${filters.period}`;
      if (tipoCartera === 'comercial') {
        rawHeaders = columnasRender.map(c => c.headerText || c.header as string);
        rows = datosFiltrados.map((r: any) => columnasRender.map(col => {
          switch(col.id) {
            case 'agency': return r.agency;
            case 'cartera': return r.cartera;
            case 'crecimiento': return r.crecimientoBruto;
            case 'nroOper': return r.opAchieved;
            case 'desembolsos': return r.amountAchieved;
            case 'repagos': return r.repagos;
            case 'duracion': return r.duration;
            case 'moraCPP': return r.moraCPP_soles;
            case 'pctMora': return r.cpp / 100;
            case 'moraDef': return r.moraDeficiente_soles;
            case 'crecNeto150': return r.crecimientoNeto150;
            default: return '';
          }
        }));
      } else {
        rawHeaders = ['Agencia', 'Recuperador', 'Cartera', 'Repagos', 'Mora CPP', 'Mora Deficiente', '% Mora 9', 'Crec. Neto 30'];
        rows = datosNormalizacion.map((r: any) => [
          r.agency, r.recuperador, r.cartera, r.repagos, r.moraCPP_soles, r.moraDeficiente_soles, r.pctMora9 / 100, r.crecNeto30
        ]);
      }
    } else if (tablaId === 'cantidad') {
      rawHeaders = ['Agencia', 'Oper.', 'Meta', 'Avance'];
      rows = datosFiltrados.map((r: any) => [
        r.agency, r.opAchieved, r.opTarget, r.opTarget > 0 ? (r.opAchieved / r.opTarget) : 0
      ]);
    } else if (tablaId === 'monto') {
      rawHeaders = ['Agencia', 'Desembolso', 'Meta', 'Avance'];
      rows = datosFiltrados.map((r: any) => [
        r.agency, r.amountAchieved, r.amountTarget, r.amountTarget > 0 ? (r.amountAchieved / r.amountTarget) : 0
      ]);
    } else if (tablaId === 'mora') {
      rawHeaders = ['Agencia', 'Mora CPP (S/)', '% Vigente', 'Meta', 'Excedente (S/)'];
      rows = datosFiltrados.map((r: any) => [
        r.agency, r.moraCPP_soles, r.cpp / 100, r.meta / 100, r.excedente
      ]);
    }

    if (formato === 'clipboard') {
      const contenido = [
        rawHeaders.join('\t'),
        ...rows.map(row => row.map(val => (typeof val === 'number' && val % 1 !== 0) ? val.toFixed(4) : val).join('\t'))
      ].join('\n');
      navigator.clipboard.writeText(contenido).then(() => { alert('✅ Datos copiados al portapapeles. Ya puedes pegarlos en Excel o Word.'); });
    } else {
      try {
        await descargarExcel(filename, rawHeaders, rows);
      } catch (err) {
        console.error('Error generando el Excel:', err);
        alert('❌ Ocurrió un error al generar el archivo Excel.');
      }
    }
  };

  const getBarColor = (entryAgency: string, activeColor: string) => {
    if (filters.agency === 'Todas') return activeColor;
    return entryAgency === filters.agency ? '#f59e0b' : '#cbd5e1'; 
  };

  if (isLoading || !indicadoresBD) return <LoadingState />;
  if (error) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error de conexión al DWH.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" key={filters.period}>
      <WorkdayStrip periodo={filters.period} />
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Colocación acumulada" value={money(tComercial.totalMontoLogrado)} note="Logrado a la fecha" icon={TrendingUp} delta={`+${tComercial.pctAvanceMontos}%`} />
        <KpiCard label="Meta mensual" value={money(tComercial.totalMontoMeta)} note="Monto objetivo" icon={Target} tone="gold" />
        <KpiCard label="Crecimiento Neto 150" value={money(tComercial.totCrecimientoNeto150)} note="Variación real del mes" icon={Building2} tone="blue" />
        <KpiCard label="Excedente Mora CPP" value={money(tComercial.totExcedenteMora)} note="Sobre la meta del 10%" icon={AlertTriangle} tone={tComercial.totExcedenteMora > 0 ? "red" : "teal"} delta={tComercial.totExcedenteMora > 0 ? "Excede" : "OK"} />
      </div>

      <SectionBand tone="green">Indicadores de Crecimiento Global</SectionBand>
      <Panel 
        title="Matriz General de Resultados" 
        eyebrow="Flujo, Duración y Riesgo consolidado"
        action={
          <ExportActions 
            onExport={(f) => exportarTabla('matriz', f)}
            extraAction={
              isModified && (
                <button onClick={resetOrder} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition hover:text-foreground">
                  <RefreshCw size={13} /> Restablecer
                </button>
              )
            } 
          />
        }
      >
        <div className="mb-4 flex w-full max-w-xs rounded-lg bg-muted/60 p-1 font-semibold">
          <button onClick={() => setTipoCartera('comercial')} className={`flex-1 rounded-md py-1.5 text-xs transition-all ${tipoCartera === 'comercial' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Comercial</button>
          <button onClick={() => setTipoCartera('normalizacion')} className={`flex-1 rounded-md py-1.5 text-xs transition-all ${tipoCartera === 'normalizacion' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Normalización</button>
        </div>

        {tipoCartera === 'comercial' ? (
          <TableShell>
            <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
              <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight whitespace-nowrap border-collapse">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="border-b border-border">
                    {columnasRender.map((col) => (
                      <th 
                        key={col.id} 
                        draggable={col.id !== 'agency'} 
                        onDragStart={(e) => handleDragStart(e, col.id)} 
                        onDragOver={handleDragOver} 
                        onDrop={(e) => handleDrop(e, col.id)} 
                        className={`bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground transition-colors ${col.id !== 'agency' ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-foreground' : ''} ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {datosFiltrados.map((row: any) => (
                    <tr key={row.agency} className="hover:bg-muted/30 transition-colors">
                      {columnasRender.map((col) => (
                        <td key={`${row.agency}-${col.id}`} className={`px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 ${col.align === 'left' ? 'text-left whitespace-normal min-w-[70px] md:min-w-[100px] leading-[1.15]' : 'text-right whitespace-nowrap font-mono'} ${col.align === 'center' ? 'text-center' : ''}`}>{col.cell(row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                  <tr className="border-t-2 border-border font-bold">
                    {columnasRender.map((col) => (
                      <td key={`footer-${col.id}`} className={`bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 whitespace-nowrap ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right font-mono'}`}>{col.footer()}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </TableShell>
        ) : (
          <TableShell>
            <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
              <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] whitespace-nowrap tracking-tight border-collapse">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="border-b border-border">
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-left rounded-tl-md">Agencia</th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-left">Recuperador</th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-right">Cartera</th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-right">Repagos</th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-right"><div className="leading-[1.15]">Mora<br/>CPP</div></th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-right"><div className="leading-[1.15]">Mora<br/>Defic.</div></th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-right"><div className="leading-[1.15]">% Mora<br/>9</div></th>
                    <th className="bg-slate-50 px-1.5 py-1.5 xl:px-2 xl:py-2 align-bottom font-bold text-muted-foreground text-right rounded-tr-md"><div className="leading-[1.15]">Crec. Neto<br/>30</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {datosNormalizacion.map((row: any) => (
                    <tr key={`${row.agency}-${row.recuperador}`} className="hover:bg-muted/30 transition-colors">
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 font-semibold text-left whitespace-normal min-w-[50px] md:min-w-[80px] leading-[1.15]" title={row.agency}>{row.agency}</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-left text-muted-foreground whitespace-normal min-w-[70px] md:min-w-[120px] leading-[1.15]" title={row.recuperador}>{row.recuperador}</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{money(row.cartera)}</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{money(row.repagos)}</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-right font-mono text-rose-600 whitespace-nowrap">{money(row.moraCPP_soles)}</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-right font-mono text-rose-600 whitespace-nowrap">{money(row.moraDeficiente_soles)}</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-right font-mono text-rose-600 font-bold whitespace-nowrap">{Number(row.pctMora9).toFixed(2)}%</td>
                      <td className="px-1.5 py-1 sm:py-1.5 xl:px-2 xl:py-2 text-right font-mono text-emerald-600 font-bold whitespace-nowrap">{row.crecNeto30 >= 0 ? '+' : ''}{money(row.crecNeto30)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                  <tr className="border-t-2 border-border font-bold">
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-left whitespace-nowrap" colSpan={2}>Total Normalización</td>
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-right font-mono whitespace-nowrap">{money(tNorm.totNormCartera)}</td>
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-right font-mono whitespace-nowrap">{money(tNorm.totNormRepagos)}</td>
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-right font-mono text-rose-600 whitespace-nowrap">{money(tNorm.totNormMoraCPP)}</td>
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-right font-mono text-rose-600 whitespace-nowrap">{money(tNorm.totNormMoraDef)}</td>
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-right font-mono text-rose-600 whitespace-nowrap">{tNorm.avgNormPctMora.toFixed(2)}%</td>
                    <td className="bg-slate-100 px-1.5 py-2 xl:px-2 xl:py-2.5 text-right font-mono text-emerald-600 whitespace-nowrap">{tNorm.totNormCrecNeto30 >= 0 ? '+' : ''}{money(tNorm.totNormCrecNeto30)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </TableShell>
        )}
      </Panel>

      {/* SECCIÓN 2: AVANCE DE OPERACIONES Y MONTOS */}
      <SectionBand tone="blue">Avance de Operaciones y Montos</SectionBand>
      {/* 🚀 EL CAMBIO DE GRID AQUÍ (xl pasa a 2xl) */}
      <div className="grid gap-5 grid-cols-1 2xl:grid-cols-2">
        <Panel title="En Cantidad de Colocaciones" eyebrow="Resaltando agencia seleccionada" action={<ExportActions onExport={(f) => exportarTabla('cantidad', f)} />}>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.5fr] items-stretch">
            <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
              <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="border-b border-border">
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground rounded-tl-md">Agencia</th>
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">Oper.</th>
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">Meta</th>
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right rounded-tr-md">Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {datosFiltrados.map((row: any) => (
                    <tr key={row.agency} className="hover:bg-muted/30 transition-colors">
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 font-semibold whitespace-normal min-w-[60px] md:min-w-[100px] leading-[1.15]" title={row.agency}>{row.agency}</td>
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{row.opAchieved}</td>
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 text-right font-mono text-muted-foreground whitespace-nowrap">{row.opTarget}</td>
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {row.opTarget > 0 ? Math.round((row.opAchieved / row.opTarget) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                  <tr className="border-t-2 border-border font-bold">
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-left whitespace-nowrap">Total</td>
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{tComercial.totalOpLogradas}</td>
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{tComercial.totalOpMeta}</td>
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-right font-mono text-emerald-600 whitespace-nowrap">{tComercial.pctAvanceOperaciones}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col h-full min-h-[300px]">
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={todasComercial} margin={{ top: 10, right: 0, left: -25, bottom: 45 }}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="agency" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="opAchieved" radius={[2, 2, 0, 0]}>
                      {todasComercial.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.agency, '#0284c7')} />
                      ))}
                    </Bar>
                    <Line type="step" dataKey="opTarget" stroke="#ea580c" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center pt-2">
                <HalfGauge value={tComercial.pctAvanceOperaciones} title="CUMPLIMIENTO (CANT)" color="#16a34a" />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="En Monto de Colocaciones" eyebrow="Resaltando agencia seleccionada" action={<ExportActions onExport={(f) => exportarTabla('monto', f)} />}>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.5fr] items-stretch">
            <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
              <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="border-b border-border">
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground rounded-tl-md">Agencia</th>
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">Desembolso</th>
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">Meta</th>
                    <th className="bg-slate-50 px-1.5 sm:px-2 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right rounded-tr-md">Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {datosFiltrados.map((row: any) => (
                    <tr key={row.agency} className="hover:bg-muted/30 transition-colors">
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 font-semibold whitespace-normal min-w-[60px] md:min-w-[100px] leading-[1.15]" title={row.agency}>{row.agency}</td>
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{money(row.amountAchieved)}</td>
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 text-right font-mono text-muted-foreground whitespace-nowrap">{money(row.amountTarget)}</td>
                      <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 xl:px-2 xl:py-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {row.amountTarget > 0 ? Math.round((row.amountAchieved / row.amountTarget) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                  <tr className="border-t-2 border-border font-bold">
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-left whitespace-nowrap">Total</td>
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{money(tComercial.totalMontoLogrado)}</td>
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-right font-mono whitespace-nowrap">{money(tComercial.totalMontoMeta)}</td>
                    <td className="bg-slate-100 px-1.5 sm:px-2 py-2 xl:px-2 xl:py-2 text-right font-mono text-emerald-600 whitespace-nowrap">{tComercial.pctAvanceMontos}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col h-full min-h-[300px]">
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={todasComercial} margin={{ top: 10, right: 0, left: 10, bottom: 45 }}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="agency" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={v => `${v / 1000}k`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v: any) => typeof v === 'number' ? money(v) : v} />
                    <Bar dataKey="amountAchieved" radius={[2, 2, 0, 0]}>
                      {todasComercial.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.agency, '#0369a1')} />
                      ))}
                    </Bar>
                    <Line type="step" dataKey="amountTarget" stroke="#ea580c" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center pt-2">
                <HalfGauge value={tComercial.pctAvanceMontos} title="CUMPLIMIENTO (S/)" color="#16a34a" />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* SECCIÓN 3: CALIDAD DE CARTERA Y MORAS */}
      <SectionBand tone="coral">Calidad de Cartera y Moras</SectionBand>
      {/* 🚀 EL CAMBIO DE GRID AQUÍ (xl pasa a 2xl) */}
      <div className="grid gap-5 grid-cols-1 2xl:grid-cols-[1.1fr_1.3fr] items-stretch">
        <Panel title="Mora CPP - Detalle" eyebrow="Excedentes y variaciones en tabla" action={<ExportActions onExport={(f) => exportarTabla('mora', f)} />}>
          <div className="relative overflow-x-auto overflow-y-auto scrollbar-thin max-h-[600px] z-0">
            <table className="w-full text-left text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] tracking-tight border-collapse">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="border-b border-border">
                  <th className="bg-slate-50 px-1.5 sm:px-3 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground rounded-tl-md">Agencia</th>
                  <th className="bg-slate-50 px-1.5 sm:px-3 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">Mora CPP</th>
                  <th className="bg-slate-50 px-1.5 sm:px-3 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">% Vigente</th>
                  <th className="bg-slate-50 px-1.5 sm:px-3 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right">Meta</th>
                  <th className="bg-slate-50 px-1.5 sm:px-3 py-1.5 xl:px-2 xl:py-2 font-bold text-muted-foreground text-right rounded-tr-md">Excedente (S/)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {datosFiltrados.map((row: any) => (
                  <tr key={row.agency} className="hover:bg-muted/30 transition-colors">
                    <td className="px-1.5 sm:px-3 py-1.5 sm:py-2.5 font-semibold whitespace-normal min-w-[70px] md:min-w-[120px] leading-[1.15]" title={row.agency}>{row.agency}</td>
                    <td className="px-1.5 sm:px-3 py-1.5 sm:py-2.5 text-right font-mono whitespace-nowrap">{money(row.moraCPP_soles)}</td>
                    <td className={`px-1.5 sm:px-3 py-1.5 sm:py-2.5 text-right font-mono whitespace-nowrap ${row.cpp > 10 ? 'text-rose-600 font-bold' : ''}`}>{Number(row.cpp).toFixed(2)}%</td>
                    <td className="px-1.5 sm:px-3 py-1.5 sm:py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">{row.meta}%</td>
                    <td className={`px-1.5 sm:px-3 py-1.5 sm:py-2.5 text-right font-mono font-bold whitespace-nowrap ${row.excedente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {row.excedente > 0 ? '+' : ''}{money(row.excedente)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                <tr className="border-t-2 border-border font-bold">
                  <td className="bg-slate-100 px-1.5 sm:px-3 py-2 sm:py-2.5 text-left whitespace-nowrap">Total</td>
                  <td className="bg-slate-100 px-1.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono whitespace-nowrap">{money(tComercial.totMoraCPP)}</td>
                  <td className="bg-slate-100 px-1.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono whitespace-nowrap">{tComercial.avgPctMora.toFixed(2)}%</td>
                  <td className="bg-slate-100 px-1.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono whitespace-nowrap">10%</td>
                  <td className={`bg-slate-100 px-1.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono whitespace-nowrap ${tComercial.totExcedenteMora > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {tComercial.totExcedenteMora > 0 ? '+' : ''}{money(tComercial.totExcedenteMora)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel title="Curva de Cumplimiento Mora CPP" eyebrow="Ordenado por % de Mora">
          <div className="w-full h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={[...todasComercial].sort((a, b) => Number(a.cpp) - Number(b.cpp))} 
                margin={{ top: 20, right: 15, left: -15, bottom: 45 }}
              >
                <defs>
                  <linearGradient id="colorCpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="agency" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => v !== undefined ? `${v}%` : ''} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="meta" name="Meta 10%" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Area 
                  type="monotone" 
                  dataKey="cpp" 
                  name="% Mora CPP" 
                  stroke="#0284c7" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCpp)" 
                  dot={(props: any) => {
                    const isSelected = props.payload.agency === filters.agency;
                    return (
                      <circle 
                        key={props.key}
                        cx={props.cx} 
                        cy={props.cy} 
                        r={isSelected ? 7 : 3.5} 
                        fill={isSelected ? '#f59e0b' : '#fff'} 
                        stroke={isSelected ? '#d97706' : '#0284c7'} 
                        strokeWidth={isSelected ? 3 : 2} 
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}