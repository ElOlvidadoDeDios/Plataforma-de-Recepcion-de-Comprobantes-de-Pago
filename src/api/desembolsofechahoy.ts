export interface dataResponseApi {   
    DNI: string,
    CUENTA: string,
    RAZON_SOCIAL: string,
    PAGARE: string,
    OTORGA: string,
    MONTO_NETO: string,
    AGENCIA: string,  // 👈 Este es el que usarás para filtrar
    ID_PAYOUT: string,
    STATUS_GLOBAL: string,
    STATUS_CREATED: number,
    STATUS_DETALLE: string | null
}

// Primera función - obtiene TODOS los desembolsos
export const desembolsosFechaHoy = async (): Promise<dataResponseApi[]> => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
  const token = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

  const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/PayoutByDateToday`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(`Error en la consulta: ${response.status}`);
  }

  const data = await response.json() as dataResponseApi[];
  return data;
};

// Segunda función - filtra por agencia específica
export const getListadoPorAgencias = async (idAgencia: string): Promise<dataResponseApi[]> => {
  // 1. Obtener todos los desembolsos
  const todosLosDesembolsos = await desembolsosFechaHoy();
  
  // 2. Filtrar por la agencia específica (ej: "01")


  const desembolsosFiltrados = todosLosDesembolsos.filter(
    desembolso => desembolso.AGENCIA === idAgencia
  );
  
  return desembolsosFiltrados;
};
