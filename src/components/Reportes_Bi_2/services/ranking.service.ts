// services/rankingService.ts

export async function getRanking(periodo: string, agencia: string, asesor: string) {
  const params = new URLSearchParams({
    periodo,
    agencia: agencia !== 'Todas' ? agencia : '',
    asesor: asesor !== 'Todos' ? asesor : ''
  });
  const res = await fetch(`${import.meta.env.VITE_API_REPORTE_URL}/api/ranking?${params}`);
  if (!res.ok) throw new Error('Error al cargar el ranking');
  return res.json();
}