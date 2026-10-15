import { installBiFetchCache, syncBrowserCacheVersion, prefetchAllowedViews, clearBiBrowserCache } from './utils/biCache';

import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TooltipProvider } from './components/tooltip';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, Trophy, Building2, CalendarDays, LayoutDashboard, Menu, RefreshCw, Search, SlidersHorizontal, Target, TrendingUp, Users, X, LineChart, Ban, ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { resolveUserAccess, CODE_TO_BI_AGENCY } from './utils/accessControl';

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

installBiFetchCache();

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

const NAV_ITEMS = [
  ['gerencia', 'Reporte Gerencia', LayoutDashboard],
  ['supervision', 'Supervisión Agencias', Building2],
  ['agencia', 'Detalle de Agencia', SlidersHorizontal],
  ['asesores', 'Indicadores Asesores', Users],
  ['colocaciones', 'Colocaciones', Target],
  ['diaria', 'Productividad Diaria', TrendingUp],
  ['evolucion', 'Evolución Histórica', LineChart],
  ['cancelados', 'Cancelados No Renovados', Ban],
  ['avance', 'Avance de Cartera', Activity],
  ['ranking', 'Productividad Asesores', Trophy],
] as const;

export default function PowerBiDashboard() {
  return (
    <TooltipProvider>
      <DashboardContent />
      <SonnerToaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}

function DashboardContent() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigateRouter = useNavigate();

  // Configuramos React Query para mantener las vistas en caché del navegador por 15 minutos
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 1000 * 60 * 15, // 15 min en RAM del navegador (0 ms al cambiar de vista)
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
      },
    });
  }, [queryClient]);

  // Consultamos filtros y semáforo de actualización cada 60 segundos (responde en <1ms gracias a smartCache)
  const { data: dbFilters } = useQuery({
    queryKey: ['filtros-bd'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_REPORTE_URL}/api/filtros`);
      if (!res.ok) throw new Error('Error al obtener filtros');
      return res.json();
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60, // Verifica cada minuto si el ETL actualizó Log_Actualizacion
  });

  // Resolvemos el perfil de acceso según el rol, id_age e id_ana del usuario logueado
  const access = useMemo(() => resolveUserAccess(user, dbFilters), [user, dbFilters]);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const lastSegment = (pathParts[pathParts.length - 1] || '') as View;
  const requestedView: View = viewMeta[lastSegment] ? lastSegment : access.defaultView;
  const activeView: View = access.allowedViews.includes(requestedView) ? requestedView : access.defaultView;

  // Si el usuario intenta entrar por URL a una vista no permitida para su rol, lo redirigimos
  useEffect(() => {
    if (!access.allowedViews.includes(requestedView)) {
      navigateRouter(access.defaultView === 'gerencia' ? '/reportes' : `/reportes/${access.defaultView}`, { replace: true });
    }
  }, [requestedView, access, navigateRouter]);

  const getCurrentPeriod = () => {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const [filters, setFilters] = useState<Filters>({
    period: getCurrentPeriod(),
    agency: access.lockedAgency || 'Todas',
    advisor: access.lockedAdvisor || 'Todos',
    day: 'Hoy',
  });

  const [lastUpdated, setLastUpdated] = useState('Cargando...');
  const previousUpdateRef = useRef<string | null>(null);

  // Sincronización de fecha del ETL + candado de filtros por rol
  // Sincronización de fecha del ETL + limpieza automática si el ETL corrió
  useEffect(() => {
    if (dbFilters) {
      if (dbFilters.periodos?.length > 0 && filters.period === 'Cargando...') {
        setFilters(prev => ({ ...prev, period: dbFilters.periodos[0] }));
      }
      if (dbFilters.ultimaActualizacion) {
        const versionChanged = syncBrowserCacheVersion(dbFilters.ultimaActualizacion);
        if (versionChanged && previousUpdateRef.current) {
          queryClient.invalidateQueries({
            predicate: (q) => q.queryKey[0] !== 'filtros-bd',
          });
          toast.info(`Datos sincronizados con el DWH (${dbFilters.ultimaActualizacion})`);
        }
        previousUpdateRef.current = dbFilters.ultimaActualizacion;
        setLastUpdated(dbFilters.ultimaActualizacion);
      }
    }
  }, [dbFilters, filters.period, queryClient]);

  // Pre-carga silenciosa en segundo plano de las vistas a las que tiene acceso el usuario
  useEffect(() => {
    if (dbFilters) {
      prefetchAllowedViews(access.allowedViews, filters);
    }
  }, [dbFilters, access.allowedViews, filters.period, filters.agency, filters.advisor]);

  // Aplicamos el bloqueo de Agencia y Asesor cuando el usuario tiene nivel AGENCIA o ASESOR
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      agency: access.lockedAgency || prev.agency,
      advisor: access.lockedAdvisor || prev.advisor,
    }));
  }, [access.lockedAgency, access.lockedAdvisor]);

  // Envolvemos setFilters para impedir que un usuario bloqueado cambie su agencia o asesor
  const handleSetFilters: React.Dispatch<React.SetStateAction<Filters>> = (updater) => {
    setFilters(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return {
        ...next,
        agency: access.lockedAgency || next.agency,
        advisor: access.lockedAdvisor || next.advisor,
      };
    });
  };

  // Filtramos también dbFilters para las vistas que tienen selectores internos
  const scopedDbFilters = useMemo(() => {
    if (!dbFilters) return dbFilters;
    if (access.level === 'GLOBAL') return dbFilters;

    const filteredAsesores = (dbFilters.asesores || []).filter((a: any) => {
      const ageName = CODE_TO_BI_AGENCY[String(a.IdSAgencia || '').trim().padStart(2, '0')];
      if (access.lockedAgency && ageName !== access.lockedAgency) return false;
      if (access.lockedAdvisor) {
        const fullName = String(a.AsesorNombresApellidos || a.Asesor || '').trim();
        const shortName = String(a.Asesor || '').trim();
        return fullName === access.lockedAdvisor || shortName === access.lockedAdvisor;
      }
      return true;
    });

    return {
      ...dbFilters,
      asesores: filteredAsesores,
      lockedAgency: access.lockedAgency,
      lockedAdvisor: access.lockedAdvisor,
    };
  }, [dbFilters, access]);

  const [mobileNav, setMobileNav] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const meta = viewMeta[activeView];
  const visibleNavItems = NAV_ITEMS.filter(([view]) => access.allowedViews.includes(view));

  const handleNavigate = (view: View) => {
    if (!access.allowedViews.includes(view)) return;
    navigateRouter(view === 'gerencia' ? '/reportes' : `/reportes/${view}`);
    setMobileNav(false);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    clearBiBrowserCache();
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Datos actualizados');
    }, 350);
  };

  const resetFilters = () => {
    setFilters({
      period: dbFilters?.periodos?.[0] || getCurrentPeriod(),
      agency: access.lockedAgency || 'Todas',
      advisor: access.lockedAdvisor || 'Todos',
      day: 'Hoy',
    });
    toast.success('Filtros restablecidos');
  };

  return (
    <div className="powerbi-theme dashboard-noise min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gradient-to-br from-cyan-500 to-blue-500 text-white transition-all duration-300 md:translate-x-0 ${mobileNav ? 'translate-x-0 w-[256px]' : '-translate-x-full'} ${isSidebarCollapsed ? 'md:w-[80px]' : 'md:w-[256px]'}`}>
        
        <div className="flex h-[88px] items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-5 relative">
          <button 
            onClick={() => navigateRouter('/')}
            className={`group flex items-center gap-3 text-left transition-all ${isSidebarCollapsed ? 'mx-auto' : ''}`}
            title="Volver al menú principal"
          >
            <div className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:ring-2 group-hover:ring-[hsl(var(--sidebar-primary)/.5)]" style={{ width: isSidebarCollapsed ? '44px' : '105px' }}>
              <img 
                src="https://plataformadepagosdile.netlify.app/assets/logo_dile-CnWgqqS_.webp" 
                alt="Logo DILE" 
                className={`h-full object-contain ${isSidebarCollapsed ? 'w-full scale-150' : 'w-full'}`}
              />
            </div>
            
            {!isSidebarCollapsed && (
              <div className="flex flex-col justify-center overflow-hidden whitespace-nowrap">
                <div className="font-display text-[18px] font-bold tracking-[-.04em] text-white">
                  PULSO<span className="text-[hsl(var(--sidebar-primary))]">.</span>
                </div>
                <div className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.19em] text-white/90 transition-colors group-hover:text-white">
                  <ArrowLeft size={10} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-x-1" /> Inicio
                </div>
              </div>
            )}
          </button>

          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white text-cyan-600 rounded-full p-1 shadow-md hidden md:flex hover:scale-110 transition-transform"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>

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
        
        <div className="flex-1 overflow-y-auto px-4 py-7 scrollbar-none">
          {!isSidebarCollapsed && (
            <div className="mb-3 px-3 font-mono text-[12px] uppercase tracking-[.16em] text-white">Reporte operativo</div>
          )}
          
          <nav className="space-y-1">
            {visibleNavItems.map(([view, label, Icon]) => (
              <button 
                key={view} 
                onClick={() => handleNavigate(view)} 
                title={isSidebarCollapsed ? label : undefined}
                className={`group flex items-center transition-all 
                  ${isSidebarCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-xl px-0' : 'w-full gap-3 rounded-xl px-3 py-3 text-left'} 
                  ${activeView === view ? 'bg-white/20 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.95),0_10px_24px_rgba(6,182,212,0.38)]' : 'text-white/90 hover:bg-white/12 hover:text-white'}`}
              >
                <Icon size={isSidebarCollapsed ? 22 : 16} strokeWidth={activeView === view ? 2.4 : 1.8} className="shrink-0" />
                
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-[12px] font-semibold truncate">{label}</span>
                    {activeView === view && <span className="ml-auto shrink-0 h-1.5 w-1.5 rounded-full bg-white" />}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      {mobileNav && <button className="fixed inset-0 z-20 bg-[hsl(var(--foreground)/.32)] md:hidden" onClick={() => setMobileNav(false)} />}
      
      {/* MAIN */}
      <main className={`min-h-[100dvh] transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[256px]'}`}>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-[hsl(var(--background)/.86)] px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-11">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-border bg-card p-2 md:hidden" onClick={() => setMobileNav(true)}><Menu size={19} /></button>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{meta.eyebrow}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays size={13} />Periodo de gestión · {filters.period}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {access.lockedAgency && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-700">
                  <ShieldCheck size={14} />
                  <span>{access.debugLabel}</span>
                </div>
              )}
              <button onClick={() => toast.info('Usa los filtros')} className="hidden rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground sm:block"><Search size={17} /></button>
            </div>
          </div>
        </header>
        <div className="px-5 py-7 sm:px-8 lg:px-11 lg:py-9">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="animate-rise">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[hsl(var(--primary))]">
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />Reporte Power BI · {meta.label}
              </div>
              <h1 className="font-display max-w-2xl text-[30px] font-bold leading-[1.08] tracking-[-.045em] sm:text-[39px]">{meta.title}</h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted-foreground">{meta.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={refresh} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-foreground">
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />Actualizar
              </button>
            </div>
          </div>
          
          <FilterBar activeView={activeView} filters={filters} setFilters={handleSetFilters} showFilters={showFilters} setShowFilters={setShowFilters} resetFilters={resetFilters} dbFilters={scopedDbFilters} />
          
          <div className="mb-6 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Actualizado {lastUpdated} · Fuente: SQL Server DWH</span>
          </div>
          
          <div className={isRefreshing ? "opacity-40 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
            <DashboardView activeView={activeView} filters={filters} navigate={handleNavigate} dbFilters={scopedDbFilters} />
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardView({ activeView, filters, navigate, dbFilters }: { activeView: View; filters: Filters; navigate: (view: View) => void, dbFilters: any }) {
  if (activeView === 'supervision') return <SupervisionAgenciasView navigate={navigate} filters={filters} />;
  if (activeView === 'agencia') return <AgenciaView filters={filters} />;
  if (activeView === 'asesores') return <AsesoresView filters={filters} />;
  if (activeView === 'colocaciones') return <ColocacionesView filters={filters} />;
  if (activeView === 'diaria') return <ProductividadDiaria filters={filters} />;
  if (activeView === 'evolucion') return <EvolucionView dbFilters={dbFilters} />;
  if (activeView === 'cancelados') return <CanceladosView dbFilters={dbFilters} />;
  if (activeView === 'avance') return <AvanceView dbFilters={dbFilters} />;
  if (activeView === 'ranking') return <RankingView />;
  if (activeView === 'metas') return <IngresoMetasView />;
  return <GerenciaView filters={filters} />; 
}