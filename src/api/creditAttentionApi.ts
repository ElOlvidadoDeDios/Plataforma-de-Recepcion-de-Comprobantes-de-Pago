import axios from 'axios';
import { CreditAttentionResponse } from '../types/creditAttention';
import { SessionManager } from '../utils/sessionManager';

// Interfaces para gestión de mora
export interface AnalistaByAgencia {
  ID_ANA: string;
  CARGO: string;
  ANA_ACTUAL: string;
  AGENCIA: string;
}

export interface AdministradorInfo {
  NOM_ADMI: string;
  CARGO: string;
  AGENCIA: string;
}

export interface CreditoMora {
  CUENTA: string;
  OTORGA: string;
  PAGARE: string;
  SOCIO: string;
  SALDO_PRESENTE: string;
  DIAS_ATRASO: string;
  PRODUCTO: string;
  CUOTAS_PAGAR: number;
  POR_PAGAR: number;
  CELULAR: string;
}

export interface GestionMoraData {
  ID_GESTION: string | null;
  PERIODO: string | null;
  MOTIVO_RETRASO: string | null;
  COMPROMISO: string | null;
  FECHA_COMPROMISO: string | null;
  ESTADO: string | null;
}

export interface ClienteMora {
  CREDITO_MORA: CreditoMora;
  GESTION_MORA: GestionMoraData[];
}

// Interface para el registro de gestión de mora
export interface GestionMoraRequest {
  PAGARE: string;
  CUENTA: string;
  OTORGA: string;
  MOTIVO: string;
  COMPROMISO: string;
  FECHA_COMPROMISO: string;
  REGISTRADOR: string;
  NOMBRE_A: string;
  AGENCIA: string;
}

// Interface para la respuesta del registro de gestión de mora
export interface GestionMoraResponse {
  status: boolean;
  message: string;
}

// Interface para la consulta de gestión de mora 1x1
export interface GestionMora1x1Request {
  PAGARE: string;
  OTORGA: string;
  CUENTA: string;
  PERIODO: string;
}

// Interface para la respuesta de gestión de mora 1x1
export interface GestionMora1x1Response {
  GESTION_MORA: {
    ID_GESTION: string;
    PERIODO: string;
    MOTIVO_RETRASO: string;
    COMPROMISO: string;
    FECHA_COMPROMISO: string;
    ESTADO: string;
  };
}

// Interface para envío de mensajes WhatsApp
export interface WhatsAppMessageRequest {
  number: string;
  message: string;
  mediaUrl?: string; // Para incluir imagen/media
}

export interface WhatsAppMessageResponse {
  status: string;
  number?: string;
  message?: string;
  mediaUrl?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para incluir el token en cada solicitud
axiosInstance.interceptors.request.use(
    (config) => {
        const token = SessionManager.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const creditAttentionApi = {
    // Obtener historial por DNI de la solicitud
    getHistorialBySolicitudDni: async (dni: string): Promise<CreditAttentionResponse> => {
        try {
            const response = await axiosInstance.get(`/api/historial-atencion/solicitud/${dni}`);
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial de la solicitud');
        }
    },

    // Obtener historial por DNI del usuario que atendió
    getHistorialByUsuarioDni: async (dni: string): Promise<CreditAttentionResponse> => {
        try {
            const response = await axiosInstance.get(`/api/historial-atencion/usuario/${dni}`);
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial del usuario');
        }
    },

    getHistorialByEmail: async (
        email: string,
        fechaInicio?: string,
        fechaFin?: string
        ): Promise<CreditAttentionResponse> => {
        try {
            const params: any = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;

            const response = await axiosInstance.get(`/api/historial-atencion/usuario/${email}`, {
            params
            });
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial del usuario');
        }
    },

    getHistorialCompleto: async (
        fechaInicio?: string,
        fechaFin?: string
        ): Promise<CreditAttentionResponse> => {
        try {
            const params: any = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;

            const response = await axiosInstance.get(`/api/historial-atencion`, {
            params
            });
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial completo');
        }
    },

    // Obtener clientes en mora (ahora desde el backend)
    getClientesEnMora: async (periodo?: string): Promise<ClienteMora[]> => {
        try {
            const body = periodo ? { PERIODO: periodo } : {};
            const response = await axiosInstance.post('/auth/users/mora/current-user', body);
            return response.data;
        } catch (error: any) {
            if (error.response) {
            } else if (error.request) {
            } else {
            }

            throw new Error('Error al obtener clientes en mora');
        }
    },

    // Obtener clientes en mora para un analista específico
    getClientesEnMoraByAnalista: async (analistaData: {
        ID_ANA: string;
        CARGO: string;
        AGENCIA: string;
        PERIODO?: string; // Parámetro opcional para período específico
    }): Promise<ClienteMora[]> => {
        try {
            const response = await axiosInstance.post('/auth/users/mora/by-analyst', analistaData);
            return response.data;
        } catch (error: any) {
            if (error.response) {
            } else if (error.request) {
            } else {
            }

            throw new Error('Error al obtener clientes en mora del analista');
        }
    },

    // Guardar gestión de mora - Ahora usa ruta interna del backend
    saveGestionMora: async (gestionData: GestionMoraRequest): Promise<GestionMoraResponse> => {
        try {
            const response = await axiosInstance.post('/api/gestion-mora/save', gestionData);
            return response.data;
        } catch (error: any) {
            throw new Error('Error al guardar la gestión de mora');
        }
    },

    // Obtener analistas por agencia y período - Ahora usa ruta interna del backend
    getAnalistasByAgencia: async (periodo: string, agencia: string): Promise<AnalistaByAgencia[]> => {
        try {
            const response = await axiosInstance.post('/api/gestion-mora/analistas-by-agencia', {
                PERIODO: periodo,
                AGENCIA: agencia
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Error al obtener analistas por agencia');
        }
    },

    // Obtener lista de administradores - Ahora usa ruta interna del backend
    getAdministradores: async (): Promise<AdministradorInfo[]> => {
        try {
            const response = await axiosInstance.get('/api/gestion-mora/administradores');
            return response.data;
        } catch (error: any) {
            throw new Error('Error al obtener lista de administradores');
        }
    },

    // Obtener gestión de mora 1x1 - Consulta específica para un cliente
    getGestionMora1x1: async (gestionData: GestionMora1x1Request): Promise<GestionMora1x1Response> => {
        try {
            const response = await axiosInstance.post('/api/gestion-mora/get-gestion-mora-1x1', gestionData);
            return response.data;
        } catch (error: any) {
            throw new Error('Error al obtener gestión de mora 1x1');
        }
    },

    // Enviar mensaje de WhatsApp
    sendWhatsAppMessage: async (messageData: WhatsAppMessageRequest): Promise<WhatsAppMessageResponse> => {
        try {
            const response = await axiosInstance.post('/api/gestion-mora/send-media', messageData);
            return response.data;
        } catch (error: any) {
            throw new Error('Error al enviar mensaje de WhatsApp');
        }
    },

    // Enviar OTP por WhatsApp/Notificación
    sendOTPNotification: async (otpData: any): Promise<any> => {
        try {
            const response = await axiosInstance.post('/api/gestion-mora/send-OTP', otpData);
            return response.data;
        } catch (error: any) {
            throw new Error('Error al enviar OTP');
        }
    },

};