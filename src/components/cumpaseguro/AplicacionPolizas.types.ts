/**
 * Tipos para el módulo de Aplicación de Pólizas (Mi CumpaSeguro)
 */

export interface TitularAplicacion {
  tipo_documento: string;
  nro_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  tipo_atencion?: string;
  costo?: number;
  direccion?: string;
  correo?: string;
  celular?: string;
  foto_dni_anverso?: string;
  foto_dni_reverso?: string;
  foto_dni_anverso_url?: string;
  foto_dni_reverso_url?: string;
}

export interface BeneficiarioAplicacion {
  tipo_documento: string;
  nro_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion?: string;
  correo?: string;
  celular?: string;
  foto_dni_anverso_url?: string;
  foto_dni_reverso_url?: string;
}

export interface FirmEasyData {
  status?: string;
  token?: string;
  signed_file?: string | null;
  message?: string | null;
  firm_aws?: string | null;
}

export interface FirmaData {
  dni?: string;
  id_asegurado?: string;
  firm_easy?: FirmEasyData;
}

export interface FirmaInfo {
  status?: boolean;
  message?: string;
  data?: FirmaData;
}

export interface VoucherDetail {
  key?: string;
  monto_pago?: number;
  nro_operacion?: string | null;
  nro_banco?: number;
  estado?: string;
  user_registra?: string;
  user_paga?: string | null;
  voucher_aws?: string | null;
}

export interface VoucherData {
  _id?: {
    $oid?: string;
  } | string;
  dni?: string;
  id_document?: string;
  voucher?: VoucherDetail;
  fecha_registro?: {
    $date?: {
      $numberLong?: string;
    };
  };
  fecha_local?: string;
  hora_local?: string;
  estado_general?: string;
}

export interface VoucherInfo {
  status?: boolean;
  code?: number;
  message?: string;
  data?: VoucherData;
}

export interface PolizaPorAplicar {
  _id: string;
  titular: TitularAplicacion;
  beneficiarios: BeneficiarioAplicacion[];
  user: string;
  agencia_nom: string;
  fecha_registro?: {
    $date?: {
      $numberLong?: string;
    };
  };
  fecha_local?: string;
  hora_local?: string;
  fecha_hora_local?: string;
  estado: string;
  fecha_vence?: string;
  firma?: FirmaInfo;
  voucher?: VoucherInfo;
}

export interface ListarPolizasPorAplicarResponse {
  status: boolean;
  message: string;
  cantidad: number;
  data: PolizaPorAplicar[];
}
