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
  }>;
  comprobantebase_64: string[]; // Actualizado a array de strings
  estado: string;
  motivo_rechazo?: string;
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
  name: string;
  lastName: string;
  dni: string;
  role: string;
  lastLogin: string;
  agencias?: AgenciaCaja[];
  status: UserStatus;
  statusText?: string;
  message?: string;  // Mensaje de respuesta del servidor
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
