import { FileText, MapPin, Briefcase, User } from 'lucide-react';
import { useState, useCallback } from 'react';
import Layout from '../Layout';

import { DatosForm } from './regsitro_datos';
import RegistroDireccion from './registro_direccion';
import RegistroFamiliares from './registro_familiares';
import RegistroLaboral from './registro_laboral';
import CertificadosAfiliacion from './certificadosAfiliacion';

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
    ap_paterno: '',
    ap_materno: '',
    nombres: '',
    Fecha_nac: '',
    parentesco: '',
    dni: '',
    telefono: '',
    correo: '',
    direccion: '',
    estado_civil: '',
    grado_instruccion: '',
    vinculo_familiar: '',
    sexo: '',
    tipo_documento: '',
    Nro_doc: '',
    estado: '',
    email: '',
    beneficiario: false,
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
    />,
    direccion: <RegistroDireccion datosBasicos={datosBasicos} datosDireccionApi={datosDireccionApi} />,
    laboral: <RegistroLaboral formData={formData} onInputChange={onInputChange} datosBasicos={datosBasicos} />,
    familia: <RegistroFamiliares formData={formData} onInputChange={onInputChange} datosBasicos={datosBasicos} />,
    impresion: <CertificadosAfiliacion />,
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
                  onClick={() => handleTabChange('laboral')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'laboral'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : !datosBasicosCompletos
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={!datosBasicosCompletos}
                >
                  <Briefcase className="inline w-4 h-4 mr-2" />
                  Laboral
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
              {activeTab === 'datos' && tabContents.datos}
              {activeTab === 'direccion' && tabContents.direccion}
              {activeTab === 'laboral' && tabContents.laboral}
              {activeTab === 'familia' && tabContents.familia}
              {activeTab === 'impresion' && tabContents.impresion}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
