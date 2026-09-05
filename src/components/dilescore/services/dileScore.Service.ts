import {
  DileScoreAutoData,
  DileScoreDocInfoRequest,
  DileScoreDocInfoResponse,
  DileScoreDocQueryResult,
  DileScoreInputData,
  DileScorePayload,
  DileScorePayloadDatosSolicitante,
  DileScoreRequest,
  DileScoreResult,
} from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const API_BASE_URL_2 = import.meta.env.VITE_API_BASE_URL_GEODILE  //'http://192.168.3.34:8080';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_SCORE //'http://192.168.3.34:8000';
const API_BASE_URL_GEODILE_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN 
const API_KEY = import.meta.env.VITE_API_BASE_SCORE_API_KEY 

const validateDni = (dni: string): void => {
  const clean = (dni || '').trim();
  if (!/^\d{8}$/.test(clean)) {
    throw new Error('El DNI debe tener 8 digitos numericos');
  }
};

const toNumber = (value: string, fallback = 0): number => {
  const normalized = (value || '').replace(',', '.').trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toAhorroFlag = (value: string): number => {
  const normalized = (value || '').trim().toLowerCase();

  if (!normalized) return 0;
  if (normalized === '1' || normalized === 'si' || normalized === 'sí' || normalized === 'true' || normalized === 'yes') {
    return 1;
  }

  return 0;
};

const getPeriodoActual = (): number => {
  const now = new Date();
  return now.getFullYear() * 100 + (now.getMonth() + 1);
};

const normalizeProducto = (value: string): string => {
  const clean = (value || '').trim();
  if (!clean) return 'MAS_INCLUSIVO';
  return clean;
};

export const buildDileScorePayloadMock = (
  inputData: DileScoreInputData,
  autoData: DileScoreAutoData,
  supplementalData: Record<string, string | number | null> = {},
): DileScorePayload => {
  const entityDefaults: Record<string, null> = {};
  for (let i = 1; i <= 6; i += 1) {
    entityDefaults[`Tipo_Entidad_R_${i}`] = null;
    entityDefaults[`Entidad_D_R_${i}`] = null;
    entityDefaults[`Deuda_R_${i}`] = null;
    entityDefaults[`Calificacion_R_${i}`] = null;
    entityDefaults[`TipoCred_Ent_R_${i}`] = null;

    entityDefaults[`Tipo_Entidad_NR_${i}`] = null;
    entityDefaults[`Entidad_D_NR_${i}`] = null;
    entityDefaults[`Deuda_NR_${i}`] = null;
    entityDefaults[`DiasVencidos_NR_${i}`] = null;
    entityDefaults[`TipoCred_Ent_NR_${i}`] = null;
    entityDefaults[`Calificacion_NR_${i}`] = null;
  }

  const pnorDefaults: Record<string, number> = {};
  for (let i = 0; i <= 24; i += 1) {
    pnorDefaults[`PNOR_M${i}`] = 0;
  }

  const solicitante: DileScorePayloadDatosSolicitante = {
    TIPO_SOCIO: autoData.TIPO_SOCIO || 'SOCIO NORMAL',
    MESES_ANTIGUEDAD: toNumber(autoData.MESES_ANTIGUEDAD),
    EDAD_ANIOS: toNumber(autoData.EDAD_ANIOS),
    LUGAR_NAC: autoData.LUGAR_NAC || '',
    TIPO_PERSONA: autoData.TIPO_PERSONA || 'NATURAL',
    TIPO_VIVIENDA: autoData.TIPO_VIVIENDA || '',
    ESTADO_CIVIL: autoData.ESTADO_CIVIL || '',
    NIVEL_INSTRUCCION: autoData.NIVEL_INSTRUCCION || '',
    PROFESION: autoData.PROFESION || '',
    NACIONALIDAD: autoData.NACIONALIDAD || '',
    ACTIVIDAD_ECONOMICA: autoData.ACTIVIDAD_ECONOMICA || '',
    TIENE_AHORRO: toAhorroFlag(autoData.TIENE_AHORRO),
    Tipo_Documento: 'DNI',
    TDOC: 'D',
    MONTO_PRESTAMO: toNumber(inputData.MONTO_PRESTAMO),
    CUOTAS: toNumber(inputData.CUOTAS),
    CUOTA_FIJA: toNumber(inputData.CUOTA_FIJA),
    TIPO_PRES: 'MICROEMPRESA',
    FINALIDAD_PRESTAMO: inputData.FINALIDAD_PRESTAMO || '',
    TIPO_DESTINO: inputData.TIPO_DESTINO || '',
    SUBTIPO_PRES: inputData.SUBTIPO_PRES || '',
    TIPO_PRODUCTO: inputData.TIPO_PRODUCTO || 'MAS_INCLUSIVO',
    FRECUENCIA_PAGO: inputData.FRECUENCIA_PAGO || '',
    AGENCIA_NOMBRE: inputData.AGENCIA_NOMBRE || '',
    TIPO_NVORECU: 'N',
    PERIODO: getPeriodoActual(),
    SCORE: null,
    Nro_Entidades_SBS: 0,
    Total_Nro_Ent_R: 0,
    Total_Nro_Ent_NR_Microf: 0,
    Deuda_SBS_Microf: 0,
    Cob_Judicial_SBS: 0,
    Deuda_Castigada_SBS: 0,
    Cta_CorrienteCerrada: 0,
    TarjetaCreditoCerrada: 0,
    Calificacion_SBS: '',
    Calificacion_SBS_Microf: '',
    'Calificacion_SBS.1': '',
    Calificacion_NR_Microf: '',
    ...entityDefaults,
    ...pnorDefaults,
    ...supplementalData,
  };

  return {
    dni: inputData.DNI.trim(),
    producto: normalizeProducto(inputData.TIPO_PRODUCTO),
    datos_solicitante: solicitante,
  };
};

export const consultarDileScoreReal = async (
  payload: DileScorePayload,
): Promise<unknown> => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL_GEODILE no esta configurada');
  }

  const response = await fetch(`${API_BASE_URL}/score`, {
    method: 'POST',
    headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
    },
    body: JSON.stringify({ ...payload, api_key: API_KEY }),
  });

  const contentType = response.headers.get('content-type') || '';
  const responseBody = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof responseBody === 'string'
        ? `Error en score: ${response.status}`
        : responseBody?.message || `Error en score: ${response.status}`,
    );
  }

  return responseBody;
};

