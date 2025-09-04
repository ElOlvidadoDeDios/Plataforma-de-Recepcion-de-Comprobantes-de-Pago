import { useEffect } from 'react';

// Interfaces locales para evitar dependencias circulares
interface Nacionalidad {
  TIPO_NAC: string;
  NOM_NAC: string;
}

interface TipoPersona {
  TIPO_PERSONA: string;
  NOM_TPERSONA: string;
}

interface TipoSocio {
  TIPO_SOCIO: string;
  NOM_TSOCIO: string;
}

interface EstadoSocio {
  EST_SOCIO: string;
  NOM_ESOCIO: string;
}

interface TipoDocumento {
  TIPO_DI: string;
  NOM_DI: string;
  NCARACTER: string;
}

interface ComboBoxData {
  NACIONALIDAD?: Nacionalidad[];
  TIPO_PERSONA?: TipoPersona[];
  TIPO_SOCIO?: TipoSocio[];
  ESTADO_SOCIO?: EstadoSocio[];
  TIPO_DOCUMENTO?: TipoDocumento[];
}

interface UseDefaultValuesProps {
  comboData: ComboBoxData | null;
  showFullForm: boolean;
  formData: any;
  handleInputChange: (field: any, value: string) => void;
}

// Funciones para obtener valores por defecto
export const getPeruNacionalidad = (comboData: ComboBoxData | null): string => {
  if (!comboData?.NACIONALIDAD) return '';
  const peru = comboData.NACIONALIDAD.find(
    (n: Nacionalidad) => n.NOM_NAC.toLowerCase().includes('per') || n.NOM_NAC.toLowerCase().includes('perú'),
  );
  return peru ? peru.TIPO_NAC : '';
};

export const getTipoPersona = (comboData: ComboBoxData | null): string => {
  if (!comboData?.TIPO_PERSONA) return '';
  const natural = comboData.TIPO_PERSONA.find(
    (n: TipoPersona) => n.NOM_TPERSONA.toLowerCase().includes('natural'),
  );
  return natural ? natural.TIPO_PERSONA : '';
};

export const getTipoSocio = (comboData: ComboBoxData | null): string => {
  if (!comboData?.TIPO_SOCIO) return '';
  const tipoSocio = comboData.TIPO_SOCIO.find(
    (n: TipoSocio) => n.NOM_TSOCIO.toLowerCase().includes('socio normal'),
  );
  return tipoSocio ? tipoSocio.TIPO_SOCIO : '';
};

export const getSituacion = (comboData: ComboBoxData | null): string => {
  if (!comboData?.ESTADO_SOCIO) return '';
  const situacion = comboData.ESTADO_SOCIO.find(
    (n: EstadoSocio) => n.NOM_ESOCIO.toLowerCase().includes('activo'),
  );
  return situacion ? situacion.EST_SOCIO : '';
};

export const getDNIDocument = (comboData: ComboBoxData | null): TipoDocumento | null => {
  if (!comboData?.TIPO_DOCUMENTO) return null;
  return comboData.TIPO_DOCUMENTO.find(
    (doc: TipoDocumento) => doc.NOM_DI.toLowerCase().includes('dni') ||
             doc.NOM_DI.toLowerCase().includes('documento nacional')
  ) || null;
};

// Hook principal para manejar valores por defecto
export const useDefaultValues = ({ 
  comboData, 
  showFullForm, 
  formData, 
  handleInputChange 
}: UseDefaultValuesProps) => {
  
  // Effect para valores por defecto - solo se ejecutan cuando se muestra el formulario completo
  useEffect(() => {
    if (comboData && showFullForm && !formData.TIPO_NAC) {
      const peruCode = getPeruNacionalidad(comboData);
      if (peruCode) {
        handleInputChange('TIPO_NAC', peruCode);
      }
    }
  }, [comboData, showFullForm, formData.TIPO_NAC, handleInputChange]);

  useEffect(() => {
    if (comboData && showFullForm && !formData.TIPO_PERSONA) {
      const tipoPersona = getTipoPersona(comboData);
      if (tipoPersona) {
        handleInputChange('TIPO_PERSONA', tipoPersona);
      }
    }
  }, [comboData, showFullForm, formData.TIPO_PERSONA, handleInputChange]);

  useEffect(() => {
    if (comboData && showFullForm && !formData.TIPO_SOCIO) {
      const tipoSocio = getTipoSocio(comboData);
      if (tipoSocio) {
        handleInputChange('TIPO_SOCIO', tipoSocio);
      }
    }
  }, [comboData, showFullForm, formData.TIPO_SOCIO, handleInputChange]);

  useEffect(() => {
    if (comboData && showFullForm && !formData.EST_SOCIO) {
      const situacion = getSituacion(comboData);
      if (situacion) {
        handleInputChange('EST_SOCIO', situacion);
      }
    }
  }, [comboData, showFullForm, formData.EST_SOCIO, handleInputChange]);

  // Funciones utilitarias que se pueden usar directamente
  return {
    getPeruNacionalidad: () => getPeruNacionalidad(comboData),
    getTipoPersona: () => getTipoPersona(comboData),
    getTipoSocio: () => getTipoSocio(comboData),
    getSituacion: () => getSituacion(comboData),
    getDNIDocument: () => getDNIDocument(comboData)
  };
};