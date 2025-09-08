import { FileText, MapPin, User } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import Layout from '../Layout';
import { useAuth } from '../../hooks/useAuth';

import { DatosForm } from './regsitro_datos';
import RegistroDireccion from './registro_direccion';
import RegistroFamiliares from './registro_familiares';
import CertificadosAfiliacion from './certificadosAfiliacion';
import { ClienteCompleto } from '../../types/clienteData';

// Interface para los datos básicos del cliente
interface DatosBasicos {
  NVA_CTA: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRES: string;
}

// Interface para los datos de dirección de la API
interface DatosDireccion {
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

export default function PersonaForm() {
  const [activeTab, setActiveTab] = useState('datos');
  const { user } = useAuth();
  
  // Estado para los datos básicos del cliente
  const [datosBasicos, setDatosBasicos] = useState<DatosBasicos>({
    NVA_CTA: '',
    APE_PAT: '',
    APE_MAT: '',
    NOMBRES: ''
  });
  
  // Estado para controlar si se han completado los datos básicos
  const [datosBasicosCompletos, setDatosBasicosCompletos] = useState<boolean>(false);
  
  // Estado para los datos de dirección obtenidos de la API
  const [datosDireccionApi, setDatosDireccionApi] = useState<DatosDireccion | null>(null);

  // Estado para almacenar todos los datos del cliente después del guardado exitoso
  const [clienteCompleto, setClienteCompleto] = useState<ClienteCompleto | null>(null);

  // Función callback para recibir los datos completos del cliente después del registro exitoso
  const handleRegistroExitoso = useCallback((datosCompletos: ClienteCompleto) => {
    setClienteCompleto(datosCompletos);
  }, []);

  // Crear datos para certificado usando useMemo para optimización
  const datosCertificado = useMemo(() => {
    
    if (!clienteCompleto || !user) {
      return undefined;
    }
    
    // Crear estructura esperada por CertificadosAfiliacion
    const datos = {
      cliente: clienteCompleto,
      direccion: (clienteCompleto as any).direccion || null, // ← Pasar dirección por separado
      usuario: {
        id_age: user.id_age?.toString() || '0',
        razon: user.email || user.user || '',
        dni: user.dni || ''
      },
      fechaEmision: new Date(), // ← Pasar objeto Date, no string
      // ✅ PASAR LOS DATOS DEL ANALISTA ORIGINAL Y AGENCIA ORIGINAL
      codUserOriginal: (clienteCompleto as any).COD_USER_ORIGINAL || clienteCompleto.COD_USER,
      ageOriginal: (clienteCompleto as any).AGE_ORIGINAL || clienteCompleto.AGE
    } as any;
    
    return datos;
  }, [clienteCompleto, user]);

  // Inicialización de los datos requeridos por los componentes
  const [formData, setFormData] = useState({
    // Dirección
    tipo_direccion: '',
    tipo_via: '',
    nombre: '',
    numero: '',
    interior: '',
    mz: '',
    lote: '',
    referencia: '',
    distrito: '',
    provincia: '',
    departamento: '',
    zona: '',
    nombre_zona: '',
    // Laboral
    ocupacion: '',
    empresa: '',
    direccion_empresa: '',
    telefono_empresa: '',
    ingresos: '',
    // Familiares
    ITEM: "",
    CUENTA: "",
    APE_PATERNO: "",
    APE_MATERNO: "",
    NOMBRE: "",
    FECHA_NAC: "",
    TIPO_PAREN: "",
    SEXO: "",
    TELEFONO: "",
    EMAIL: "",
    TIPO_DI: "",
    NRO_DI: "",
    TUTOR: "",
    BENEFICIARIO: "",
    PORC_BENEF: "",
    DIRECCION_REF: "",
    COD_USER: "",
  });

  // Función para actualizar el estado según la firma esperada por los componentes
  const onInputChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Función callback para recibir los datos básicos del componente DatosForm
  const handleDatosBasicosChange = useCallback((datos: DatosBasicos) => {
    setDatosBasicos(datos);
    
    // Verificar si todos los campos requeridos están completos
    const completos = datos.NVA_CTA !== '' &&
                     datos.APE_PAT !== '' &&
                     datos.APE_MAT !== '' &&
                     datos.NOMBRES !== '';
    
    setDatosBasicosCompletos(completos);
  }, []);

  // Función callback para recibir los datos de dirección del componente DatosForm
  const handleDatosDireccionChange = useCallback((datosDireccion: DatosDireccion | null) => {
    setDatosDireccionApi(datosDireccion);
  }, []);

  // Función para cambiar de pestaña con validación
  const handleTabChange = (tab: string) => {
    if (tab === 'datos') {
      setActiveTab(tab);
    } else if (datosBasicosCompletos) {
      setActiveTab(tab);
    } else {
      alert('Debe completar los datos básicos (Número de cuenta, Apellidos y Nombres) antes de continuar.');
    }
  };

  const tabContents = {
    datos: <DatosForm
      onSave={() => console.log('Guardado')}
      onClear={() => console.log('Limpiado')}
      onDatosBasicosChange={handleDatosBasicosChange}
      onDatosDireccionChange={handleDatosDireccionChange}
      onRegistroExitoso={handleRegistroExitoso}
    />,
    direccion: <RegistroDireccion datosBasicos={datosBasicos} datosDireccionApi={datosDireccionApi} />,
    familia: <RegistroFamiliares formData={formData} onInputChange={onInputChange} datosBasicos={datosBasicos} />,
    impresion: <CertificadosAfiliacion
      datosCertificado={datosCertificado}
      documentosExistentes={(clienteCompleto as any)?.DOCUMENT || null}
    />,
  };
  
  return (
    <Layout title="Registro de Clientes">
      <div className="flex flex-col" style={{ height: '100%' }}>
        <div className="flex-grow">
          <div className="bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 rounded-lg shadow-lg h-full">
            <div className="border-t border-gray-200">
              <div className="flex flex-wrap">
                <button
                  onClick={() => handleTabChange('datos')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'datos'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="inline w-4 h-4 mr-2" />
                  Datos
                </button>
                <button
                  onClick={() => handleTabChange('direccion')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'direccion'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : !datosBasicosCompletos
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={!datosBasicosCompletos}
                >
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Dirección
                </button>

                <button
                  onClick={() => handleTabChange('familia')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'familia'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : !datosBasicosCompletos
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={!datosBasicosCompletos}
                >
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Familia/Benef.
                </button>
                <button
                  onClick={() => handleTabChange('impresion')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'impresion'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : !datosBasicosCompletos
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={!datosBasicosCompletos}
                >
                  <FileText className="inline w-4 h-4 mr-2" />
                  Impresión
                </button>
              </div>
            </div>
            <div className="p-6 flex-grow w-full">
              <div style={{ display: activeTab === 'datos' ? 'block' : 'none' }}>
                {tabContents.datos}
              </div>
              <div style={{ display: activeTab === 'direccion' ? 'block' : 'none' }}>
                {tabContents.direccion}
              </div>
              <div style={{ display: activeTab === 'familia' ? 'block' : 'none' }}>
                {tabContents.familia}
              </div>
              <div style={{ display: activeTab === 'impresion' ? 'block' : 'none' }}>
                {tabContents.impresion}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
