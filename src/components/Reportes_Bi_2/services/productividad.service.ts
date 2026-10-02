// services/productividadService.ts

export async function getGestionPreventiva() {
  const res = await fetch(`${import.meta.env.VITE_API_REPORTE_URL}/api/gestion-preventiva`);
  if (!res.ok) throw new Error('Error de red');
  return res.json();
}

export async function getProductividadDiaria(period: string, day: string) {
  const params = new URLSearchParams({ day: day || 'Hoy' });
  const res = await fetch(`${import.meta.env.VITE_API_REPORTE_URL}/api/diaria/${period}?${params}`);
  if (!res.ok) throw new Error('Error de red');
  return res.json();
}