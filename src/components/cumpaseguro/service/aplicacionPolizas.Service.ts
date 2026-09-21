import { ListarPolizasPorAplicarResponse } from '../AplicacionPolizas.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE // 'http://192.168.3.34:8080/desarrollo';
const ENDPOINT_POR_APLICAR = `${API_BASE_URL}/api_mongo_firm_easy/api/ListarIngresadosAseguradosPorAplicar`;
const ENDPOINT_ASEGURADOS_GLOBAL = `${API_BASE_URL}/api_mongo_firm_easy/api/ListarAseguradosGlobal`;
const ENDPOINT_ASEGURADOS_GLOBAL_POR_VENCER = `${API_BASE_URL}/api_mongo_firm_easy/api/ObtenerAseguradosPorVencer`;
const token = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

const AGENCIAS_A_98 = new Set(['06', '07', '10', '11', '12', '13']);

function normalizarAgenciaParaAplicacion(agencia: string): string {
  const agenciaNormalizada = String(agencia || '').trim();
  return AGENCIAS_A_98.has(agenciaNormalizada) ? '98' : agenciaNormalizada;
}

/**
 * Servicio para consultar las pólizas ingresadas y pendientes de aplicación
 */
export async function obtenerPolizasPorAplicar(): Promise<ListarPolizasPorAplicarResponse> {
  const response = await fetch(ENDPOINT_POR_APLICAR, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener pólizas por aplicar (HTTP ${response.status})`);
  }

  const data: ListarPolizasPorAplicarResponse = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'No se pudo obtener el listado de pólizas por aplicar');
  }

  return data;
}

/**
 * Servicio para consultar la lista global de asegurados
 */
export async function obtenerAseguradosGlobal(): Promise<ListarPolizasPorAplicarResponse> {
  const response = await fetch(ENDPOINT_ASEGURADOS_GLOBAL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener asegurados globales (HTTP ${response.status})`);
  }

  const data: ListarPolizasPorAplicarResponse = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'No se pudo obtener la lista global de asegurados');
  }

  return data;
}


/**
 * Servicio para consultar la lista global de asegurados por vencer
 */
export async function obtenerAseguradosGlobalPorVencer(): Promise<any[]> {
  const response = await fetch(ENDPOINT_ASEGURADOS_GLOBAL_POR_VENCER, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener asegurados por vencer (HTTP ${response.status})`);
  }

  const data: { status: boolean; message: string; cantidad: number; data: any[] } = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'No se pudo obtener la lista de asegurados por vencer');
  }

  return data.data;
}


// {
//     "ID":"6aac06da472540fb8b035d6e",
//     "MONTO_PAGO":140,
//     "NRO_VOUCHER":"014785236",
//     "NRO_BANCO":"74856",
//     "USER":"DEDI",
//     "AGENCIA":"01",
//     "COD_CAJA":"137"


export async function aplicarpoliza(payload: {
  ID: string;
  MONTO_PAGO: number;
  NRO_VOUCHER: string;
  NRO_BANCO: string;
  USER: string;
  AGENCIA: string;
  COD_CAJA: string;
  USER_PLATAFORMA: string;
  
}): Promise<any> {
  const payloadNormalizado = {
    ...payload,
    AGENCIA: normalizarAgenciaParaAplicacion(payload.AGENCIA),
  };

  const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/asegurar_micumpa_pago`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
    body: JSON.stringify(payloadNormalizado),
  });

  if (!response.ok) {
    throw new Error(`Error al aplicar póliza (HTTP ${response.status})`);
  }

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'No se pudo aplicar la póliza');
  }

  return data;
}