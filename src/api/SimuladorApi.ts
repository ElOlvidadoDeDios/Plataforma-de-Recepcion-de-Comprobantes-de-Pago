

export interface GetNomPrestamo {
    TIPO_PRES: string;
    SUBTIPO_PRES: string;
    ID_VALOR: string;
    NOM_SUBTIPO_PRES: string;
}

export interface TipoProductoPrestamo{
    TIPO_PROD: string;
    NOMBRE: string;
} 

export interface Nombrecuota {
    TIPO_CUOTA: string;
    NOM_CUOTA: string;
}

export interface FrecuenciaPago {
    TIPO_PRES: string;
    TIPO_PROD: string;
    COD_FREC: string;
    DES_FREC: string
}

export interface Tipocondicionpago {
    TIPO_CONDIPAGO: string;
    NOM_CONDIPAGO: string;
}

export interface Monto_minimo_maximoRequest {
  COD_AGE: string;
  PRES: string;
  PROD: string;
  FRECU: string;
  MONEDA: string;
}
export interface Monto_minimo_maximoResponse {
    DESDE: string;
    HASTA: string;
}
export interface Plazo_minimo_maximoRequest {
    COD_AGE: string;
    PRES: string;
    PROD: string;
    FRECU: string;
    MONEDA: string;
    MONTO: string;
}
export interface Plazo_minimo_maximoResponse {
    DESDE: string;
    HASTA: string;
}

export interface Tea_minimo_maximoRequest {
    COD_AGE: string;
    PRES: string;
    PROD: string;
    FRECU: string;
    MONEDA: string;
    PLAZO: string;
    MONTO: string;
}

export interface Tea_minimo_maximoResponse {
    "TEM_MIN": string;
    "TEM_MAX": string;
}  
//calular valor cuota
export interface Valor_cuotaRequest {
    COD_AGE: string;
    PRES: string;
    PROD: string;
    FRECU: string;
    MONEDA: string;
    PLAZO: number;
    MONTO: number;
    TIPO_CUOTA: string;
    FECHA_INICIO: string;
    FECHA_PRI: string;
    DIA_FIJO: string;
    CUENTA: string;
    INT_PEND: number;
    TIPO_PAGO: string;
}
export interface VARIAPARAMETROS {
    TEM_MIN: string;
    TEM_MAX: string;
}
export interface Valor_cuotaResponse {
    CUOTA: string;
    SEGURO: string;
    CUOTA_SEGURO: string;
    TEA: string;
    TEM: string;
    VARIA: VARIAPARAMETROS;
}

export interface Recalcularcuotarequest {
    COD_AGE: string;
    PRES: string;
    PROD: string;
    FRECU: string;
    MONEDA: string;
    PLAZO: number;
    MONTO: number;
    TIPO_CUOTA: string;
    FECHA_INICIO: string;
    FECHA_PRI: string;
    DIA_FIJO: string;
    CUENTA: string;
    INT_PEND: number;
    TIPO_PAGO: string;
    TEM: string;
}
export interface Recalcularcuotaresponse {
    CUOTA: string;
    SEGURO: string;
    CUOTA_SEGURO: string;
    TEA: string;
}
//obtener cronograma simulado de pagos de un prestamo
export interface ObtenerCronogramaSimuladoRequest {
    COD_AGE: string;
    PRES: string;
    PROD: string;
    FRECU: string;
    MONEDA: string;
    PLAZO: number;
    MONTO: number;
    TIPO_CUOTA: string;
    FECHA_INICIO: string;
    FECHA_PRI: string;
    DIA_FIJO: string;
    CUENTA: string;
    INT_PEND: number;
    TIPO_PAGO: string;
    TEA: string;
    CUOTA_FIJA: number;
    USER: string;
    DNI: string;
    RAZON: string;
}
export interface ObtenerCronogramaSimuladoResponse {
    NRO_CUO: string;
    FECHA_VCMTO: string;
    TOTAL_CUOTA: string;
    CAPITAL: string;
    INTERES: string;
    APORTE: string;
    SEGURO: string;
    PORTES: string;
    DESGRAV: string;
    INTER_XCOBRAR: string;
    SALDO: string;
    PRESTAMO: string;
    PRODUCTO: string;
    COOP: string;
    AGENCIA: string;
    USUARIO: string;
    PLAZO: string;
    TASA: string;
    FRECUENCIA: string;
    MONTO: string;
    FORMAPAGO: string;
    TEM: string;
    TASA_SEGURO: string;
    CUENTA: string;
    RAZON: string;
    DNI: string;
    FECHA: string;
    MONEDA: string;
    ACUINTERES: string;
}


// obtener url de los enpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE; 
const API_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
// Obtener nombres de préstamos
export const fetchGetNomPrestamo = async (): Promise<GetNomPrestamo[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/cb_cal_pres`, {
            method: 'GET',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
};


// obtener tipo de preducto prestamano 
export const fetchTipodeproductoPrestamo =async (PRES: string): Promise<TipoProductoPrestamo[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/cb_cal_prod`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ PRES: PRES }),
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}

// selecionar tipo de cuoita por defecto 
export const fetchTipoCuota = async (): Promise<Nombrecuota[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/cb_cal_ti_cuota`, {
            method: 'GET',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}

//seleccionar frecuencia de pago por defecto
export const fetchFrecuenciaPago = async (PRES: string, PROD: string): Promise<FrecuenciaPago[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/cb_cal_frec`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ PRES: PRES, PROD: PROD }),
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}
// seleccionar tipo de condicion de pago por defecto
export const fetchTipoCondicionPago = async (): Promise<Tipocondicionpago[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/cb_cal_cond_pago`, {
            method: 'GET',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}

//combo maximo y minimo monto
export const fetchMontoMinimoMaximo = async (requestData: Monto_minimo_maximoRequest): Promise<Monto_minimo_maximoResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/monto_min_max`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}
//combo maximo y minimo plazo
export const fetchPlazoMinimoMaximo = async (requestData: Plazo_minimo_maximoRequest): Promise<Plazo_minimo_maximoResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/plazo_min_max`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}

// combo maximo y minimo TEA
export const fetchTeaMinimoMaximo = async (requestData: Tea_minimo_maximoRequest): Promise<Tea_minimo_maximoResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/tea_min_max`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}

// calcular valor de la cuota
export const fetchValorCuota = async (requestData: Valor_cuotaRequest): Promise<Valor_cuotaResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/calcular_valores`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}

// obtener valores de cuota actualizada
export const fetchActualizarCuota = async (requestData: Recalcularcuotarequest): Promise<Recalcularcuotaresponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/recalcular_valores_tea`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}
//
// obtener cronograma simulado de pagos de un prestamo
export const fetchObtenerCronogramaSimulado = async (requestData: ObtenerCronogramaSimuladoRequest): Promise<ObtenerCronogramaSimuladoResponse[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/imprime_simula`, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error(`Error en la consulta: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message) {
            throw new Error(`Error en la consulta: ${error.message}`);
        }
        throw error;
    }
}