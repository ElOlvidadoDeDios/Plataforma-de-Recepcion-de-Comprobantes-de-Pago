export interface PersonData {
  NVA_CTA: string;
  AGE: string;
  TIPO_IDEN: string;
  DOC_IDEN: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRES: string;
  FECHA_APERT: string;
  FECHA_NAC: string;
  LUGAR_NAC: string;
  TIPO_PERSONA: string;
  TIPO_NAC: string;
  SEXO: 'M' | 'F' | '';
  TIPO_ECIV: string;
  TIPO_VIV: string;
  TLF_CELULAR: string;
  TLF_CELULAR2: string;
  TLF_CASA: string;
  TLF_CASA2: string;
  TIPO_INST: string;
  TIPO_PROF: string;
  OCUPACION: string;
  TIPO_ACTI: string;
  EMAIL: string;
  TIPO_SOCIO: string;
  COD_USER: string;
  EST_SOCIO: string;
  SITUACION?: string;
}


// Interface para los datos de dirección de la API
export interface DatosDireccionApi {
  CUENTA: string;
  TIPO_DIR: string;
  TIPO_VIA: string;
  NOM_VIA: string;
  NUMERO: string;
  INTERIOR: string;
  TIPO_ZONA: string;
  NOM_ZONA: string;
  REFERENCIA: string;
  DPTO: string;
  PROV: string;
  DIST: string;
  TIPO_SECTOR: string;
  DIRECCION: string;
}


export interface TipoDocumento {
  TIPO_DI: string;
  NOM_DI: string;
  NCARACTER: string;
}

// Interface para los datos básicos del cliente
export interface DatosBasicos {
  NVA_CTA: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRES: string;
}

// Usar la interfaz que ya existe para sectores
export interface DireccionData {
  cuenta: string;
  socio: string;
  tipo_direccion: string;
  tipo_via: string;
  nombre: string;
  numero: string;
  interior: string;
  zona: string;
  nombre_zona: string;
  departamento: string;
  provincia: string;
  distrito: string;
  sector: string;
  referencia: string;
}

// Interface para los datos de dirección de la API
export interface DatosDireccionApi {
  CUENTA: string;
  TIPO_DIR: string;
  TIPO_VIA: string;
  NOM_VIA: string;
  NUMERO: string;
  INTERIOR: string;
  TIPO_ZONA: string;
  NOM_ZONA: string;
  REFERENCIA: string;
  DPTO: string;
  PROV: string;
  DIST: string;
  TIPO_SECTOR: string;
  DIRECCION: string;
}

export interface RegistroDireccionProps {
  datosBasicos: DatosBasicos;
  datosDireccionApi?: DatosDireccionApi | null;
}

