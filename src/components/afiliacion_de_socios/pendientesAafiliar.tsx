import { useState, useEffect, useContext } from 'react';
import Layout from '../Layout';
import afiliacionAPI, { type AfiliacionSocios, type AfiliarSocioRequest } from '../../api/afiliacionAPi';
import { AuthContext } from '../../contexts/AuthContext';
import { useComboBoxrellenarData, useComboBoxData } from '../../api/registroDeclientesApi';
import registroClienteApi from '../../api/registroDeclientesApi';
import { mapResponseToPersonData, createInitialPersonData, type ResponseData, type TipoDocumento } from '../registro_clientes/FormFields';
import { useRegistroClienteUtils } from '../../hooks/useRegistroClienteUtils';
import { AGENCIAS } from '../../types/index';
import { DNIImageViewer, EditableField, EditableSelectField, VoucherViewer, Modal } from './componetes';
import { useNotifications } from '../../hooks/useNotifications';
const Notification = useNotifications();
// Interfaz extendida con dirección
interface SocioData {
  SITUACION: string;
  DATOS: {
    CUENTA: string;
    AGENCIA: string;
    //TIPO_SOCIO: string;
    TIPO_DI: string;
    NRO_DI: string;
    APE_PATERNO: string;
    APE_MATERNO: string;
    NOMBRE: string;
    FECHA_APERTURA: string;
    FECHA_NAC: string;
    LUGAR_NAC: string;
    EST_SOCIO: string;
    TIPO_PERSONA: string;
    TIPO_VIVIENDA: string;
    EST_CIVIL: string;
    SEXO: 'M' | 'F' | '';
    TIPO_PROFESION: string;
    TIPO_INSTRUCCION: string;
    OCUPACION: string;
    EMAIL: string;
    TLF_FIJO1: string;
    TLF_FIJO2: string;
    TLF_CEL1: string;
    TLD_CEL2: string;
    TIPO_NAC: string;
    TIPO_ACTI: string;
    AFILIA_FPSSOC: string;
    FEC_FPSSOC: string;
    AFILIA_FPSCONY: string;
    FEC_FPSCONY: string;
    COD_USER: string;
  };
  DIRECCION: {
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
    COD_USER: string;
  };
  DOCUMENT: {
    CUENTA: string;
    DNI_FRONTAL: string;//"DOCUMENT_AFILIACION/OFICINA PRINCIPAL/75654681_05092025175818_68bb6b0a3bfd1.jpg",
    DNI_POSTERIOR: string;//"DOCUMENT_AFILIACION/OFICINA PRINCIPAL/75654681_05092025175818_68bb6b0a3c687.png",
    OTRO_DOCUMENTO: string;//"DOCUMENT_AFILIACION/OFICINA PRINCIPAL/75654681_05092025175818_68bb6b0a3d3d1.jpg"
  };
  
}


