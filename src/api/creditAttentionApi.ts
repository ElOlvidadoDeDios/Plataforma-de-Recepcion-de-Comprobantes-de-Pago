import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { CreditAttentionResponse } from '../types/creditAttention';

// Interfaces para gestión de mora
export interface CreditoMora {
  CUENTA: string;
  OTORGA: string;
  PAGARE: string;
  SOCIO: string;
  SALDO_PRESENTE: string;
  DIAS_ATRASO: string;
  PRODUCTO: string;
}

export interface GestionMoraData {
  ID_GESTION: string | null;
  MOTIVO_RETRASO: string | null;
  COMPROMISO: string | null;
  FECHA_COMPROMISO: string | null;
}

export interface ClienteMora {
  CREDITO_MORA: CreditoMora;
  GESTION_MORA: GestionMoraData;
}

// Función para obtener datos del token JWT
const getTokenData = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const decoded: any = jwtDecode(token);
    return {
      id_ana: decoded.id_ana,
      cargo: decoded.cargo,
      id_age: decoded.id_age
    };
  } catch (error) {
    throw new Error('Error al decodificar el token');
  }
};

// Función para calcular el período actual (YYYYMM)
const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MORA_API_URL = 'http://192.168.3.206/api_sql_dev';

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para incluir el token en cada solicitud
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const creditAttentionApi = {
    // Obtener historial por DNI de la solicitud
    getHistorialBySolicitudDni: async (dni: string): Promise<CreditAttentionResponse> => {
        try {
            const response = await axiosInstance.get(`/api/historial-atencion/solicitud/${dni}`);
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial de la solicitud');
        }
    },

    // Obtener historial por DNI del usuario que atendió
    getHistorialByUsuarioDni: async (dni: string): Promise<CreditAttentionResponse> => {
        try {
            const response = await axiosInstance.get(`/api/historial-atencion/usuario/${dni}`);
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial del usuario');
        }
    },

    getHistorialByEmail: async (
        email: string,
        fechaInicio?: string,
        fechaFin?: string
        ): Promise<CreditAttentionResponse> => {
        try {
            const params: any = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;

            const response = await axiosInstance.get(`/api/historial-atencion/usuario/${email}`, {
            params
            });
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial del usuario');
        }
    },

    getHistorialCompleto: async (
        fechaInicio?: string,
        fechaFin?: string
        ): Promise<CreditAttentionResponse> => {
        try {
            const params: any = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;

            const response = await axiosInstance.get(`/api/historial-atencion`, {
            params
            });
            return response.data;
        } catch (error) {
            throw new Error('Error al obtener el historial completo');
        }
    },

    // Obtener clientes en mora
// Obtener clientes en mora
getClientesEnMora: async (): Promise<ClienteMora[]> => {
    try {
        const tokenData = getTokenData();
        const periodo = getCurrentPeriod();

        const requestData = {
            ID_ANA: tokenData.id_ana,
            PERIODO: periodo,
            CARGO: tokenData.cargo,
            AGENCIA: tokenData.id_age
        };

        console.log("📤 Enviando datos del usuario actual a /api/gestion_mora:", requestData);
        console.log("🌐 URL completa:", `${MORA_API_URL}/api/gestion_mora`);

        // Crear una instancia específica para la API de mora
        const moraInstance = axios.create({
            baseURL: MORA_API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 segundos de timeout
        });

        const response = await moraInstance.post('/api/gestion_mora', requestData);

        console.log("✅ Respuesta recibida para usuario actual:", response.data);

        return response.data;
    } catch (error: any) {
        if (error.response) {
            console.error("❌ Error de respuesta del servidor:", error.response.data);
            console.error("📦 Código de estado:", error.response.status);
        } else if (error.request) {
            console.error("❌ No hubo respuesta del servidor. Detalles:", error.request);
        } else {
            console.error("❌ Error al configurar la solicitud:", error.message);
        }

        throw new Error('Error al obtener clientes en mora');
    }
},

    // Obtener clientes en mora para un analista específico
    getClientesEnMoraByAnalista: async (analistaData: {
        ID_ANA: string;
        CARGO: string;
        AGENCIA: string;
    }): Promise<ClienteMora[]> => {
        try {
            const periodo = getCurrentPeriod();
            
            const requestData = {
                ID_ANA: analistaData.ID_ANA,
                PERIODO: periodo,
                CARGO: analistaData.CARGO,
                AGENCIA: analistaData.AGENCIA
            };

            console.log("📤 Enviando datos del analista a /api/gestion_mora:", requestData);
            console.log("🌐 URL completa:", `${MORA_API_URL}/api/gestion_mora`);

            // Crear una instancia específica para la API de mora (sin token ya que es API externa)
            const moraInstance = axios.create({
                baseURL: MORA_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 30000 // 30 segundos de timeout
            });

            // NO agregar token de autorización para esta API externa específica
            const response = await moraInstance.post('/api/gestion_mora', requestData);

            console.log("✅ Respuesta recibida para analista:", response.data);

            return response.data;
        } catch (error: any) {
            if (error.response) {
                console.error("❌ Error de respuesta del servidor (analista):", error.response.data);
                console.error("📦 Código de estado:", error.response.status);
            } else if (error.request) {
                console.error("❌ No hubo respuesta del servidor (analista). Detalles:", error.request);
            } else {
                console.error("❌ Error al configurar la solicitud (analista):", error.message);
            }

            throw new Error('Error al obtener clientes en mora del analista');
        }
    },

};