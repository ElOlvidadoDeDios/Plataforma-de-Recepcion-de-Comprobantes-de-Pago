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
  FIRM_DIGITAL?: FirmDigital;
}

export interface InfoSocio {
  DATOS_PERSONALES: DatosPersonales;
  SOCIODEMOGRAFICO: Sociodemografico;
  CONTACTO: Contacto;
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    // console.error('Error en searchClientes:', error);
    throw error;
  }

};
// Función para obtener detalle del cliente
export const searchClientesByDNI = async (dni: string): Promise<ClienteResponse | null> => {
  if (!dni) {
    // console.error('DNI es requerido');
    throw new Error('DNI es requerido');
  }

  try {
    // console.log('Consultando DNI:', dni);
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/consulta-clientes/por-dni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    // console.error('Error en searchClientesByDNI:', error);
    throw error;
  }
};