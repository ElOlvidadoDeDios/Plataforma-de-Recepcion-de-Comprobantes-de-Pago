import axios from 'axios';
import { SessionManager } from '../../../utils/sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== INTERFACES ====================

export interface Mensaje {
  _id: string;
  messageId: string;
  number: string;
  direction: 'inbound' | 'outbound';
  type: string;
  body: string;
  timestamp: number;
  createdAt: string;
}

export interface PaginationInfo {
  total: number;
  count: number;
  limit: number;
  hasMore: boolean;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}

export interface MensajesResponse {
  data: Mensaje[];
  pagination: PaginationInfo;
}

export interface ConversacionResponse {
  number: string;
  messages: Mensaje[];
  pagination: PaginationInfo;
}

export interface EstadisticasNumero {
  number: string;
  totalMensajes: number;
  mensajesRecibidos: number;
  mensajesEnviados: number;
  ultimoMensaje: Mensaje | null;
}

export interface QueryMensajesParams {
  number?: string;
  direction?: 'inbound' | 'outbound';
  limit?: number;
  page?: number;
  beforeTimestamp?: number;
  afterTimestamp?: number;
}

// ==================== FUNCIONES API ====================

const getToken = () => {
  return SessionManager.getItem('token');
};

const getAuthHeaders = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Obtener mensajes con paginación tradicional (por páginas)
 */
export const getMensajesPorPagina = async (
  params: QueryMensajesParams = {}
): Promise<MensajesResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mensajes-whatsapp`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener mensajes:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener mensajes');
  }
};

/**
 * Obtener mensajes con scroll infinito (timestamp-based)
 * Recomendado para UI tipo chat
 */
export const getMensajesConScroll = async (
  params: QueryMensajesParams = {}
): Promise<MensajesResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mensajes-whatsapp/scroll`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener mensajes con scroll:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener mensajes');
  }
};

/**
 * Obtener una conversación específica por número
 */
export const getConversacion = async (
  number: string,
  params: QueryMensajesParams = {}
): Promise<ConversacionResponse> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/mensajes-whatsapp/conversacion/${number}`,
      {
        headers: getAuthHeaders(),
        params,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener conversación:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener conversación');
  }
};

/**
 * Obtener lista de números activos (con conversaciones)
 */
export const getNumerosActivos = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mensajes-whatsapp/numeros-activos`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener números activos:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener números activos');
  }
};

/**
 * Obtener estadísticas de un número específico
 */
export const getEstadisticasNumero = async (number: string): Promise<EstadisticasNumero> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/mensajes-whatsapp/estadisticas/${number}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
  }
};

/**
 * Obtener información de debug de la conexión MongoDB (solo desarrollo)
 */
export const getDebugInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mensajes-whatsapp/debug/info`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener info de debug:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener info de debug');
  }
};
