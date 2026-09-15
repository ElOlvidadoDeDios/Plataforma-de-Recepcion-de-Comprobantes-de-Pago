export interface DileScoreInputData {
  DNI: string;
  MONTO_PRESTAMO: string;
  CUOTAS: string;
  CUOTA_FIJA: string;
  FINALIDAD_PRESTAMO: string;
  TIPO_DESTINO: string;
  SUBTIPO_PRES: string;
  TIPO_PRODUCTO: string;
  FRECUENCIA_PAGO: string;
  AGENCIA_NOMBRE: string;
}

export interface DileScoreAutoData {
  TIPO_SOCIO: string;
  RAZON_SOCIAL: string;
  MESES_ANTIGUEDAD: string;
  EDAD_ANIOS: string;
  LUGAR_NAC: string;
  TIPO_PERSONA: string;
  TIPO_VIVIENDA: string;
  ESTADO_CIVIL: string;
  NIVEL_INSTRUCCION: string;
  PROFESION: string;
  NACIONALIDAD: string;
  ACTIVIDAD_ECONOMICA: string;
  TIENE_AHORRO: string;
}

export interface DileScoreDocInfoRequest {
  tipo_doc: string;
  nro_doc: string;
}

export interface DileScoreDocInfoResponse {
  status: boolean;
  message: string;
  data?: {
    status?: boolean;
    message?: string;
    data?: {
      NOM_TSOCIO?: string;
      RAZON_SOCIAL?: string;
      MESES_ANTIGUEDAD?: string;
      EDAD_ANIOS?: string;
      LUGAR_NAC?: string;
      NOM_TPERSONA?: string;
      NOM_VIVIENDA?: string;
      NOM_ECIVIL?: string;
      NOM_TINSTRUC?: string;
      NOM_TPROF?: string;
      NOM_NAC?: string;
      NOM_ACTI?: string;
      TIENE_AHORRO?: string;
      NOM_DI?: string;
      SCORE?: number;
      Nro_Entidades_SBS?: number;
      Total_Nro_Ent_R?: number;
      Total_Nro_Ent_NR_Microf?: number;
      Deuda_SBS_Microf?: number;
      Cob_Judicial_SBS?: number;
      Deuda_Castigada_SBS?: number;
      Cta_CorrienteCerrada?: number;
      TarjetaCreditoCerrada?: number;
      Calificacion_SBS?: string;
      Calificacion_SBS_Microf?: string;
      'Calificacion_SBS.1'?: string;
      Calificacion_NR_Microf?: string;
      [key: string]: string | number | null | undefined;
    };
  };
}

export interface DileScoreDocQueryResult {
  autoData: DileScoreAutoData;
  supplementalData: Record<string, string | number | null>;
}

export interface DileScoreRequest {
  dni: string;
  inputData?: DileScoreInputData;
  autoData?: DileScoreAutoData;
}

export interface DileScorePayloadDatosSolicitante {
  TIPO_SOCIO: string;
  MESES_ANTIGUEDAD: number;
  EDAD_ANIOS: number;
  LUGAR_NAC: string;
  TIPO_PERSONA: string;
  TIPO_VIVIENDA: string;
  ESTADO_CIVIL: string;
  NIVEL_INSTRUCCION: string;
  PROFESION: string;
  NACIONALIDAD: string;
  ACTIVIDAD_ECONOMICA: string;
  TIENE_AHORRO: number;
  Tipo_Documento: string;
  TDOC: string;
  MONTO_PRESTAMO: number;
  CUOTAS: number;
  CUOTA_FIJA: number;
  TIPO_PRES: string;
  FINALIDAD_PRESTAMO: string;
  TIPO_DESTINO: string;
  SUBTIPO_PRES: string;
  TIPO_PRODUCTO: string;
  FRECUENCIA_PAGO: string;
  AGENCIA_NOMBRE: string;
  TIPO_NVORECU: string;
  PERIODO: number;
  SCORE: number | null;
  Nro_Entidades_SBS: number;
  Total_Nro_Ent_R: number;
  Total_Nro_Ent_NR_Microf: number;
  Deuda_SBS_Microf: number;
  Cob_Judicial_SBS: number;
  Deuda_Castigada_SBS: number;
  Cta_CorrienteCerrada: number;
  TarjetaCreditoCerrada: number;
  Calificacion_SBS: string;
  Calificacion_SBS_Microf: string;
  'Calificacion_SBS.1': string;
  Calificacion_NR_Microf: string;
  [key: string]: string | number | null;
}

export interface DileScorePayload {
  dni: string;
  producto: string;
  datos_solicitante: DileScorePayloadDatosSolicitante;
}

export type ScoreNivel = 'ALTO' | 'MEDIO' | 'BAJO';

export interface DileScoreResult {
  dni: string;
  score: number;
  nivel: ScoreNivel;
  recomendacion: string;
  fechaConsulta: string;
}


