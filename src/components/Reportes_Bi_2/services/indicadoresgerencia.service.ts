// services/indicadoresGerenciaService.ts

export interface IndicadorComercial {
  agency: string;
  cartera: number;
  crecimientoBruto: number;
  opAchieved: number;
  opTarget: number;
  amountAchieved: number;
  amountTarget: number;
  repagos: number;
  duration: number;
  moraCPP_soles: number;
  cpp: number;
  meta: number;
  excedente: number;
  moraDeficiente_soles: number;
  crecimientoNeto150: number;
  [key: string]: any;
}

export interface IndicadorNormalizacion {
  agency: string;
  recuperador: string;
  cartera: number;
  repagos: number;
  moraCPP_soles: number;
  moraDeficiente_soles: number;
  pctMora9: number;
  crecNeto30: number;
  [key: string]: any;
}

export interface IndicadoresGerenciaResponse {
  comercial: IndicadorComercial[];
  normalizacion: IndicadorNormalizacion[];
}

/**
 * Obtiene los indicadores de gerencia (comercial + normalización) para un período dado.
 * Lanza un Error si la respuesta no es OK, para que React Query lo capture en `error`.
 */
export async function fetchIndicadoresGerencia(period: string): Promise<IndicadoresGerenciaResponse> {
  const baseUrl = import.meta.env.VITE_API_REPORTE_URL;
  const res = await fetch(`${baseUrl}/api/indicadores-gerencia/${period}`);

  if (!res.ok) {
    throw new Error(`Error al cargar indicadores (status ${res.status})`);
  }

  return res.json();
}