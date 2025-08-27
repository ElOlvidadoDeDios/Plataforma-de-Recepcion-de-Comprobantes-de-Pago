import { useState, useCallback } from 'react';
import {Save, X, FileText, MapPin, Briefcase, User } from 'lucide-react';
import Layout from '../Layout';
import RegistroDireccion from './registro_direccion';
import { DatosForm , PersonData} from './regsitro_datos';
import RegistroFamiliares from './registro_familiares';
import RegistroLaboral from './registro_laboral';
import { verificarSocioReniec } from '../../api/geodileApi';



export default function PersonaForm() {
  const [activeTab, setActiveTab] = useState('datos');
  const [formData, setFormData] = useState<PersonData>({
    dni: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    nombres: '',
    lugarNacimiento: '',
    fechaNac: '1/08/2025',
    nacionalidad: 'PERUANA',
    sexo: '',
    estadoCivil: 'SOLTERO (A)',
    vivienda: 'PROPIA',
    telefonoFijo1: '',
    telefonoFijo2: '',
    movil1: '',
    movil2: '',
    instruccion: 'ANALFABETO',
    profesion: 'ABOGADO',
    ocupacion: '',
    activEconomica: 'AMBULANTES Y PUESTOS DE VENTA EN MERCADO',
    email: '',
    tipoSocio: 'SOCIO NORMAL',
    grupoSolidario: '',
    delegadoGrupo: false,
    situacion: 'ACTIVO'
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = useCallback((field: keyof PersonData, value: string | boolean) => {
    setFormData(prev => {
      if (prev[field] === value) return prev; // Evitar re-render innecesario
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const searchByDNI = useCallback(async () => {
    if (!formData.dni) return;
    setLoading(true);
    try {
      const datosReniec = await verificarSocioReniec(formData.dni);
      
      if (datosReniec) {
        setFormData(prev => ({
          ...prev,
          apellidoPaterno: datosReniec.apellido_paterno || '',
          apellidoMaterno: datosReniec.apellido_materno || '',
          nombres: datosReniec.nombres || '',
          lugarNacimiento: 'LIMA', // valor por defecto
          nacionalidad: 'PERUANA'
        }));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [formData.dni]);

  const handleSubmit = useCallback(async () => {
    try {
      alert('Datos guardados correctamente');
    } catch (error) {
      alert('Error al guardar los datos');
    }
  }, [formData]);

  const handleCancel = useCallback(() => {
    setFormData({
      dni: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombres: '',
      lugarNacimiento: '',
      fechaNac: '1/08/2025',
      nacionalidad: 'PERUANA',
      sexo: '',
      estadoCivil: 'SOLTERO (A)',
      vivienda: 'PROPIA',
      telefonoFijo1: '',
      telefonoFijo2: '',
      movil1: '',
      movil2: '',
      instruccion: 'ANALFABETO',
      profesion: 'ABOGADO',
      ocupacion: '',
      activEconomica: 'AMBULANTES Y PUESTOS DE VENTA EN MERCADO',
      email: '',
      tipoSocio: 'SOCIO NORMAL',
      grupoSolidario: '',
      delegadoGrupo: false,
      situacion: 'ACTIVO'
    });
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'datos':
        return (
          <DatosForm
            formData={formData}
            handleInputChange={handleInputChange}
            searchByDNI={searchByDNI}
            loading={loading}
          />
        );
      case 'direccion':
        return <RegistroDireccion formData={formData as any} onInputChange={handleInputChange as any} />;
      case 'laboral':
        return <RegistroLaboral formData={formData as any} onInputChange={handleInputChange as any} />;
      case 'familia':
        return <RegistroFamiliares formData={formData as any} onInputChange={handleInputChange as any} />;
      default:
        return (
          <DatosForm
            formData={formData}
            handleInputChange={handleInputChange}
            searchByDNI={searchByDNI}
            loading={loading}
          />
        );
    }
  };

  return (
    <Layout title="Registro de Clientes">
      <div className="flex flex-col" style={{ height: '100%' }}>
        <div className="flex-grow">
          <div className="bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 rounded-lg shadow-lg h-full">
            <div className="border-t border-gray-200">
              <div className="flex flex-wrap">
                <button
                  onClick={() => setActiveTab('datos')}
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
                  onClick={() => setActiveTab('direccion')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'direccion'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Dirección
                </button>
                <button
                  onClick={() => setActiveTab('laboral')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'laboral'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Briefcase className="inline w-4 h-4 mr-2" />
                  Laboral
                </button>
                <button
                  onClick={() => setActiveTab('familia')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'familia'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Familia/Benef.
                </button>
                <button
                  onClick={() => setActiveTab('impresion')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'impresion'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="inline w-4 h-4 mr-2" />
                  Impresión
                </button>
              </div>
            </div>
            <div className="p-6 flex-grow w-full">
              {renderTabContent()}
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Save size={16} />
              Grabar
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <X size={16} />
              Cancelar
            </button>
            {/* <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center justify-center gap-2 font-medium transition-colors">
              <FileText size={16} />
              Salir
            </button> */}
          </div>
        </div>
      </div>
    </Layout>
  );
}