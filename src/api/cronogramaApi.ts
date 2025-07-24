import axios, { AxiosError } from 'axios';
import { APIError } from '../utils/error';

export interface CuotaCronograma {
  NUMERO_CUOTA: string;
  FECHA_VENCIMIENTO: string;
  FECHA_PAGO: string;
  DIAS_MORA: number;
  CUOTA_TOTAL: string;
  PAGO_CAPITAL: string;
  PAGO_INTERES: string;
  DESGRAVAMEN: string;
  SEGURO: string;
  SALDO_PROYECTADO: string;
  ESTADO: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Configuración de Axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const getCronograma = async (idPrestamo: string): Promise<CuotaCronograma[]> => {
  try {
    const response = await axiosInstance.post('/api/cronograma', {
      pagare: idPrestamo
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener el cronograma',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener el cronograma');
  }
};


export interface MovimientoPrestamo  {
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
    GLOSA: string;
};
export const getMovimientosPrestamo = async (
  pagare: string,
  cuenta: string,
  otorga: string
): Promise<MovimientoPrestamo[]> => {
  try {
    const response = await axiosInstance.post('/api/movimiento-prestamo', {
      pagare,
      cuenta,
      otorga,
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener los movimientos del préstamo',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener los movimientos del préstamo');
  }
};