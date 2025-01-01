import axios, { AxiosError } from 'axios';
import { PaymentRecord } from '../types';
import { APIError } from '../utils/error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchPayments = async (fechaInicio: string, fechaFin: string) => {
  try {
    const response = await axios.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `${API_BASE_URL}/api/comprobantes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
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

export const fetchPaymentsByDNI = async (dni: string) => {
  try {
    const response = await axios.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `${API_BASE_URL}/api/comprobantes/${dni}`
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
    const response = await axios.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `${API_BASE_URL}/api/comprobantes/estado/${status}`
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

export const fetchPaymentsByStatusAndDate = async (status: string, date: string) => {
  try {
    const response = await axios.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `${API_BASE_URL}/api/comprobantes/estado/${status}/fecha/${date}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al obtener los pagos por estado y fecha',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos por estado y fecha');
  }
};

export const updatePaymentStatus = async (dni: string, fecha: string, hora: string, nuevoEstado: string) => {
  try {
    const response = await axios.put<PaymentRecord>(
      `${API_BASE_URL}/api/comprobantes/${dni}`,
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
