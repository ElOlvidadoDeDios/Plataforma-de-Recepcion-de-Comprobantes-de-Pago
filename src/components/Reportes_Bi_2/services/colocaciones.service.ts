// src/services/colocacionesService.ts
const API_BASE = import.meta.env.VITE_API_REPORTE_URL;

// ============================================================================
// API: AGENCIA
// ============================================================================
export async function fetchAgencia(periodo: string): Promise<any> {
  const params = new URLSearchParams({ periodo: periodo !== 'Cargando...' ? periodo : '' });
  const res = await fetch(`${API_BASE}/api/agencia?${params}`);
  if (!res.ok) throw new Error('Error al cargar agencia');
  return res.json();
}

// ============================================================================
// API: DÍAS LABORALES
// ============================================================================
export async function fetchDiasLaborales(periodo: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/dias-laborales/${periodo}`);
  if (!res.ok) throw new Error('Error al cargar calendario');
  return res.json();
}