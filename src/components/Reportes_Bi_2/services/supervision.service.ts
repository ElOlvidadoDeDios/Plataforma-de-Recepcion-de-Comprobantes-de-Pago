// services/supervisionService.ts

export async function getSupervision(period: string) {
  const res = await fetch(`${import.meta.env.VITE_API_REPORTE_URL}/api/supervision/${period}`);
  if (!res.ok) throw new Error('Error al cargar supervisión');
  return res.json();
}