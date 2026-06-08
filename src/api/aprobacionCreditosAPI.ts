export interface SolicitudCredito {
  AGENCIA_NOM: string;
  Nro: string;
  NRO_SOL: string;
  FECHA_SOL: string;
  CUENTA: string;
  NOMBRE: string;
  MONTO_SOL: string;
  MONEDA: string;
  NETO: string;
  COD_CARGO: string;
  TEM: string;
  TEA_INTERES: string;
  CUO_SEGURO: string;
}

export interface ResponseSolicitudes {
  status: boolean;
  message: string;
  data: SolicitudCredito[];
}

/**
 * Obtiene solicitudes de crédito pendientes del API real
 * @param agencia - ID de agencia del usuario autenticado (campo id_age del token)
 * @param cargo - ID del cargo del usuario (campo cargo del token)
 * @param user - ID o código del usuario (campo user del token)
 */
export const fetchSolicitudesCreditoPendientes = async (
  agencia: string,
  cargo: string,
  user: string
): Promise<ResponseSolicitudes> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
    const TOKEN_aPI_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
    
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL_GEODILE no está configurada');
    }

    const url = `${API_BASE_URL}/api_app_dile_v1_1_dev_1/api/list_solicitudes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `${TOKEN_aPI_BASE_URL}`
      },
      body: JSON.stringify({
        AGENCIA: agencia,
        ID_CARGO: cargo,
        ID_USER: user
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Formato de respuesta inesperado del servidor');
    }

    return {
      status: true,
      message: 'Solicitudes cargadas exitosamente',
      data: data?.slice().sort((a, b) => {
        return new Date(b.FECHA_REGISTRO).getTime() -
              new Date(a.FECHA_REGISTRO).getTime();
      }) ?? [],
    };
  } catch (error) {
    console.error('Error en fetchSolicitudesCreditoPendientes:', error);
    return {
      status: false,
      message: 'Error al obtener solicitudes de crédito: ' + (error instanceof Error ? error.message : String(error)),
      data: [],
    };
  }
};

/**
 * Interface para el detalle completo de la solicitud
 */
export interface DetalleSolicitud {
  CUENTA: string;
  RAZON_SOCIAL: string;
  NRO_SOL: string;
  SUBTIPO_PRES: string;
  NOM_SUBTIPO_PRES: string;
  TIPO_PROD: string;
  NOM_PROD: string;
  MONTO_SOL: string;
  MONTO_NETO: string;
  MONTO_APROB: string;
  PLAZO: string;
  MONEDA: string;
  FECHA_1RACUOTA: string;
  COD_FRECUENCIA: string;
  CUOTA_FIJA: string;
  TEA_INTERES: string;
  CUO_SEGURO: string;
  ORDEN: string;
  TEM: string;
  ESTADO: string;
  NIVEL: string;
  ENCARGADO: string;
  COD_AGE: string;
  NOM_FRECUENCIA: string;
}

/**
 * Obtiene el detalle completo de una solicitud de crédito
 * @param nroSol - Número de solicitud
 */
export const fetchDetalleSolicitud = async (nroSol: string): Promise<{ status: boolean; message: string; data: DetalleSolicitud | null }> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
    const TOKEN_aPI_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
    
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL_GEODILE no está configurada');
    }

    const url = `${API_BASE_URL}/api_app_dile_v1_1_dev_1/api/detalle_solicitud_aprobar`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `${TOKEN_aPI_BASE_URL}`
      },
      body: JSON.stringify({
        NRO_SOL: nroSol
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No se encontró detalle para esta solicitud');
    }

    return {
      status: true,
      message: 'Detalle obtenido exitosamente',
      data: data[0], // El API retorna un array, tomamos el primer elemento
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al obtener el detalle de la solicitud: ' + (error instanceof Error ? error.message : String(error)),
      data: null,
    };
  }
};

/**
 * Interface para aprobar solicitud
 */
export interface AprobarSolicitudRequest {
  COD_AGE: string;
  NRO_SOL: string;
  TRAMO: string;
  PRIORIDAD: string;
  GLOSA: string;
  COD_APRUEBA: string;
  CUOTA_FIJA: number;
  PLAZO: number;
  FEC_1_ER: string;
  MONTO_APRO: number;
  MONTO_NETO: number;
  TEA: number;
  COD_USER: string;
}

/**
 * Interface para denegar solicitud
 */
export interface DenegarSolicitudRequest {
  COD_AGE: string;
  NRO_SOL: string;
  TRAMO: string;
  PRIORIDAD: string;
  GLOSA: string;
  COD_APRUEBA: string;
}

/**
 * Interface para anular solicitud
 */
export interface AnularSolicitudRequest {
  COD_AGE: string;
  NRO_SOL: string;
  GLOSA: string;
  COD_APRUEBA: string;
  NIVEL: string;
  ORDEN: string;
}

/**
 * Aprobar una solicitud de crédito
 * @param requestData - Datos para aprobar la solicitud
 */
export const aprobarSolicitud = async (requestData: AprobarSolicitudRequest): Promise<{ status: boolean; message: string }> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
    const TOKEN_aPI_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
    
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL_GEODILE no está configurada');
    }

    const url = `${API_BASE_URL}/api_app_dile_v1_1_dev_1/api/aprobar_solicitud`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `${TOKEN_aPI_BASE_URL}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Retornar el status que viene del API, no siempre true
    return {
      status: data.status !== undefined ? data.status : true,
      message: data.message || 'Solicitud aprobada exitosamente',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al aprobar la solicitud: ' + (error instanceof Error ? error.message : String(error)),
    };
  }

  /***
   * Denegar una solicitud de credito 
   * @param requestData - Datos para denegar la solicitud
   */
 };
 
/**
 * Denegar una solicitud de crédito
 * @param requestData - Datos para denegar la solicitud
 */
export const denegarSolicitud = async (requestData: DenegarSolicitudRequest): Promise<{ status: boolean; message: string }> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
    const TOKEN_aPI_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
    
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL_GEODILE no está configurada');
    }

    const url = `${API_BASE_URL}/api_app_dile_v1_1_dev_1/api/denegar_solicitud`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `${TOKEN_aPI_BASE_URL}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Retornar el status que viene del API
    return {
      status: data.status !== undefined ? data.status : true,
      message: data.message || 'Solicitud denegada exitosamente',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al denegar la solicitud: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
};

/**
 * Anular una solicitud de crédito
 * @param requestData - Datos para anular la solicitud
 */
export const anularSolicitud = async (requestData: AnularSolicitudRequest): Promise<{ status: boolean; message: string }> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
    const TOKEN_aPI_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
    
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL_GEODILE no está configurada');
    }

    const url = `${API_BASE_URL}/api_app_dile_v1_1_dev_1/api/anular_solicitud`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `${TOKEN_aPI_BASE_URL}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Retornar el status que viene del API
    return {
      status: data.status !== undefined ? data.status : true,
      message: data.message || 'Solicitud anulada exitosamente',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al anular la solicitud: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
};
