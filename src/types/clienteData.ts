// Interfaces para datos del cliente completos
export interface ClienteCompleto {
  // Datos básicos
  DOC_IDEN: string;
  TIPO_IDEN: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRES: string;
  NVA_CTA: string;
  FECHA_NAC: string;
  LUGAR_NAC: string;
  TIPO_NAC: string;
  SEXO: string;
  TIPO_ECIV: string;
  TIPO_VIV: string;
  
  // Contacto - TELÉFONO SIEMPRE VA EL CELULAR PRINCIPAL
  TLF_CELULAR: string; // Este es el que va como "TELÉFONO" en los documentos
  TLF_CELULAR2?: string;
  TLF_CASA?: string;
  TLF_CASA2?: string;
  EMAIL: string;
  
  // Educación y profesión
  TIPO_INST: string;
  TIPO_PROF: string;
  OCUPACION: string;
  TIPO_ACTI: string;
  
  // Datos cooperativa
  TIPO_SOCIO: string;
  EST_SOCIO: string;
  TIPO_PERSONA: string;
  AGE: string;
  FECHA_APERT: string;
  
  // Usuario que registra
  COD_USER: string;
  
  // Situación del socio
  SITUACION?: string;
}

export interface eDireccionCompleta {
  CUENTA?: string;
  TIPO_DIR?: string;
  TIPO_VIA?: string;
  NOM_VIA?: string;
  NUMERO?: string;
  INTERIOR?: string;
  TIPO_ZONA?: string;
  NOM_ZONA?: string;
  REFERENCIA?: string;
  DPTO?: string;      // Departamento
  PROV?: string;      // Provincia  
  DIST?: string;      // Distrito
  TIPO_SECTOR?: string;
  DIRECCION?: string; // Dirección completa concatenada
}

export interface DatosUsuario {
  dni: string;
  user: string;
  razon?: string;
  id_age: string; // Para mapear a nombre de agencia
}

// Interface completa para generar documentos
export interface DatosCertificado {
  cliente: ClienteCompleto;
  direccion?: eDireccionCompleta;
  usuario: DatosUsuario;
  fechaEmision: Date;
  // ✅ Agregar campos para capturar analista original y agencia original
  codUserOriginal?: string; // COD_USER del analista que originalmente registró el socio
  ageOriginal?: string;     // AGE de la agencia donde originalmente se registró el socio
}