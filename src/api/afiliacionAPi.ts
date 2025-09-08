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

// Interface para el endpoint de afiliación
export interface AfiliarSocioRequest {
    TIPO_DOC: string;
    NRO_DOC: string;
    AGENCIA: string;
    COD_CAJA: string;
    USER: string;
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

const afiliarSocioProceso = async (datos: AfiliarSocioRequest): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/afiliarSocio_proceso`,
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

export default { sociospendientesAfiliar, afiliarSocioProceso, getImgSocio };