// datos necesarios para obtner el score 
/*{
  "dni": "70123456", //NDoc - experin - dni ingreso
  "producto": "MAS_INCLUSIVO", //MAS_INCLUSIVO_SEMANAL
  "datos_solicitante": {
    "TIPO_SOCIO": "SOCIO NORMAL", //default
    "MESES_ANTIGUEDAD": 18,//calcular si es nuevo o recurrente, desde el primer crédito
    "EDAD_ANIOS": 34,//calcular con fecha nacimiento
    "LUGAR_NAC": "CUSCO", //lugar donde nace
    "TIPO_PERSONA": "NATURAL", //naturla o juridico
    "TIPO_VIVIENDA": "PROPIA", //PROPIA, ALQUILADA, FAMILIAR
    "ESTADO_CIVIL": "Casado (a)", //SOLTERO - CASADO - DIVORCIADO - 
    "NIVEL_INSTRUCCION": "Secundaria", //primaria, secundaria - universitario
    "PROFESION": "Comerciante", //
    "NACIONALIDAD": "Perú", //
    "ACTIVIDAD_ECONOMICA": "Bodega", //otros
    "TIENE_AHORRO": 1, //si tiene cuenta ahorro diferente de aporte y custodia
    "Tipo_Documento": "DNI", //SICOOP
    "TDOC": "D", //DEFAUL D

    "MONTO_PRESTAMO": 2500.0,
    "CUOTAS": 12,
    "CUOTA_FIJA": 245.5,
    "TIPO_PRES": "MICROEMPRESA", //DEFAULT MICROEMPRESA
    "FINALIDAD_PRESTAMO": "Comercio",
    "TIPO_DESTINO": "Capital de Trabajo",
    "SUBTIPO_PRES": "MICRO EMPRESAS",
    "TIPO_PRODUCTO": "MAS INCLUSIVO",
    "FRECUENCIA_PAGO": "SEMANAS",
    "AGENCIA_NOMBRE": "AGENCIA SICUANI",
    "TIPO_NVORECU": "N",
    "PERIODO": 202608, //cuando es evauado

    "SCORE": 780, //sabio sentinel ScoreSabio
    "Nro_Entidades_SBS": 2, //NroEntFin + NEntFinNR
    "Total_Nro_Ent_R": 2, //NroEntFin
    "Total_Nro_Ent_NR_Microf": 1,//NEntFinNR
    "Deuda_SBS_Microf": 300.0, //DeudaSBSMicrof
    "Cob_Judicial_SBS": 0,
    "Deuda_Castigada_SBS": 0,
    "Cta_CorrienteCerrada": 0,
    "TarjetaCreditoCerrada": 0,
    "Calificacion_SBS": "NORMAL", //Calificativo
    "Calificacion_SBS_Microf": "NORMAL",
    "Calificacion_SBS.1": "NORMAL",
    "Calificacion_NR_Microf": "NORMAL",

    "Tipo_Entidad_R_1": "CMAC", 
    "Entidad_D_R_1": "CMAC CUSCO S A", 
    "Deuda_R_1": 1800.0, 
    "Calificacion_R_1": "NORMAL", 
    "TipoCred_Ent_R_1": "MICRO EMPRESA",
    
    "Tipo_Entidad_R_2": "BANCO", "Entidad_D_R_2": "BCP", "Deuda_R_2": 500.0, "Calificacion_R_2": "NORMAL", "TipoCred_Ent_R_2": "CONSUMO",
    "Tipo_Entidad_R_3": null, "Entidad_D_R_3": null, "Deuda_R_3": null, "Calificacion_R_3": null, "TipoCred_Ent_R_3": null,
    "Tipo_Entidad_R_4": null, "Entidad_D_R_4": null, "Deuda_R_4": null, "Calificacion_R_4": null, "TipoCred_Ent_R_4": null,
    "Tipo_Entidad_R_5": null, "Entidad_D_R_5": null, "Deuda_R_5": null, "Calificacion_R_5": null, "TipoCred_Ent_R_5": null,
    "Tipo_Entidad_R_6": null, "Entidad_D_R_6": null, "Deuda_R_6": null, "Calificacion_R_6": null, "TipoCred_Ent_R_6": null,

    "Tipo_Entidad_NR_1": "Coopac", "Entidad_D_NR_1": "COOPAC KORI", "Deuda_NR_1": 300.0, "DiasVencidos_NR_1": 0,
    "Tipo_Entidad_NR_2": null, "Entidad_D_NR_2": null, "Deuda_NR_2": null, "DiasVencidos_NR_2": null,
    "Tipo_Entidad_NR_3": null, "Entidad_D_NR_3": null, "Deuda_NR_3": null, "DiasVencidos_NR_3": null,
    "Tipo_Entidad_NR_4": null, "Entidad_D_NR_4": null, "Deuda_NR_4": null, "DiasVencidos_NR_4": null,
    "Tipo_Entidad_NR_5": null, "Entidad_D_NR_5": null, "Deuda_NR_5": null, "DiasVencidos_NR_5": null,
    "Tipo_Entidad_NR_6": null, "Entidad_D_NR_6": null, "Deuda_NR_6": null, "DiasVencidos_NR_6": null,

    "PNOR_M0": 0.0, "PNOR_M1": 0.0, "PNOR_M2": 0.0, "PNOR_M3": 0.0, "PNOR_M4": 0.0,
    "PNOR_M5": 0.0, "PNOR_M6": 0.0, "PNOR_M7": 0.0, "PNOR_M8": 0.0, "PNOR_M9": 0.0,
    "PNOR_M10": 0.0, "PNOR_M11": 0.0, "PNOR_M12": 0.0, "PNOR_M13": 0.0, "PNOR_M14": 0.0,
    "PNOR_M15": 0.0, "PNOR_M16": 0.0, "PNOR_M17": 0.0, "PNOR_M18": 0.0, "PNOR_M19": 0.0,
    "PNOR_M20": 0.0, "PNOR_M21": 0.0, "PNOR_M22": 0.0, "PNOR_M23": 0.0, "PNOR_M24": 0.0
  }
}*/