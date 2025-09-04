//componente padre de registro datos
import { memo, useContext, useEffect, useState, useCallback } from 'react';
import { SessionManager } from '../../utils/sessionManager';
import { ClienteData } from '../../api/registroDeclientesApi';
import { Search } from 'lucide-react';
import { useComboBoxData, saveCliente, useComboBoxrellenarData } from '../../api/registroDeclientesApi';
import { AGENCIAS } from '../../types/index';
import { AuthContext } from '../../contexts/AuthContext';
import { verificarSocioReniec } from '../../api/geodileApi';
import {PersonData, TipoDocumento, SelectField, InputField, RadioGroup, DatosDireccionApi, DatosBasicos, ResponseData, mapResponseToPersonData, createInitialPersonData, SituacionBadge} from './FormFields';
import { useRegistroClienteUtils } from '../../hooks/useRegistroClienteUtils';



export const DatosForm = memo(
  ({ onSave, onClear, onDatosBasicosChange, onDatosDireccionChange }: {
    onSave: () => void;
    onClear: () => void;
    onDatosBasicosChange?: (datos: DatosBasicos) => void;
    onDatosDireccionChange?: (datosDireccion: DatosDireccionApi | null) => void;
  }) => {
    const [formData, setFormData] = useState<PersonData>(() => createInitialPersonData());

    const [selectedDocType, setSelectedDocType] = useState<string>('');
    const [docError, setDocError] = useState<string>('');
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [showFullForm, setShowFullForm] = useState<boolean>(false); // Estado para mostrar/ocultar campos
    const [hasSearchedDNI, setHasSearchedDNI] = useState<boolean>(false); // Estado para saber si ya se buscó
    const [isExistingSocio, setIsExistingSocio] = useState<boolean>(false); // Estado para saber si el socio ya existe en la DB
    
    const { comboData, loading: comboLoading, error: comboError } = useComboBoxData();
    const { user } = useContext(AuthContext);
    const userData = user;
    const agenciaNombre = userData?.id_age
      ? Object.keys(AGENCIAS).find((key) => AGENCIAS[key as keyof typeof AGENCIAS] === userData.id_age)
      : '';

    const handleInputChange = useCallback(
      (field: keyof PersonData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      },
      [],
    );

    // Usar el hook de utilidades combinado
    const {
      // Opciones de select
      nacionalidadOptions,
      estadoCivilOptions,
      viviendaOptions,
      instruccionOptions,
      profesionOptions,
      actividadEconomicaOptions,
      tipoSocioOptions,
      estadoSocioOptions,
      tipoPersonaOptions,
      // Funciones utilitarias
      validateDocumentLength: validateDoc,
      getDNIDocument
      // Las funciones getPeruNacionalidad, getTipoPersona, getTipoSocio, getSituacion
      // no se necesitan aquí porque los valores por defecto se asignan automáticamente
      // a través de los effects en useDefaultValues
    } = useRegistroClienteUtils({
      comboData,
      showFullForm,
      formData,
      handleInputChange
    });


  const searchByDNI = useCallback(async () => {
    if (!formData.DOC_IDEN || !selectedDocType) return;
    setSearchLoading(true);
    
    // LIMPIAR EL FORMULARIO ANTES DE BUSCAR
    const formDataLimpio = createInitialPersonData({
      AGE: formData.AGE,
      TIPO_IDEN: selectedDocType,
      DOC_IDEN: formData.DOC_IDEN,
    });
    
    // Actualizar el formulario con datos limpios primero
    setFormData(formDataLimpio);
    
    try {
      const response = await useComboBoxrellenarData(selectedDocType, formData.DOC_IDEN);
      
        // Los datos vienen de la base de datos - SOCIO EXISTE - BLOQUEAR EDICIÓN
        setIsExistingSocio(true);
        
      if (response?.DATOS) {
        // Usar la función utilitaria para mapear los datos
        const mappedData = mapResponseToPersonData(response as ResponseData, formDataLimpio);
        
        // Actualizar el formulario con los datos mapeados
        setFormData(mappedData);

        // Verificar si hay datos completos de dirección (más allá de solo CUENTA)
        if (response.DIRECCION && onDatosDireccionChange) {
          // Verificar si hay campos de dirección con datos reales (no solo CUENTA)
          const hasCompleteAddressData =
            response.DIRECCION.TIPO_DIR ||
            response.DIRECCION.TIPO_VIA ||
            response.DIRECCION.NOM_VIA ||
            response.DIRECCION.NUMERO ||
            response.DIRECCION.TIPO_ZONA ||
            response.DIRECCION.NOM_ZONA ||
            response.DIRECCION.DPTO ||
            response.DIRECCION.PROV ||
            response.DIRECCION.DIST ||
            response.DIRECCION.DIRECCION;

          if (hasCompleteAddressData) {
            // Solo si hay datos completos de dirección, crear el objeto
            const direccionData: DatosDireccionApi = {
              CUENTA: response.DIRECCION.CUENTA || '',
              TIPO_DIR: response.DIRECCION.TIPO_DIR || '',
              TIPO_VIA: response.DIRECCION.TIPO_VIA || '',
              NOM_VIA: response.DIRECCION.NOM_VIA || '',
              NUMERO: response.DIRECCION.NUMERO || '',
              INTERIOR: response.DIRECCION.INTERIOR || '',
              TIPO_ZONA: response.DIRECCION.TIPO_ZONA || '',
              NOM_ZONA: response.DIRECCION.NOM_ZONA || '',
              REFERENCIA: response.DIRECCION.REFERENCIA || '',
              DPTO: response.DIRECCION.DPTO || '',
              PROV: response.DIRECCION.PROV || '',
              DIST: response.DIRECCION.DIST || '',
              TIPO_SECTOR: response.DIRECCION.TIPO_SECTOR || '',
              DIRECCION: response.DIRECCION.DIRECCION || '',
            };
            onDatosDireccionChange(direccionData);
          } else {
            // Si solo hay CUENTA pero no datos completos de dirección, notificar null
            onDatosDireccionChange(null);
          }
        } else if (onDatosDireccionChange) {
          // Si no hay datos de dirección, notificar null
          onDatosDireccionChange(null);
        }
        
      } else {
        // Los datos NO vienen de la base de datos - SOCIO NUEVO - PERMITIR EDICIÓN
        setIsExistingSocio(false);
        
        // Si no hay datos en la respuesta, intentar con RENIEC
        const datosReniec = await verificarSocioReniec(formData.DOC_IDEN);
        if (datosReniec) {
          const datosConReniec = {
            ...formDataLimpio, // Usar los datos ya limpios
            APE_PAT: datosReniec.apellido_paterno || '',
            APE_MAT: datosReniec.apellido_materno || '',
            NOMBRES: datosReniec.nombres || '',
          };
          setFormData(datosConReniec);
        }
        // Si no hay datos de RENIEC, el formulario queda limpio
        // No hay datos de dirección, notificar null
        if (onDatosDireccionChange) {
          onDatosDireccionChange(null);
        }
      }
      
      setShowFullForm(true);
      setHasSearchedDNI(true);
      
    } catch (error) {
      // En caso de error, seguir con el flujo normal pero mostrar el formulario
      setShowFullForm(true);
      setHasSearchedDNI(true);
    } finally {
      setSearchLoading(false);
    }
  }, [formData.DOC_IDEN, selectedDocType]);

  // Effect para notificar cambios en los datos básicos
  useEffect(() => {
    if (onDatosBasicosChange) {
      const datosBasicos: DatosBasicos = {
        NVA_CTA: formData.NVA_CTA || '',
        APE_PAT: formData.APE_PAT || '',
        APE_MAT: formData.APE_MAT || '',
        NOMBRES: formData.NOMBRES || ''
      };
      onDatosBasicosChange(datosBasicos);
    }
  }, [formData.NVA_CTA, formData.APE_PAT, formData.APE_MAT, formData.NOMBRES, onDatosBasicosChange]);

    const validateDocumentLength = (value: string, docType: string) => {
      const validation = validateDoc(value, docType);
      if (!validation.isValid) {
        setDocError(validation.error);
        return false;
      }
      setDocError('');
      return true;
    };

    const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedDocType(e.target.value);
      handleInputChange('TIPO_IDEN', e.target.value);
      setDocError('');
    };

    const handleDocNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      handleInputChange('DOC_IDEN', value);
      if (selectedDocType) {
        validateDocumentLength(value, selectedDocType);
      }
    };

    const handleSearchByDNI = () => {
      if (!selectedDocType) {
        setDocError('Seleccione un tipo de documento.');
        return;
      }
      if (validateDocumentLength(formData.DOC_IDEN, selectedDocType)) {
        searchByDNI();
      }
    };

    const handleClear = () => {
      // Obtener el tipo de DNI para mantenerlo seleccionado
      const dniDoc = comboData?.TIPO_DOCUMENTO?.find(
        (doc) => doc.NOM_DI.toLowerCase().includes('dni') ||
                 doc.NOM_DI.toLowerCase().includes('documento nacional')
      );
      
      const clearedData = createInitialPersonData({
        TIPO_IDEN: dniDoc ? dniDoc.TIPO_DI : '',
      });
      
      setFormData(clearedData);
      setSelectedDocType(dniDoc ? dniDoc.TIPO_DI : '');
      setDocError('');
      setShowFullForm(false); // Ocultar el formulario completo
      setHasSearchedDNI(false); // Resetear el estado de búsqueda
      setIsExistingSocio(false); // Resetear el estado de socio existente
      
      // Limpiar también del localStorage
      localStorage.removeItem('registro_cliente_datos');
      
      // Limpiar datos de dirección
      if (onDatosDireccionChange) {
        onDatosDireccionChange(null);
      }
      
      onClear();
    };

    const handleSave = async () => {
      const formDataWithAgencia = {
        ...formData,
        AGE: userData?.id_age || '',
      };

      const requiredFields: Array<keyof PersonData> = [
        'AGE', 'TIPO_IDEN', 'DOC_IDEN', 'APE_PAT', 'APE_MAT', 'NOMBRES',
        'FECHA_NAC', 'LUGAR_NAC', 'TIPO_NAC', 'SEXO', 'TIPO_ECIV', 'TIPO_VIV',
        'TLF_CELULAR', 'TIPO_INST', 'TIPO_PROF', 'OCUPACION', 'TIPO_ACTI',
        'EMAIL', 'TIPO_SOCIO', 'EST_SOCIO'
      ];

      const isValid = requiredFields.every(field => {
        const value = formDataWithAgencia[field];
        if (value === undefined || value === null || value === '') {
          alert(`Por favor, complete todos los campos obligatorios. Campo: ${field}`);
          return false;
        }
        return true;
      });

      if (!isValid) {
        //alert('Por favor, complete todos los campos obligatorios.');
        return;
      }

      const finalFormData: ClienteData = {
        ...formDataWithAgencia,
        AGE: userData?.id_age || '',
        COD_USER: userData?.user || SessionManager.getItem('user') || '',
        TIPO_SOCIO: formData.TIPO_SOCIO,
        TIPO_PERSONA: formData.TIPO_PERSONA,
        EST_SOCIO: formData.EST_SOCIO
      };

      try {
        const response = await saveCliente(finalFormData);
        
        // Si el cliente se guardó exitosamente (response === true),
        // hacer una consulta para recuperar todos los datos completos
        if (response === true) {
          
          // Hacer la consulta con el tipo de documento y número de documento
          try {
            const datosCompletos = await useComboBoxrellenarData(formData.TIPO_IDEN, formData.DOC_IDEN);
            
            if (datosCompletos?.DATOS) {
              // Usar la función utilitaria para mapear los datos
              const mappedData = mapResponseToPersonData(datosCompletos as ResponseData, formData);
              // Actualizar el formulario con todos los datos completos
              setFormData(mappedData);
            }
          } catch (error) {
          }
        }
        
        onSave();
      } catch (error) {
      }
    };

    // Las opciones ahora vienen del hook useRegistroClienteUtils

    // Effect para seleccionar DNI por defecto
    useEffect(() => {
      if (comboData?.TIPO_DOCUMENTO && !selectedDocType) {
        const dniDoc = getDNIDocument();
        if (dniDoc) {
          setSelectedDocType(dniDoc.TIPO_DI);
          handleInputChange('TIPO_IDEN', dniDoc.TIPO_DI);
        }
      }
    }, [comboData?.TIPO_DOCUMENTO, selectedDocType, getDNIDocument, handleInputChange]);

    // Los effects para valores por defecto ahora están manejados por useDefaultValues en el hook

    return (
      <div>
        {/* CABECERA - SIEMPRE VISIBLE */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 md:p-4 rounded-t-lg">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm md:text-base font-medium mb-1">Agencia</label>
                <p className="bg-white text-black rounded px-3 py-1 w-full text-sm md:text-base">
                  {agenciaNombre}
                </p>
              </div>
              <div className="flex-1">
                <label className="block text-sm md:text-base font-medium mb-1 text-white">
                  Tipo de Persona
                </label>
                <select
                  value={formData.TIPO_PERSONA}
                  onChange={(e) => handleInputChange('TIPO_PERSONA', e.target.value)}
                  className="w-full bg-white text-black border border-gray-300 rounded px-3 py-1 text-sm md:text-base"
                >
                  {tipoPersonaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Badge de Situación y estado de bloqueo */}
              <div className="flex items-center gap-2">
                {formData.SITUACION && (
                  <SituacionBadge situacion={formData.SITUACION} />
                )}
                {isExistingSocio && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-orange-100 text-orange-800 border-orange-200">
                    <span>🔒</span>
                    <span>SOLO LECTURA</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm md:text-base font-medium mb-1">Cuenta</label>
                <input
                  type='text'
                  name='NVA_CTA'
                  value={formData.NVA_CTA || '<AUTOMATICO>'}
                  onChange={(e) => handleInputChange('NVA_CTA', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-200 text-black"
                  readOnly
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm md:text-base font-medium mb-1">Fecha Ingreso</label>
                <input
                  type="text"
                  value={new Date(formData.FECHA_APERT).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                  className="bg-white text-black rounded px-3 py-1 w-full text-sm md:text-base"
                  readOnly
                />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="block text-sm md:text-base font-medium whitespace-nowrap">Tipo Doc.</label>
                  <select
                    value={selectedDocType}
                    onChange={handleDocTypeChange}
                    className="bg-white text-black rounded px-3 py-1 text-sm md:text-base px-2 py-1"
                    disabled={comboLoading}
                  >
                    {comboLoading ? (
                      <option>Cargando...</option>
                    ) : comboData?.TIPO_DOCUMENTO ? (
                      <>
                        <option value="">Seleccione una opción</option>
                        {comboData.TIPO_DOCUMENTO.map((doc: TipoDocumento) => (
                          <option key={doc.TIPO_DI} value={doc.TIPO_DI}>
                            {doc.NOM_DI}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option disabled>No hay tipos de documento disponibles</option>
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm md:text-base font-medium whitespace-nowrap">Nro. Doc.</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={formData.DOC_IDEN}
                      onChange={handleDocNumberChange}
                      className={`bg-white text-black rounded px-3 py-1 text-sm md:text-base px-2 py-1  ${
                        docError ? 'border border-red-500' : 'border border-gray-300'
                      }`}
                      placeholder="Número de documento"
                    />
                    <button
                      onClick={handleSearchByDNI}
                      disabled={searchLoading || !!docError}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      {searchLoading ? '...' : <Search size={14} />}
                    </button>
                  </div>
                </div>
                {docError && <p className="text-red-500 text-xs mt-1">{docError}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* MENSAJE CUANDO NO SE HA BUSCADO EL DNI */}
        {!showFullForm && !hasSearchedDNI && (
          <div className="p-6 text-center bg-gray-50">
            <p className="text-gray-600 text-lg">
              Por favor, ingrese el tipo de documento y número de documento, luego haga clic en buscar para continuar con el registro.
            </p>
          </div>
        )}

        {/* FORMULARIO COMPLETO - SOLO VISIBLE DESPUÉS DE BUSCAR DNI */}
        {showFullForm && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Apellido Paterno"
                    value={formData.APE_PAT}
                    onChange={(v) => handleInputChange('APE_PAT', v)}
                    required
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Apellido Materno"
                    value={formData.APE_MAT}
                    onChange={(v) => handleInputChange('APE_MAT', v)}
                    required
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Nombres"
                    value={formData.NOMBRES}
                    onChange={(v) => handleInputChange('NOMBRES', v)}
                    required
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Lugar de Nacimiento"
                    value={formData.LUGAR_NAC}
                    onChange={(v) => handleInputChange('LUGAR_NAC', v)}
                    required
                    disabled={isExistingSocio}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Fecha de Nacimiento"
                    value={formData.FECHA_NAC ? formData.FECHA_NAC.split(' ')[0] : ''}
                    onChange={(v) => handleInputChange('FECHA_NAC', v)}
                    type="date"
                    required
                    disabled={isExistingSocio}
                  />
                  <SelectField
                    label="Nacionalidad"
                    value={formData.TIPO_NAC}
                    options={nacionalidadOptions}
                    onChange={(v) => handleInputChange('TIPO_NAC', v)}
                    loading={comboLoading}
                    disabled={isExistingSocio}
                  />
                  <RadioGroup
                    label="Sexo"
                    value={formData.SEXO}
                    options={[
                      { value: 'M', label: 'Masculino' },
                      { value: 'F', label: 'Femenino' },
                    ]}
                    onChange={(v) => handleInputChange('SEXO', v)}
                    disabled={isExistingSocio}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Estado civil"
                    value={formData.TIPO_ECIV}
                    options={estadoCivilOptions}
                    onChange={(v) => handleInputChange('TIPO_ECIV', v)}
                    loading={comboLoading}
                    disabled={isExistingSocio}
                  />
                  <SelectField
                    label="Vivienda"
                    value={formData.TIPO_VIV}
                    options={viviendaOptions}
                    onChange={(v) => handleInputChange('TIPO_VIV', v)}
                    loading={comboLoading}
                    disabled={isExistingSocio}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <InputField
                    label="Número de referencia principal"
                    type='text'
                    value={formData.TLF_CASA}
                    onChange={(v) => handleInputChange('TLF_CASA', v)}
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Número de referencia secundario"
                    type='text'
                    value={formData.TLF_CASA2}
                    onChange={(v) => handleInputChange('TLF_CASA2', v)}
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Número de Celular principal"
                    type='text'
                    value={formData.TLF_CELULAR}
                    onChange={(v) => handleInputChange('TLF_CELULAR', v)}
                    labelClassName='text-red-500 font-bold'
                    required
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Número de Celular secundario"
                    type='text'
                    value={formData.TLF_CELULAR2}
                    onChange={(v) => handleInputChange('TLF_CELULAR2', v)}
                    disabled={isExistingSocio}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SelectField
                    label="Instrucción"
                    value={formData.TIPO_INST}
                    options={instruccionOptions}
                    onChange={(v) => handleInputChange('TIPO_INST', v)}
                    loading={comboLoading}
                    disabled={isExistingSocio}
                  />
                  <SelectField
                    label="Profesión"
                    value={formData.TIPO_PROF}
                    options={profesionOptions}
                    onChange={(v) => handleInputChange('TIPO_PROF', v)}
                    loading={comboLoading}
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="Ocupación"
                    value={formData.OCUPACION}
                    onChange={(v) => handleInputChange('OCUPACION', v)}
                    required
                    disabled={isExistingSocio}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Activ. Económica"
                    value={formData.TIPO_ACTI}
                    options={actividadEconomicaOptions}
                    onChange={(v) => handleInputChange('TIPO_ACTI', v)}
                    loading={comboLoading}
                    disabled={isExistingSocio}
                  />
                  <InputField
                    label="E-mail"
                    value={formData.EMAIL}
                    onChange={(v) => handleInputChange('EMAIL', v)}
                    type="email"
                    required
                    disabled={isExistingSocio}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <SelectField
                  label="Tipo Socio"
                  value={formData.TIPO_SOCIO}
                  options={tipoSocioOptions}
                  onChange={(v) => handleInputChange('TIPO_SOCIO', v)}
                  loading={comboLoading}
                  disabled={isExistingSocio}
                />
                <SelectField
                  label="Situación"
                  value={formData.EST_SOCIO}
                  options={estadoSocioOptions}
                  onChange={() => {}}
                  disabled
                  loading={comboLoading}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 p-4 bg-gray-100">
              <button
                type="button"
                onClick={handleClear}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isExistingSocio}
                className={`px-4 py-2 rounded-md text-white ${
                  isExistingSocio
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isExistingSocio ? 'Socio ya existe' : 'Grabar'}
              </button>
            </div>
          </>
        )}

        {comboLoading && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md">
            Cargando datos...
          </div>
        )}
        {comboError && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md">
            Error: {comboError}
          </div>
        )}
      </div>
    );
  },
);