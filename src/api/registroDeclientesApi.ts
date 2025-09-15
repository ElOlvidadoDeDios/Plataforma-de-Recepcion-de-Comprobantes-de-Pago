
// API para gestionar datos de clientes
import { useEffect, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

const API_BASE_URL =import.meta.env.VITE_API_BASE_URL_GEODILE;  // corregir
const API_BASE_URL_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

const Notification = useNotifications();

// Interfaces para los datos del API
interface EstadoCivil {
  EST_CIVIL: string;
  NOM_ECIVIL: string;
}

interface TipoSocio {
  TIPO_SOCIO: string;
  NOM_TSOCIO: string;
}

interface TipoDocumento {
  TIPO_DI: string;
  NOM_DI: string;
  NCARACTER: string;
}

interface EstadoSocio {
  EST_SOCIO: string;
  NOM_ESOCIO: string;
}

interface TipoVivienda {
  TIPO_VIVIENDA: string;
  NOM_VIVIENDA: string;
}

interface TipoProfesion {
  TIPO_PROFESION: string;
  NOM_TPROF: string;
}

interface NivelInstruccion {
  TIPO_INSTRUCCION: string;
  NOM_TINSTRUC: string;
}

interface Nacionalidad {
  TIPO_NAC: string;
  NOM_NAC: string;
}

interface ActividadEconomica {
  TIPO_ACTI: string;
  NOM_ACTI: string;
}

interface Departamento {
  DPTO: string;
  NOM_UBIGEO: string;
}

interface Distrito {
  DIST: string;
  NOM_UBIGEO: string;
}

interface Provincia {
  PROV: string;
  NOM_UBIGEO: string;
}
interface sector {
  TIPO_SECTOR: string;
  NOM_SECTOR: string;
}
interface ComboBoxData {
  ESTADO_CIVIL: EstadoCivil[];
  TIPO_SOCIO: TipoSocio[];
  TIPO_DOCUMENTO: TipoDocumento[];
  ESTADO_SOCIO: EstadoSocio[];
  TIPO_PERSONA: Array<{
    TIPO_PERSONA: string;
    NOM_TPERSONA: string;
  }>;
  TIPO_VIVIENDA: TipoVivienda[];
  TIPO_PROFESION: TipoProfesion[];
  NIVEL_INSTRUCCION: NivelInstruccion[];
  NACIONALIDAD: Nacionalidad[];
  ACTIVIDAD_ECONOMICA: ActividadEconomica[];
  DEPARTAMENTO: Departamento[];
  DISTRITO: Distrito[];
  PROVINCIA: Provincia[];
  SECTOR: sector[];
}

// Hook personalizado para cargar los datos del API
export  const useComboBoxData = () => {
  const [comboData, setComboData] = useState<ComboBoxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComboData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/combo_box_insert`,// modificar a qui 
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${API_BASE_URL_TOKEN}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data: ComboBoxData = await response.json();
        setComboData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
 
    fetchComboData();
  }, []);

  return { comboData, loading, error };
};

//guardar cliente
export interface ClienteData {
    NVA_CTA?: string;  //cuenta
    DOC_IDEN?: string;
    APE_PAT?: string;
    APE_MAT?: string;
    NOMBRES?: string;
    AGE?: string;
    LUGAR_NAC?: string;
    FECHA_NAC?: string;
    TIPO_NAC?: string;
    SEXO?: string;
    TIPO_ECIV?: string;
    TIPO_VIV?: string;
    TLF_CASA?: string;
    TLF_CASA2?: string;
    TLF_CELULAR?: string;
    TLF_CELULAR2?: string;
    TIPO_INST?: string;
    TIPO_PROF?: string;
    OCUPACION?: string;
    TIPO_ACTI?: string;
    EMAIL?: string;
    TIPO_SOCIO?: string;
    EST_SOCIO?: string;
    TIPO_PERSONA?: string; // Campo adicional para el tipo de persona
    COD_USER?: string; // Campo adicional para el usuario
}

export const saveCliente = async (clienteData: ClienteData) => {
    try {
        
        const response = await fetch(`${API_BASE_URL}/api_mongo_firm_easy/api/pre_afilia_datos`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${API_BASE_URL_TOKEN}`
                },
                body: JSON.stringify(clienteData)
            }
        );
        
        const data = await response.json();
        
        // Verificar si la respuesta es exitosa
        if (response.ok && (data === true || (data.status === true && data.inserted_id))) {
            Notification.success('✅ Datos guardados exitosamente');
        } else {
            Notification.error('❌ No se guardaron los datos, inténtelo de nuevo');
        }
        
        return data;
    } catch (error) {
        Notification.error('❌ No se guardaron los datos, inténtelo de nuevo');
        throw error;
    }
}

