import axios from 'axios';
import { CreditAttentionResponse } from '../types/creditAttention';
//import { get } from 'http';

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
        const token = localStorage.getItem('token');
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

};