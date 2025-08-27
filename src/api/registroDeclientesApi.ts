// API para gestionar datos de clientes
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
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

interface ComboBoxData {
  ESTADO_CIVIL: EstadoCivil[];
  TIPO_SOCIO: TipoSocio[];
  TIPO_DOCUMENTO: TipoDocumento[];
  ESTADO_SOCIO: EstadoSocio[];
  TIPO_PERSONA: any[];
  TIPO_VIVIENDA: TipoVivienda[];
  TIPO_PROFESION: TipoProfesion[];
  NIVEL_INSTRUCCION: NivelInstruccion[];
  NACIONALIDAD: Nacionalidad[];
  ACTIVIDAD_ECONOMICA: ActividadEconomica[];
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

export default { useComboBoxData };