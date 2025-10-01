// ======================
// INTERFACES (No tocar)
export interface CuotaDto {
  Pagare: string;
  NumeroCuota: string;
  NombreSocio: string;
  Otorga: string;
  FechaVencimiento: string;
  EstadoCuota: string;
  CapitalPendiente: number;
  TotalCuota: number;
  InteresCuota: number;
  MoraGenerada: number;
  NombreProducto: string;
}

export interface ApiResponseDto {
  success: boolean;
  message: string;
  data: CuotaDto[];
}

export interface PagoRequestDto {
  PAGARE: string;
  COD_AGE: string;
  COD_CAJA: string;
  USER_CAJA: string;
  DNI_SOCIO: string;
  MONTO_SUG: string;
  MONTO_PAG: string;
  LAT: string;
  LNG: string;
}

export interface PagoResponseDto {
  status: boolean;
  message: string;
  detail?: any;
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL_G = `${import.meta.env.VITE_API_BASE_URL_GEODILE}/`;
const API_KEY = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
// ======================
// ENDPOINTS CENTRALIZADOS (Fácil de mover a un servicio)
const API_ENDPOINTS = {
  CUOTAS_BY_DNI: (dni: string) => `${API_BASE_URL}/pagos-recaudadores/cuotas/${dni}`,
  PROCESAR_PAGO: `${API_BASE_URL_G}api_app_dile_v1_1/api/InsertPagosPagador`,
};

// ======================
// FUNCIONES DE API (Aisladas para extraer después)
export const fetchCuotasPorDNI = async (dni: string): Promise<{ [key: string]: CuotaDto[] }> => {
  try {
    const response = await fetch(API_ENDPOINTS.CUOTAS_BY_DNI(dni));
    const data: ApiResponseDto = await response.json();
    if (!data.success) throw new Error(data.message);

    const agrupadoPorPagare: { [key: string]: CuotaDto[] } = {};
    data.data.forEach(cuota => {
      if (!agrupadoPorPagare[cuota.Pagare]) agrupadoPorPagare[cuota.Pagare] = [];
      agrupadoPorPagare[cuota.Pagare].push(cuota);
    });
    return agrupadoPorPagare;
  } catch (error) {
    throw new Error('Error al consultar cuotas: ' + error);
  }
};

export const procesarPago = async (pagoData: PagoRequestDto): Promise<PagoResponseDto> => {
  const response = await fetch(API_ENDPOINTS.PROCESAR_PAGO, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `${API_KEY}`
     },
    body: JSON.stringify(pagoData),
  });
  return await response.json();
};
