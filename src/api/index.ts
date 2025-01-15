import axios, { AxiosError } from 'axios';
import { PaymentRecord } from '../types';
import { APIError } from '../utils/error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Función para obtener el token del localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Configuración de Axios para incluir el token en cada solicitud
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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

export const fetchPaymentsByDNI = async (dni: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/${dni}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al obtener los pagos por DNI',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos por DNI');
  }
};


export const fetchPaymentsByStatus = async (status: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/estado/${status}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al obtener los pagos por estado',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos por estado');
  }
};

export const updatePaymentStatus = async (dni: string, fecha: string, hora: string, nuevoEstado: string) => {
  try {
    const response = await axiosInstance.put<PaymentRecord>(
      `/api/comprobantes/${dni}`,
      { fecha, hora, estado: nuevoEstado }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al actualizar el estado del pago',
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el estado del pago');
  }
};

export const fetchPayments = async (fechaInicio: string, fechaFin: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al obtener los pagos',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos');
  }
};
export const fetchPaymentByDNIAndTime = async (dni: string, fecha: string, hora: string) => {
  try {
    // Usar axiosInstance en lugar de axios directamente para mantener consistencia
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/${dni}/detalle`, // Ajusta esta ruta según tu API
      {
        params: {
          fecha,
          hora
        }
      }
    );

    if (response.data.comprobantes && response.data.comprobantes.length > 0) {
      const matchedPayment = response.data.comprobantes.find(
        (comprobante) => comprobante.fecha === fecha && comprobante.hora === hora
      );

      if (!matchedPayment) {
        throw new APIError('Comprobante no encontrado');
      }

      return matchedPayment;
    } else {
      throw new APIError('Comprobante no encontrado');
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al obtener el comprobante',
        error.response?.status
      );
    }
    throw error;
  }
};