const extractSupplementalData = (
  docData: NonNullable<NonNullable<DileScoreDocInfoResponse['data']>['data']>,
): Record<string, string | number | null> => {
  const supplemental: Record<string, string | number | null> = {};

  const baseNumericKeys = [
    'SCORE',
    'Nro_Entidades_SBS',
    'Total_Nro_Ent_R',
    'Total_Nro_Ent_NR_Microf',
    'Deuda_SBS_Microf',
    'Cob_Judicial_SBS',
    'Deuda_Castigada_SBS',
    'Cta_CorrienteCerrada',
    'TarjetaCreditoCerrada',
  ] as const;

  const baseStringKeys = [
    'Calificacion_SBS',
    'Calificacion_SBS_Microf',
    'Calificacion_SBS.1',
    'Calificacion_NR_Microf',
  ] as const;

  for (const key of baseNumericKeys) {
    const value = docData[key];
    if (typeof value === 'number') supplemental[key] = value;
  }

  for (const key of baseStringKeys) {
    const value = docData[key];
    if (typeof value === 'string') supplemental[key] = value;
  }

  for (let i = 1; i <= 6; i += 1) {
    const stringKeys = [
      `Tipo_Entidad_R_${i}`,
      `Entidad_D_R_${i}`,
      `Calificacion_R_${i}`,
      `TipoCred_Ent_R_${i}`,
      `Tipo_Entidad_NR_${i}`,
      `Entidad_D_NR_${i}`,
      `TipoCred_Ent_NR_${i}`,
      `Calificacion_NR_${i}`,
    ] as const;

    const numberOrNullKeys = [
      `Deuda_R_${i}`,
      `Deuda_NR_${i}`,
      `DiasVencidos_NR_${i}`,
    ] as const;

    for (const key of stringKeys) {
      const value = docData[key];
      if (typeof value === 'string' || value === null) {
        supplemental[key] = value;
      }
    }

    for (const key of numberOrNullKeys) {
      const value = docData[key];
      if (typeof value === 'number' || value === null) {
        supplemental[key] = value;
      }
    }
  }

  for (let i = 0; i <= 24; i += 1) {
    const key = `PNOR_M${i}`;
    const value = docData[key];
    if (typeof value === 'number') {
      supplemental[key] = value;
    }
  }

  return supplemental;
};

