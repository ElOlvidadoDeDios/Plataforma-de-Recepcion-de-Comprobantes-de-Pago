import { SessionManager } from '../utils/sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const UPLOAD_API_URL =
  import.meta.env.VITE_UPLOAD_API_URL

export interface CreateComprobantePayload {
  dni: string;
  creditoId: string;
  cuotaSeleccionada: string;
  cuotasVencidasCantidad: string;
  cuotasVencidasTotalAPagar: string;
  comprobantebase_64: Array<{
    ruta: string;
    _id: string;
    estado: 'pendiente' | 'aceptado' | 'rechazado';
    motivo_rechazo?: string;
    banco?: string;
    fecha_voucher?: string;
    fechamodificacion?: string;
    horamodificacion?: string;
    monto_pago?: string;
    nroOperacion?: string;
    nro_banco?: string;
    tipoOperacion?: string;
    user_caja?: string;
    origen?: string;
  }>;
  nombreSocio: string;
  estadoGeneral?: 'pendiente' | 'parcial' | 'atendido';
  fecha: string;
  hora: string;
  origen?: string;
}

interface VoucherUploadResponse {
  status: boolean;
  message?: string;
  UPLOAD_AWS?: {
    status: boolean;
    message: string;
    ruta_img: string;
  };
}

const getAuthHeaders = (): HeadersInit => {
  const token = SessionManager.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const uploadVoucherFileToCloud = async (
  file: File,
  dni: string,
  pagare: string,
  uniqueId?: string,
): Promise<string> => {
  const formData = new FormData();
  formData.append('PAGARE', pagare);
  formData.append('DNI_SOCIO', dni);

  const extension = file.name.includes('.')
    ? file.name.split('.').pop() || 'jpg'
    : 'jpg';
  const uniqueSuffix = uniqueId || Date.now().toString();
  const uniqueFileName = `${dni}-${pagare.replace(/\//g, '-')}-${uniqueSuffix}.${extension}`;

  formData.append('file', file, uniqueFileName);

  const response = await fetch(`${UPLOAD_API_URL}/api_mongo_firm_easy/api/pay_load_file`, {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as VoucherUploadResponse;

  if (!response.ok) {
    throw new Error(data.message || `Error HTTP ${response.status}`);
  }

  if (!data.status) {
    throw new Error(data.message || 'Error al subir el voucher');
  }

  if (!data.UPLOAD_AWS?.status || !data.UPLOAD_AWS?.ruta_img) {
    throw new Error(data.UPLOAD_AWS?.message || 'No se recibió la URL del voucher');
  }

  return data.UPLOAD_AWS.ruta_img;
};

export const uploadVoucherFilesToCloud = async (
  files: File[],
  dni: string,
  pagare: string,
): Promise<string[]> => {
  const urls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const url = await uploadVoucherFileToCloud(
      files[index],
      dni,
      pagare,
      `${Date.now()}-${index}`,
    );
    urls.push(url);
  }

  return urls;
};

export const createComprobantePago = async (
  payload: CreateComprobantePayload,
): Promise<{ success: boolean; message?: string; data?: unknown }> => {
  const response = await fetch(`${API_BASE_URL}/api/comprobantes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  return data;
};
