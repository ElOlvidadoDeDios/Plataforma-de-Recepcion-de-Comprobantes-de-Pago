/**
 * Tipos para el módulo de listado de aseguramientos (Mi CumpaSeguro).
 * Basados en la estructura real que retorna el backend.
 */

export interface FechaMongo {
  $date: {
    $numberLong: string;
  };
}

export interface PersonaRegistro {
  tipo_documento: string;
  nro_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;

  // Estos campos solo vienen en el titular
  tipo_atencion?: string;
  costo?: number;

  direccion: string;
  correo: string;
  celular: string;

  foto_dni_anverso?: string;
  foto_dni_reverso?: string;
  voucher?: string;

  foto_dni_anverso_url?: string;
  foto_dni_reverso_url?: string;
  voucher_url?: string;
}

export type BeneficiarioRegistro = PersonaRegistro;

export type EstadoAseguramiento = 'INGRESADO' | 'APROBADO' | 'RECHAZADO' | string;

export interface RegistroAseguramiento {
  _id: string;
  titular: PersonaRegistro;
  beneficiarios: BeneficiarioRegistro[];
  fecha_registro: FechaMongo;
  fecha_local: string;
  hora_local: string;
  fecha_hora_local: string;
  estado: EstadoAseguramiento;
}

export interface ListadoAseguramientosResponse {
  status: boolean;
  message: string;
  cantidad: number;
  data: RegistroAseguramiento[];
}
