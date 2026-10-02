import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TooltipProvider } from './components/tooltip'; // Ajusta la ruta si es necesario
import { Toaster as SonnerToaster, toast } from 'sonner'; // Renombramos para no chocar con react-hot-toast
import { useLocation, useNavigate } from 'react-router-dom'; // Usamos el router de GeoDile
import { Activity, Trophy, Building2, CalendarDays, LayoutDashboard, Menu, RefreshCw, Search, SlidersHorizontal, Target, TrendingUp, Users, X, LineChart, Ban, ArrowLeft } from 'lucide-react';

// ==========================================
// IMPORTACIONES MODULARES (Ajusta las rutas relativas según tu estructura)
// ==========================================
import { FilterBar } from './components/FilterBar';
import { GerenciaView } from './pages/GerenciaView';
import { SupervisionAgenciasView } from './pages/SupervisionAgenciasView';
import { AgenciaView } from './pages/AgenciaView';
import { AsesoresView } from './pages/AsesoresView';
import { ColocacionesView } from './pages/ColocacionesView';
import { ProductividadDiaria } from './pages/ProductividadDiaria';
import { EvolucionView } from './pages/EvolucionView';
import { CanceladosView } from './pages/CanceladosView';
import { AvanceView } from './pages/AvanceView';
import { RankingView } from './pages/RankingView';
import IngresoMetasView from './pages/IngresoMetasView';

export type View = 'gerencia' | 'supervision' | 'agencia' | 'asesores' | 'colocaciones' | 'diaria' | 'evolucion' | 'cancelados' | 'avance' | 'ranking' | 'metas';
export type Filters = { period: string; agency: string; advisor: string; day: string };

const viewMeta: Record<View, { label: string; eyebrow: string; title: string; subtitle: string }> = {
  gerencia: { label: 'Reporte Gerencia', eyebrow: 'Lectura general de la operación', title: 'La colocación avanza con foco y control.', subtitle: 'Una lectura ejecutiva de metas, cartera, crecimiento, mora y productividad por agencia.' },
  supervision: { label: 'Supervisión Agencias', eyebrow: 'Supervisión · indicadores consolidados', title: 'Cada agencia muestra una oportunidad distinta.', subtitle: 'Compara el desempeño comercial y de recuperación para decidir dónde intervenir primero.' },
  agencia: { label: 'Detalle de Agencia', eyebrow: 'Supervisión · agencia seleccionada', title: 'Profundiza en la salud de una agencia.', subtitle: 'Revisa colocación, repagos, cartera y mora CPP por agencia y por asesor.' },
  asesores: { label: 'Indicadores Asesores', eyebrow: 'Seguimiento de equipos', title: 'La productividad se construye asesor por asesor.', subtitle: 'Identifica desempeño, duración, socios nuevos, mora y faltante a la meta de S/ 20K.' },
  colocaciones: { label: 'Colocaciones', eyebrow: 'Ritmo de colocación', title: 'El objetivo del mes se vuelve alcanzable.', subtitle: 'Monitorea meta, logrado y proyección para anticiparte al cierre de la agencia.' },
  diaria: { label: 'Productividad Diaria', eyebrow: 'Metas, proyecciones y colocaciones logradas', title: 'La gestión de hoy define el cierre.', subtitle: 'Compara cantidad y monto de colocaciones frente a la meta diaria de cada agencia.' },
  evolucion: { label: 'Evolución Histórica', eyebrow: 'Análisis de tendencias a largo plazo', title: 'El historial revela el verdadero crecimiento.', subtitle: 'Analiza el flujo de colocaciones y la calidad de cartera durante los últimos 12 meses.' },
  cancelados: { label: 'Cancelados No Renovados', eyebrow: 'Oportunidades de Retención', title: 'Seguimiento a créditos finalizados.', subtitle: 'Analiza los socios que cancelaron y no volvieron a sacar un crédito en los últimos 6 meses.' },
  avance: { label: 'Avance de Cartera', eyebrow: 'Progreso de Cobranza', title: 'Monitoreo del % de Avance por Socio.', subtitle: 'Listado detallado del avance de pagos, facilitando el seguimiento para futuras renovaciones.' },
  ranking: { label: 'Productividad Asesores', eyebrow: 'Ranking Comercial', title: 'Top de asesores por operaciones.', subtitle: 'Revisa quién lidera las colocaciones en cada periodo y su respectivo administrador.' },
  metas: { label: 'Ingreso de Metas', eyebrow: 'Configuración Operativa', title: 'Planificación de Productividad.', subtitle: 'Establezca las proyecciones de operaciones y montos para el día en curso por agencia.' },
};

