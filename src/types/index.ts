export interface PaymentRecord {
  _id: string;
  dni: string;
  nombre: string;
  apellido: string;
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
  comprobantebase_64: string;
  estado: string;
  fecha: string;
  hora: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  lastName: string;
  dni: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string;
  isEmailBlocked?: boolean;
}
