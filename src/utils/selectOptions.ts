import { useMemo } from 'react';

// Interfaces para las opciones de select
export interface SelectOption {
  value: string;
  label: string;
}

// Interfaces locales para evitar dependencias circulares
interface Nacionalidad {
  TIPO_NAC: string;
  NOM_NAC: string;
}

interface EstadoCivil {
  EST_CIVIL: string;
  NOM_ECIVIL: string;
}

interface TipoVivienda {
  TIPO_VIVIENDA: string;
  NOM_VIVIENDA: string;
}

interface NivelInstruccion {
  TIPO_INSTRUCCION: string;
  NOM_TINSTRUC: string;
}

interface TipoProfesion {
  TIPO_PROFESION: string;
  NOM_TPROF: string;
}

interface ActividadEconomica {
  TIPO_ACTI: string;
  NOM_ACTI: string;
}

interface TipoSocio {
  TIPO_SOCIO: string;
  NOM_TSOCIO: string;
}

interface EstadoSocio {
  EST_SOCIO: string;
  NOM_ESOCIO: string;
}

interface TipoPersona {
  TIPO_PERSONA: string;
  NOM_TPERSONA: string;
}

interface ComboBoxData {
  NACIONALIDAD?: Nacionalidad[];
  ESTADO_CIVIL?: EstadoCivil[];
  TIPO_VIVIENDA?: TipoVivienda[];
  NIVEL_INSTRUCCION?: NivelInstruccion[];
  TIPO_PROFESION?: TipoProfesion[];
  ACTIVIDAD_ECONOMICA?: ActividadEconomica[];
  TIPO_SOCIO?: TipoSocio[];
  ESTADO_SOCIO?: EstadoSocio[];
  TIPO_PERSONA?: TipoPersona[];
}

// Hook personalizado para generar opciones de select reutilizables
export const useSelectOptions = (comboData: ComboBoxData | null) => {
  // Opciones para nacionalidad
  const nacionalidadOptions = useMemo(
    () =>
      comboData?.NACIONALIDAD?.map((nac: Nacionalidad) => ({
        value: nac.TIPO_NAC,
        label: nac.NOM_NAC,
      })) || [],
    [comboData?.NACIONALIDAD],
  );

  // Opciones para estado civil
  const estadoCivilOptions = useMemo(
    () =>
      comboData?.ESTADO_CIVIL?.map((estado: EstadoCivil) => ({
        value: estado.EST_CIVIL,
        label: estado.NOM_ECIVIL,
      })) || [],
    [comboData?.ESTADO_CIVIL],
  );

  // Opciones para tipo de vivienda
  const viviendaOptions = useMemo(
    () =>
      comboData?.TIPO_VIVIENDA?.map((vivienda: TipoVivienda) => ({
        value: vivienda.TIPO_VIVIENDA,
        label: vivienda.NOM_VIVIENDA,
      })) || [],
    [comboData?.TIPO_VIVIENDA],
  );

  // Opciones para nivel de instrucción
  const instruccionOptions = useMemo(
    () =>
      comboData?.NIVEL_INSTRUCCION?.map((instruccion: NivelInstruccion) => ({
        value: instruccion.TIPO_INSTRUCCION,
        label: instruccion.NOM_TINSTRUC,
      })) || [],
    [comboData?.NIVEL_INSTRUCCION],
  );

  // Opciones para tipo de profesión
  const profesionOptions = useMemo(
    () =>
      comboData?.TIPO_PROFESION?.map((profesion: TipoProfesion) => ({
        value: profesion.TIPO_PROFESION,
        label: profesion.NOM_TPROF,
      })) || [],
    [comboData?.TIPO_PROFESION],
  );

  // Opciones para actividad económica
  const actividadEconomicaOptions = useMemo(
    () =>
      comboData?.ACTIVIDAD_ECONOMICA?.map((actividad: ActividadEconomica) => ({
        value: actividad.TIPO_ACTI,
        label: actividad.NOM_ACTI,
      })) || [],
    [comboData?.ACTIVIDAD_ECONOMICA],
  );

  // Opciones para tipo de socio
  const tipoSocioOptions = useMemo(
    () =>
      comboData?.TIPO_SOCIO?.map((tipo: TipoSocio) => ({
        value: tipo.TIPO_SOCIO,
        label: tipo.NOM_TSOCIO,
      })) || [],
    [comboData?.TIPO_SOCIO],
  );

  // Opciones para estado del socio
  const estadoSocioOptions = useMemo(
    () =>
      comboData?.ESTADO_SOCIO?.map((estado: EstadoSocio) => ({
        value: estado.EST_SOCIO,
        label: estado.NOM_ESOCIO,
      })) || [],
    [comboData?.ESTADO_SOCIO],
  );

  // Opciones para tipo de persona
  const tipoPersonaOptions = useMemo(
    () =>
      comboData?.TIPO_PERSONA?.map((tipo: TipoPersona) => ({
        value: tipo.TIPO_PERSONA,
        label: tipo.NOM_TPERSONA,
      })) || [],
    [comboData?.TIPO_PERSONA],
  );

  // Opciones para sexo (estáticas)
  const sexoOptions: SelectOption[] = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
  ];

  return {
    nacionalidadOptions,
    estadoCivilOptions,
    viviendaOptions,
    instruccionOptions,
    profesionOptions,
    actividadEconomicaOptions,
    tipoSocioOptions,
    estadoSocioOptions,
    tipoPersonaOptions,
    sexoOptions,
  };
};

// Funciones utilitarias para obtener opciones específicas
export const createSelectOptions = <T extends Record<string, any>>(
  data: T[] | undefined,
  valueKey: keyof T,
  labelKey: keyof T
): SelectOption[] => {
  return data?.map((item: T) => ({
    value: item[valueKey] as string,
    label: item[labelKey] as string,
  })) || [];
};