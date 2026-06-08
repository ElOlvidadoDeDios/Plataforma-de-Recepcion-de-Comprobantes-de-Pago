//componente padre de registro datos
import { memo, useContext, useEffect, useState, useCallback } from 'react';
import { SessionManager } from '../../utils/sessionManager';
import { ClienteData } from '../../api/registroDeclientesApi';
import { Search } from 'lucide-react';
import registroClienteApi, { useComboBoxData, saveCliente, useComboBoxrellenarData } from '../../api/registroDeclientesApi';
import { AGENCIAS } from '../../types/index';
import { AuthContext } from '../../contexts/AuthContext';
import { verificarSocioReniec } from '../../api/geodileApi';
import {PersonData, TipoDocumento, SelectField, InputField, PhoneField, RadioGroup, DatosDireccionApi, DatosBasicos, ResponseData, mapResponseToPersonData, createInitialPersonData, SituacionBadge} from './FormFields';
import { useRegistroClienteUtils } from '../../hooks/useRegistroClienteUtils';
import { useNotifications } from '../../hooks/useNotifications';

const Notification=useNotifications();


export const DatosForm = memo(
  ({ onSave, onClear, onDatosBasicosChange, onDatosDireccionChange, onRegistroExitoso }: {
    onSave: () => void;
    onClear: () => void;
    onDatosBasicosChange?: (datos: DatosBasicos) => void;
    onDatosDireccionChange?: (datosDireccion: DatosDireccionApi | null) => void;
    onRegistroExitoso?: (datosCompletos: any) => void;
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


  // Función para mapear dirección con textos descriptivos
  const mapearDireccionConTextos = useCallback(async (direccionOriginal: any) => {
    try {
      let direccionConTextos = {
        ...direccionOriginal,
        DIRECCION_COMPLETA: direccionOriginal.DIRECCION || direccionOriginal.NOM_VIA || ''
      };

      // Mapear departamento, provincia y distrito a textos usando las mismas funciones que registro_direccion.tsx
      if (direccionOriginal.DPTO) {
        try {
          // Cargar departamentos para encontrar el texto
          const departamentos = await registroClienteApi.useComboBoxDepartamentosData();
          const deptoEncontrado = departamentos.find((d: any) => d.DPTO === direccionOriginal.DPTO);
          if (deptoEncontrado) {
            direccionConTextos.DPTO_TEXTO = (deptoEncontrado as any).NOM_UBIGEO;
          } else {
            direccionConTextos.DPTO_TEXTO = direccionOriginal.DPTO; // Si no encuentra, mantiene el código
          }

          // Mapear provincia si existe departamento
          if (direccionOriginal.PROV) {
            const provincias = await registroClienteApi.useComboBoxProvinciasData(direccionOriginal.DPTO);
            const provEncontrada = provincias.find((p: any) => p.PROV === direccionOriginal.PROV);
            if (provEncontrada) {
              direccionConTextos.PROV_TEXTO = (provEncontrada as any).NOM_UBIGEO;
            } else {
              direccionConTextos.PROV_TEXTO = direccionOriginal.PROV; // Si no encuentra, mantiene el código
            }

            // Mapear distrito si existe provincia
            if (direccionOriginal.DIST) {
              const distritos = await registroClienteApi.useComboBoxDistritosData(direccionOriginal.DPTO, direccionOriginal.PROV);
              const distEncontrado = distritos.find((d: any) => d.DIST === direccionOriginal.DIST);
              if (distEncontrado) {
                direccionConTextos.DIST_TEXTO = (distEncontrado as any).NOM_UBIGEO;
              } else {
                direccionConTextos.DIST_TEXTO = direccionOriginal.DIST; // Si no encuentra, mantiene el código
              }
            }
          }
        } catch (error) {

          // En caso de error, mantener los códigos originales
          direccionConTextos.DPTO_TEXTO = direccionOriginal.DPTO || '';
          direccionConTextos.PROV_TEXTO = direccionOriginal.PROV || '';
          direccionConTextos.DIST_TEXTO = direccionOriginal.DIST || '';
        }
      } else {
        // Si no hay código de departamento, usar cadenas vacías
        direccionConTextos.DPTO_TEXTO = '';
        direccionConTextos.PROV_TEXTO = '';
        direccionConTextos.DIST_TEXTO = '';
      }

      return direccionConTextos;
    } catch (error) {

      return {
        ...direccionOriginal,
        DIRECCION_COMPLETA: direccionOriginal.DIRECCION || direccionOriginal.NOM_VIA || '',
        DPTO_TEXTO: direccionOriginal.DPTO || '',
        PROV_TEXTO: direccionOriginal.PROV || '',
        DIST_TEXTO: direccionOriginal.DIST || ''
      };
    }
  }, []);

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

        // 🚨 IMPORTANTE: Si el socio YA EXISTE, ejecutar onRegistroExitoso aquí también
        if (onRegistroExitoso) {
          // Convertir IDs a textos descriptivos usando las opciones del hook
          const datosConTextosDescriptivos = {
            ...mappedData,
            // ✅ CAPTURAR EL COD_USER Y AGE DE LA API - DATOS DEL ANALISTA ORIGINAL
            // Usar los datos ya mapeados correctamente por la función mapResponseToPersonData
            COD_USER_ORIGINAL: mappedData.COD_USER, // Usuario analista que originalmente registró (ya mapeado)
            AGE_ORIGINAL: mappedData.AGE, // Agencia original donde se registró (ya mapeada)
            // Convertir campos usando las opciones ya procesadas del hook
            TIPO_NAC_TEXTO: nacionalidadOptions.find(n => n.value === mappedData.TIPO_NAC)?.label || mappedData.TIPO_NAC,
            SEXO_TEXTO: mappedData.SEXO === 'M' ? 'Masculino' : mappedData.SEXO === 'F' ? 'Femenino' : mappedData.SEXO,
            TIPO_ECIV_TEXTO: estadoCivilOptions.find(e => e.value === mappedData.TIPO_ECIV)?.label || mappedData.TIPO_ECIV,
            TIPO_VIV_TEXTO: viviendaOptions.find(v => v.value === mappedData.TIPO_VIV)?.label || mappedData.TIPO_VIV,
            TIPO_INST_TEXTO: instruccionOptions.find(i => i.value === mappedData.TIPO_INST)?.label || mappedData.TIPO_INST,
            TIPO_PROF_TEXTO: profesionOptions.find(p => p.value === mappedData.TIPO_PROF)?.label || mappedData.TIPO_PROF,
            TIPO_ACTI_TEXTO: actividadEconomicaOptions.find(a => a.value === mappedData.TIPO_ACTI)?.label || mappedData.TIPO_ACTI,
            TIPO_SOCIO_TEXTO: tipoSocioOptions.find(s => s.value === mappedData.TIPO_SOCIO)?.label || mappedData.TIPO_SOCIO,
            EST_SOCIO_TEXTO: estadoSocioOptions.find(e => e.value === mappedData.EST_SOCIO)?.label || mappedData.EST_SOCIO,
            TIPO_IDEN_TEXTO: comboData?.TIPO_DOCUMENTO?.find(d => d.TIPO_DI === mappedData.TIPO_IDEN)?.NOM_DI || mappedData.TIPO_IDEN,
            // Agregar datos adicionales
            fecha_registro: new Date().toISOString(),
            // Agregar dirección con nombres descriptivos si está disponible
            direccion: response.DIRECCION ? await mapearDireccionConTextos(response.DIRECCION) : null,
            // 🚨 IMPORTANTE: Incluir el objeto DOCUMENT del API response
            DOCUMENT: response.DOCUMENT || null
          };
          onRegistroExitoso(datosConTextosDescriptivos);
        }

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
        NOMBRES: formData.NOMBRES || '',
        SITUACION: formData.SITUACION || '' // 🚨 INCLUIR SITUACION PARA VALIDACIÓN DE FAMILIARES
      };
      onDatosBasicosChange(datosBasicos);
    }
  }, [formData.NVA_CTA, formData.APE_PAT, formData.APE_MAT, formData.NOMBRES, formData.SITUACION, onDatosBasicosChange]);

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
      // 🚨 LÓGICA ESPECIAL: Si la agencia del usuario es 06 o 07, siempre enviar 98
      const agenciaAEnviar = (userData?.id_age === '06' || userData?.id_age === '07' || userData?.id_age === "10"|| userData?.id_age === "11" || userData?.id_age === "12"|| userData?.id_age === "13") ? '98' : (userData?.id_age || '');
      
      const formDataWithAgencia = {
        ...formData,
        AGE: agenciaAEnviar,
        // Convertir campos de texto a mayúsculas
        APE_PAT: formData.APE_PAT?.toUpperCase() || '',
        APE_MAT: formData.APE_MAT?.toUpperCase() || '',
        NOMBRES: formData.NOMBRES?.toUpperCase() || '',
        LUGAR_NAC: formData.LUGAR_NAC?.toUpperCase() || '',
        OCUPACION: formData.OCUPACION?.toUpperCase() || '',
        EMAIL: formData.EMAIL?.toLowerCase() || '', // Email en minúsculas por convención
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
          Notification.validation('Por favor, complete todos los campos obligatorios.', [field]);
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
        AGE: agenciaAEnviar, // Usar la misma lógica de agencia
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
              
              // Si hay callback de registro exitoso, pasar los datos completos con textos descriptivos
              if (onRegistroExitoso) {
                // Crear objeto con todos los datos del cliente incluyendo textos descriptivos
                const datosCompletosForCertificate = {
                  ...mappedData,
                  // Convertir IDs a textos descriptivos
                  TIPO_NAC_TEXTO: nacionalidadOptions.find(n => n.value === mappedData.TIPO_NAC)?.label || mappedData.TIPO_NAC,
                  SEXO_TEXTO: mappedData.SEXO === 'M' ? 'Masculino' : mappedData.SEXO === 'F' ? 'Femenino' : mappedData.SEXO,
                  TIPO_ECIV_TEXTO: estadoCivilOptions.find(e => e.value === mappedData.TIPO_ECIV)?.label || mappedData.TIPO_ECIV,
                  TIPO_VIV_TEXTO: viviendaOptions.find(v => v.value === mappedData.TIPO_VIV)?.label || mappedData.TIPO_VIV,
                  TIPO_INST_TEXTO: instruccionOptions.find(i => i.value === mappedData.TIPO_INST)?.label || mappedData.TIPO_INST,
                  TIPO_PROF_TEXTO: profesionOptions.find(p => p.value === mappedData.TIPO_PROF)?.label || mappedData.TIPO_PROF,
                  TIPO_ACTI_TEXTO: actividadEconomicaOptions.find(a => a.value === mappedData.TIPO_ACTI)?.label || mappedData.TIPO_ACTI,
                  TIPO_SOCIO_TEXTO: tipoSocioOptions.find(s => s.value === mappedData.TIPO_SOCIO)?.label || mappedData.TIPO_SOCIO,
                  EST_SOCIO_TEXTO: estadoSocioOptions.find(e => e.value === mappedData.EST_SOCIO)?.label || mappedData.EST_SOCIO,
                  TIPO_IDEN_TEXTO: comboData?.TIPO_DOCUMENTO?.find(d => d.TIPO_DI === mappedData.TIPO_IDEN)?.NOM_DI || mappedData.TIPO_IDEN,
                  // Agregar datos adicionales
                  fecha_registro: new Date().toISOString(),
                  direccion: datosCompletos.DIRECCION || null,
                  // 🚨 IMPORTANTE: Incluir el objeto DOCUMENT del API response
                  DOCUMENT: datosCompletos.DOCUMENT || null
                };
                onRegistroExitoso(datosCompletosForCertificate);
              }
            } else if (onRegistroExitoso) {
              // Si no hay datos completos pero el guardado fue exitoso, usar los datos del formulario con textos descriptivos
              const datosCompletosForCertificate = {
                ...finalFormData,
                // Convertir IDs a textos descriptivos usando los datos del formulario
                TIPO_NAC_TEXTO: nacionalidadOptions.find(n => n.value === finalFormData.TIPO_NAC)?.label || finalFormData.TIPO_NAC,
                SEXO_TEXTO: finalFormData.SEXO === 'M' ? 'Masculino' : finalFormData.SEXO === 'F' ? 'Femenino' : finalFormData.SEXO,
                TIPO_ECIV_TEXTO: estadoCivilOptions.find(e => e.value === finalFormData.TIPO_ECIV)?.label || finalFormData.TIPO_ECIV,
                TIPO_VIV_TEXTO: viviendaOptions.find(v => v.value === finalFormData.TIPO_VIV)?.label || finalFormData.TIPO_VIV,
                TIPO_INST_TEXTO: instruccionOptions.find(i => i.value === finalFormData.TIPO_INST)?.label || finalFormData.TIPO_INST,
                TIPO_PROF_TEXTO: profesionOptions.find(p => p.value === finalFormData.TIPO_PROF)?.label || finalFormData.TIPO_PROF,
                TIPO_ACTI_TEXTO: actividadEconomicaOptions.find(a => a.value === finalFormData.TIPO_ACTI)?.label || finalFormData.TIPO_ACTI,
                TIPO_SOCIO_TEXTO: tipoSocioOptions.find(s => s.value === finalFormData.TIPO_SOCIO)?.label || finalFormData.TIPO_SOCIO,
                EST_SOCIO_TEXTO: estadoSocioOptions.find(e => e.value === finalFormData.EST_SOCIO)?.label || finalFormData.EST_SOCIO,
                TIPO_IDEN_TEXTO: comboData?.TIPO_DOCUMENTO?.find(d => d.TIPO_DI === formData.TIPO_IDEN)?.NOM_DI || formData.TIPO_IDEN,
                fecha_registro: new Date().toISOString(),
                direccion: null,
                // Para socios nuevos, no hay documentos existentes
                DOCUMENT: null
              };
              onRegistroExitoso(datosCompletosForCertificate);
            }
          } catch (error) {
            // Si hay error en la consulta pero el guardado fue exitoso, usar los datos del formulario con textos descriptivos
            if (onRegistroExitoso) {
              const datosCompletosForCertificate = {
                ...finalFormData,
                // Convertir IDs a textos descriptivos usando los datos del formulario
                TIPO_NAC_TEXTO: nacionalidadOptions.find(n => n.value === finalFormData.TIPO_NAC)?.label || finalFormData.TIPO_NAC,
                SEXO_TEXTO: finalFormData.SEXO === 'M' ? 'Masculino' : finalFormData.SEXO === 'F' ? 'Femenino' : finalFormData.SEXO,
                TIPO_ECIV_TEXTO: estadoCivilOptions.find(e => e.value === finalFormData.TIPO_ECIV)?.label || finalFormData.TIPO_ECIV,
                TIPO_VIV_TEXTO: viviendaOptions.find(v => v.value === finalFormData.TIPO_VIV)?.label || finalFormData.TIPO_VIV,
                TIPO_INST_TEXTO: instruccionOptions.find(i => i.value === finalFormData.TIPO_INST)?.label || finalFormData.TIPO_INST,
                TIPO_PROF_TEXTO: profesionOptions.find(p => p.value === finalFormData.TIPO_PROF)?.label || finalFormData.TIPO_PROF,
                TIPO_ACTI_TEXTO: actividadEconomicaOptions.find(a => a.value === finalFormData.TIPO_ACTI)?.label || finalFormData.TIPO_ACTI,
                TIPO_SOCIO_TEXTO: tipoSocioOptions.find(s => s.value === finalFormData.TIPO_SOCIO)?.label || finalFormData.TIPO_SOCIO,
                EST_SOCIO_TEXTO: estadoSocioOptions.find(e => e.value === finalFormData.EST_SOCIO)?.label || finalFormData.EST_SOCIO,
                TIPO_IDEN_TEXTO: comboData?.TIPO_DOCUMENTO?.find(d => d.TIPO_DI === formData.TIPO_IDEN)?.NOM_DI || formData.TIPO_IDEN,
                fecha_registro: new Date().toISOString(),
                direccion: null,
                // En caso de error, tampoco hay documentos existentes
                DOCUMENT: null
              };
              onRegistroExitoso(datosCompletosForCertificate);
            }
          }
        } else {
        }
        
        onSave();
      } catch (error) {
      }
    };

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
                    value={new Date(formData.FECHA_APERT + "T00:00:00-05:00").toLocaleDateString('es-PE', {
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
                      maxLength={12}
                      className={`bg-white text-black rounded px-2 py-1 text-sm md:text-base w-28 md:w-32 ${
                        docError ? 'border border-red-500' : 'border border-gray-300'
                      }`}
                      placeholder="Nro. Doc."
                    />
                    <button
                      onClick={handleSearchByDNI}
                      disabled={searchLoading || !!docError}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50 flex-shrink-0"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PhoneField
                    label="Número de referencia principal"
                    value={formData.TLF_CASA}
                    onChange={(v) => handleInputChange('TLF_CASA', v)}
                    disabled={isExistingSocio}
                    fieldName="TLF_CASA"
                    placeholder="Ingrese número de referencia"
                  />
                  <PhoneField
                    label="Número de referencia secundario"
                    value={formData.TLF_CASA2}
                    onChange={(v) => handleInputChange('TLF_CASA2', v)}
                    disabled={isExistingSocio}
                    fieldName="TLF_CASA2"
                    placeholder="Ingrese número de referencia"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PhoneField
                    label="Número de Celular principal"
                    value={formData.TLF_CELULAR}
                    onChange={(v) => handleInputChange('TLF_CELULAR', v)}
                    labelClassName='text-red-500 font-bold'
                    required
                    disabled={isExistingSocio}
                    fieldName="TLF_CELULAR"
                    placeholder="Ingrese número de celular"
                  />
                  <PhoneField
                    label="Número de Celular secundario"
                    value={formData.TLF_CELULAR2}
                    onChange={(v) => handleInputChange('TLF_CELULAR2', v)}
                    disabled={isExistingSocio}
                    fieldName="TLF_CELULAR2"
                    placeholder="Ingrese número de celular"
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