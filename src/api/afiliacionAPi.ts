const API_BASE_URL =import.meta.env.VITE_API_BASE_URL_GEODILE;  // corregir
const API_BASE_URL_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;




// mportar  colas del socios  a  pendientes a afiliar

export interface AfiliacionSocios {
    DNI: string;
    APELLIDOS: string;
    NOMBRES: string;
    FECHA_PRE_AFI : string;
    EDAD: string;
    ESTADO: string;
}

const sociospendientesAfiliar = async (): Promise<AfiliacionSocios[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_mongo_firm_easy/api/ListSociosPreAfiliados`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: AfiliacionSocios[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};


export default { sociospendientesAfiliar };