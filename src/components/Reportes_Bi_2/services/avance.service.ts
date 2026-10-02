// src/services/avanceService.ts
const API_BASE = import.meta.env.VITE_API_REPORTE_URL;

// ============================================================================
// API: AVANCE DE CARTERA
// ============================================================================
export interface AvanceFilters {
  agencia: string;
  asesor: string;
}

export async function fetchAvance(filters: AvanceFilters): Promise<any[]> {
  const params = new URLSearchParams({
    agencia: filters.agencia !== 'Todas' ? filters.agencia : '',
    asesor: filters.asesor !== 'Todos' ? filters.asesor : ''
  });
  const res = await fetch(`${API_BASE}/api/avance?${params}`);
  if (!res.ok) throw new Error('Error al cargar avance de cartera');
  return res.json();
}