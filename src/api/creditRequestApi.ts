import axios, { AxiosError } from 'axios';
import { CreditRequest } from '../types/creditRequest';
import { APIError } from '../utils/error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Función para obtener el token del localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Configuración de Axios para incluir el token en cada solicitud
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export const creditRequestApi = {
    // Obtener todas las solicitudes con paginación
    getAll: async (page: number = 1, limit: number = 12, sortBy: string = 'fecha', sortOrder: 'asc' | 'desc' = 'desc'): Promise<{
        total: number;
        solicitudes: CreditRequest[];
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }> => {
        try {
            // Validar parámetros
            const validPage = Math.max(1, page);
            const validLimit = Math.min(Math.max(1, limit), 50); // Límite máximo de 50 para performance
            
            const response = await axiosInstance.get('/api/solicitudes-credito', {
                params: {
                    page: validPage,
                    limit: validLimit,
                    sortBy,
                    sortOrder
                },
                timeout: 10000 // 10 segundos timeout
            });
            
            return {
                ...response.data,
                page: validPage,
                limit: validLimit
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.code === 'ECONNABORTED') {
                    throw new APIError('Tiempo de espera agotado al cargar solicitudes', 408);
                }
                throw new APIError(
                    error.response?.data?.message || 'Error al obtener las solicitudes',
                    error.response?.status
                );
            }
            throw new APIError('Error al obtener las solicitudes');
        }
    },

    // Obtener solicitudes por DNI
    getByDni: async (dni: string): Promise<{ total: number; solicitudes: CreditRequest[] }> => {
        try {
            const response = await axiosInstance.get(`/api/solicitudes-credito/dni/${dni}`);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new APIError(
                    'Error al obtener las solicitudes por DNI',
                    error.response?.status
                );
            }
            throw new APIError('Error al obtener las solicitudes por DNI');
        }
    },

    // Obtener solicitudes por estado con paginación
    getByStatus: async (
        status: CreditRequest['status'],
        page: number = 1,
        limit: number = 12,
        sortBy: string = 'fecha',
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<{
        total: number;
        solicitudes: CreditRequest[];
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }> => {
        try {
            // Validar parámetros
            const validPage = Math.max(1, page);
            const validLimit = Math.min(Math.max(1, limit), 50);
            
            const response = await axiosInstance.get(`/api/solicitudes-credito/estado/${status}`, {
                params: {
                    page: validPage,
                    limit: validLimit,
                    sortBy,
                    sortOrder
                },
                timeout: 10000
            });
            
            return {
                ...response.data,
                page: validPage,
                limit: validLimit
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.code === 'ECONNABORTED') {
                    throw new APIError('Tiempo de espera agotado al cargar solicitudes por estado', 408);
                }
                throw new APIError(
                    error.response?.data?.message || 'Error al obtener las solicitudes por estado',
                    error.response?.status
                );
            }
            throw new APIError('Error al obtener las solicitudes por estado');
        }
    },

    // Actualizar estado de atención
    updateAttentionStatus: async (id: string, estadoAtencion: CreditRequest['estadoAtencion']): Promise<CreditRequest> => {
        try {
            const response = await axiosInstance.put(`/api/solicitudes-credito/${id}/atencion`, { estadoAtencion });
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new APIError(
                    'Error al actualizar el estado de atención',
                    error.response?.status
                );
            }
            throw new APIError('Error al actualizar el estado de atención');
        }
    }
};