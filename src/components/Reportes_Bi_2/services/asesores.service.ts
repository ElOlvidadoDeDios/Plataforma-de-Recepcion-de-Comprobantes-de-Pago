// src/services/asesoresService.ts
const API_BASE = import.meta.env.VITE_API_REPORTE_URL;

// ============================================================================
// API: INDICADORES DE ASESORES
// ============================================================================
export async function fetchAsesores(periodo: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/asesores/${periodo}`);
  if (!res.ok) throw new Error('Error al cargar asesores');
  return res.json();
}

// ============================================================================
// API: DÍAS LABORALES
// ============================================================================
export async function fetchDiasLaborales(periodo: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/dias-laborales/${periodo}`);
  if (!res.ok) return null;
  return res.json();
}