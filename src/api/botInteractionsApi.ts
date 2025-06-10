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

export const getBotInteractions = async () => {
  try {
    const response = await axiosInstance.get<{ success: boolean; data: BotInteraction[] }>(
      '/api/consultas-bot'
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener las interacciones del bot',
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