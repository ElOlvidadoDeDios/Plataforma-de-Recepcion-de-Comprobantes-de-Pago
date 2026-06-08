// Interfaces para OTP
export interface CreateOtpRequest {
  entidad_id: string;
  entidad_tipo: string;
  tipo_otp: string;
  canal_envio: 'EMAIL' | 'SMS' | 'WHATSAPP';
  destino_envio: string;
  max_intentos?: number;
  minutos_expiracion?: number;
  creado_por?: string;
  ip_creacion?: string;
  observacion?: string;
}

export interface CreateOtpResponse {
  status: boolean;
  message: string;
  data: {
    id_otp: string;
    codigo: string; // Solo para testing, en producción no se devuelve
    fecha_expiracion: string;
    intentos_restantes: number;
  };
}

export interface ValidateOtpRequest {
  entidad_id: string;
  entidad_tipo: string;
  tipo_otp: string;
  codigo: string;
}

export interface ValidateOtpResponse {
  status: boolean;
  message: string;
  data: {
    id_otp: string;
    entidad_id: string;
    tipo_otp: string;
  } | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Crea un código OTP para validación
 */
export const createOtpCode = async (request: CreateOtpRequest): Promise<CreateOtpResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating OTP:', error);
    return {
      status: false,
      message: 'Error al generar código OTP: ' + (error instanceof Error ? error.message : String(error)),
      data: {
        id_otp: '',
        codigo: '',
        fecha_expiracion: '',
        intentos_restantes: 0
      }
    };
  }
};

/**
 * Valida un código OTP
 */
export const validateOtpCode = async (request: ValidateOtpRequest): Promise<ValidateOtpResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating OTP:', error);
    return {
      status: false,
      message: 'Error al validar código OTP: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    };
  }
};
