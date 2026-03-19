import axios from "axios";
import { SessionManager } from "../../../utils/sessionManager";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL_Di =import.meta.env.VITE_API_BASE_URL_GEODILE;  // corregir
const API_BASE_URL_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

// Función para obtener el token usando SessionManager
const getToken = () => {
  return SessionManager.getItem('token');
};
// Configuración de Axios para incluir el token en cada solicitud
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface recuperador {
  NUM: number;
  NOM_ADMI: string;
  ID_ANA: string;
  CARGO: string;
  AGENCIA: string;
  COD_AGE: string;
}

export interface Analista {
  ID_ANA: string;
  CARGO: string;
  ANA_ACTUAL: string;
  AGENCIA: string;
}

export interface CreditoMora {
  CUENTA: string;
  OTORGA: string;
  PAGARE: string;
  SOCIO: string;
  POR_PAGAR: number;
  CUOTAS_PAGAR: number;
  SALDO_PRESENTE: string;
  DIAS_ATRASO: string;
  PRODUCTO: string;
  CELULAR: string;
}

export interface GestionMora {
  ID_GESTION: string;
  MOTIVO_RETRASO: string;
  COMPROMISO: string;
  FECHA_COMPROMISO: string;
  ESTADO: string;
}

        // {
        //     "CREDITO_MORA": {
        //         "CUENTA": "000000036881",
        //         "OTORGA": "2025-09-17 00:00:00",
        //         "PAGARE": "01-0032340-25",
        //         "SOCIO": "ALVAREZ GARCIA, MERI ANGELA",
        //         "POR_PAGAR": 1024.5,
        //         "CUOTAS_PAGAR": 7,
        //         "SALDO_PRESENTE": "759.05",
        //         "DIAS_ATRASO": "138",
        //         "PRODUCTO": "MAS INCLUSIVO SEMANAL",
        //         "CELULAR": "906353102"
        //     },
        //     "GESTION_MORA": [
        //         {
        //             "ID_GESTION": "G-01-0032340-25-202603-13032026120323",
        //             "MOTIVO_RETRASO": "PRUEBA",
        //             "COMPROMISO": "PRUEBA",
        //             "FECHA_COMPROMISO": "2026-03-13",
        //             "ESTADO": "PENDING"
        //         }
        //     ]
        // },

export interface SocioMora {
  CREDITO_MORA: CreditoMora;
  GESTION_MORA: GestionMora[];
}

export interface SaveGestionDto {
  PAGARE: string;
  CUENTA: string;
  OTORGA: string;
  MOTIVO: string;
  COMPROMISO: string;
  FECHA_COMPROMISO: string;
  REGISTRADOR: string;
  NOMBRE_A: string;
  AGENCIA: string;
}

export interface GestionXEstados {
  status: boolean;
  message: string;
  resumen: {
    total_pending: number;
    total_cumplido: number;
    total_incumplido: number;
    TOTAL_GESTIONES: number;
  };
  resumen_responsables: Record<string, any>;
  detalles: {
    PENDIENTE: any[];
    CUMPLIDO: any[];
    INCUMPLIDOS: any[];
  };
}


// lista de recuperadores 
export const getRecuperadores = async (): Promise<recuperador[]> => {
  const { data } = await axiosInstance.get('m-recuperacion/recuperadores',
  );
  return data;
};

export const getSociosMora = async (params: {
  ID_ANA: string;
  CARGO: string;
  AGENCIA: string;
  PERIODO: string;
}): Promise<SocioMora[]> => {
  const { data } = await axiosInstance.post('m-recuperacion/gestion-mora', params);
  return data.data_mora;
};



export const getCurrentPeriodo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

export const getAnalistasByAgencia = async (agencia: string, periodo: string): Promise<Analista[]> => {
  const { data } = await axiosInstance.post('m-recuperacion/analistas-by-agencia', {
    PERIODO: periodo,
    AGENCIA: agencia,
  });
  return data;
};

//reporte de mroa por agencia 
export interface ReporteMoraData {
  AGENCIA: string;
  status: boolean;
  message: string;
  resumen: {
    total_pending: number;
    total_cumplido: number;
    total_incumplido: number;
    TOTAL_GESTIONES: number;
  };
  resumen_responsables: {
    [key: string]: {
      total_gestiones: number;
      por_estado: {
        PENDING: number;
        CUMPLIDO: number;
        INCUMPLIMIENTO: number;
      };
      agencias: string[];
    };
  };
  detalles: {
    PENDIENTE: Array<{
      PAGARE: string;
      CUENTA: string;
      OTORGA: string;
      PERIODO: string;
      DETALLE_GESTION: {
        ID_DETALLE: string;
        MOTIVO_RETRASO: string;
        COMPROMISO: string;
        FECHA_COMPROMISO: string;
        RESPONSABLE: string;
        AGENCIA: string;
        ESTADO: string;
      };
    }>;
    CUMPLIDO: Array<{
      PAGARE: string;
      CUENTA: string;
      OTORGA: string;
      PERIODO: string;
      DETALLE_GESTION: {
        ID_DETALLE: string;
        MOTIVO_RETRASO: string;
        COMPROMISO: string;
        FECHA_COMPROMISO: string;
        RESPONSABLE: string;
        AGENCIA: string;
        ESTADO: string;
      };
    }>;
    INCUMPLIDOS: Array<{
      PAGARE: string;
      CUENTA: string;
      OTORGA: string;
      PERIODO: string;
      DETALLE_GESTION: {
        ID_DETALLE: string;
        MOTIVO_RETRASO: string;
        COMPROMISO: string;
        FECHA_COMPROMISO: string;
        RESPONSABLE: string;
        AGENCIA: string;
        ESTADO: string;
      };
    }>;
  };
}
// lista de  gestion de mora por estado
export const getReporteMora = async (AGENCIA: string): Promise<ReporteMoraData> => {
    try {
      const response = await fetch(`${API_BASE_URL_Di}/api_app_dile_v1_1/api/getGestionesXestados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify({ AGENCIA: AGENCIA })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
};

