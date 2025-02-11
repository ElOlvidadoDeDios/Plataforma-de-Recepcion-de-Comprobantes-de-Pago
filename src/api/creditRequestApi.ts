import axios, { AxiosError } from 'axios';
import { CreditRequest } from '../types/creditRequest';
import { APIError } from '../utils/error';

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? 'http://localhost:3030' : import.meta.env.VITE_API_BASE_URL;

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

// Interceptor para manejar errores de CORS y otros errores comunes
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('Error de respuesta:', error.response.status);
        } else if (error.request) {
            console.error('Error de solicitud:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export const creditRequestApi = {
    // Obtener todas las solicitudes
    getAll: async (): Promise<{ total: number; solicitudes: CreditRequest[] }> => {
        try {
            const response = await axiosInstance.get('/api/solicitudes-credito');
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
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
                    error.response?.data?.message || 'Error al obtener las solicitudes por DNI',
                    error.response?.status
                );
            }
            throw new APIError('Error al obtener las solicitudes por DNI');
        }
    },

    // Obtener solicitudes por estado
    getByStatus: async (status: CreditRequest['status']): Promise<{ total: number; solicitudes: CreditRequest[] }> => {
        try {
            const response = await axiosInstance.get(`/api/solicitudes-credito/estado/${status}`);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
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
                    error.response?.data?.message || 'Error al actualizar el estado de atención',
                    error.response?.status
                );
            }
            throw new APIError('Error al actualizar el estado de atención');
        }
    }
};