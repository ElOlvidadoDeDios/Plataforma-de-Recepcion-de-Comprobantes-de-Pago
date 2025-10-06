import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';
import { APIError } from '../utils/error';
import { SessionManager } from '../utils/sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;

const getToken = () => {
  return SessionManager.getItem('token');
};

const notificacionesApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

notificacionesApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      logger.error('❌ Notifications Request error:', error);
    }
    return Promise.reject(error);
  }
);

notificacionesApiInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      logger.log('✅ Notifications Response:', {
        url: response.config.url,
        status: response.status
      });
    }
    return response;
  },
  async (error) => {
    if (import.meta.env.DEV && error.response?.status !== 401) {
      logger.error('❌ Notifications Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message
      });
    }

    if (error.response?.status === 403) {
      SessionManager.removeItem('token');
      SessionManager.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interfaces para las notificaciones
export interface DetalleGestion {
  ID_DETALLE: string;
  MOTIVO_RETRASO: string;
  COMPROMISO: string;
  FECHA_COMPROMISO: string;
  RESPONSABLE: string;
  AGENCIA: string;
  ESTADO: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export interface NotificacionGestionDiaria {
  PAGARE: string;
  CUENTA: string;
  OTORGA: string;
  PERIODO: string;
  DETALLE_GESTION: DetalleGestion;
}

export interface NotificacionesResponse {
  status: boolean;
  message?: string;
  data?: NotificacionGestionDiaria[];
}

// Función para obtener las notificaciones de gestión diaria
export const fetchNotificacionesDayManagement = async (responsable?: string, agencia?: string): Promise<NotificacionesResponse> => {
  try {
    // Limpiar el nombre del responsable (quitar comas y espacios extra)
    const responsableLimpio = responsable ? responsable.replace(/,/g, '').trim() : '';
    
    const requestBody = {
      RESPONSABLE: responsableLimpio,
      AGENCIA: agencia || ''
    };
    
    const response = await notificacionesApiInstance.post<NotificacionGestionDiaria[] | NotificacionesResponse>(
      '/api_mongo_firm_easy/api/notificacitonDayManagement',
      requestBody
    );

    // Si la respuesta es un array directamente (hay datos)
    if (Array.isArray(response.data)) {
      return {
        status: true,
        data: response.data
      };
    }

    // Si la respuesta es un objeto con status false (no hay datos)
    if (response.data && typeof response.data === 'object' && 'status' in response.data) {
      return response.data as NotificacionesResponse;
    }

    // Fallback para respuestas inesperadas
    return {
      status: false,
      message: 'NO SE ENCONTRO INFORMACION'
    };

  } catch (error) {
    if (error instanceof AxiosError) {
      // Si es un 404, no hay notificaciones
      if (error.response?.status === 404) {
        return {
          status: false,
          message: 'NO SE ENCONTRO INFORMACION'
        };
      }

      // Otros errores HTTP
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          'Error al obtener notificaciones';
      
      throw new APIError(errorMessage, error.response?.status);
    }
    
    // Error de red u otros
    throw new APIError('Error de conexión al obtener notificaciones');
  }
};

// Función para marcar una notificación como vista (si es necesario en el futuro)
export const markNotificationAsRead = async (idDetalle: string): Promise<void> => {
  try {
    await notificacionesApiInstance.patch(`notificaciones/${idDetalle}/read`);
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || 'Error al marcar notificación como leída';
      throw new APIError(errorMessage, error.response?.status);
    }
    throw new APIError('Error al marcar notificación como leída');
  }
};

// Función para obtener el conteo de notificaciones pendientes
export const getNotificacionesCount = async (responsable?: string, agencia?: string): Promise<number> => {
  try {
    const notificaciones = await fetchNotificacionesDayManagement(responsable, agencia);
    
    if (notificaciones.status && notificaciones.data) {
      return notificaciones.data.length;
    }
    
    return 0;
  } catch (error) {
    logger.error('Error al obtener conteo de notificaciones:', error);
    return 0;
  }
};