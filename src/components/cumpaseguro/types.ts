export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE';
export type TipoAtencion = 'Presencial' | 'Virtual';

export interface PersonaData {
  tipoDoc: TipoDocumento;
  dni: string;
  nombre: string;
  apePaterno: string;
  apeMaterno: string;
  direccion: string;
  tipoAtencion: TipoAtencion | '';
  costo: string;
  correo: string;
  celular: string;
  sinDocumento?: boolean; // Para cuando no tiene DNI físico
  fotoDniAnverso: File | null;
  fotoDniReverso: File | null;
  fotoVoucher: File | null;
  fotoSustento: File | null; // Documento de sustentación cuando sinDocumento es true
  fotoDniAnversoPreview: string;
  fotoDniReversoPreview: string;
  fotoVoucherPreview: string;
  fotoSustentoPreview?: string;
}

export type PersonaErrors = Partial<Record<keyof PersonaData, string>>;

export const crearPersonaVacia = (): PersonaData => ({
  tipoDoc: 'DNI',
  dni: '',
  nombre: '',
  apePaterno: '',
  apeMaterno: '',
  direccion: '',
  tipoAtencion: '',
  costo: '',
  correo: '',
  celular: '',
  sinDocumento: false,
  fotoDniAnverso: null,
  fotoDniReverso: null,
  fotoVoucher: null,
  fotoSustento: null,
  fotoDniAnversoPreview: '',
  fotoDniReversoPreview: '',
  fotoVoucherPreview: '',
  fotoSustentoPreview: '',
});

export interface AseguramientoPayload {
  titular: PersonaData;
  beneficiario: PersonaData | null;
  fechaRegistro: string; // ISO 8601
  user: string; // DNI del usuario que registra
  agencia_nom: string; // Nombre de la agencia
}

export interface AseguramientoResponse {
  success: boolean;
  codigo: string;
  fechaRegistro: string; // ISO 8601, confirmada por el servicio
}

/**
 * Interface para las pólizas de seguro en gestión
 */
export interface Poliza {
  _id: string;
  titular: {
    tipo_documento: string;
    nro_documento: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    tipo_atencion: string;
    costo: number;
    direccion: string;
    correo: string;
    celular: string;
    foto_dni_anverso_url?: string;
    foto_dni_reverso_url?: string;
  };
  beneficiarios: any[];
  user: string;
  agencia_nom: string;
  fecha_local: string;
  hora_local: string;
  fecha_hora_local: string;
  estado: string;
  firma?: {
    status: boolean;
    message: string;
    data?: {
      dni: string;
      id_asegurado: string;
      firm_easy: {
        status: string; // "pending", "signed", etc.
        token: string;
        signed_file: string | null;
        message: string | null;
        firm_aws: string | null; // URL de AWS S3
      };
    };
    error?: string | null;
  };
  contrato_url?: string;
  voucher_url?: string;
  voucher?: {
    status: boolean;
    code: number;
    message: string;
    data?: {
      dni: string;
      id_document: string;
      voucher?: {
        key: string;
        monto_pago: number;
        nro_operacion: string | null;
        nro_banco: number;
        estado: string;
        user_registra: string;
        user_paga: string | null;
        voucher_aws: string;
      };
      fecha_registro: any;
      fecha_local: string;
      hora_local: string;
      estado_general: string;
    };
  };
}