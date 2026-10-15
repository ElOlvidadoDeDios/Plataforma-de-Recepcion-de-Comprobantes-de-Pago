import type { View, Filters } from '../PowerBiDashboard';

const memoryStore = new Map<string, any>();
const STORAGE_PREFIX = 'PULSO_BI_CACHE_V1_';
const VERSION_KEY = 'PULSO_BI_LAST_UPDATE';

let isFetchPatched = false;

/**
 * Intercepta de forma transparente todas las peticiones GET hacia el backend de reportes BI.
 * Si la URL ya fue consultada en la misma versión del ETL, responde en 0ms desde la RAM del navegador.
 */
export function installBiFetchCache() {
  if (isFetchPatched || typeof window === 'undefined') return;
  isFetchPatched = true;

  const originalFetch = window.fetch.bind(window);
  const apiBase = String(import.meta.env.VITE_API_REPORTE_URL || '');

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || 'GET').toUpperCase();

    // Solo interceptamos peticiones GET dirigidas a nuestro Backend de Reportes BI (excepto /api/filtros que es nuestro semáforo)
    const isBiReportCall = apiBase && url.startsWith(apiBase) && method === 'GET' && !url.includes('/api/filtros');

    if (!isBiReportCall) {
      return originalFetch(input, init);
    }

    // 1. Revisar RAM del navegador (0ms)
    if (memoryStore.has(url)) {
      const cachedData = memoryStore.get(url);
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Browser-Cache': 'RAM-HIT' },
      });
    }

    // 2. Revisar SessionStorage (persiste si el usuario presiona F5)
    try {
      const stored = sessionStorage.getItem(STORAGE_PREFIX + url);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryStore.set(url, parsed);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Browser-Cache': 'STORAGE-HIT' },
        });
      }
    } catch {
      // Ignorar si sessionStorage está lleno
    }

    // 3. Si no está en el navegador, va al SmartCache del Backend y guarda una copia local
    const response = await originalFetch(input, init);
    if (response.ok) {
      const clone = response.clone();
      clone.json().then((data) => {
        if (!data?.error) {
          memoryStore.set(url, data);
          try {
            sessionStorage.setItem(STORAGE_PREFIX + url, JSON.stringify(data));
          } catch {
            // Si excede la cuota de sessionStorage, queda igual en memoryStore (RAM)
          }
        }
      }).catch(() => {});
    }

    return response;
  };
}

/**
 * Sincroniza la versión del caché del navegador con Log_Actualizacion del DWH.
 * Si el ETL actualizó la base de datos, limpia automáticamente el caché antiguo del navegador.
 */
export function syncBrowserCacheVersion(ultimaActualizacion: string): boolean {
  if (!ultimaActualizacion || ultimaActualizacion === 'Cargando...') return false;

  const savedVersion = sessionStorage.getItem(VERSION_KEY);
  if (savedVersion !== ultimaActualizacion) {
    clearBiBrowserCache();
    sessionStorage.setItem(VERSION_KEY, ultimaActualizacion);
    return true; // Hubo nueva actualización del ETL
  }
  return false;
}

export function clearBiBrowserCache() {
  memoryStore.clear();
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
}

/**
 * Pre-carga silenciosamente en segundo plano los datos de las vistas permitidas para el usuario.
 * Así, cuando haga clic en otra pestaña del menú lateral, los datos ya estarán en su navegador.
 */
export function prefetchAllowedViews(allowedViews: View[], filters: Filters) {
  const apiBase = import.meta.env.VITE_API_REPORTE_URL;
  if (!apiBase || !filters.period || filters.period === 'Cargando...') return;

  const p = encodeURIComponent(filters.period);
  const ag = encodeURIComponent(filters.agency || 'Todas');
  const as = encodeURIComponent(filters.advisor || 'Todos');
  const d = encodeURIComponent(filters.day || 'Hoy');

  const urlsByView: Partial<Record<View, string>> = {
    gerencia: `${apiBase}/api/gerencia?periodo=${p}&agencia=${ag}&asesor=${as}`,
    supervision: `${apiBase}/api/supervision?periodo=${p}&agencia=${ag}&asesor=${as}`,
    agencia: `${apiBase}/api/agencia?periodo=${p}&agencia=${ag}&asesor=${as}`,
    asesores: `${apiBase}/api/asesores?periodo=${p}&agencia=${ag}&asesor=${as}`,
    colocaciones: `${apiBase}/api/colocaciones?periodo=${p}&agencia=${ag}&asesor=${as}`,
    diaria: `${apiBase}/api/diaria?periodo=${p}&agencia=${ag}&asesor=${as}&dia=${d}`,
    cancelados: `${apiBase}/api/cancelados?agencia=${ag}&asesor=${as}&tipo=Todas&frecuencia=Todas`,
    avance: `${apiBase}/api/avance?agencia=${ag}&asesor=${as}`,
    ranking: `${apiBase}/api/ranking`,
  };

  // Lanzamos la pre-carga con un pequeño respiro de 300ms para no competir con la vista activa
  setTimeout(() => {
    allowedViews.forEach((view) => {
      const targetUrl = urlsByView[view];
      if (targetUrl && !memoryStore.has(targetUrl)) {
        fetch(targetUrl).catch(() => {});
      }
    });
  }, 300);
}