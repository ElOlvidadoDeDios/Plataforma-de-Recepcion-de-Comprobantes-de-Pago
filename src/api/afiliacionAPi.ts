import { SessionManager } from '../utils/sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;  // corregir
const API_BASE_URL_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
const API_BASE_URL_NEST = import.meta.env.VITE_API_BASE_URL; // Backend NestJS




// mportar  colas del socios  a  pendientes a afiliar

export interface AfiliacionSocios {
    DNI: string;
    AGENCIA: string;
    APELLIDOS: string;
    NOMBRES: string;
    FECHA_PRE_AFI : string;
    EDAD: string;
    ESTADO: string;
}

// Interface para el endpoint de afiliación
export interface AfiliarSocioRequest {
    TIPO_DOC: string;
    NRO_DOC: string;
    AGENCIA: string;
    COD_CAJA: string;
    USER: string;
    nro_banco?: string; // Campo opcional para el número de banco
}

interface ApiResponse {
  status?: boolean;
  message?: string;
  data?: AfiliacionSocios[];
}

const sociospendientesAfiliar = async (): Promise<ApiResponse | AfiliacionSocios[]> => {
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
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    // Validar si la respuesta trae socios o es un error
    if (data.status === false) {
      return []; // devolvemos array vacío para que no rompa el render
    }

    // Si es un array, devolvemos normal
    return data as AfiliacionSocios[];
  } catch (error) {
    if (error instanceof Error) {
    } else {
    }
    // Log error details for debugging without breaking the UI
    return []; // Return empty array to ensure UI stability
  }
};


const afiliarSocioProceso = async (datos: AfiliarSocioRequest): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/afiliarSocio_proceso`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify(datos)
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
  catch (error) {
    throw error;
  }
};


interface ImgSocioResponse {
  status: boolean;
  link: {
    LINK_DNI_FRONTAL: string;
    LINK_DNI_POSTERIOR: string;
    LINK_VOUCHER_AFI: string;
  };
}

const getImgSocio = async (DNI: string): Promise<ImgSocioResponse | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_mongo_firm_easy/api/get_url_img_pre_afilia`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify({ DNI: DNI })
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const responseText = await response.text();
    
    // Verificar si la respuesta es HTML (error del servidor)
    if (responseText.startsWith('<') || responseText.includes('<br')) {
      return null;
    }
    
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      return null;
    }
    
  } catch (error) {
    return null;
  }
};

// ✅ NUEVO: API para obtener URLs desde el nuevo endpoint (NestJS Backend)
// Endpoint: http://192.168.3.26:3032/afiliacion/socio/imagenes
// Método: POST
// Body: { DNI: "74792434" }
const getImgSocioNew = async (DNI: string): Promise<ImgSocioResponse | null> => {
  try {
    const token = SessionManager.getItem('token');
    
    const response = await fetch(
      `${API_BASE_URL_NEST}/afiliacion/socio/imagenes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Agregar token si existe
        },
        body: JSON.stringify({ DNI: DNI })
      }
    );
    
    if (!response.ok) {
      console.error(`Error HTTP ${response.status} al obtener imágenes del nuevo backend`);
      return null;
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error al conectar con el nuevo backend de imágenes:', error);
    return null;
  }
};

interface datafamiliar {
  ITEM: number;
  CUENTA: string;
  APE_PATERNO: string;
  APE_MATERNO: string;
  NOMBRE: string;
  FECHA_NAC: string;
  TIPO_PAREN: string;
  SEXO: string;
  TELEFONO: string;
  EMAIL: string;
  TIPO_DI: string;
  NRO_DI: string;
  TUTOR: string;
  BENEFICIARIO: string;
  PORC_BENEF: number;
  DIRECCION_REF: string;
  COD_USER: string;
}

export const familiarSocioProceso = async (datos: datafamiliar): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/insertSocioFamiliar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify(datos)
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
//   {
//   "ITEM": 1,
//   "CUENTA": "000000037426",
//   "APE_PATERNO": "PEREZ",
//   "APE_MATERNO": "GARCIA",
//   "NOMBRE": "JUAN",
//   "FECHA_NAC": "2005-03-15",
//   "TIPO_PAREN": "HI",
//   "SEXO": "M",
//   "TELEFONO": "987654321",
//   "EMAIL": "juan.perez@example.com",
//   "TIPO_DI": "01",
//   "NRO_DI": "12345678",
//   "TUTOR": "N",
//   "BENEFICIARIO": "S",
//   "PORC_BENEF": 0,
//   "DIRECCION_REF": "Av. Principal 123, Lima",
// }
interface comboBoxData {
  TIPO_PAREN: string;
  NOM_TPAREN: string;
}
interface comboBoxDataFamiliar {
  TIPO_DI: string;
  NOM_DI: string;
  NCARACTER: string;
}
export interface FamiliarOpciones {
  TIPO_VINCULO_FAMILIAR: comboBoxData[];
  TIPO_DOCUMENTO: comboBoxDataFamiliar[];
}
export const useComboBoxFamiliarOpcionesData = async (): Promise<FamiliarOpciones | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/comboFamiliar`,
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
    
    const data: FamiliarOpciones = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
//{
//   "TIPO_VINCULO_FAMILIAR": [
//     {
//       "TIPO_PAREN": "01",
//       "NOM_TPAREN": "Titular"
//     },
//     {
//       "TIPO_DI": "99",
//       "NOM_DI": "NINGUNO",
//       "NCARACTER": "8"
//     }
//   ]
// }
export interface DatosAdicionalesAPI {
  CUENTA: string;
  TIEMPO_LABORANDO: number;
  TUVO_CREDITOS: string;
  TIENE_VEHICULO: string;
  TIENE_CARGA_FAMILIAR: string;
  NUMERO_HIJOS: number;
  DETALLES_HIJO: {
    EDAD_HIJO: number;
    VIVE_CON_TITULAR: string;
    NIVEL_ESTUDIO: string;
    TIPO_INSTITUCION: string;
    DONDE_ESTUDIA: string;
  }[] | null;
}
export interface DatosAdicionalesResponse {
  status: boolean;
  message: string;
  detalle: {
    INSERT_SOCIO: {
      status: boolean;
      message: string;
      detalle: string;
    };
    NUM_HIJOS_INSERT: number;
    INSERT_HIJOS: {
      status: boolean;
      message: string;
      detalle: string;
    }[];
  };
}


export const DatosAdicionales_insert = async (
  data: DatosAdicionalesAPI
): Promise<DatosAdicionalesResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/insertDatosAdicionales`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result: DatosAdicionalesResponse = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

export default { sociospendientesAfiliar, afiliarSocioProceso, getImgSocio, getImgSocioNew, useComboBoxFamiliarOpcionesData };



