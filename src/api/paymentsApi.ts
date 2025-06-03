import axios, { AxiosError } from 'axios';
import { PaymentRecord } from '../types';
import { APIError } from '../utils/error';

export interface PaymentHistoryRecord {
  fecha_pago: string;
  dni_usuario: string;  
  hora_pago: string;
  monto: number;
  agencia: string;
  estado: 'aceptado' | 'rechazado';
  motivo_rechazo?: string;
  comprobante: {
    dni: string;
    nombreSocio: string;
    creditoId: string;
    cuotaSeleccionada: string;
    comprobantebase_64: string[], // Actualizado a array de strings
    fecha_comprobante: string;
    hora_comprobante: string;
    estado_anterior: string;
  }
}

export interface PaymentHistoryResponse {
  success: boolean;
  message: string;
  data: PaymentHistoryRecord[];
}

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

// Función auxiliar para asegurar que comprobantebase_64 sea siempre un array
const normalizePaymentRecord = (payment: PaymentRecord): PaymentRecord => {
  if (!payment.comprobantebase_64) {
    payment.comprobantebase_64 = [];
  } else if (!Array.isArray(payment.comprobantebase_64)) {
    payment.comprobantebase_64 = [payment.comprobantebase_64];
  }
  return payment;
};

// Función auxiliar para normalizar un array de PaymentRecord
const normalizePaymentRecords = (payments: PaymentRecord[]): PaymentRecord[] => {
  return payments.map(normalizePaymentRecord);
};

export const fetchPaymentsByDNI = async (dni: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/${dni}`
    );
    response.data.comprobantes = normalizePaymentRecords(response.data.comprobantes);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los pagos por DNI',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos por DNI');
  }
};

export const fetchPaymentsByStatus = async (status: 'pendiente' | 'parcial' | 'atendido') => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/estadoGeneral/${status}`
    );
    response.data.comprobantes = normalizePaymentRecords(response.data.comprobantes);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los pagos por estado',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos por estado');
  }
};

export const fetchPendingPaymentsByPagare = async (creditoId: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/pagare/${creditoId}/pendientes`
    );
    return normalizePaymentRecords(response.data.comprobantes);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los pagos pendientes del pagaré',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos pendientes del pagaré');
  }
};

export const updatePaymentStatus = async (
  dni: string,
  fecha: string,
  hora: string,
  nuevoEstado: string,
  motivo_Rechazo?: string,
  agenciaData?: { agencia: string; cod_caja: string; user_caja: string } | null,
  monto?: number | null,
  dni_usuario?: string,
  email?: string,
  indice: number = 0
) => {
  try {
    const requestBody = {
      fecha,
      hora,
      estado: nuevoEstado,
      motivo_rechazo: motivo_Rechazo || null,
      monto: nuevoEstado === 'aceptado' ? monto : null,
      indice,
      userData: {
        ...(agenciaData && {
          agencia: agenciaData.agencia,
          cod_caja: agenciaData.cod_caja,
          user_caja: agenciaData.user_caja,
        }),
        dni_usuario,
        email
      }
    };

    console.log('Enviando al backend:', requestBody);
    
    const response = await axiosInstance.put<PaymentRecord>(
      `/api/comprobantes/${dni}`,
      requestBody
    );
    const message = nuevoEstado === 'aceptado' ?
      'Pago procesado exitosamente' :
      'Comprobante actualizado';
    return { ...normalizePaymentRecord(response.data), message };
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error detallado:', error.response?.data);
      throw new APIError(
        `Error al actualizar el estado del pago: ${errorMessage}`,
        error.response?.status
      );
    }
    console.error('Error no-Axios:', error);
    throw new APIError('Error al actualizar el estado del pago');
  }
};

export const fetchPayments = async (fechaInicio: string, fechaFin: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );
    response.data.comprobantes = normalizePaymentRecords(response.data.comprobantes);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los pagos',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos');
  }
};

export const fetchPaymentByDNIAndTime = async (dni: string, fecha: string, hora: string) => {
  try {
    const response = await axiosInstance.get<{ total: number; comprobantes: PaymentRecord[] }>(
      `/api/comprobantes/${dni}/detalle`,
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

      return normalizePaymentRecord(matchedPayment);
    } else {
      throw new APIError('Comprobante no encontrado');
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener el comprobante',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener el comprobante');
  }
};

export const fetchPaymentHistory = async (params: {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  estado?: 'aceptado' | 'rechazado';
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
    if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
    if (params.dni) queryParams.append('dni', params.dni);
    if (params.estado) queryParams.append('estado', params.estado);

    const response = await axiosInstance.get<PaymentHistoryResponse>(
      `/api/comprobantes/historial-pagos?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener el historial de pagos',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener el historial de pagos');
  }
};

export const procesarInfoPago = async (pagare: string, dni_socio: string) => {
  try {
    const response = await axiosInstance.post('/api/comprobantes/procesar-info-pago', {
      pagare,
      dni_socio
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al procesar información del pagaré',
        error.response?.status
      );
    }
    throw new APIError('Error al procesar información del pagaré');
  }
};