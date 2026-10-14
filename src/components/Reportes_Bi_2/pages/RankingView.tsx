//RankingView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { RefreshCw, Copy, Download, Trophy, Medal, Flame, PlaneTakeoff, Plane, CircleDollarSign } from 'lucide-react';
import { money } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { Panel } from '../components/Panel';
import { getRanking } from '../services/ranking.service';

// ============================================================================
// HOOKS MAESTROS DE DRAG & DROP Y EXPORTACIÓN
// ============================================================================
function useColumnOrder(initialOrder: string[], tableId: string, lockedCol: string = 'asesor') {
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

// TABLA CON DENSIDAD FLUIDA Y DISEÑO GAMIFICADO
function DraggableTable({ control, columns, data, containerClass }: { control: any, columns: any[], data: any[], containerClass: string }) {
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
          {data.length > 0 ? data.map((row: any, i: number) => {
            const isTop1 = row.Puesto_Actual === 1;
            const isTop2 = row.Puesto_Actual === 2;
            const isTop3 = row.Puesto_Actual === 3;
            const rowClass = isTop1 ? 'bg-amber-500/10 hover:bg-amber-500/20' : 
                             isTop2 ? 'bg-slate-300/20 hover:bg-slate-300/30' : 
                             isTop3 ? 'bg-orange-600/10 hover:bg-orange-600/20' : 
                             'hover:bg-muted/30';

            return (
              <tr key={`row-${i}`} className={`transition-colors ${rowClass}`}>
                {columns.map(col => (
                  <td 
                    key={`cell-${i}-${col.id}`} 
                    className={`px-1.5 py-1.5 xl:px-2 xl:py-2.5 ${col.align === 'left' ? 'text-left whitespace-normal min-w-[70px] md:min-w-[100px] max-w-[200px] leading-[1.15]' : 'text-right whitespace-nowrap font-mono'} ${col.align === 'center' ? 'text-center' : ''} ${col.cellBg ? col.cellBg(row) : ''}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            );
          }) : (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground italic">Cargando la tabla de posiciones...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const Col = (id: string, header: string, cell: (r:any)=>any, raw: (r:any)=>any, align='right', cellBg?: (r:any)=>string, headerJSX?: React.ReactNode) => ({ id, header, headerJSX, cell, raw, align, cellBg });

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
export function RankingView() {
  const { data: rankingData, isLoading, error } = useQuery({
    queryKey: ['ranking-excelencia'],
    queryFn: () => getRanking()
  });

  const COL_KEYS = ['puesto', 'asesor', 'agencia', 'operaciones', 'puntosOp', 'crecimiento', 'puntosCrec', 'seguros', 'puntosSeg', 'puntajeTotal', 'comentario'];
  const cTable = useColumnOrder(COL_KEYS, 'ranking', 'puesto');

  // ==========================================
  // ZONA DE IMÁGENES ANIMADAS CON PANEO (ARRIBA HACIA ABAJO)
  // ==========================================
  // Generamos el arreglo dinámico basado en las fotos 1.jpeg a la 15.jpeg
  const images = useMemo(() => Array.from({ length: 15 }, (_, i) => `/viajes/${i + 1}.jpeg`), []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000); // 6 segundos por foto para apreciar el paneo
    return () => clearInterval(interval);
  }, [images.length]);

  // ==========================================
  // LÓGICA Y FUNCIONES DE LA TABLA
  // ==========================================
  const tableData = rankingData || [];

  const renderPuesto = (r: any) => {
    const puesto = r.Puesto_Actual;
    if (puesto === 1) return <div className="flex items-center gap-1.5 text-amber-500 font-black text-[14px]"><Medal size={18} fill="currentColor" /> 1º</div>;
    if (puesto === 2) return <div className="flex items-center gap-1.5 text-slate-400 font-black text-[14px]"><Medal size={18} fill="currentColor" /> 2º</div>;
    if (puesto === 3) return <div className="flex items-center gap-1.5 text-orange-600 font-black text-[14px]"><Medal size={18} fill="currentColor" /> 3º</div>;
    if (puesto <= 5) return <div className="flex items-center gap-1.5 text-emerald-600 font-bold"><CircleDollarSign size={14} /> {puesto}º</div>;
    if (puesto <= 10) return <div className="flex items-center gap-1.5 text-blue-600 font-bold"><CircleDollarSign size={14} /> {puesto}º</div>;
    return <span className="text-muted-foreground font-bold">{puesto}º</span>;
  };

  const getPuestoBg = (r: any) => {
    const puesto = r.Puesto_Actual;
    if (puesto === 1) return 'bg-amber-400/30 border-r border-amber-500/50';
    if (puesto === 2) return 'bg-slate-300/40 border-r border-slate-400/50';
    if (puesto === 3) return 'bg-orange-500/20 border-r border-orange-600/50';
    if (puesto <= 10) return 'bg-emerald-500/10 border-r border-emerald-500/20';
    return 'border-r border-border/50';
  };

  const dict: Record<string, any> = {
    puesto: Col('puesto', 'Puesto', r => renderPuesto(r), r => r.Puesto_Actual, 'left', r => getPuestoBg(r)),
    asesor: Col('asesor', 'Asesor', r => (
      <div>
        <div className={`font-black uppercase tracking-tight ${r.Puesto_Actual <= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>{r.Asesor}</div>
        {r.Puesto_Actual === 1 && <div className="text-[9px] text-amber-600 font-bold flex items-center gap-1"><PlaneTakeoff size={10} /> Viaje Internacional</div>}
        {r.Puesto_Actual === 2 && <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1"><Plane size={10} /> Viaje Nacional</div>}
        {r.Puesto_Actual >= 3 && r.Puesto_Actual <= 5 && <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">Premio S/ 1,000</div>}
        {r.Puesto_Actual >= 6 && r.Puesto_Actual <= 10 && <div className="text-[9px] text-blue-600 font-bold flex items-center gap-1">Premio S/ 500</div>}
      </div>
    ), r => r.Asesor, 'left'),
    agencia: Col('agencia', 'Agencia', r => <span className="font-semibold text-muted-foreground">{r.Agencia}</span>, r => r.Agencia, 'left'),
    
    operaciones: Col('operaciones', 'Oper', r => <span className="font-black text-blue-600">{r.Operaciones}</span>, r => r.Operaciones, 'center'),
    puntosOp: Col('puntosOp', 'Puntos Op.', r => <span className="bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded-full font-bold">{Number(r.Puntos_Op).toFixed(2)}</span>, r => r.Puntos_Op, 'center', undefined, <div className="leading-[1.15]">Puntos<br/>Operaciones</div>),
    
    crecimiento: Col('crecimiento', 'Crecimiento', r => <span className={`font-bold ${r.Crecimiento_Neto_150 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(r.Crecimiento_Neto_150)}</span>, r => r.Crecimiento_Neto_150, 'right'),
    puntosCrec: Col('puntosCrec', 'Puntos Crec.', r => <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{Number(r.Puntos_Crec).toFixed(2)}</span>, r => r.Puntos_Crec, 'center', undefined, <div className="leading-[1.15]">Puntos<br/>Crecimiento</div>),
    
    seguros: Col('seguros', 'Seguros', r => <span className="font-black text-purple-600">{r.Seguros_Vendidos}</span>, r => r.Seguros_Vendidos, 'center'),
    puntosSeg: Col('puntosSeg', 'Puntos Seg.', r => <span className="bg-purple-500/10 text-purple-700 px-2 py-0.5 rounded-full font-bold">{Number(r.Puntos_Seg).toFixed(2)}</span>, r => r.Puntos_Seg, 'center', undefined, <div className="leading-[1.15]">Puntos<br/>Seguros</div>),
    
    puntajeTotal: Col('puntajeTotal', 'Puntaje Total', r => <span className="text-[14px] font-black text-foreground">{Number(r.Puntaje_Total).toFixed(2)}</span>, r => r.Puntaje_Total, 'center', () => 'bg-yellow-500/10', <div className="leading-[1.15] text-amber-600">Puntaje<br/>Total</div>),
    comentario: Col('comentario', 'Comentario', r => <span className="italic font-medium text-muted-foreground">{r.Comentario_Creativo}</span>, r => r.Comentario_Creativo, 'left')
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
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ranking_Excelencia', { views: [{ state: 'frozen', ySplit: 1 }] });

      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd97706' } };

      rows.forEach((row: any[]) => worksheet.addRow(row));

      worksheet.columns.forEach((col, idx) => {
        const headerLen = String(headers[idx] ?? '').length;
        const maxDataLen = rows.reduce((max: number, row: any[]) => {
          const len = String(row[idx] ?? '').length;
          return len > max ? len : max;
        }, 0);
        col.width = Math.min(Math.max(headerLen, maxDataLen) + 2, 40);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ranking_Excelencia_Comercial_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <div className="p-5 text-destructive font-semibold border border-destructive/20 bg-destructive/10 rounded-xl">Error al cargar datos del ranking.</div>;

  const fechaCalculo = tableData.length > 0 ? new Date(tableData[0].Fecha_Calculo).toLocaleDateString('es-PE') : 'Hoy';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Estilos para animaciones CSS inyectados directamente */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fly {
          0% { transform: translateX(-10vw) translateY(5vh) scale(0.5); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateX(110vw) translateY(-20vh) scale(1.5); opacity: 0; }
        }
        @keyframes panImage {
          0% { background-position: center 0%; }
          100% { background-position: center 100%; }
        }
        .animate-pan {
          /* Animación de 12 segundos alternando arriba y abajo */
          animation: panImage 12s alternate ease-in-out infinite;
        }
      `}} />

      {/* HEADER ÉPICO CON CARRUSEL DE IMÁGENES Y PANEO */}
      {/* Se aumentó el min-h-[400px] para dar más campo visual a las fotos */}
      <div className="rounded-2xl border-none p-8 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative min-h-[400px]">
        
        {/* Carrusel de Fondo */}
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-70 animate-pan' : 'opacity-0'
            }`}
            style={{ 
              backgroundImage: `url('${src}')`,
              // Iniciamos las fotos siempre pegadas arriba para priorizar los rostros
              backgroundPosition: 'center 0%' 
            }}
          />
        ))}

        {/* Gradiente Overlay más suave para resaltar colores reales */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/60 to-orange-900/60 mix-blend-multiply" />
        {/* Una capa sutil oscura uniforme para asegurar legibilidad del texto blanco */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Avión Animado */}
        <div className="absolute top-10 -left-20 animate-[fly_15s_linear_infinite] opacity-40">
          <PlaneTakeoff size={64} className="text-white transform -rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-2 text-amber-300 font-bold tracking-widest text-xs uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            <Flame size={16} className="text-amber-400"/> Competencia Institucional <Flame size={16} className="text-amber-400"/>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-xl text-white">
            PREMIO EXCELENCIA 2026
          </h1>
          <p className="text-amber-50 font-medium max-w-2xl text-sm md:text-base mt-2 leading-relaxed bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/10">
            Acumulado de Operaciones, Crecimiento Neto y Ventas de MiCumpa. Los 10 mejores asesores de la red ganarán viajes internacionales, nacionales y premios en efectivo. ¡Sin límite de sobreproducción!
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center bg-black/40 backdrop-blur-md rounded-xl p-5 border border-white/20 shadow-2xl">
          <div className="text-[10px] text-amber-200 font-bold uppercase tracking-wider mb-1">Última Actualización</div>
          <div className="text-3xl font-black drop-shadow-md text-white">{fechaCalculo}</div>
          <div className="text-xs text-amber-100 font-medium mt-1">Fuente: DWH Institucional</div>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <Panel 
        title="TABLA DE POSICIONES EN VIVO" 
        icon={<Trophy size={18} className="text-amber-500" />} 
        eyebrow="Todos contra Todos - Ranking Oficial" 
        action={<ExportActions control={cTable} onExport={exportar} />}
      >
        <DraggableTable control={cTable} columns={colRender} data={tableData} containerClass="max-h-[650px] pb-0" />
      </Panel>

    </div>
  );
}