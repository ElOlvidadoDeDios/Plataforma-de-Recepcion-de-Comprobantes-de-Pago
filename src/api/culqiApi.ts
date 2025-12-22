const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
const API_BASE_URL_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

// === INTERFACES MEJORADAS PARA MANEJAR LOS 3 CASOS ===

export interface SocioData {
  CUENTA: string;
  RAZON_SOCIAL: string;
  MONTO_APROBADO: string;  // Viene como string desde el API
  ESTADO: string;
  AGENCIA_NOM: string;
  ANA_ACTUAL: string;
}

// Enum para los tipos de vista
export enum VistaType {
  VISTA_ADMINISTRADOR_AGENCIA = 'VISTA ADMINISTRADOR AGENCIA',
  VISTA_ANALISTAS = 'VISTA ANALISTAS'
}

// Tipo para datos agrupados por agencia (Caso 1: SuperAdmin ve todas las agencias)
export type DatosPorAgencia = Record<string, SocioData[]>;

// Tipo para datos de una sola agencia (Caso 2 y 3: Admin/Analista de agencia específica)
export type DatosAgenciaEspecifica = SocioData[];

// Interface principal que maneja los 3 casos
export interface CulqiResponse {
  status: boolean;
  message: VistaType;
  agencia: string;  // "TODAS_LAS_AGENCIA" o nombre de agencia específica
  data: DatosPorAgencia | DatosAgenciaEspecifica;
}

export interface CulqiRequest {
  USER: string;
}

// Tipo para errores
interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

// Función para validar si la respuesta contiene datos válidos de Culqi
export const esRespuestaValidaCulqi = (response: any): response is CulqiResponse => {
  try {
    // Verificar estructura básica
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Verificar que tenga las propiedades mínimas esperadas
    const tieneEstructuraBasica = 'status' in response && 'data' in response;
    if (!tieneEstructuraBasica) {
      return false;
    }

    // Si tiene datos pero no son del formato esperado de Culqi
    if (response.data) {
      // Verificar si es un array de socios o un objeto agrupado por agencias
      if (Array.isArray(response.data)) {
        // Debe ser un array de socios válidos
        if (response.data.length > 0) {
          const primerItem = response.data[0];
          return primerItem &&
                 typeof primerItem === 'object' &&
                 'CUENTA' in primerItem &&
                 'RAZON_SOCIAL' in primerItem &&
                 'MONTO_APROBADO' in primerItem;
        }
        return true; // Array vacío es válido
      } else if (typeof response.data === 'object') {
        // Debe ser un objeto agrupado por agencias
        const claves = Object.keys(response.data);
        if (claves.length > 0) {
          const primeraAgencia = response.data[claves[0]];
          return Array.isArray(primeraAgencia);
        }
        return true; // Objeto vacío es válido
      }
    }

    // Si no tiene datos, verificar si es porque no hay Culquis (válido)
    return response.status !== undefined;
    
  } catch (error) {
    return false;
  }
};