//consultar dni  mi sicoop
export const useComboBoxrellenarData = async (
  TIPO_DOC: string,
  NRO_DOC: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/getSocioEdit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify({
          TIPO_DOC,
          NRO_DOC
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};




const useComboBoxDepartamentosData = async (): Promise<ComboBoxData[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/getdptos`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: ComboBoxData[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
const useComboBoxProvinciasData = async (
  dpto: string
): Promise<ComboBoxData[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/listProv`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify({
          DPTO: dpto,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: ComboBoxData[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

const useComboBoxDistritosData = async (
  dpto: string,
  prov: string
): Promise<ComboBoxData[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/listDist`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify({
          DPTO: dpto,
          PROV: prov,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: ComboBoxData[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

const useComboBoxSectoresData = async (
  dpto: string,
  prov: string,
  dist: string
): Promise<ComboBoxData[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/listSector`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
        body: JSON.stringify({
          DPTO: dpto,
          PROV: prov,
          DIST: dist,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: ComboBoxData[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

interface TipoDireccion {
  TIPO_DIR: string;
  NOM_DIR: string;
}

interface TipoVia {
  TIPO_VIA: string;
  NOM_TVIA: string;
}

interface TipoZona {
  TIPO_ZONA: string;
  NOM_TZONA: string;
}

interface SectorOpciones {
  TIPO_DIRECCION: TipoDireccion[];
  TIPO_VIA: TipoVia[];
  TIPO_ZONA: TipoZona[];
}

const useComboBoxSectorOpcionesData = async (): Promise<SectorOpciones> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/comboxDir`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: SectorOpciones = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
interface TipoVinculoFamiliar {
  TIPO_PAREN: string;
  NOM_TPAREN: string;
}

interface TipoDocumento {
  TIPO_DI: string;
  NOM_DI: string;
  NCARACTER: string;
}

interface FamiliarOpciones {
  TIPO_VINCULO_FAMILIAR: TipoVinculoFamiliar[];
  TIPO_DOCUMENTO: TipoDocumento[];
}

const useComboBoxFamiliarOpcionesData = async (): Promise<FamiliarOpciones> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api_app_dile_v1_1/api/comboFamiliar`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${API_BASE_URL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: FamiliarOpciones = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};


export interface saverDirecionData {
    CUENTA: string;
    TIPO_DIR: string;
    TIPO_VIA: string;
    NOM_VIA: string; //NOM_VIA
    NUMERO: string;
    INTERIOR: string;
    TIPO_ZONA: string;
    NOM_ZONA: string; //NOM_ZONA
    DPTO: string; //DEPARTAMENTO
    PROV: string; //PROVINCIA
    DIST: string; //DISTRITO
    TIPO_SECTOR: string; //SECTOR
    REFERENCIA: string; //REFERENCIA
    COD_USER: string; //USUARIO
}

export const saverDirecion = async (direccionData: saverDirecionData) => {
    try {

        const response = await fetch(`${API_BASE_URL}/api_mongo_firm_easy/api/pre_afilia_direccion`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${API_BASE_URL_TOKEN}`,
                },
                body: JSON.stringify(direccionData)
            }
        );
        
        const data = await response.json();
        
        // Verificar si la respuesta es exitosa
        if (response.ok && (data === true || (data.status === true && data.message))) {
            if (data.message) {
                Notification.success(`✅ ${data.message}`);
            } else {
                Notification.success('✅ Datos guardados exitosamente');
            }
        } else {
            Notification.error('❌ No se guardaron los datos, inténtelo de nuevo');
        }
        
        return data;
    } catch (error) {
        Notification.error('❌ No se guardaron los datos, inténtelo de nuevo');
        throw error;
    }
}
//enpoit para subir el comprobante de filaicion y los dni 




// Interface para datos de subida de archivos
export interface UploadFileData {
  DNI_SOCIO: string;    // DNI del socio
  AGENCIA: string;      // ID de la agencia
  ANALISTA: string;     // COD_USER del analista
}

// ✅ NUEVA FUNCIÓN: Subir todos los archivos en UN SOLO PAYLOAD
export const uploadAllFilesAtOnce = async (
  fileData: UploadFileData,
  files: {
    dniFrontal: File;
    dniReverso: File;
    voucher: File;
  }
) => {
  try {
    // Crear FormData para enviar todos los datos y archivos juntos
    const formData = new FormData();
    
    // ✅ AGREGAR DATOS DEL SOCIO
    formData.append('DNI_SOCIO', fileData.DNI_SOCIO);
    formData.append('AGENCIA', fileData.AGENCIA);
    formData.append('ANALISTA', fileData.ANALISTA);
    
    // ✅ AGREGAR TODAS LAS IMÁGENES EN UN SOLO PAYLOAD
    formData.append('dni_frontal', files.dniFrontal);
    formData.append('dni_reverso', files.dniReverso);
    formData.append('voucher', files.voucher);
    const response = await fetch(`${API_BASE_URL}/api_mongo_firm_easy/api/load_file_preAfilia`, {
      method: 'POST',
      headers: {
        'Authorization': `${API_BASE_URL_TOKEN}`,
        // No incluir 'Content-Type' para FormData - el browser lo configura automáticamente
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    // Si la respuesta es un array, significa que devuelve un objeto por cada archivo
    if (Array.isArray(data)) {
      // Verificar si todos los elementos del array son exitosos
      const allSuccessful = data.every(item =>
        item.success === true ||
        item.status === true ||
        item.message?.includes('exitosamente') ||
        item.message?.includes('guardado')
      );
      
      if (allSuccessful) {
        return { success: true, data };
      } else {
        const errors = data.filter(item => !item.success && item.status !== true);
        return { success: false, error: `Errores en la subida: ${JSON.stringify(errors)}` };
      }
    } else {
      // Manejo para respuesta de objeto único
      if (data.success || data.status === true) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Error desconocido' };
      }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Función para subir archivos (DNI frontal, DNI reverso, voucher) - INDIVIDUAL [MANTENER POR COMPATIBILIDAD]
export const uploadPreAfiliaFile = async (
  fileData: UploadFileData,
  file: File,
  fileType: 'DNI_FRONTAL' | 'DNI_REVERSO' | 'VOUCHER'
) => {
  try {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    
    // Agregar los datos del socio
    formData.append('DNI_SOCIO', fileData.DNI_SOCIO);
    formData.append('AGENCIA', fileData.AGENCIA);
    formData.append('ANALISTA', fileData.ANALISTA);
    formData.append('TIPO_ARCHIVO', fileType);
    
    // Agregar el archivo
    formData.append('file', file);


    const response = await fetch(`${API_BASE_URL}/api_mongo_firm_easy/api/load_file_preAfilia`, {
      method: 'POST',
      headers: {
        'Authorization': `${API_BASE_URL_TOKEN}`,
        // No incluir 'Content-Type' para FormData - el browser lo configura automáticamente
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Verificar si la respuesta es exitosa
    if (data.success || data.status === true) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Error desconocido' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Función helper para subir múltiples archivos en orden [MANTENER POR COMPATIBILIDAD]
export const uploadMultipleFiles = async (
  fileData: UploadFileData,
  files: {
    dniFrontal?: File;
    dniReverso?: File;
    voucher?: File;
  }
) => {
  const results = [];
  
  try {
    // 1. Subir DNI frontal (si existe)
    if (files.dniFrontal) {
      const result = await uploadPreAfiliaFile(fileData, files.dniFrontal, 'DNI_FRONTAL');
      results.push({ type: 'DNI_FRONTAL', ...result });
      
      if (!result.success) {
        throw new Error(`Error subiendo DNI frontal: ${result.error}`);
      }
    }

    // 2. Subir DNI reverso (si existe)
    if (files.dniReverso) {
      const result = await uploadPreAfiliaFile(fileData, files.dniReverso, 'DNI_REVERSO');
      results.push({ type: 'DNI_REVERSO', ...result });
      
      if (!result.success) {
        throw new Error(`Error subiendo DNI reverso: ${result.error}`);
      }
    }

    // 3. Subir voucher (si existe)
    if (files.voucher) {
      const result = await uploadPreAfiliaFile(fileData, files.voucher, 'VOUCHER');
      results.push({ type: 'VOUCHER', ...result });
      
      if (!result.success) {
        throw new Error(`Error subiendo voucher: ${result.error}`);
      }
    }
    return { success: true, results };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      results
    };
  }
};

export const validarnumeroCelular = async (numero: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/validarNumCel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${API_BASE_URL_TOKEN}`,
      },
      body: JSON.stringify({ NUM_CEL: numero })
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

export default { useComboBoxData , saveCliente, useComboBoxDepartamentosData, useComboBoxProvinciasData, useComboBoxDistritosData, useComboBoxSectoresData, useComboBoxSectorOpcionesData, useComboBoxFamiliarOpcionesData, uploadPreAfiliaFile, uploadMultipleFiles, uploadAllFilesAtOnce};

