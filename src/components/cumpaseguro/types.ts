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
  fotoDniAnverso: File | null;
  fotoDniReverso: File | null;
  fotoVoucher: File | null;
  fotoDniAnversoPreview: string;
  fotoDniReversoPreview: string;
  fotoVoucherPreview: string;
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
  fotoDniAnverso: null,
  fotoDniReverso: null,
  fotoVoucher: null,
  fotoDniAnversoPreview: '',
  fotoDniReversoPreview: '',
  fotoVoucherPreview: '',
});

export interface AseguramientoPayload {
  titular: PersonaData;
  beneficiario: PersonaData | null;
  fechaRegistro: string; // ISO 8601
}

export interface AseguramientoResponse {
  success: boolean;
  codigo: string;
  fechaRegistro: string; // ISO 8601, confirmada por el servicio
}