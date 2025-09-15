export interface PaymentRecord {
  _id: string;
  dni: string;
  nombreSocio: string;
  creditoId: string;
  cuotaSeleccionada: string;
  cuotasVencidasCantidad: string;
  cuotasVencidasTotalAPagar: string;
  comprobante: Array<{
    encryption_metadata: {
      encryption_key: string;
      hmac_key: string;
      iv: string;
      plaintext_hash: string;
      encrypted_hash: string;
      _id: string;
    };
    file_name: string;
    media_id: string;
    cdn_url: string;
    _id: string;
    estado: 'pendiente' | 'aceptado' | 'rechazado';
    motivo_rechazo?: string;
  }>;
  comprobantebase_64: Array<{
    ruta: string;
    estado: 'pendiente' | 'aceptado' | 'rechazado';
    motivo_rechazo?: string;
    _id?: string;
    nroOperacion?: string;
    nro_banco?: string;
    tipoOperacion?: string;
    monto_pago?: number;
  }>;
  estadoGeneral: 'pendiente' | 'parcial' | 'atendido';
  fecha: string;
  hora: string;
}

export interface AgenciaCaja {
  agencia: string;
  cod_caja: string;
  user_caja: string;
}

import { UserStatus } from './roles';

// Tipo base que incluye el texto del estado y mensaje
export interface UserResponse {
  _id: string;
  email: string;
  razon?: string;  // Nombre completo/razón social
  cargo?: string;  // Cargo del usuario
  user?: string;   // Usuario
  dni: string;
  role: string;
  lastLogin: string;
  agencias?: AgenciaCaja[];
  status: UserStatus;
  statusText?: string;
  message?: string;  // Mensaje de respuesta del servidor
  id_ana?: string;  // ID analista
  id_age?: string;  // ID agencia
}

// User hereda todo de UserResponse
export type User = UserResponse;

export const AGENCIAS = {
  "AGENCIA JULIACA": "07",
  "AGENCIA LIMA": "06",
  "AGENCIA QUILLABAMBA": "03",
  "AGENCIA SAN JERÓNIMO": "02",
  "AGENCIA SANTIAGO": "05",
  "AGENCIA SICUANI": "04",
  "AGENCIA TICA TICA": "08",
  "OFICINA PRINCIPAL": "01"
} as const;
