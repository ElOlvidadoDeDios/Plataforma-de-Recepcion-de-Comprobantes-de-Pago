// src/api/auditoriaGeodileApi.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const API_GEODILE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
// URL directa de la API de GeoDile
//anadir estas rutal al .env antes de mandar a producción

export const getDesembolsosParaAuditoria = async () => {
  const response = await axios.get(`${API_URL}/geodile/auditoria/pendientes`);
  return response.data;
};

export const procesarAuditoriaGeodile = async (data: {
  id: string;
  user: string;
  nombre_verificador: string;
  estado: string;
  observacion: string;
}) => {
  const response = await axios.post(`${API_GEODILE_URL}/api_mongo_firm_easy/api/validar_reporte_gps`, data);
  return response.data;
};

// NUEVA FUNCIÓN: Consultar GPS e Imágenes por DNI
export const getVerificacionGps = async (user: string, dni_socio: string) => {
  const response = await axios.post(`${API_GEODILE_URL}/api_mongo_firm_easy/api/get_verifica_reporte_gps`, {
    user,
    dni_socio
  });
  return response.data;
};

// Función limpia que solo recibe el DNI a consultar
export const getVerificacionGpsPorDni = async (dni_socio: string) => {
  const response = await axios.post(`${API_GEODILE_URL}/api_mongo_firm_easy/api/get_verifica_reporte_gps`, {
    user: "72369991", // O el usuario que requiera
    dni_socio: dni_socio.trim()
  });
  return response.data;
};