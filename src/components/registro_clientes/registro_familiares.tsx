import { useState, useEffect, useContext } from 'react';
import { useComboBoxFamiliarOpcionesData, type FamiliarOpciones } from '../../api/afiliacionAPi';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

// Interfaces
interface DatosBasicos {
  NVA_CTA: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRES: string;
  SITUACION?: string; // Campo para verificar que sea AFILIADO
}

interface FamiliarData {
  ITEM: string;
  CUENTA: string;
  APE_PATERNO: string;
  APE_MATERNO: string;
  NOMBRE: string;
  FECHA_NAC: string;
  TIPO_PAREN: string;
  SEXO: string;
  TELEFONO: string;
  EMAIL: string;
  TIPO_DI: string;
  NRO_DI: string;
  TUTOR: string;
  BENEFICIARIO: string;
  PORC_BENEF: string;
  DIRECCION_REF: string;
  COD_USER: string;
}

interface RegistroFamiliaresProps {
  formData: FamiliarData;
  onInputChange: (field: keyof FamiliarData, value: string) => void;
  datosBasicos: DatosBasicos;
  onSubmit?: () => void;
}

// Componente reutilizable para inputs
const FormInput = ({
  label,
  value,
  onChange,
  field,
  type = "text",
  placeholder = "",
  required = false,
  readOnly = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (field: keyof FamiliarData, value: string) => void;
  field: keyof FamiliarData;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
    />
  </div>
);

// Componente reutilizable para selects
const FormSelect = ({
  label,
  value,
  onChange,
  field,
  options = [],
  required = false,
  getOptionLabel = (opt: any) => opt.NOM_TPAREN || opt.NOM_DI,
  getOptionValue = (opt: any) => opt.TIPO_PAREN || opt.TIPO_DI,
}: {
  label: string;
  value: string;
  onChange: (field: keyof FamiliarData, value: string) => void;
  field: keyof FamiliarData;
  options?: any[];
  required?: boolean;
  getOptionLabel?: (opt: any) => string;
  getOptionValue?: (opt: any) => string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors bg-white"
      required={required}
    >
      <option value="">Seleccione una opción</option>
      {options.map((opt) => (
        <option key={getOptionValue(opt)} value={getOptionValue(opt)}>
          {getOptionLabel(opt)}
        </option>
      ))}
    </select>
    {value && (
      <p className="mt-1 text-xs text-gray-500">
        Seleccionado: {options.find((o) => getOptionValue(o) === value)?.NOM_TPAREN || options.find((o) => getOptionValue(o) === value)?.NOM_DI} (Código: {value})
      </p>
    )}
  </div>
);

// Componente principal
export default function RegistroFamiliares({ formData, onInputChange, datosBasicos, onSubmit }: RegistroFamiliaresProps) {
  const [familiarOpciones, setFamiliarOpciones] = useState<FamiliarOpciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 🔐 OBTENER USUARIO DEL CONTEXTO DE AUTENTICACIÓN (igual que en registro_datos.tsx)
  const { user } = useContext(AuthContext);
  // 📢 HOOK PARA NOTIFICACIONES PROFESIONALES
  const notifications = useNotifications();

  // Cargar opciones de la API al montar el componente
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        setLoading(true);
        const opciones = await useComboBoxFamiliarOpcionesData();
        setFamiliarOpciones(opciones);
      } catch (error) {
        notifications.error('Error al cargar opciones de familiar. Por favor recargue la página.');
      } finally {
        setLoading(false);
      }
    };
    cargarOpciones();
  }, []);

  // Inicializar ITEM con valor 1 por defecto
  useEffect(() => {
    if (!formData.ITEM) {
      onInputChange('ITEM', '1');
    }
  }, []);

  // Función para enviar datos del familiar
  const handleSubmit = async () => {
    // 🚨 VALIDAR QUE EL SOCIO ESTÉ AFILIADO ANTES DE PERMITIR REGISTRAR FAMILIARES
    if (!datosBasicos.SITUACION || datosBasicos.SITUACION !== 'AFILIADO') {
      notifications.warning(
        `Solo se pueden registrar familiares/beneficiarios para socios con situación "AFILIADO".\n\nSituación actual: ${datosBasicos.SITUACION || 'No definida'}`,
        { duration: 6000, icon: '👥' }
      );
      return;
    }

    // 🔐 VALIDAR QUE EXISTA USUARIO AUTENTICADO
    if (!user?.user) {
      notifications.error('No se encontró información del usuario autenticado', { icon: '🔐' });
      return;
    }

    if (!formData.APE_PATERNO || !formData.NOMBRE || !formData.TIPO_PAREN) {
      notifications.validation('Campos obligatorios faltantes', [
        'Apellido Paterno',
        'Nombres',
        'Vínculo Familiar'
      ]);
      return;
    }

    try {
      setSubmitting(true);

      // 🚀 DATOS COMPLETOS PARA ENVIAR A LA API
      const datosFamiliar = {
        ...formData,
        // Convertir campos de texto a mayúsculas
        APE_PATERNO: formData.APE_PATERNO?.toUpperCase() || '',
        APE_MATERNO: formData.APE_MATERNO?.toUpperCase() || '',
        NOMBRE: formData.NOMBRE?.toUpperCase() || '',
        DIRECCION_REF: formData.DIRECCION_REF?.toUpperCase() || '',
        EMAIL: formData.EMAIL?.toLowerCase() || '', // Email en minúsculas por convención
        ITEM: 1, // Fijo en 1 (número)
        CUENTA: datosBasicos.NVA_CTA,
        COD_USER: user.user, // Usuario autenticado
        // Asegurar valores por defecto para campos opcionales
        TUTOR: formData.TUTOR || 'N',
        BENEFICIARIO: formData.BENEFICIARIO || 'false',
        PORC_BENEF: parseInt(formData.PORC_BENEF) || 0, // Convertir a número
      };

      // 🎯 LLAMAR A LA API REAL PARA GUARDAR EN BD
      const { familiarSocioProceso } = await import('../../api/afiliacionAPi');
      const response = await familiarSocioProceso(datosFamiliar);

      if (response === true) {
        notifications.success('Familiar registrado exitosamente', { icon: '👨‍👩‍👧‍👦' });
        
        // Limpiar formulario después del envío exitoso
        Object.keys(formData).forEach((key) => {
          onInputChange(key as keyof FamiliarData, '');
        });

        if (onSubmit) {
          onSubmit();
        }
      } else {
        notifications.error('Error al registrar el familiar. Por favor intente nuevamente.');
      }
    } catch (error) {
      notifications.error('Error al procesar el familiar. Por favor intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto p-6 bg-white shadow-lg rounded-lg bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando opciones...</span>
        </div>
      </div>
    );
  }

  const puedeRegistrarFamiliares = datosBasicos.SITUACION === 'AFILIADO';

  return (
    <div className="mx-auto p-6 bg-white shadow-lg rounded-lg bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      {/* 🚨 ALERTA SI NO PUEDE REGISTRAR FAMILIARES */}
      {!puedeRegistrarFamiliares && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-xl">⚠️</span>
            <h3 className="font-bold">No se pueden registrar familiares/beneficiarios</h3>
          </div>
          <p className="text-red-700 mt-2">
            Solo se pueden registrar familiares para socios con situación <strong>"AFILIADO"</strong>.
          </p>
          <p className="text-red-600 text-sm mt-1">
            Situación actual: <span className="font-mono bg-red-100 px-2 py-1 rounded">{datosBasicos.SITUACION || 'No definida'}</span>
          </p>
        </div>
      )}
      {/* Sección Superior con Cuenta y Socio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 italic mb-6 pb-4 border-b border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
          <input
            type="text"
            value={datosBasicos.NVA_CTA}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Socio</label>
          <input
            type="text"
            value={`${datosBasicos.APE_PAT} ${datosBasicos.APE_MAT} ${datosBasicos.NOMBRES}`.trim()}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
            readOnly
          />
        </div>
      </div>

      <form className="space-y-6">
        {/* Apellidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Apellido Paterno"
            value={formData.APE_PATERNO}
            onChange={onInputChange}
            field="APE_PATERNO"
            placeholder="Ingrese apellido paterno"
            required
          />
          <FormInput
            label="Apellido Materno"
            value={formData.APE_MATERNO}
            onChange={onInputChange}
            field="APE_MATERNO"
            placeholder="Ingrese apellido materno"
          />
        </div>

        {/* Nombres */}
        <FormInput
          label="Nombres"
          value={formData.NOMBRE}
          onChange={onInputChange}
          field="NOMBRE"
          placeholder="Ingrese nombres completos"
          required
        />

        {/* Fecha de Nacimiento y Vínculo Familiar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Fecha de Nacimiento"
            value={formData.FECHA_NAC}
            onChange={onInputChange}
            field="FECHA_NAC"
            type="date"
          />
          <FormSelect
            label="Vínculo Familiar"
            value={formData.TIPO_PAREN}
            onChange={onInputChange}
            field="TIPO_PAREN"
            options={familiarOpciones?.TIPO_VINCULO_FAMILIAR || []}
            required
          />
        </div>

        {/* Sexo */}
        <FormSelect
          label="Sexo"
          value={formData.SEXO}
          onChange={onInputChange}
          field="SEXO"
          options={[
            { TIPO_DI: 'M', NOM_DI: 'MASCULINO' },
            { TIPO_DI: 'F', NOM_DI: 'FEMENINO' },
          ]}
          getOptionLabel={(opt) => opt.NOM_DI}
          getOptionValue={(opt) => opt.TIPO_DI}
        />

        {/* Tipo de Documento y Número */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            label="Tipo de Documento"
            value={formData.TIPO_DI}
            onChange={onInputChange}
            field="TIPO_DI"
            options={familiarOpciones?.TIPO_DOCUMENTO || []}
          />
          <FormInput
            label="Nro de Documento"
            value={formData.NRO_DI}
            onChange={onInputChange}
            field="NRO_DI"
            placeholder="Ingrese número de documento"
          />
        </div>

        {/* Teléfono y Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Nro. celular"
            value={formData.TELEFONO}
            onChange={onInputChange}
            field="TELEFONO"
            placeholder="Ej: +51 999 999 999"
          />
          <FormInput
            label="Email"
            value={formData.EMAIL}
            onChange={onInputChange}
            field="EMAIL"
            type="email"
            placeholder="ejemplo@correo.com"
          />
        </div>

        {/* Dirección */}
        <FormInput
          label="Dirección"
          value={formData.DIRECCION_REF}
          onChange={onInputChange}
          field="DIRECCION_REF"
          placeholder="Ingrese dirección completa"
        />

        {/* Beneficiario y Porcentaje */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-md">
            <input
              type="checkbox"
              id="BENEFICIARIO"
              checked={formData.BENEFICIARIO === 'true'}
              onChange={(e) => onInputChange("BENEFICIARIO", e.target.checked ? "true" : "false")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="BENEFICIARIO" className="text-sm font-medium text-gray-700">
              Es beneficiario
            </label>
          </div>
          {formData.BENEFICIARIO === 'true' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Porcentaje de Beneficio:</label>
              <input
                type="number"
                value={formData.PORC_BENEF}
                onChange={(e) => onInputChange("PORC_BENEF", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                placeholder="0"
                min="0"
                max="100"
              />
              <p className="mt-1 text-xs text-gray-500">Ingrese el porcentaje (0-100)</p>
            </div>
          )}
        </div>

        {/* Tutor e Item */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            label="Es Tutor"
            value={formData.TUTOR}
            onChange={onInputChange}
            field="TUTOR"
            options={[
              { TIPO_DI: 'N', NOM_DI: 'NO' },
              { TIPO_DI: 'S', NOM_DI: 'SÍ' },
            ]}
            getOptionLabel={(opt) => opt.NOM_DI}
            getOptionValue={(opt) => opt.TIPO_DI}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item:</label>
            <input
              type="number"
              value="1"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
              readOnly
              disabled
              title="Campo no editable - Valor fijo: 1"
            />
            <p className="mt-1 text-xs text-gray-500">Campo automático, no editable (siempre 1)</p>
          </div>
        </div>

        {/* Botón para guardar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !puedeRegistrarFamiliares}
            className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
              !puedeRegistrarFamiliares
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : submitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={!puedeRegistrarFamiliares ? 'Solo disponible para socios con situación AFILIADO' : ''}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : !puedeRegistrarFamiliares ? (
              'Registro no disponible'
            ) : (
              'Registrar Familiar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
