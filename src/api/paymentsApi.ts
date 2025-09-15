import axios, { AxiosError } from 'axios';
import { PaymentRecord } from '../types';
import { APIError } from '../utils/error';
import { SessionManager } from '../utils/sessionManager';
const API_BASE_URL_GEO = import.meta.env.VITE_API_BASE_URL_GEODILE ;
const URL_GEODILE_TOKEN = ` ${import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN}`;
export interface PaymentHistoryRecord {
  email: string;
  dni_usuario: string;
  fecha_pago: string;
  hora_pago: string;
  monto: number;
  agencia: string;
  cod_caja: string; // ✅ Agregado: Código de caja
  user_caja: string; // ✅ Agregado: Usuario de caja
  tipo_pago: string;
  tipo_operacion: 'aceptacion_total' | 'rechazo_total' | 'rechazo_parcial' | 'modificacion_parcial';
  estadoGeneral_anterior: string;
  estadoGeneral_final: string;
  monto_total_operacion: number;
  comprobante: {
    dni: string;
    nombreSocio: string;
    creditoId: string;
    fecha_comprobante: string;
    hora_comprobante: string;
    vouchers_modificados: Array<{
      indice: number;
      estado_anterior: string;
      estado_nuevo: string;
      nroOperacion: string;
      tipoOperacion: string;
      nro_banco: string;
      motivo_rechazo?: string;
      monto_pago: number;
      ruta_comprobante: string;
    }>;
  };
}

