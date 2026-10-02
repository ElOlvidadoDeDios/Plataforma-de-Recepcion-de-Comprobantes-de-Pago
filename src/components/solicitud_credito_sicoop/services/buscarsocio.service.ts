// Tipo de documento
export enum TipoDocumento {
  DNI = "01",
  NOMBRE = "02",
  CUENTA = "03"
}

export interface ClienteBasico {
  NRO_DI: string;
  CUENTA: string;
  RAZON_SOCIAL: string;
  NOM_AGE: string;
  EST_SOCIO: string;
  CREDITO_VIGENTE: string;
  TIPO_DIR: string;
  TIPO_VIA: string;
  NOM_VIA: string;
  TIPO_ZONA: string;
  NOM_ZONA: string;
  NUMERO: string;
  INTERIOR: string;
  REFERENCIA: string;
  DPTO: string;
  PROV: string;
  DIST: string;
  TIPO_SECTOR: string;
  DIRECCION: string;
  CEL_PRINCIPAL: string;
  TLF_CEL2: string;
  TLF_FIJO1: string;
  TLF_FIJO2: string;
  EMAIL: string;
}

 export interface BusquedaInicialResponse {
  status: boolean;
  count: number;
  data: ClienteBasico[];
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
const API_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
// Función para búsqueda inicial de clientes que maneja 404 silenciosamente
export const searchClientes = async (
  tipo_doc: TipoDocumento,
  valor: string,
  signal?: AbortSignal
): Promise<BusquedaInicialResponse> => {
  if (!valor || valor.length < 3) {
    return {
      status: false,
      count: 0,
      data: []
    };
  }

  try {
    
    const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/buscar_datos_socio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${API_TOKEN}`
      },
      body: JSON.stringify({
        tipo_doc,
        razon: valor.trim()
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.status}`);
    }

    const data = await response.json();
    
    // Si el servidor devuelve status: false, es una respuesta válida (sin resultados)
    if (data.status === false) {
      return {
        status: false,
        count: data.count || 0,
        data: []
      };
    }
    
    return data;

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: false,
        count: 0,
        data: []
      };
    }
    throw error;
  }

};

//compoente para obtener finalidad 
export interface GetFinalidad {

    TIPO_FINALIDAD: string;
    NOM_FINALIDAD: string;
}
// {
//     "PRES": "25"//ID_ VALOR
// }
export interface getFinalidadResponse {
  status: boolean;
  count: number;
  data: GetFinalidad[];
}
export async function getFinalidad(PRES: string): Promise<getFinalidadResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/cb_cal_fina`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${API_TOKEN}`,
            },
            body: JSON.stringify({ PRES: PRES })
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return {
              status: false,
              count: 0,
              data: []
            };
        }
        return {
          status: false,
          count: 0,
          data: []
        };
    }
}



