import { SessionManager } from '../utils/sessionManager';

// Interfaces para los datos del endpoint de desembolsos
export interface DatosSocio {
  DNI_SOCIO: string;//DNI
  RAZON: string;//NOMBRE_COMPLETO
}

export interface DatosBancariosDesembolso {
  DNI_TITULAR: string | null;
  TITULAR: string | null;
  BANCO: string | null;
  TIPO_CUENTA: string | null;
  NUM_CUENTA: string | null;
  CCI: string | null;
  ESTADO: string | null;
  
}

export interface CreditoDesembolso {
  NRO_DI: string;
  PAGARE: string;
  OTORGA: string;
  CUENTA: string;
  MONTO_NETO: string;
  MONTO_SOL: string;
  MONTO_APROB: string
  NOM_PROD: string;
  
}
export interface DatosFirma {
    DNI_SOCIO: string;
    NOMBRES: string;
    EMAIL: string;
    FIRMANTE: string;
    STATUS: string;
    FECHA_CREA: string;
    HORA_CREA: string;
    FECHA_VALIDA: string;
    HORA_VALIDA: string;
    CELULAR: string;
}
export interface DatosResponsable{
  ANALISTA: string;
  AGENCIA: string;
  CELULAR: string;
}
export interface ClienteDesembolso {
  DATOS_SOCIO: DatosSocio;
  DATOS_DESEMBOLSO: CreditoDesembolso;
  DATOS_BANCO: DatosBancariosDesembolso;
  DATOS_FIRMA: DatosFirma;
  DATOS_RESPONSABLE: DatosResponsable;
}

export interface DesembolsosResponse {
  data: ClienteDesembolso[];
  status: boolean;
  message?: string;
}

// Función para obtener los créditos pendientes a desembolsar
export const obtenerCreditosPendientesDesembolsar = async (): Promise<ClienteDesembolso[]> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/desembolsos/pendientes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SessionManager.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.status}`);
    }

    const data = await response.json();
    
    // Si la respuesta es directamente un array
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si la respuesta tiene una estructura con data
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // Si no hay datos, devolver array vacío
    return [];

  } catch (error) {
    throw error;
  }
};

// Función para verificar si un cliente tiene datos bancarios completos
export const tieneDatosBancariosCompletos = (cliente: ClienteDesembolso): boolean => {
  const { DATOS_BANCO } = cliente;
  return !!(
    DATOS_BANCO.BANCO &&
    DATOS_BANCO.TIPO_CUENTA &&
    DATOS_BANCO.NUM_CUENTA &&
    DATOS_BANCO.CCI &&
    DATOS_BANCO.TITULAR
  );
};

// Función para obtener el estado de los datos bancarios
export const getEstadoDatosBancarios = (cliente: ClienteDesembolso): string => {
  if (tieneDatosBancariosCompletos(cliente)) {
    return 'COMPLETO';
  } else if (cliente.DATOS_BANCO.BANCO || cliente.DATOS_BANCO.NUM_CUENTA || cliente.DATOS_BANCO.CCI) {
    return 'INCOMPLETO';
  } else {
    return 'FALTA';
  }
};

// Función para formatear el monto
export const formatearMonto = (monto: string): string => {
  if (!monto) return '0.00';
  
  // Remover caracteres no numéricos excepto el punto decimal
  const numeroLimpio = monto.replace(/[^\d.]/g, '');
  const numero = parseFloat(numeroLimpio);
  
  if (isNaN(numero)) return '0.00';
  
  return numero.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};