export interface PaymentHistoryResponse {
  success: boolean;
  message: string;
  data: PaymentHistoryRecord[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Función para obtener el token usando SessionManager
const getToken = () => {
  return SessionManager.getItem('token');
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

export const fetchPaymentsByStatus = async (
  status: 'pendiente' | 'parcial' | 'atendido',
  page: number = 1,
  limit: number = 12,
  sortBy: string = 'fecha',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  success: boolean;
  comprobantes: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  try {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 50);

    const response = await axiosInstance.get<{
      success: boolean;
      comprobantes: PaymentRecord[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>(`/api/comprobantes/estadoGeneral/${status}`, {
      params: {
        page: validPage,
        limit: validLimit,
        sortBy,
        sortOrder
      },
      timeout: 10000
    });

    if (response.data.comprobantes) {
      response.data.comprobantes = normalizePaymentRecords(response.data.comprobantes);
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        throw new APIError('Tiempo de espera agotado al cargar pagos por estado', 408);
      }
      throw new APIError(
        error.response?.data?.message || 'Error al obtener los pagos por estado',
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
      throw new APIError(
        `Error al actualizar el estado del pago: ${errorMessage}`,
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el estado del pago');
  }
};

export const fetchPayments = async (params: {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  estado?: 'pendiente' | 'parcial' | 'atendido';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  success: boolean;
  comprobantes: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  try {
    const validPage = Math.max(1, params.page || 1);
    const validLimit = Math.min(Math.max(1, params.limit || 12), 50);

    const queryParams = new URLSearchParams();
    if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
    if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
    if (params.dni) queryParams.append('dni', params.dni);
    if (params.estado) queryParams.append('estado', params.estado);
    queryParams.append('page', validPage.toString());
    queryParams.append('limit', validLimit.toString());
    queryParams.append('sortBy', params.sortBy || 'fecha');
    queryParams.append('sortOrder', params.sortOrder || 'desc');

    const response = await axiosInstance.get<{
      success: boolean;
      comprobantes: PaymentRecord[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>(`/api/comprobantes?${queryParams.toString()}`, {
      timeout: 10000
    });

    if (response.data.comprobantes) {
      response.data.comprobantes = normalizePaymentRecords(response.data.comprobantes);
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        throw new APIError('Tiempo de espera agotado al cargar pagos', 408);
      }
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
  estado?: 'aceptacion_total' | 'rechazo_total' | 'rechazo_parcial';
  tipoPago?: string;
  usuarioFiltro?: string; // 🔧 Nuevo parámetro para filtrar por usuario que procesó
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaymentHistoryResponse & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
    if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
    if (params.dni) queryParams.append('dni', params.dni);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.tipoPago) queryParams.append('tipoPago', params.tipoPago);
    if (params.usuarioFiltro) queryParams.append('usuario', params.usuarioFiltro); // 🔧 Filtro por usuario
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await axiosInstance.get<PaymentHistoryResponse & {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>(`/api/comprobantes/historial-pagos?${queryParams.toString()}`);
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        throw new APIError('Tiempo de espera agotado al cargar historial de pagos', 408);
      }
      throw new APIError(
        error.response?.data?.message || 'Error al obtener el historial de pagos',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener el historial de pagos');
  }
};

// 🆕 API específica para reportes - SIN PAGINACIÓN
export const fetchPaymentHistoryForReport = async (params: {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  estado?: 'aceptacion_total' | 'rechazo_total' | 'rechazo_parcial';
  tipoPago?: string;
  agencia?: string;
  usuario?: string;
}): Promise<PaymentHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
    if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
    if (params.dni) queryParams.append('dni', params.dni);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.tipoPago) queryParams.append('tipoPago', params.tipoPago);
    if (params.agencia) queryParams.append('agencia', params.agencia);
    if (params.usuario) queryParams.append('usuario', params.usuario);

    const response = await axiosInstance.get<PaymentHistoryResponse>(
      `/api/comprobantes/reportes/historial-pagos?${queryParams.toString()}`
    );
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al generar reporte de historial de pagos',
        error.response?.status
      );
    }
    throw new APIError('Error al generar reporte de historial de pagos');
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

export const procesarComprobantesMasivo = async (data: {
  montoTotal: string;
  userData: {
    agencia: string;
    cod_caja: string;
    user_caja: string;
    email: string;
    dni_usuario: string;
  };
  vouchers: Array<{
    identificacion: {
      creditoId: string;
      dni: string;
      fecha: string;
      hora: string;
      estadoGeneral: string;
    };
    detalles: Array<{
      indice: number;
      montoPago: string;
      nroOperacion: string;
      tipoOperacion: string;
      nro_banco: string;
      estado: string;
      _id: string;
      motivo_rechazo?: string;
    }>;
  }>;
}) => {
  try {
    const response = await axiosInstance.post('/api/comprobantes/procesar-masivo', data);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Extraer mensaje específico del backend
      const backendMessage = error.response?.data?.message ||
                           error.response?.data?.error ||
                           'Error al procesar comprobantes masivos';
      
      throw new APIError(
        backendMessage,
        error.response?.status
      );
    }
    throw new APIError('Error al procesar comprobantes masivos');
  }
};

// Obtener todos los pagos de un préstamo específico
export const getPaymentsByCreditoId = async (creditoId: string) => {
  try {
    const response = await axiosInstance.get<{
      success: boolean;
      count: number;
      data: PaymentRecord[];
      creditoId: string
    }>(`/api/comprobantes/pagare/${creditoId}/todos`);
    
    if (response.data.data) {
      response.data.data = normalizePaymentRecords(response.data.data);
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los pagos del préstamo',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los pagos del préstamo');
  }
};



// reporte de movimientos diarios
export interface MovimientoPrestamoDiario {
  FECHA_MOV: string;
  COD_AGENCIA: string;
  COD_CAJA: string;
  NRO_DOC: string;
  CAPITAL: string;
  INTERES: string;
  MORA: string;
  SEGURO: string;
  PORTES: string;
  DESGRAV: string;
  APORTE: string;
  TOTAL: string;
  MONEDA: string;
  TIPO_PAGO: string;
}

export const getMovimientosDiarios = async (
  fecha: string,
  caja: string,
  agencia: string
): Promise<MovimientoPrestamoDiario[]> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL_GEO}/api_app_dile_v1_1/api/diario_caja_x_dia`,
      {
        fecha,
        caja,
        agencia,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${URL_GEODILE_TOKEN}`,

        },
      }
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los movimientos diarios de caja',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los movimientos diarios de caja');
  }
};