// Función para verificar si hay datos de Culqi disponibles
export const tieneDatosCulqi = (response: CulqiResponse): boolean => {
  try {
    if (!response.data) return false;
    
    if (Array.isArray(response.data)) {
      return response.data.length > 0;
    } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
      // Es un objeto agrupado por agencias
      const datosPorAgencia = response.data as DatosPorAgencia;
      const agencias = Object.keys(datosPorAgencia);
      return agencias.some(agencia =>
        Array.isArray(datosPorAgencia[agencia]) &&
        datosPorAgencia[agencia].length > 0
      );
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

// === FUNCIONES AUXILIARES PARA PROCESAMIENTO ===

/**
 * Verifica si los datos están agrupados por agencia (Caso 1: SuperAdmin)
 */
export const esDatosAgrupados = (data: DatosPorAgencia | DatosAgenciaEspecifica): data is DatosPorAgencia => {
  if (!data || Array.isArray(data)) return false;
  
  // Verificar si es un objeto donde las claves son nombres de agencias
  // y los valores son arrays de SocioData
  const primeraClave = Object.keys(data)[0];
  return primeraClave !== undefined && Array.isArray(data[primeraClave]);
};

/**
 * Obtiene todos los socios de todas las agencias (aplana los datos agrupados)
 */
export const obtenerTodosSocios = (response: CulqiResponse): SocioData[] => {
  if (esDatosAgrupados(response.data)) {
    // Caso 1: Datos agrupados por agencia - aplana todas las agencias
    return Object.values(response.data).flat();
  } else {
    // Caso 2 y 3: Array directo de socios
    return response.data as SocioData[];
  }
};

/**
 * Obtiene socios agrupados por agencia
 */
export const obtenerSociosPorAgencia = (response: CulqiResponse): DatosPorAgencia => {
  if (esDatosAgrupados(response.data)) {
    // Caso 1: Ya están agrupados
    return response.data;
  } else {
    // Caso 2 y 3: Agrupar por agencia (todos son de la misma agencia)
    const socios = response.data as SocioData[];
    const agenciaKey = response.agencia;
    return { [agenciaKey]: socios };
  }
};

/**
 * Obtiene información del tipo de usuario basado en la respuesta
 */
export const obtenerInfoUsuario = (response: CulqiResponse) => {
  const esSuperAdmin = response.agencia === "TODAS_LAS_AGENCIA";
  const esAnalista = response.message === VistaType.VISTA_ANALISTAS;
  const esAdminAgencia = response.message === VistaType.VISTA_ADMINISTRADOR_AGENCIA && !esSuperAdmin;

  return {
    esSuperAdmin,
    esAnalista,
    esAdminAgencia,
    agencia: response.agencia,
    tipoVista: response.message
  };
};

// === FUNCIÓN PRINCIPAL MEJORADA ===

export const DatosAdicionales_insert = async (
  data: CulqiRequest
): Promise<CulqiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/qullqi_data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify(data),
      }
    );

    const jsonResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        `Error ${response.status}: ${jsonResponse.message || 'Error desconocido'}`
      );
    }

    // Validar si la respuesta es válida para Culqi
    if (!esRespuestaValidaCulqi(jsonResponse)) {
      // En lugar de lanzar error, devolver una respuesta vacía válida
      return {
        status: true,
        message: 'VISTA ANALISTAS' as VistaType,
        agencia: 'SIN_AGENCIA',
        data: []
      } as CulqiResponse;
    }

    return jsonResponse as CulqiResponse;
    
  } catch (error) {
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 500,
        details: 'Error al conectar con la API de Culqi'
      } as ApiError;
    }
    throw error;
  }
};

// === FUNCIONES DE UTILIDAD ADICIONALES ===

/**
 * Convierte el monto de string a number
 */
export const formatearMonto = (monto: string): number => {
  return parseFloat(monto) || 0;
};

/**
 * Obtiene el total de socios
 */
export const contarTotalSocios = (response: CulqiResponse): number => {
  return obtenerTodosSocios(response).length;
};

/**
 * Obtiene el monto total aprobado
 */
export const calcularMontoTotal = (response: CulqiResponse): number => {
  const socios = obtenerTodosSocios(response);
  return socios.reduce((total, socio) => total + formatearMonto(socio.MONTO_APROBADO), 0);
};

/**
 * Obtiene estadísticas por agencia
 */
export const obtenerEstadisticasPorAgencia = (response: CulqiResponse) => {
  const sociosPorAgencia = obtenerSociosPorAgencia(response);
  
  return Object.entries(sociosPorAgencia).map(([agencia, socios]) => ({
    agencia,
    cantidad: socios.length,
    montoTotal: socios.reduce((total, socio) => total + formatearMonto(socio.MONTO_APROBADO), 0),
    analistas: [...new Set(socios.map(socio => socio.ANA_ACTUAL))]
  }));
};

