import { ListadoAseguramientosResponse } from "../Aseguramiento.types";


/**
 * TODO: ajusta esta URL a la real de tu backend.
 * Si ya tienes una instancia de axios/fetch configurada en otro archivo
 * de "services" del proyecto, reemplaza este fetch por esa instancia.
 */
const API_BASE_URL = 'http://192.168.3.34:8080/desarrollo/api_mongo_firm_easy'//`${import.meta.env.VITE_API_BASE_URL_GEODILE}/api_mongo_firm_easy`;
const ENDPOINT_LISTADO = `${API_BASE_URL}/api/ListarIngresadosAsegurados`;
const token = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
/**
 * Obtiene el listado de aseguramientos registrados.
 * Respuesta esperada:
 * {
 *   status: boolean,
 *   message: string,
 *   cantidad: number,
 *   data: RegistroAseguramiento[]
 * }
 */
export async function obtenerAseguramientos(): Promise<ListadoAseguramientosResponse> {
  const response = await fetch(ENDPOINT_LISTADO, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`, 
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener los aseguramientos (HTTP ${response.status})`);
  }

  const data: ListadoAseguramientosResponse = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'No se pudo obtener el listado de aseguramientos');
  }

  return data;
}