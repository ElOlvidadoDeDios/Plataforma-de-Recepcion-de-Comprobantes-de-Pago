// src/services/canceladosService.ts
const API_BASE = import.meta.env.VITE_API_REPORTE_URL;

// ============================================================================
// API: CANCELADOS
// ============================================================================
export interface CanceladosFilters {
  agencia: string;
  asesor: string;
  tipo: string;
  frecuencia: string;
}

export async function fetchCancelados(filters: CanceladosFilters): Promise<any[]> {
  const params = new URLSearchParams({
    agencia: filters.agencia !== 'Todas' ? filters.agencia : '',
    asesor: filters.asesor !== 'Todos' ? filters.asesor : '',
    tipo: filters.tipo !== 'Todas' ? filters.tipo : '',
    frecuencia: filters.frecuencia !== 'Todas' ? filters.frecuencia : ''
  });
  const res = await fetch(`${API_BASE}/api/cancelados?${params}`);
  if (!res.ok) throw new Error('Error al cargar cancelados');
  return res.json();
}