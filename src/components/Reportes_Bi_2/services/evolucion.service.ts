// services/evolucionService.ts

export interface EvolucionParams {
  agencia?: string;
  asesor?: string;
  granularidad: 'Mensual' | 'Diario';
  desde: string;
  hasta: string;
}

export interface EvolucionRegistro {
  periodo: string;
  etiqueta: string;
  colocacionNumReal: number;
  colocacionNumMeta: number;
  colocacionMonto: number;
  colocacionMeta: number;
  repagos: number;
  crecimientoBruto: number;
  carteraTotal?: number;
  mora31Total?: number;
  pctMora31?: number;
  [key: string]: any;
}

/**
 * Obtiene el historial de evolución (mensual o diario) para el rango y filtros dados.
 * Lanza un Error si la respuesta no es OK, para que React Query lo capture en `error`.
 */
export async function fetchEvolucion(params: EvolucionParams): Promise<EvolucionRegistro[]> {
  const baseUrl = import.meta.env.VITE_API_REPORTE_URL;

  const query = new URLSearchParams({
    agencia: params.agencia && params.agencia !== 'Todas' ? params.agencia : '',
    asesor: params.asesor && params.asesor !== 'Todos' ? params.asesor : '',
    granularidad: params.granularidad,
    desde: params.desde,
    hasta: params.hasta
  });

  const res = await fetch(`${baseUrl}/api/evolucion?${query}`);

  if (!res.ok) {
    throw new Error(`Error al cargar historial (status ${res.status})`);
  }

  return res.json();
}