const mapDocInfoToAutoData = (response: DileScoreDocInfoResponse): DileScoreDocQueryResult => {
  const docData = response.data?.data;

  if (!docData) {
    throw new Error(response.message || 'No se pudo obtener la informacion del DNI');
  }

  const autoData: DileScoreAutoData = {
    TIPO_SOCIO: docData.NOM_TSOCIO ?? '',
    MESES_ANTIGUEDAD: docData.MESES_ANTIGUEDAD ?? '',
    EDAD_ANIOS: docData.EDAD_ANIOS ?? '',
    LUGAR_NAC: docData.LUGAR_NAC ?? '',
    TIPO_PERSONA: docData.NOM_TPERSONA ?? '',
    TIPO_VIVIENDA: docData.NOM_VIVIENDA ?? '',
    ESTADO_CIVIL: docData.NOM_ECIVIL ?? '',
    NIVEL_INSTRUCCION: docData.NOM_TINSTRUC ?? '',
    PROFESION: docData.NOM_TPROF ?? '',
    NACIONALIDAD: docData.NOM_NAC ?? '',
    ACTIVIDAD_ECONOMICA: docData.NOM_ACTI ?? '',
    TIENE_AHORRO: docData.TIENE_AHORRO ?? '',
  };

  return {
    autoData,
    supplementalData: extractSupplementalData(docData),
  };
};

export const consultarInfoScoreDoc = async (
  payload: DileScoreDocInfoRequest,
): Promise<DileScoreDocQueryResult> => {
  const nroDoc = (payload.nro_doc || '').trim();

  if (!/^\d{8}$/.test(nroDoc)) {
    throw new Error('El DNI debe tener 8 digitos numericos');
  }

  const response = await fetch(`${API_BASE_URL_2}/api_app_dile_v1_1/api/getInfoScoreDoc`, {
    method: 'POST',
    headers: {
      Authorization: `${API_BASE_URL_GEODILE_TOKEN}`,
    },
    body: JSON.stringify({
      tipo_doc: payload.tipo_doc,
      nro_doc: nroDoc,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error en la consulta del documento: ${response.status}`);
  }

  const data = (await response.json()) as DileScoreDocInfoResponse;
  return mapDocInfoToAutoData(data);
};

const buildScore = (dni: string): number => {
  const total = dni.split('').reduce((acc, n) => acc + Number(n), 0);
  const weighted = total * 73;
  return Math.min(999, Math.max(350, 350 + (weighted % 650)));
};

const scoreToNivel = (score: number): DileScoreResult['nivel'] => {
  if (score >= 750) return 'ALTO';
  if (score >= 600) return 'MEDIO';
  return 'BAJO';
};

const scoreToRecomendacion = (score: number): string => {
  if (score >= 750) return 'Perfil con buena capacidad de pago. Puede pasar a evaluacion preferente.';
  if (score >= 600) return 'Perfil estable. Recomendable validar ingresos y historial reciente.';
  return 'Perfil con riesgo elevado. Sugerido reforzar garantias y evaluacion manual.';
};

export const consultarDileScoreSimulado = async (
  payload: DileScoreRequest,
): Promise<DileScoreResult> => {
  validateDni(payload.dni);
  await wait(700);

  const score = buildScore(payload.dni);

  return {
    dni: payload.dni,
    score,
    nivel: scoreToNivel(score),
    recomendacion: scoreToRecomendacion(score),
    fechaConsulta: new Date().toISOString(),
  };
};