export const SelectField = ({
  label,
  value,
  options,
  onChange,
  disabled,
  loading,
  required = false,
  showDefaultOption = true,
  className = '',
  placeholder = 'Seleccione una opción',
}: {
  label: string;
  value: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  showDefaultOption?: boolean;
  className?: string;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border ${required && !value && !disabled ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${required && !value && !disabled ? 'focus:ring-red-500' : 'focus:ring-blue-500'} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
    >
      {loading ? (
        <option>Cargando...</option>
      ) : options?.length ? (
        <>
          {showDefaultOption && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </>
      ) : (
        <option disabled>No hay opciones disponibles</option>
      )}
    </select>
  </div>
);

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  labelClassName = '',
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  placeholder?: string;
  maxLength?: number;
}) => (
  <div>
    <label className={`block text-sm font-medium mb-1 ${labelClassName || 'text-gray-700'}`}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full border ${required && !value && !disabled ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${required && !value && !disabled ? 'focus:ring-red-500' : 'focus:ring-blue-500'} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
    />
  </div>
);

export const RadioGroup = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="flex items-center gap-4 mt-2">
      {options.map((opt) => (
        <label key={opt.value} className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name={label}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => !disabled && onChange(opt.value)}
            disabled={disabled}
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// Componente para mostrar el estado de situación
export const SituacionBadge = ({ situacion }: { situacion?: string }) => {
  if (!situacion) return null;
  
  const isPreAfiliado = situacion === 'PRE_AFILIADO';
  const isAfiliado = situacion === 'AFILIADO';
  
  const badgeClass = isPreAfiliado
    ? 'bg-red-100 text-red-800 border-red-200'
    : isAfiliado
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';
  
  const icon = isPreAfiliado ? '⚠️' : isAfiliado ? '✅' : '❓';
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${badgeClass}`}>
      <span>{icon}</span>
      <span>{situacion.replace('_', ' ')}</span>
    </div>
  );
};



// Interface para los datos de respuesta de la API
export interface ResponseData {
  SITUACION?: string;
  DATOS?: {
    CUENTA?: string;
    AGENCIA?: string;
    TIPO_DI?: string;
    NRO_DI?: string;
    APE_PATERNO?: string;
    APE_MATERNO?: string;
    NOMBRE?: string;
    FECHA_APERTURA?: string;
    FECHA_NAC?: string;
    LUGAR_NAC?: string;
    TIPO_PERSONA?: string;
    TIPO_NAC?: string;
    SEXO?: string;
    EST_CIVIL?: string;
    TIPO_VIVIENDA?: string;
    TLF_CEL1?: string;
    TLD_CEL2?: string;
    TLF_FIJO1?: string;
    TLF_FIJO2?: string;
    TIPO_INSTRUCCION?: string;
    TIPO_PROFESION?: string;
    OCUPACION?: string;
    TIPO_ACTI?: string;
    EMAIL?: string;
    TIPO_SOCIO?: string;
    EST_SOCIO?: string;
  };
  DIRECCION?: {
    CUENTA?: string;
    TIPO_DIR?: string;
    TIPO_VIA?: string;
    NOM_VIA?: string;
    NUMERO?: string;
    INTERIOR?: string;
    TIPO_ZONA?: string;
    NOM_ZONA?: string;
    REFERENCIA?: string;
    DPTO?: string;
    PROV?: string;
    DIST?: string;
    TIPO_SECTOR?: string;
    DIRECCION?: string;
  };
}

/**
 * Función utilitaria para mapear datos de respuesta de la API a PersonData
 * @param response - Datos de respuesta de la API
 * @param formData - Datos actuales del formulario
 * @returns PersonData mapeado
 */
export function mapResponseToPersonData(response: ResponseData, formData: PersonData): PersonData {
  const fieldMappings: Record<keyof PersonData, { responseKey?: string; formatter?: (value?: any) => any; fromDireccion?: boolean }> = {
    NVA_CTA: { fromDireccion: true }, // CUENTA viene de DIRECCION
    AGE: { responseKey: 'AGENCIA' },
    TIPO_IDEN: { responseKey: 'TIPO_DI' },
    DOC_IDEN: { responseKey: 'NRO_DI' },
    APE_PAT: { responseKey: 'APE_PATERNO' },
    APE_MAT: { responseKey: 'APE_MATERNO' },
    NOMBRES: { responseKey: 'NOMBRE' },
    FECHA_APERT: {
      responseKey: 'FECHA_APERTURA',
      formatter: (value?: string) => value ? value.split(' ')[0] : '',
    },
    FECHA_NAC: {
      responseKey: 'FECHA_NAC',
      formatter: (value?: string) => value ? value.split(' ')[0] : '',
    },
    LUGAR_NAC: { responseKey: 'LUGAR_NAC' },
    TIPO_PERSONA: { responseKey: 'TIPO_PERSONA' },
    TIPO_NAC: { responseKey: 'TIPO_NAC' },
    SEXO: {
      responseKey: 'SEXO',
      formatter: (value?: string) => (value === "M" || value === "F") ? value : "" as "" | "M" | "F",
    },
    TIPO_ECIV: { responseKey: 'EST_CIVIL' },
    TIPO_VIV: { responseKey: 'TIPO_VIVIENDA' },
    TLF_CELULAR: { responseKey: 'TLF_CEL1' },
    TLF_CELULAR2: { responseKey: 'TLD_CEL2' },
    TLF_CASA: { responseKey: 'TLF_FIJO1' },
    TLF_CASA2: { responseKey: 'TLF_FIJO2' },
    TIPO_INST: { responseKey: 'TIPO_INSTRUCCION' },
    TIPO_PROF: { responseKey: 'TIPO_PROFESION' },
    OCUPACION: { responseKey: 'OCUPACION' },
    TIPO_ACTI: { responseKey: 'TIPO_ACTI' },
    EMAIL: { responseKey: 'EMAIL' },
    TIPO_SOCIO: { responseKey: 'TIPO_SOCIO' },
    COD_USER: { formatter: () => formData.COD_USER },
    EST_SOCIO: { responseKey: 'EST_SOCIO' },
    SITUACION: { formatter: () => '' },
  };

  const result: Partial<PersonData> = {};
  (Object.keys(fieldMappings) as Array<keyof PersonData>).forEach((key) => {
    const { responseKey, formatter, fromDireccion } = fieldMappings[key];
    
    let responseValue: any = undefined;
    
    if (fromDireccion) {
      // Para CUENTA, tomar de DIRECCION
      responseValue = response.DIRECCION?.CUENTA;
    } else if (responseKey && response.DATOS) {
      // Para otros campos, tomar de DATOS si existe
      responseValue = response.DATOS[responseKey as keyof ResponseData['DATOS']];
    }
    
    const value = responseValue !== undefined ? responseValue : (formData as any)[key];
    result[key] = formatter ? formatter(value) : value;
  });

  // Manejar SITUACION especialmente ya que viene del root del response
  result.SITUACION = response.SITUACION || formData.SITUACION;

  return result as PersonData;
}


/**
 * Función utilitaria para crear un objeto PersonData inicial/limpio
 * @param overrides - Campos específicos para sobrescribir los valores por defecto
 * @returns PersonData con valores iniciales
 */
export function createInitialPersonData(overrides?: Partial<PersonData>): PersonData {
  const initialData: PersonData = {
    NVA_CTA: '<AUTOMATICO>',
    AGE: '',
    TIPO_IDEN: '',
    DOC_IDEN: '',
    APE_PAT: '',
    APE_MAT: '',
    NOMBRES: '',
    FECHA_APERT: new Date().toISOString().split('T')[0],
    FECHA_NAC: '',
    LUGAR_NAC: '',
    TIPO_PERSONA: '',
    TIPO_NAC: '',
    SEXO: '' as "" | "M" | "F",
    TIPO_ECIV: '',
    TIPO_VIV: '',
    TLF_CELULAR: '',
    TLF_CELULAR2: '',
    TLF_CASA: '',
    TLF_CASA2: '',
    TIPO_INST: '',
    TIPO_PROF: '',
    OCUPACION: '',
    TIPO_ACTI: '',
    EMAIL: '',
    TIPO_SOCIO: '',
    COD_USER: '',
    EST_SOCIO: '',
  };

  return { ...initialData, ...overrides };
}