export default function AfiliacionSociosComponent() {
  // Estado para la lista inicial simplificada desde la API
  const [sociosLista, setSociosLista] = useState<AfiliacionSocios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el modal con datos completos
  const [selectedSocio, setSelectedSocio] = useState<SocioData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nroBanco, setNroBanco] = useState(''); // Estado local para el número de banco
  const [loadingModal, setLoadingModal] = useState<string | null>(null); // Cambiar a string para identificar qué socio se está cargando
  // ✅ ESTADO PARA GUARDAR LOS TEXTOS DESCRIPTIVOS
  const [textosDescriptivos, setTextosDescriptivos] = useState<any>(null);
  // ✅ ESTADO PARA LAS OPCIONES DE TIPO VÍA Y ZONA
  const [opcionesSector, setOpcionesSector] = useState<any>({
    TIPO_VIA: [],
    TIPO_ZONA: []
  });

  // 🔥 OBTENER comboData IGUAL QUE EN registro_datos.tsx línea 31
  const { comboData } = useComboBoxData();

  // 🎯 USAR EL MISMO HOOK QUE REGISTRO DE CLIENTES
  const handleInputChange = () => {
    // No necesitamos esta función aquí, pero es requerida por el hook
  };

  const {
    // Opciones de select (ya procesadas)
    nacionalidadOptions,
    estadoCivilOptions,
    viviendaOptions,
    instruccionOptions,
    profesionOptions,
    actividadEconomicaOptions,
    tipoSocioOptions,
    estadoSocioOptions,
    tipoPersonaOptions,

  } = useRegistroClienteUtils({
    comboData, // ✅ Usar el comboData obtenido del hook
    showFullForm: true,
    formData: {},
    handleInputChange
  });

  // ✅ DATOS MOCK REMOVIDOS - AHORA SE USAN LOS DATOS REALES DEL API getSocioEdit

  // Cargar lista inicial desde la API
  useEffect(() => {
    const cargarSociosPendientes = async () => {
      try {
        setLoading(true);
        setError(null);
        interface ApiResponse {
          status?: boolean;
          message?: string;
          data?: AfiliacionSocios[];
        }
        
        const data: ApiResponse | AfiliacionSocios[] = await afiliacionAPI.sociospendientesAfiliar();
        if (Array.isArray(data)) {
          setSociosLista(data);
        } else if (data?.status === false) {
          setError(data.message || 'No hay información disponible');
          setSociosLista([]);
        } else {
          setError('Respuesta inesperada de la API');
          setSociosLista([]);
        }
      } catch (error) {
        setError('Error al cargar la lista de socios pendientes');
      } finally {
        setLoading(false);
      }
    };

    cargarSociosPendientes();
  }, []);

  // 🏗️ CARGAR OPCIONES DE SECTOR (TIPO_VIA y TIPO_ZONA)
  useEffect(() => {
    const cargarOpcionesSector = async () => {
      try {
        const sectorOpcionesData = await registroClienteApi.useComboBoxSectorOpcionesData();
        setOpcionesSector(sectorOpcionesData);
      } catch (error) {
      }
    };

    cargarOpcionesSector();
  }, []);

  const getTipoDocumento = (tipo: string) => {
    switch (tipo) {
      case '01': return 'DNI';
      case '02': return 'Carnet de Extranjería';
      case '03': return 'Pasaporte';
      default: return 'Otro';
    }
  };

  const handleFieldChange = (section: 'DATOS' | 'DIRECCION', fieldKey: string, value: string) => {
    if (selectedSocio) {
      setSelectedSocio(prev => ({
        ...prev!,
        [section]: {
          ...prev![section],
          [fieldKey]: value
        }
      }));
    }
  };

  // 🔧 Función para mapear dirección con textos descriptivos (igual que en registro_datos.tsx)
  const mapearDireccionConTextos = async (direccionOriginal: any) => {
    try {
      let direccionConTextos = {
        ...direccionOriginal,
        DIRECCION_COMPLETA: direccionOriginal.DIRECCION || direccionOriginal.NOM_VIA || ''
      };

      // ✅ MAPEAR TIPO_VIA y TIPO_ZONA con textos descriptivos
      if (direccionOriginal.TIPO_VIA && opcionesSector.TIPO_VIA) {
        const tipoViaEncontrado = opcionesSector.TIPO_VIA.find((via: any) => via.TIPO_VIA === direccionOriginal.TIPO_VIA);
        if (tipoViaEncontrado) {
          direccionConTextos.TIPO_VIA_TEXTO = tipoViaEncontrado.NOM_TVIA;
        } else {
          direccionConTextos.TIPO_VIA_TEXTO = direccionOriginal.TIPO_VIA;
        }
      } else {
        direccionConTextos.TIPO_VIA_TEXTO = direccionOriginal.TIPO_VIA || '';
      }

      if (direccionOriginal.TIPO_ZONA && opcionesSector.TIPO_ZONA) {
        const tipoZonaEncontrada = opcionesSector.TIPO_ZONA.find((zona: any) => zona.TIPO_ZONA === direccionOriginal.TIPO_ZONA);
        if (tipoZonaEncontrada) {
          direccionConTextos.TIPO_ZONA_TEXTO = tipoZonaEncontrada.NOM_TZONA;
        } else {
          direccionConTextos.TIPO_ZONA_TEXTO = direccionOriginal.TIPO_ZONA;
        }
      } else {
        direccionConTextos.TIPO_ZONA_TEXTO = direccionOriginal.TIPO_ZONA || '';
      }

      // Mapear departamento, provincia y distrito a textos usando las mismas funciones
      if (direccionOriginal.DPTO) {
        try {
          // Cargar departamentos para encontrar el texto
          const departamentos = await registroClienteApi.useComboBoxDepartamentosData();
          const deptoEncontrado = departamentos.find((d: any) => d.DPTO === direccionOriginal.DPTO);
          if (deptoEncontrado) {
            direccionConTextos.DPTO_TEXTO = (deptoEncontrado as any).NOM_UBIGEO;
          } else {
            direccionConTextos.DPTO_TEXTO = direccionOriginal.DPTO;
          }

          // Mapear provincia si existe departamento
          if (direccionOriginal.PROV) {
            const provincias = await registroClienteApi.useComboBoxProvinciasData(direccionOriginal.DPTO);
            const provEncontrada = provincias.find((p: any) => p.PROV === direccionOriginal.PROV);
            if (provEncontrada) {
              direccionConTextos.PROV_TEXTO = (provEncontrada as any).NOM_UBIGEO;
            } else {
              direccionConTextos.PROV_TEXTO = direccionOriginal.PROV;
            }

            // Mapear distrito si existe provincia
            if (direccionOriginal.DIST) {
              const distritos = await registroClienteApi.useComboBoxDistritosData(direccionOriginal.DPTO, direccionOriginal.PROV);
              const distEncontrado = distritos.find((d: any) => d.DIST === direccionOriginal.DIST);
              if (distEncontrado) {
                direccionConTextos.DIST_TEXTO = (distEncontrado as any).NOM_UBIGEO;
              } else {
                direccionConTextos.DIST_TEXTO = direccionOriginal.DIST;
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
        TIPO_VIA_TEXTO: direccionOriginal.TIPO_VIA || '',
        TIPO_ZONA_TEXTO: direccionOriginal.TIPO_ZONA || '',
        DPTO_TEXTO: direccionOriginal.DPTO || '',
        PROV_TEXTO: direccionOriginal.PROV || '',
        DIST_TEXTO: direccionOriginal.DIST || ''
      };
    }
  };

  // 🎯 FUNCIÓN SIMPLIFICADA USANDO EXACTAMENTE EL MISMO MAPEO QUE EN REGISTRO_DATOS.TSX
  const mapearCodigosATextos = (mappedData: any, comboData?: any) => {
    return {
      // ✅ USAR LOS MISMOS CAMPOS Y MAPEO QUE EN registro_datos.tsx (líneas 172-195)
      TIPO_NAC_TEXTO: nacionalidadOptions.find(n => n.value === mappedData.TIPO_NAC)?.label || mappedData.TIPO_NAC,
      SEXO_TEXTO: mappedData.SEXO === 'M' ? 'Masculino' : mappedData.SEXO === 'F' ? 'Femenino' : mappedData.SEXO,
      TIPO_ECIV_TEXTO: estadoCivilOptions.find(e => e.value === mappedData.TIPO_ECIV)?.label || mappedData.TIPO_ECIV,
      TIPO_VIV_TEXTO: viviendaOptions.find(v => v.value === mappedData.TIPO_VIV)?.label || mappedData.TIPO_VIV,
      TIPO_INST_TEXTO: instruccionOptions.find(i => i.value === mappedData.TIPO_INST)?.label || mappedData.TIPO_INST,
      TIPO_PROF_TEXTO: profesionOptions.find(p => p.value === mappedData.TIPO_PROF)?.label || mappedData.TIPO_PROF,
      TIPO_ACTI_TEXTO: actividadEconomicaOptions.find(a => a.value === mappedData.TIPO_ACTI)?.label || mappedData.TIPO_ACTI,
      TIPO_SOCIO_TEXTO: tipoSocioOptions.find(s => s.value === mappedData.TIPO_SOCIO)?.label || mappedData.TIPO_SOCIO,
      EST_SOCIO_TEXTO: estadoSocioOptions.find(e => e.value === mappedData.EST_SOCIO)?.label || mappedData.EST_SOCIO,
      TIPO_PERSONA_TEXTO: tipoPersonaOptions.find(tp => tp.value === mappedData.TIPO_PERSONA)?.label || mappedData.TIPO_PERSONA,
      // ✅ MAPEO PARA TIPO DOCUMENTO igual que en registro_datos.tsx línea 188
      TIPO_IDEN_TEXTO: comboData?.TIPO_DOCUMENTO?.find((d: TipoDocumento) => d.TIPO_DI === mappedData.TIPO_IDEN)?.NOM_DI || getTipoDocumento(mappedData.TIPO_IDEN || '01'),
      // ✅ MAPEO PARA AGENCIA usando las agencias reales exactamente como en registro_datos.tsx líneas 34-36
      AGE_TEXTO: getAgenciaNombre(mappedData.AGE)
    };
  };

  // 🏢 FUNCIÓN PARA OBTENER NOMBRE DE AGENCIA (exactamente igual que en registro_datos.tsx líneas 34-36)
  const getAgenciaNombre = (agenciaId: string) => {
    return Object.keys(AGENCIAS).find((key) => AGENCIAS[key as keyof typeof AGENCIAS] === agenciaId) || agenciaId;
  };

  const handleAfiliar = async (socioLista: AfiliacionSocios) => {
    try {
      setLoadingModal(socioLista.DNI); // Identificar cuál socio se está cargando
      
      // 🔥 USAR EL MISMO ENDPOINT QUE EN REGISTRO DE CLIENTES
      // Llamar al endpoint getSocioEdit para obtener los datos completos
      const response = await useComboBoxrellenarData("01", socioLista.DNI); // "01" = DNI
      
      // 📄 OBTENER IMÁGENES REALES USANDO EL NUEVO ENDPOINT getImgSocio
      let imagenesReales = null;
      try {
        imagenesReales = await afiliacionAPI.getImgSocio(socioLista.DNI);
      } catch (error) {
      }
      
      if (response?.DATOS) {
        // Crear datos iniciales básicos para el mapeo
        const formDataLimpio = createInitialPersonData({
          TIPO_IDEN: "01", // DNI
          DOC_IDEN: socioLista.DNI,
        });
        
        // 🎯 USAR LA MISMA FUNCIÓN DE MAPEO QUE EN REGISTRO DE CLIENTES
        const mappedData = mapResponseToPersonData(response as ResponseData, formDataLimpio);
        
        // 🏠 MAPEAR DIRECCIÓN CON TEXTOS DESCRIPTIVOS
        let direccionConTextos = {};
        if (response.DIRECCION) {
          direccionConTextos = await mapearDireccionConTextos(response.DIRECCION);
        }
        
        const textosDescriptivosMapeados = mapearCodigosATextos(mappedData, comboData);
        
        // ✅ GUARDAR EN EL ESTADO PARA USAR EN EL MODAL
        setTextosDescriptivos(textosDescriptivosMapeados);

        // Convertir al formato que espera el componente de afiliación - USAR LOS TEXTOS MAPEADOS
        const socioCompleto: SocioData = {
          SITUACION: socioLista.ESTADO,
          DATOS: {
            CUENTA: mappedData.NVA_CTA || "<AUTOMATICO>",
            // ✅ USAR LOS TEXTOS MAPEADOS IGUAL QUE LA DIRECCIÓN
            AGENCIA: textosDescriptivosMapeados.AGE_TEXTO || mappedData.AGE || '',
            APE_PATERNO: mappedData.APE_PAT || '',
            APE_MATERNO: mappedData.APE_MAT || '',
            NOMBRE: mappedData.NOMBRES || '',
            FECHA_APERTURA: mappedData.FECHA_APERT || socioLista.FECHA_PRE_AFI,
            FECHA_NAC: mappedData.FECHA_NAC ? mappedData.FECHA_NAC.split(' ')[0] : '',
            LUGAR_NAC: mappedData.LUGAR_NAC || '',
            EST_SOCIO: textosDescriptivosMapeados.EST_SOCIO_TEXTO || mappedData.EST_SOCIO || '',
            TIPO_PERSONA: textosDescriptivosMapeados.TIPO_PERSONA_TEXTO || mappedData.TIPO_PERSONA || '',
            // ✅ USAR LOS TEXTOS MAPEADOS EN LUGAR DE LOS CÓDIGOS
            TIPO_VIVIENDA: textosDescriptivosMapeados.TIPO_VIV_TEXTO || mappedData.TIPO_VIV || '',
            EST_CIVIL: textosDescriptivosMapeados.TIPO_ECIV_TEXTO || mappedData.TIPO_ECIV || '',
            SEXO: textosDescriptivosMapeados.SEXO_TEXTO || mappedData.SEXO || '',
            TIPO_PROFESION: textosDescriptivosMapeados.TIPO_PROF_TEXTO || mappedData.TIPO_PROF || '',
            TIPO_INSTRUCCION: textosDescriptivosMapeados.TIPO_INST_TEXTO || mappedData.TIPO_INST || '',
            OCUPACION: mappedData.OCUPACION || '',
            EMAIL: mappedData.EMAIL || '',
            TIPO_DI: mappedData.TIPO_IDEN || '',
            NRO_DI: mappedData.DOC_IDEN || socioLista.DNI,
            TLF_FIJO1: mappedData.TLF_CASA || '',
            TLF_FIJO2: mappedData.TLF_CASA2 || '',
            TLF_CEL1: mappedData.TLF_CELULAR || '',
            TLD_CEL2: mappedData.TLF_CELULAR2 || '',
            TIPO_ACTI: textosDescriptivosMapeados.TIPO_ACTI_TEXTO || mappedData.TIPO_ACTI || '',
            AFILIA_FPSSOC: response.DATOS?.AFILIA_FPSSOC || '',
            FEC_FPSSOC: response.DATOS?.FEC_FPSSOC || '',
            TIPO_NAC: textosDescriptivosMapeados.TIPO_NAC_TEXTO || mappedData.TIPO_NAC || '',
            AFILIA_FPSCONY: response.DATOS?.AFILIA_FPSCONY || '',
            FEC_FPSCONY: response.DATOS?.FEC_FPSCONY || '',
            COD_USER: mappedData.COD_USER || ''
          },
          DIRECCION: {
            CUENTA: socioLista.DNI,
            // ✅ USAR SOLO LO QUE VIENE DEL API - NO ASUMIR VALORES
            TIPO_DIR: response.DIRECCION?.TIPO_DIR || '',
            // ✅ USAR TEXTOS DESCRIPTIVOS PARA TIPO_VIA Y TIPO_ZONA
            TIPO_VIA: (direccionConTextos as any).TIPO_VIA_TEXTO || response.DIRECCION?.TIPO_VIA || '',
            NOM_VIA: response.DIRECCION?.NOM_VIA || '',
            NUMERO: response.DIRECCION?.NUMERO || '',
            INTERIOR: response.DIRECCION?.INTERIOR || '',
            TIPO_ZONA: (direccionConTextos as any).TIPO_ZONA_TEXTO || response.DIRECCION?.TIPO_ZONA || '',
            NOM_ZONA: response.DIRECCION?.NOM_ZONA || '',
            REFERENCIA: response.DIRECCION?.REFERENCIA || '',
            // ✅ USAR TEXTOS DESCRIPTIVOS DE UBICACIÓN SI ESTÁN DISPONIBLES, SI NO, USAR CÓDIGOS ORIGINALES
            DPTO: (direccionConTextos as any).DPTO_TEXTO || response.DIRECCION?.DPTO || '',
            PROV: (direccionConTextos as any).PROV_TEXTO || response.DIRECCION?.PROV || '',
            DIST: (direccionConTextos as any).DIST_TEXTO || response.DIRECCION?.DIST || '',
            TIPO_SECTOR: response.DIRECCION?.TIPO_SECTOR || '',
            COD_USER: response.DIRECCION?.COD_USER || ''
          },
          // ✅ MAPEAR DOCUMENTOS USANDO IMÁGENES REALES DEL ENDPOINT getImgSocio
          DOCUMENT: {
            CUENTA: socioLista.DNI,
            DNI_FRONTAL: imagenesReales?.link?.LINK_DNI_FRONTAL || '',
            DNI_POSTERIOR: imagenesReales?.link?.LINK_DNI_POSTERIOR || '',
            OTRO_DOCUMENTO: imagenesReales?.link?.LINK_VOUCHER_AFI || ''
          }
        };
        
        setSelectedSocio(socioCompleto);
        setIsModalOpen(true);
        
      } else {
        // ❌ ERROR: Los datos DEBEN existir porque están pre-afiliados
        Notification.error(`ERROR: No se encontraron los datos del socio ${socioLista.DNI} en la base de datos. Contacte al administrador.`);
      }
    } catch (error) {
      Notification.error('Error al cargar la información completa del socio desde la base de datos');
    } finally {
      setLoadingModal(null);
    }
  };

  // 🔐 OBTENER DATOS DEL USUARIO DESDE AUTH CONTEXT
  const { user } = useContext(AuthContext);
  const [procesandoAfiliacion, setProcesandoAfiliacion] = useState(false);

  const handleAprobar = async () => {
    if (!selectedSocio || !user) {
      Notification.error('❌ Error: No hay datos del usuario o socio seleccionado');
      return;
    }

    // Verificar que el usuario tenga agencias configuradas
    if (!user.agencias || user.agencias.length === 0) {
      Notification.error('❌ Error: El usuario no tiene agencias asignadas');
      return;
    }

    try {
      setProcesandoAfiliacion(true);

      // 📝 PREPARAR DATOS PARA EL ENDPOINT
      const datosAfiliacion: AfiliarSocioRequest = {
        TIPO_DOC: selectedSocio.DATOS.TIPO_DI, // DNI por defecto
        NRO_DOC: selectedSocio.DATOS.NRO_DI,
        AGENCIA: user.agencias[0].agencia , // Primera agencia del usuario
        COD_CAJA: user.agencias[0].cod_caja, // Código de caja de la primera agencia
        USER: user.user || user.dni, // Usuario desde AuthContext
        nro_banco: nroBanco // Agregar el número de banco al enviar los datos
      };


      // 🚀 LLAMAR AL ENDPOINT REAL
      await afiliacionAPI.afiliarSocioProceso(datosAfiliacion);

      Notification.success('✅ Afiliación procesada exitosamente');

      // Actualizar estado en la lista principal
      setSociosLista(prev =>
        prev.map(s =>
          s.DNI === selectedSocio.DATOS.NRO_DI
            ? { ...s, ESTADO: "APROBADO" }
            : s
        )
      );

      setIsModalOpen(false);
      setSelectedSocio(null);

    } catch (error) {
      Notification.error(`❌ Error al procesar la afiliación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcesandoAfiliacion(false);
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'PRE_AFILIADO': return 'bg-yellow-100 text-yellow-800';
      case 'APROBADO': return 'bg-green-100 text-green-800';
      case 'RECHAZADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout title="Afiliación de Socios">
        <div className="p-4 bg-white shadow-md rounded-md">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando lista de socios pendientes...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Afiliación de Socios">
        <div className="p-4 bg-white shadow-md rounded-md">
          {error && (
            <div className="text-center text-yellow-600">
              <p className="text-lg font-semibold">{error}</p>
            </div>
          )}
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">Error al cargar datos</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Afiliación de Socios">
      <div className="p-4 bg-white shadow-md rounded-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Afiliación de Socios</h2>
        
        {sociosLista.length === 0 ? (
          <div className="text-center text-gray-600">
            <p className="text-lg font-semibold">No hay socios pendientes de afiliación.</p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro. DNI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombres</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Pre-afiliación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sociosLista.map((socio) => (
                  <tr key={socio.DNI} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {socio.DNI}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {socio.AGENCIA}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {socio.APELLIDOS}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {socio.NOMBRES}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {socio.EDAD} años
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(socio.FECHA_PRE_AFI).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeClass(socio.ESTADO)}`}>
                        {socio.ESTADO}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAfiliar(socio)}
                        disabled={socio.ESTADO !== 'PRE_AFILIADO' || loadingModal === socio.DNI}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                      >
                        {loadingModal === socio.DNI ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Cargando...
                          </>
                        ) : (
                          'Revisar Afiliación'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de Afiliación */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          {selectedSocio && (
            <div className="p-6">
              {/* Información Personal */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información Personal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <EditableField
                    label="Número de DNI"
                    value={selectedSocio.DATOS.NRO_DI}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="NRO_DI"
                  />
                  <EditableField
                    label="Tipo Documento"
                    value={getTipoDocumento(selectedSocio.DATOS.TIPO_DI)}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_DI"
                  />
                  <EditableField
                    label="Cuenta"
                    value={selectedSocio.DATOS.CUENTA}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="CUENTA"
                  />
                  <EditableField
                    label="Apellido Paterno"
                    value={selectedSocio.DATOS.APE_PATERNO}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="APE_PATERNO"
                  />
                  <EditableField
                    label="Apellido Materno"
                    value={selectedSocio.DATOS.APE_MATERNO}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="APE_MATERNO"
                  />
                  <EditableField
                    label="Nombres"
                    value={selectedSocio.DATOS.NOMBRE}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="NOMBRE"
                  />
                  <EditableField
                    label="Fecha de Nacimiento"
                    value={selectedSocio.DATOS.FECHA_NAC}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="FECHA_NAC"
                    type="date"
                  />
                  <EditableField
                    label="Lugar de Nacimiento"
                    value={selectedSocio.DATOS.LUGAR_NAC}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="LUGAR_NAC"
                  />
                  <EditableField
                    label="Email"
                    value={selectedSocio.DATOS.EMAIL}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="EMAIL"
                    type="email"
                  />
                  <EditableField
                    label="Ocupación"
                    value={selectedSocio.DATOS.OCUPACION}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="OCUPACION"
                  />
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información de Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <EditableField
                    label="Teléfono Fijo 1"
                    value={selectedSocio.DATOS.TLF_FIJO1}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TLF_FIJO1"
                  />
                  <EditableField
                    label="Teléfono Fijo 2"
                    value={selectedSocio.DATOS.TLF_FIJO2}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TLF_FIJO2"
                  />
                  <EditableField
                    label="Celular 1"
                    value={selectedSocio.DATOS.TLF_CEL1}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TLF_CEL1"
                  />
                  <EditableField
                    label="Celular 2"
                    value={selectedSocio.DATOS.TLD_CEL2}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TLD_CEL2"
                  />
                </div>
              </div>

              {/* Información de Dirección */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información de Dirección</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <EditableField
                    label="Tipo de Vía"
                    value={selectedSocio.DIRECCION.TIPO_VIA}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="TIPO_VIA"
                  />
                  <EditableField
                    label="Nombre de Vía"
                    value={selectedSocio.DIRECCION.NOM_VIA}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="NOM_VIA"
                  />
                  <EditableField
                    label="Número"
                    value={selectedSocio.DIRECCION.NUMERO}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="NUMERO"
                  />
                  <EditableField
                    label="Interior"
                    value={selectedSocio.DIRECCION.INTERIOR}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="INTERIOR"
                  />
                  <EditableField
                    label="Tipo de Zona"
                    value={selectedSocio.DIRECCION.TIPO_ZONA}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="TIPO_ZONA"
                  />
                  <EditableField
                    label="Nombre de Zona"
                    value={selectedSocio.DIRECCION.NOM_ZONA}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="NOM_ZONA"
                  />
                  <EditableField
                    label="Departamento"
                    value={selectedSocio.DIRECCION.DPTO}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="DPTO"
                  />
                  <EditableField
                    label="Provincia"
                    value={selectedSocio.DIRECCION.PROV}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="PROV"
                  />
                  <EditableField
                    label="Distrito"
                    value={selectedSocio.DIRECCION.DIST}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="DIST"
                  />
                </div>
                <div className="mt-4">
                  <EditableField
                    label="Referencia"
                    value={selectedSocio.DIRECCION.REFERENCIA}
                    onChange={(key, value) => handleFieldChange('DIRECCION', key, value)}
                    fieldKey="REFERENCIA"
                  />
                </div>
              </div>

              {/* Información Adicional */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información Adicional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <EditableField
                    label="Agencia"
                    value={textosDescriptivos?.AGE_TEXTO || selectedSocio.DATOS.AGENCIA}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="AGENCIA"
                  />
                  <EditableField
                    label="Fecha de Apertura"
                    value={selectedSocio.DATOS.FECHA_APERTURA}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="FECHA_APERTURA"
                    type="date"
                  />
                  <EditableSelectField
                    label="Tipo de Profesión"
                    value={textosDescriptivos?.TIPO_PROF_TEXTO || profesionOptions.find(p => p.value === selectedSocio.DATOS.TIPO_PROFESION)?.label || selectedSocio.DATOS.TIPO_PROFESION}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_PROFESION"
                    options={profesionOptions}
                    codigo={selectedSocio.DATOS.TIPO_PROFESION}
                  />
                  <EditableSelectField
                    label="Tipo de Instrucción"
                    value={textosDescriptivos?.TIPO_INST_TEXTO || selectedSocio.DATOS.TIPO_INSTRUCCION}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_INSTRUCCION"
                    options={instruccionOptions}
                    codigo={selectedSocio.DATOS.TIPO_INSTRUCCION}
                  />
                  <EditableSelectField
                    label="Tipo de Actividad"
                    value={textosDescriptivos?.TIPO_ACTI_TEXTO || actividadEconomicaOptions.find(a => a.value === selectedSocio.DATOS.TIPO_ACTI)?.label || selectedSocio.DATOS.TIPO_ACTI}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_ACTI"
                    options={actividadEconomicaOptions}
                    codigo={selectedSocio.DATOS.TIPO_ACTI}
                  />
                  <EditableSelectField
                    label="Sexo"
                    value={textosDescriptivos?.SEXO_TEXTO || selectedSocio.DATOS.SEXO}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="SEXO"
                    options={[
                      { value: 'M', label: 'Masculino' },
                      { value: 'F', label: 'Femenino' }
                    ]}
                    codigo={selectedSocio.DATOS.SEXO}
                  />
                  <EditableSelectField
                    label="Estado Civil"
                    value={textosDescriptivos?.TIPO_ECIV_TEXTO || estadoCivilOptions.find(e => e.value === selectedSocio.DATOS.EST_CIVIL)?.label || selectedSocio.DATOS.EST_CIVIL}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="EST_CIVIL"
                    options={estadoCivilOptions}
                    codigo={selectedSocio.DATOS.EST_CIVIL}
                  />
                  <EditableSelectField
                    label="Tipo de Vivienda"
                    value={textosDescriptivos?.TIPO_VIV_TEXTO || selectedSocio.DATOS.TIPO_VIVIENDA}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_VIVIENDA"
                    options={viviendaOptions}
                    codigo={selectedSocio.DATOS.TIPO_VIVIENDA}
                  />
                  <EditableSelectField
                    label="Nacionalidad"
                    value={textosDescriptivos?.TIPO_NAC_TEXTO || selectedSocio.DATOS.TIPO_NAC}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_NAC"
                    options={nacionalidadOptions}
                    codigo={selectedSocio.DATOS.TIPO_NAC}
                  />
                </div>
              </div>

              {/* Documentos de Verificación - IMÁGENES */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Documentos de Verificación</h4>
                
                {/* DNI - Ambas caras */}
                <div className="mb-6">
                  <h5 className="text-md font-medium mb-3 text-gray-700">Documento de Identidad (DNI)</h5>
                  <DNIImageViewer
                    dniFrontal={selectedSocio.DOCUMENT.DNI_FRONTAL}
                    dniPosterior={selectedSocio.DOCUMENT.DNI_POSTERIOR}
                  />
                </div>

                {/* Comprobante de Pago */}
                <div className="mb-4">
                  <h5 className="text-md font-medium mb-3 text-gray-700">Comprobante de Pago</h5>
                  <VoucherViewer otroDocumento={selectedSocio.DOCUMENT.OTRO_DOCUMENTO} />
                </div>
                
                {/* Información adicional sobre las imágenes */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Instrucciones para verificación:</strong> Verifique que los datos del DNI (ambas caras) coincidan con la información registrada 
                    y que el comprobante de pago sea válido y esté a nombre del socio. Revise la foto, firma y demás elementos de seguridad del documento.
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end border-t pt-4">
                  <input
                      type="text"
                      placeholder="Número de Banco"
                      value={nroBanco}
                      onChange={(e) => setNroBanco(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                      onClick={() => setIsModalOpen(false)}
                      disabled={procesandoAfiliacion}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Cancelar
                  </button>
                  <button
                      onClick={handleAprobar}
                      disabled={procesandoAfiliacion || !user?.agencias?.length}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                      {procesandoAfiliacion ? (
                          <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Procesando...
                          </>
                      ) : (
                          'Aprobar Afiliación'
                      )}
                  </button>
              </div>

              {/* 🔍 INFO DE DEBUG PARA VER DATOS DEL USUARIO */}
              {user && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
                  <p><strong>👤 Usuario:</strong> {user.user || user.dni}</p>
                  <p><strong>🏢 Agencias:</strong> {user.agencias?.length || 0}</p>
                  {user.agencias && user.agencias.length > 0 && (
                    <p><strong>📊 Agencia activa:</strong> {user.agencias[0].agencia} (Caja: {user.agencias[0].cod_caja})</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}