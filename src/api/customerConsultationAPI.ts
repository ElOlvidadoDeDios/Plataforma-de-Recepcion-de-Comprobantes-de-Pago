import { SessionManager } from '../utils/sessionManager';

// Tipo de documento
export enum TipoDocumento {
  DNI = "01",
  NOMBRE = "02",
  CUENTA = "03"
}

// Interfaces para la búsqueda inicial
export interface ClienteBasico {
  NRO_DI: string;
  CUENTA: string;
  RAZON_SOCIAL: string;
  AGENCIA: string;
  CREDITOS_VIGENTES: number;
  CREDITOS_CANCELADOS: number;
}

export interface BusquedaInicialResponse {
  status: boolean;
  count: number;
  data: ClienteBasico[];
}

// Interfaces para el detalle del cliente
export interface DatosPersonales {
  DNI: string;
  TIPO_DOC: string;
  NOMBRES: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRE_COMPLETO: string;
}

export interface Sociodemografico {
  DEPARTAMENTO: string;
  PROVINCIA: string;
  DISTRITO: string;
  DIRECCION: string;
  SEXO: string;
  EDAD: string;
  ESTADO_CIVIL: string;
  RUBRO: string;
}

export interface Contacto {
  CELULAR: string;
  EMAIL: string;
}

export interface DatosBancarios {
  BANCO: string | null;
  TIPO_CUENTA: string | null;
  NUM_CUENTA: string | null;
  NUM_CUENTA_CCI: string | null;
  DNI_SOCIO: string | null;
  CUENTA_DILE: string | null;
  DNI_TITULAR: string | null;
  NOMBRE_TITULAR: string | null;
  TITULAR: string | null;
  ESTADO: string | null;
}

export interface Otros {
  FECHA_INICIO: string;
  ESTADO: string;
  CUENTA_DILE: string;
}

export interface FirmDigital {
  ESTADO: string;
  ID_DOCUMENT: string | null;
  URL_SIGNED_FILE: string | null;
}

export interface DetalleCredito {
  ID_PRESTAMO: string;
  ESTADO: string;
  REPROGRAMA: string | null;
  MONTO: string;
  SALDO_CAPITAL: string;
  TASA: string;
  FRECUENCIA: string;
  PLAZO: string;
  CUOTA: string;
  PRODUCTO: string;
  OTORGA: string;
  ANALISTA: string;
  AGENCIA: string;
  FIRM_DIGITAL?: FirmDigital;
}

export interface InfoSocio {
  DATOS_PERSONALES: DatosPersonales;
  SOCIODEMOGRAFICO: Sociodemografico;
  CONTACTO: Contacto;
  "DATOS BANCARIOS": DatosBancarios[];
  OTROS: Otros;
}

export interface ClienteResponse {
  INFO_SOCIO: InfoSocio;
  CREDITO_VIGENTE: DetalleCredito[];
}

export interface ApiResponse {
  status: boolean;
  count: number;
  data: {
    INFO_SOCIO: InfoSocio;
    DETALLE_CREDITO: DetalleCredito[];
  };
}

