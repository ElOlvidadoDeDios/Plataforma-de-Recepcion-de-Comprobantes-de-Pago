import axios, { AxiosError } from 'axios';
import { PaymentRecord } from '../types';
import { APIError } from '../utils/error';
//import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.API_BASE_URL;

export const fetchPayments = async (fechaInicio: string, fechaFin: string) => {
  try {
    const response = await axios.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `${API_BASE_URL}/comprobantes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
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
export const DNIPayments = async (dni: string) => {
  try {
    const response = await axios.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `${API_BASE_URL}/comprobantes/${dni}}`,
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
export const updatePaymentStatus = async (dni: string, fecha: string, hora: string, nuevoEstado: string) => {
  try {
    const response = await axios.put<PaymentRecord>(
      `${API_BASE_URL}/comprobantes/${dni}`,
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
