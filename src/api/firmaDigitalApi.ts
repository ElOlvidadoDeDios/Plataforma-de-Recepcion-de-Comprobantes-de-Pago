// API para manejo de firma digital

interface GenerarContratoRequest {
  PAGARE: string;
  DNI: string;
  TIPO_DOC: string;
}

interface VerificarDocumentoRequest {
  ID_DOCUMENT_FIRM: string;
  PAGARE: string;
  AGENCIA: string;
}

interface ObtenerUrlFirmadaRequest {
  URL: string;
}

interface GenerarContratoResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface VerificarDocumentoResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface ObtenerUrlFirmadaResponse {
  success: boolean;
  data?: any;
  message?: string;
  url?: string;
}

// Usar la misma base URL que el resto de la aplicación
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AGENCY_API_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;

export const generarContrato = async (data: GenerarContratoRequest): Promise<GenerarContratoResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/firma-digital/generar-contrato`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

export const obtenerUrlFirmada = async (data: ObtenerUrlFirmadaRequest): Promise<ObtenerUrlFirmadaResponse> => {
  try {
    const response = await fetch(`${AGENCY_API_URL}/api_mongo_firm_easy/api/FirmPreAwsFirmeasy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    // El endpoint retorna directamente la URL como string, no como JSON
    const urlString = await response.text();
    
    // Limpiar la URL: remover barras invertidas escapadas, comillas y espacios
    const cleanUrl = urlString
      .replace(/\\\//g, '/')     // Convertir \/ a /
      .replace(/\\/g, '')        // Remover otras barras invertidas
      .replace(/"/g, '')         // Remover comillas
      .trim();                   // Remover espacios

    // Si el endpoint responde con 200, consideramos que es exitoso
    return {
      success: true,
      data: cleanUrl,
      url: cleanUrl
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

export const verificarDocumentoFirmado = async (data: VerificarDocumentoRequest): Promise<VerificarDocumentoResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/firma-digital/verificar-documento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};