// Helper function para obtener headers con autenticación
const getAuthHeaders = (): HeadersInit => {
  const token = SessionManager.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Función para búsqueda inicial de clientes que maneja 404 silenciosamente
export const searchClientes = async (
  tipo_doc: TipoDocumento,
  valor: string,
  signal?: AbortSignal
): Promise<BusquedaInicialResponse> => {
  if (!valor || valor.length < 3) {
    return {
      status: false,
      count: 0,
      data: []
    };
  }

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/consulta-clientes/buscar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        tipo_doc,
        razon: valor.trim()
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.status}`);
    }

    const data = await response.json();
    
    // Si el servidor devuelve status: false, es una respuesta válida (sin resultados)
    if (data.status === false) {
      return {
        status: false,
        count: data.count || 0,
        data: []
      };
    }
    
    return data;

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: false,
        count: 0,
        data: []
      };
    }
    throw error;
  }

};
// Función para obtener detalle del cliente
export const searchClientesByDNI = async (dni: string): Promise<ClienteResponse | null> => {
  if (!dni) {
    throw new Error('DNI es requerido');
  }

  try {
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/consulta-clientes/por-dni`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dni })
    });

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.status}`);
    }

    const data = await response.json();
    
    // Si el servidor devuelve status: false, significa que no se encontró el DNI
    if (data.status === false) {
      return null; // Retorna null para indicar que no se encontró
    }
    
    return data;

  } catch (error) {
    throw error;
  }
};

// Función para guardar datos bancarios - Ahora usa el backend NestJS
export const guardarDatosBancarios = async (
  dni: string,
  datosBancarios: DatosBancarios
): Promise<{ status: boolean; message: string }> => {
  if (!dni) {
    throw new Error('DNI es requerido');
  }

  try {
    const dataToSend = {
      BANCO: datosBancarios.BANCO,
      TIPO_CUENTA: datosBancarios.TIPO_CUENTA,
      NUM_CUENTA: datosBancarios.NUM_CUENTA,
      NUM_CUENTA_CCI: datosBancarios.NUM_CUENTA_CCI,
      DNI_SOCIO: datosBancarios.DNI_SOCIO,
      CUENTA_DILE: datosBancarios.CUENTA_DILE,
      DNI_TITULAR: datosBancarios.DNI_TITULAR,
      NOMBRE_TITULAR: datosBancarios.NOMBRE_TITULAR
    };

    if (datosBancarios.BANCO === 'Yape' || datosBancarios.BANCO === 'Plin') {
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/consulta-clientes/guardar-datos-bancarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      throw new Error(`Error al guardar datos bancarios: ${response.status}`);
    }

    const data = await response.json();
    return {
      status: true,
      message: data.message || 'Datos bancarios guardados exitosamente'
    };

  } catch (error) {
    return {
      status: false,
      message: 'Error al guardar los datos bancarios'
    };
  }
};

// Función para verificar si existe voucher de desembolso - Ahora usa el backend NestJS
export const checkVoucherExists = async (
  dni: string,
  pagare: string
): Promise<{ exists: boolean; url: string | null; message: string }> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/consulta-clientes/check-voucher`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        DNI: dni,
        PAGARE: pagare
      })
    });

    if (!response.ok) {
      throw new Error(`Error al verificar voucher: ${response.status}`);
    }

    const result = await response.json();
    
    // La API devuelve { exists: boolean, url: string, message: string }
    return {
      exists: result.exists === true,
      url: result.url && result.url.trim() !== '' ? result.url : null,
      message: result.message || 'Verificación completada'
    };

  } catch (error) {
    return {
      exists: false,
      url: null,
      message: 'No se pudo verificar el voucher, se permite subir'
    };
  }
};

// Función para subir comprobante de desembolso - Ahora usa el backend NestJS
export const uploadVoucher = async (
  voucherData: {
    DNI_SOCIO: string;
    PAGARE: string;
    AGENCIA: string;
    ANALISTA: string;
  },
  file: File
): Promise<{ status: boolean; message: string; data?: any }> => {
  try {
    const formData = new FormData();
    formData.append('DNI_SOCIO', voucherData.DNI_SOCIO);
    formData.append('PAGARE', voucherData.PAGARE);
    formData.append('AGENCIA', voucherData.AGENCIA);
    formData.append('ANALISTA', voucherData.ANALISTA);
    formData.append('file', file);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = SessionManager.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/consulta-clientes/upload-voucher`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      status: true,
      message: result.message || 'Comprobante de desembolso enviado exitosamente',
      data: result.data
    };

  } catch (error) {
    return {
      status: false,
      message: 'Error al enviar el comprobante de desembolso'
    };
  }
};

// Función para actualizar datos bancarios (por ahora usa el mismo endpoint de insertar)
export const actualizarDatosBancarios = async (
  dni: string,
  datosBancarios: DatosBancarios
): Promise<{ status: boolean; message: string }> => {
  return await guardarDatosBancarios(dni, datosBancarios);
};

