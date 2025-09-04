
// API para gestionar datos de clientes
import { useEffect, useState } from "react";

const API_BASE_URL =import.meta.env.VITE_API_BASE_URL_GEODILE;  // corregir
const API_BASE_URL_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

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
        const response = await fetch(`${API_BASE_URL}/api_app_dile_v1_1/api/combo_box_insert`,
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
            alert('✅ Datos guardados exitosamente');
        } else {
            alert('❌ No se guardaron los datos, inténtelo de nuevo');
        }
        
        return data;
    } catch (error) {
        alert('❌ No se guardaron los datos, inténtelo de nuevo');
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/getSocioEdit`,
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/getdptos`,
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/listProv`,
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/listDist`,
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/listSector`,
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/comboxDir`,
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
      `${API_BASE_URL}/api_app_dile_v1_1_dev/api/comboFamiliar`,
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
                alert(`✅ ${data.message}`);
            } else {
                alert('✅ Datos guardados exitosamente');
            }
        } else {
            alert('❌ No se guardaron los datos, inténtelo de nuevo');
        }
        
        return data;
    } catch (error) {
        alert('❌ No se guardaron los datos, inténtelo de nuevo');
        throw error;
    }
}

export default { useComboBoxData , saveCliente, useComboBoxDepartamentosData, useComboBoxProvinciasData, useComboBoxDistritosData, useComboBoxSectoresData, useComboBoxSectorOpcionesData, useComboBoxFamiliarOpcionesData};