// COMPONENTE PRINCIPAL EXPORTADO
export default function PowerBiDashboard() {
  return (
    // Ya no proveemos QueryClient porque GeoDile ya lo tiene en su App.tsx
    <TooltipProvider>
      <DashboardContent />
      <SonnerToaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}

function DashboardContent() {
  const location = useLocation();
  const navigateRouter = useNavigate();
  
  // Extraemos la vista actual de la URL relativa a /reportes (ej: /reportes/avance -> avance)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const lastSegment = (pathParts[pathParts.length - 1] || '') as View;
  const activeView: View = viewMeta[lastSegment] ? lastSegment : 'gerencia';
  
  // Llamamos a la BD usando la nueva variable de entorno de GeoDile
  const { data: dbFilters } = useQuery({
    queryKey: ['filtros-bd'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_REPORTE_URL}/api/filtros`);
      if (!res.ok) throw new Error('Error al obtener filtros');
      return res.json();
    }
  });
  // periodo actual
  const getCurrentPeriod = () => {
    const date = new Date();

    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  
  const [filters, setFilters] = useState<Filters>({ period: getCurrentPeriod(), agency: 'Todas', advisor: 'Todos', day: 'Hoy' });

  useEffect(() => {
    if (dbFilters?.periodos?.length > 0 && filters.period === 'Cargando...') {
      setFilters(prev => ({ ...prev, period: dbFilters.periodos[0] }));
    }
  }, [dbFilters, filters.period]);

  const [mobileNav, setMobileNav] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('11/08/2026 · 12:50 p. m.');
  const meta = viewMeta[activeView];

  // Función de navegación interna dentro de /reportes
  const handleNavigate = (view: View) => { 
    navigateRouter(view === 'gerencia' ? '/reportes' : `/reportes/${view}`); 
    setMobileNav(false); 
  };
  
  const refresh = () => { setIsRefreshing(true); setTimeout(() => { setIsRefreshing(false); setLastUpdated('justo ahora'); toast.success('Vista actualizada'); }, 650); };
  const resetFilters = () => { setFilters({ period: dbFilters?.periodos?.[0] || 'Cargando...', agency: 'Todas', advisor: 'Todos', day: 'Hoy' }); toast.success('Filtros restablecidos'); };

  return (
    <div className="powerbi-theme dashboard-noise min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Antes: bg-[hsl(var(--sidebar))] */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[256px] flex-col bg-gradient-to-br from-cyan-500 to-blue-500 text-white transition-transform duration-300 md:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header del Sidebar con Logo Botón */}
        <div className="flex h-[88px] items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-5">
          <button 
            onClick={() => navigateRouter('/')}
            className="group flex items-center gap-3 text-left transition-all"
            title="Volver al menú principal"
          >
            {/* Contenedor del Logo (Más grande y rectangular) */}
            <div className="flex h-11 w-[105px] items-center justify-center rounded-xl bg-white p-2 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:ring-2 group-hover:ring-[hsl(var(--sidebar-primary)/.5)]">
              <img 
                src="https://plataformadepagosdile.netlify.app/assets/logo_dile-CnWgqqS_.webp" 
                alt="Logo DILE" 
                className="h-full w-full object-contain"
              />
            </div>
            
            {/* Textos a la derecha */}
            <div className="flex flex-col justify-center">
              <div className="font-display text-[18px] font-bold tracking-[-.04em] text-white">
                PULSO<span className="text-[hsl(var(--sidebar-primary))]">.</span>
              </div>
              <div className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.19em] text-white/90 transition-colors group-hover:text-white">
                <ArrowLeft size={10} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-x-1" /> Inicio
              </div>
            </div>
          </button>

          {/* Botón cerrar en móviles */}
          <button 
            className="rounded-lg p-1 text-white/85 hover:text-white md:hidden" 
            onClick={(e) => {
              e.stopPropagation();
              setMobileNav(false);
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-7">
          <div className="mb-3 px-3 font-mono text-[12px] uppercase tracking-[.16em] text-white">Reporte operativo</div>
          <nav className="space-y-1">
            {([
              ['gerencia', 'Reporte Gerencia', LayoutDashboard],
              ['supervision', 'Supervisión Agencias', Building2],
              ['agencia', 'Detalle de Agencia', SlidersHorizontal],
              ['asesores', 'Indicadores Asesores', Users],
              ['colocaciones', 'Colocaciones', Target],
              ['diaria', 'Productividad Diaria', TrendingUp],
              //['metas', 'Ingreso de Metas', Edit],
              ['evolucion', 'Evolución Histórica', LineChart],
              ['cancelados', 'Cancelados No Renovados', Ban],
              ['avance', 'Avance de Cartera', Activity],
              ['ranking', 'Productividad Asesores', Trophy],
            ] as const).map(([view, label, Icon]) => (
              <button key={view} onClick={() => handleNavigate(view)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-semibold transition-all ${activeView === view ? 'bg-white/20 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.95),0_10px_24px_rgba(6,182,212,0.38)]' : 'text-white/90 hover:bg-white/12 hover:text-white'}`}><Icon size={16} strokeWidth={activeView === view ? 2.4 : 1.8} /><span>{label}</span>{activeView === view && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}</button>
            ))}
          </nav>
        </div>
      </aside>
      
      {mobileNav && <button className="fixed inset-0 z-20 bg-[hsl(var(--foreground)/.32)] md:hidden" onClick={() => setMobileNav(false)} />}
      
      <main className="min-h-[100dvh] md:pl-[256px]">
        <header className="sticky top-0 z-10 border-b border-border/70 bg-[hsl(var(--background)/.86)] px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-11">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><button className="rounded-xl border border-border bg-card p-2 md:hidden" onClick={() => setMobileNav(true)}><Menu size={19} /></button><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{meta.eyebrow}</div><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays size={13} />Periodo de gestión · {filters.period}</div></div></div>
            <div className="flex items-center gap-2"><button onClick={() => toast.info('Usa los filtros')} className="hidden rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground sm:block"><Search size={17} /></button></div>
          </div>
        </header>
        <div className="px-5 py-7 sm:px-8 lg:px-11 lg:py-9">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="animate-rise"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[hsl(var(--primary))]"><span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />Reporte Power BI · {meta.label}</div><h1 className="font-display max-w-2xl text-[30px] font-bold leading-[1.08] tracking-[-.045em] sm:text-[39px]">{meta.title}</h1><p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted-foreground">{meta.subtitle}</p></div>
            <div className="flex flex-wrap items-center gap-2"><button onClick={refresh} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-foreground"><RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />Actualizar</button></div>
          </div>
          
          <FilterBar activeView={activeView} filters={filters} setFilters={setFilters} showFilters={showFilters} setShowFilters={setShowFilters} resetFilters={resetFilters} dbFilters={dbFilters} />
          
          <div className="mb-6 flex items-center justify-between text-[11px] text-muted-foreground"><span>Actualizado {lastUpdated} · Fuente: SQL Server DWH</span></div>
          
          <div className={isRefreshing ? "opacity-40 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
            <DashboardView activeView={activeView} filters={filters} navigate={handleNavigate} dbFilters={dbFilters} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ORQUESTADOR DE VISTAS (Igual)
function DashboardView({ activeView, filters, navigate, dbFilters }: { activeView: View; filters: Filters; navigate: (view: View) => void, dbFilters: any }) {
  if (activeView === 'supervision') return <SupervisionAgenciasView navigate={navigate} filters={filters} />;
  if (activeView === 'agencia') return <AgenciaView filters={filters} />;
  if (activeView === 'asesores') return <AsesoresView filters={filters} />;
  if (activeView === 'colocaciones') return <ColocacionesView filters={filters} />;
  if (activeView === 'diaria') return <ProductividadDiaria filters={filters} />;
  if (activeView === 'evolucion') return <EvolucionView dbFilters={dbFilters} />;
  if (activeView === 'cancelados') return <CanceladosView dbFilters={dbFilters} />;
  if (activeView === 'avance') return <AvanceView dbFilters={dbFilters} />;
  if (activeView === 'ranking') return <RankingView dbFilters={dbFilters} />;
  if (activeView === 'metas') return <IngresoMetasView />;
  return <GerenciaView filters={filters} />; 
}