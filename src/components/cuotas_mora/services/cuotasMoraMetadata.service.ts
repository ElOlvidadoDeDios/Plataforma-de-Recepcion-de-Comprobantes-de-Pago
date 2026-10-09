const API_BASE_URL_GEODILE = import.meta.env.VITE_API_BASE_URL_GEODILE;
const API_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

interface ValidadorChatBotItem {
  status?: boolean;
  CELULAR?: string;
}

interface AsignarAgenciaPagoItem {
  ID_USER?: string;
  AGE_ACTUAL?: string;
}

export interface CuotasMoraPayloadMetadata {
  IDAnalistaActual: string;
  agencia: string;
  numero_cel: string;
}

const getGeodileHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(API_TOKEN ? { Authorization: API_TOKEN } : {}),
});

const normalizarCelular = (celular?: string): string => {
  if (!celular) return '';
  return celular.replace(/\s+/g, ' ').trim();
};

const getNumeroCelular = async (dni: string, pagare: string): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL_GEODILE}/api_app_dile_v1_1/api/validadorChatBot`,
    {
      method: 'POST',
      headers: getGeodileHeaders(),
      body: JSON.stringify({
        DNI: dni,
        PAGARE: pagare,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudo consultar numero_cel (${response.status})`);
  }

  const data = (await response.json().catch(() => [])) as ValidadorChatBotItem[];
  if (!data?.length) {
    console.warn('validadorChatBot no devolvio registros', { dni, pagare });
  }
  return normalizarCelular(data?.[0]?.CELULAR);
};

const getAnalistaYAgenciaActual = async (
  pagare: string,
): Promise<{ IDAnalistaActual: string; agencia: string }> => {
  const response = await fetch(
    `${API_BASE_URL_GEODILE}/api_app_dile_v1_1/api/asignar_agencia_pago`,
    {
      method: 'POST',
      headers: getGeodileHeaders(),
      body: JSON.stringify({
        PAGARE: pagare,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudo consultar IDAnalistaActual (${response.status})`);
  }

  const data = (await response.json().catch(() => [])) as AsignarAgenciaPagoItem[];
  if (!data?.length) {
    console.warn('asignar_agencia_pago no devolvio registros', { pagare });
  }
  return {
    IDAnalistaActual: data?.[0]?.ID_USER?.trim() || '',
    agencia: data?.[0]?.AGE_ACTUAL?.trim() || '',
  };
};

export const getCuotasMoraPayloadMetadata = async (
  dni: string,
  pagare: string,
): Promise<CuotasMoraPayloadMetadata> => {
  const [numeroCelResult, analistaAgenciaResult] = await Promise.allSettled([
    getNumeroCelular(dni, pagare),
    getAnalistaYAgenciaActual(pagare),
  ]);

  if (numeroCelResult.status === 'rejected') {
    console.error('Error obteniendo numero_cel desde validadorChatBot', numeroCelResult.reason);
  }

  if (analistaAgenciaResult.status === 'rejected') {
    console.error('Error obteniendo IDAnalistaActual/agencia desde asignar_agencia_pago', analistaAgenciaResult.reason);
  }

  return {
    agencia:
      analistaAgenciaResult.status === 'fulfilled'
        ? analistaAgenciaResult.value.agencia
        : '',
    numero_cel:
      numeroCelResult.status === 'fulfilled' ? numeroCelResult.value : '',
    IDAnalistaActual:
      analistaAgenciaResult.status === 'fulfilled'
        ? analistaAgenciaResult.value.IDAnalistaActual
        : '',
  };
};