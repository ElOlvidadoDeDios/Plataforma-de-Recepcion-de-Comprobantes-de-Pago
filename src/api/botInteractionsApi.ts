import axios, { AxiosError } from 'axios';
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

export interface BotInteraction {
  _id: string;
  phone_number: string;
  tipo: string;
  status: string;
  dni: string;
  fecha: string;
  hora: string;
}

export const getBotInteractions = async (params?: {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  tipo?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  success: boolean;
  data: BotInteraction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) queryParams.append('fechaFin', params.fechaFin);
    if (params?.dni) queryParams.append('dni', params.dni);
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = params ? `/api/consultas-bot?${queryParams.toString()}` : '/api/consultas-bot';
    
    const response = await axiosInstance.get<{
      success: boolean;
      data: BotInteraction[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>(url, {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        throw new APIError('Tiempo de espera agotado al cargar interacciones del bot', 408);
      }
      throw new APIError(
        error.response?.data?.message || 'Error al obtener las interacciones del bot',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener las interacciones del bot');
  }
};

export const getBotInteractionsByDni = async (dni: string) => {
  try {
    const response = await axiosInstance.get<{ success: boolean; data: BotInteraction[] }>(
      `/api/consultas-bot/dni/${dni}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return { success: true, data: [] };
    }
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener las interacciones del bot por DNI',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener las interacciones del bot por DNI');
  }
};