// API para manejo de firma digital

interface GenerarContratoRequest {
  PAGARE: string;
  DNI: string;
}

interface VerificarDocumentoRequest {
  ID_DOCUMENT_FIRM: string;
  PAGARE: string;
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

// Usar la misma base URL que el resto de la aplicación
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      throw new Error(`Error en la generación del contrato: ${response.status}`);
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
      throw new Error(`Error en la verificación del documento: ${response.status}`);
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