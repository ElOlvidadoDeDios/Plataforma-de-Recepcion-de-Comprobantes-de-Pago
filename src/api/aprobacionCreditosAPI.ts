export interface SolicitudCredito {
  Nro: string;
  NRO_SOL: string;
  FECHA_SOL: string;
  CUENTA: string;
  NOMBRE: string;
  MONTO_SOL: string;
  MONEDA: string;
  NETO: string;
  cod_cargo: string;
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

    const url = `${API_BASE_URL}/api_app_dile_v1_1/api/list_solicitudes`;

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
        // Ordenar numéricamente por Nro del 1 al n
        const nroA = parseInt(a.Nro) || 0;
        const nroB = parseInt(b.Nro) || 0;
        return nroA - nroB;
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
 * Simula la aprobación de una solicitud
 */
export const aprobarSolicitud = async (
  solicitudId: string,
  glosa: string
): Promise<{ status: boolean; message: string }> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Solicitud ${solicitudId} aprobada con glosa: ${glosa}`);
    return {
      status: true,
      message: 'Solicitud aprobada exitosamente',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al aprobar la solicitud',
    };
  }
};

/**
 * Simula el rechazo de una solicitud
 */
export const rechazarSolicitud = async (
  solicitudId: string,
  glosa: string
): Promise<{ status: boolean; message: string }> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Solicitud ${solicitudId} rechazada con glosa: ${glosa}`);
    return {
      status: true,
      message: 'Solicitud rechazada exitosamente',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al rechazar la solicitud',
    };
  }
};

/**
 * Simula la anulación de una solicitud
 */
export const anularSolicitud = async (
  solicitudId: string,
  glosa: string
): Promise<{ status: boolean; message: string }> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Solicitud ${solicitudId} anulada con glosa: ${glosa}`);
    return {
      status: true,
      message: 'Solicitud anulada exitosamente',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error al anular la solicitud',
    };
  }
};
