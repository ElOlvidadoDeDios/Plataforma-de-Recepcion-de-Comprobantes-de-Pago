import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Save, X } from 'lucide-react';
import Layout from '../Layout';
import afiliacionAPI, { type AfiliacionSocios } from '../../api/afiliacionAPi';
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
}

// Componente para campo editable
const EditableField = ({ 
  label, 
  value, 
  onChange, 
  fieldKey,
  type = "text" 
}: { 
  label: string; 
  value: string; 
  onChange: (key: string, value: string) => void;
  fieldKey: string;
  type?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(fieldKey, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-800"
              title="Guardar"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:text-red-800"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {value || 'No registrado'}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Edit3 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Componente Modal
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">Afiliación de Socio</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

// Componente para mostrar imágenes del DNI
const DNIImageViewer = ({ nroDni }: { nroDni: string }) => {
  const [frontLoaded, setFrontLoaded] = useState(false);
  const [backLoaded, setBackLoaded] = useState(false);
  const [frontError, setFrontError] = useState(false);
  const [backError, setBackError] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* DNI Frontal */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h5 className="font-medium text-gray-700 mb-3">DNI - Cara Frontal</h5>
        <div className="bg-gray-100 min-h-[200px] rounded-lg flex items-center justify-center">
          {!frontError ? (
            <img 
              src={`/api/images/dni/${nroDni}_front.jpg`}
              alt="DNI Frontal"
              className={`max-w-full max-h-[300px] object-contain rounded ${!frontLoaded ? 'hidden' : ''}`}
              onLoad={() => setFrontLoaded(true)}
              onError={() => setFrontError(true)}
            />
          ) : null}
          
          {(frontError || !frontLoaded) && (
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">🆔</div>
              <p className="text-sm text-gray-500">Cara frontal del DNI</p>
              <p className="text-xs text-gray-400 mt-1">
                {frontError ? 'Error al cargar imagen' : 'Cargando imagen...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DNI Posterior */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h5 className="font-medium text-gray-700 mb-3">DNI - Cara Posterior</h5>
        <div className="bg-gray-100 min-h-[200px] rounded-lg flex items-center justify-center">
          {!backError ? (
            <img 
              src={`/api/images/dni/${nroDni}_back.jpg`}
              alt="DNI Posterior"
              className={`max-w-full max-h-[300px] object-contain rounded ${!backLoaded ? 'hidden' : ''}`}
              onLoad={() => setBackLoaded(true)}
              onError={() => setBackError(true)}
            />
          ) : null}
          
          {(backError || !backLoaded) && (
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">🆔</div>
              <p className="text-sm text-gray-500">Cara posterior del DNI</p>
              <p className="text-xs text-gray-400 mt-1">
                {backError ? 'Error al cargar imagen' : 'Cargando imagen...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para voucher
const VoucherViewer = ({ nroDni }: { nroDni: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h5 className="font-medium text-gray-700 mb-3">Comprobante de Pago de Afiliación</h5>
      <div className="bg-gray-100 min-h-[200px] rounded-lg flex items-center justify-center">
        {!error ? (
          <img 
            src={`/api/images/voucher/${nroDni}_voucher.jpg`}
            alt="Comprobante de pago"
            className={`max-w-full max-h-[300px] object-contain rounded ${!loaded ? 'hidden' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        ) : null}
        
        {(error || !loaded) && (
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">🧾</div>
            <p className="text-sm text-gray-500">Voucher de pago de afiliación</p>
            <p className="text-xs text-gray-400 mt-1">
              {error ? 'Error al cargar imagen' : 'Cargando imagen...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AfiliacionSociosComponent() {
  // Estado para la lista inicial simplificada desde la API
  const [sociosLista, setSociosLista] = useState<AfiliacionSocios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el modal con datos completos
  const [selectedSocio, setSelectedSocio] = useState<SocioData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);

  // Datos completos de ejemplo (se usarán cuando se haga clic en "Revisar Afiliación")
  const mockDataCompleta: SocioData[] = [
    {
      SITUACION: "PRE_AFILIADO",
      DATOS: {
        CUENTA: "<AUTOMATICO>",
        AGENCIA: "01",
        APE_PATERNO: "GUERRA",
        APE_MATERNO: "SULCA",
        NOMBRE: "JUAN LUIS",
        FECHA_APERTURA: "2025-09-03",
        FECHA_NAC: "2000-12-02",
        LUGAR_NAC: "cusco",
        EST_SOCIO: "01",
        TIPO_PERSONA: "01",
        TIPO_VIVIENDA: "02",
        EST_CIVIL: "02",
        SEXO: "M",
        TIPO_PROFESION: "0019",
        TIPO_INSTRUCCION: "01",
        OCUPACION: "cantante",
        EMAIL: "alexanderhanccoleon4@gmail.com",
        TIPO_DI: "01",
        NRO_DI: "75654681",
        TLF_FIJO1: "",
        TLF_FIJO2: "",
        TLF_CEL1: "931941085",
        TLD_CEL2: "",
        TIPO_ACTI: "18",
        AFILIA_FPSSOC: "N",
        FEC_FPSSOC: "1900-01-01",
        TIPO_NAC: "132",
        AFILIA_FPSCONY: "E",
        FEC_FPSCONY: "1900-01-01",
        COD_USER: "HLA1"
      },
      DIRECCION: {
        CUENTA: "75654681",
        TIPO_DIR: "01",
        TIPO_VIA: "01",
        NOM_VIA: "los heroes",
        NUMERO: "200",
        INTERIOR: "",
        TIPO_ZONA: "07",
        NOM_ZONA: "los jardines",
        REFERENCIA: "cerca del colegio humberto luna",
        DPTO: "08",
        PROV: "01",
        DIST: "01",
        TIPO_SECTOR: "016",
        COD_USER: "HLA1"
      }
    },
    {
      SITUACION: "PRE_AFILIADO",
      DATOS: {
        CUENTA: "<AUTOMATICO>",
        AGENCIA: "01",
        APE_PATERNO: "VILA",
        APE_MATERNO: "PUICON",
        NOMBRE: "VALERIA SUEY",
        FECHA_APERTURA: "2025-08-30",
        FECHA_NAC: "2000-12-19",
        LUGAR_NAC: "cusco",
        EST_SOCIO: "01",
        TIPO_PERSONA: "01",
        TIPO_VIVIENDA: "02",
        EST_CIVIL: "02",
        SEXO: "F",
        TIPO_PROFESION: "0019",
        TIPO_INSTRUCCION: "02",
        OCUPACION: "ayudante",
        EMAIL: "valeria.vila@gmail.com",
        TIPO_DI: "01",
        NRO_DI: "75654690",
        TLF_FIJO1: "901579322",
        TLF_FIJO2: "",
        TLF_CEL1: "931941085",
        TLD_CEL2: "",
        TIPO_ACTI: "18",
        AFILIA_FPSSOC: "N",
        FEC_FPSSOC: "1900-01-01",
        TIPO_NAC: "132",
        AFILIA_FPSCONY: "E",
        FEC_FPSCONY: "1900-01-01",
        COD_USER: "HLA1"
      },
      DIRECCION: {
        CUENTA: "75654690",
        TIPO_DIR: "01",
        TIPO_VIA: "02",
        NOM_VIA: "avenida el sol",
        NUMERO: "150",
        INTERIOR: "A",
        TIPO_ZONA: "05",
        NOM_ZONA: "centro histórico",
        REFERENCIA: "frente a la plaza de armas",
        DPTO: "08",
        PROV: "01",
        DIST: "01",
        TIPO_SECTOR: "012",
        COD_USER: "HLA1"
      }
    }
  ];

  // Cargar lista inicial desde la API
  useEffect(() => {
    const cargarSociosPendientes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await afiliacionAPI.sociospendientesAfiliar();
        setSociosLista(data);
      } catch (error) {
        console.error('Error al cargar socios pendientes:', error);
        setError('Error al cargar la lista de socios pendientes');
      } finally {
        setLoading(false);
      }
    };

    cargarSociosPendientes();
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

  const handleAfiliar = async (socioLista: AfiliacionSocios) => {
    try {
      setLoadingModal(true);
      
      // Aquí simularemos la carga de datos completos
      // En producción, aquí harías otra llamada a la API para obtener los datos completos
      const socioCompleto = mockDataCompleta.find(s => s.DATOS.NRO_DI === socioLista.DNI);
      
      if (socioCompleto) {
        setSelectedSocio(socioCompleto);
        setIsModalOpen(true);
      } else {
        // Si no se encuentra en los datos mock, crear estructura básica
        const socioBasico: SocioData = {
          SITUACION: socioLista.ESTADO,
          DATOS: {
            CUENTA: "<AUTOMATICO>",
            AGENCIA: "01",
            APE_PATERNO: socioLista.APELLIDOS.split(' ')[0] || '',
            APE_MATERNO: socioLista.APELLIDOS.split(' ')[1] || '',
            NOMBRE: socioLista.NOMBRES,
            FECHA_APERTURA: socioLista.FECHA_PRE_AFI,
            FECHA_NAC: "2000-01-01", // Valor por defecto
            LUGAR_NAC: "",
            EST_SOCIO: "01",
            TIPO_PERSONA: "01",
            TIPO_VIVIENDA: "02",
            EST_CIVIL: "02",
            SEXO: "",
            TIPO_PROFESION: "",
            TIPO_INSTRUCCION: "",
            OCUPACION: "",
            EMAIL: "",
            TIPO_DI: "01",
            NRO_DI: socioLista.DNI,
            TLF_FIJO1: "",
            TLF_FIJO2: "",
            TLF_CEL1: "",
            TLD_CEL2: "",
            TIPO_ACTI: "",
            AFILIA_FPSSOC: "N",
            FEC_FPSSOC: "1900-01-01",
            TIPO_NAC: "",
            AFILIA_FPSCONY: "E",
            FEC_FPSCONY: "1900-01-01",
            COD_USER: ""
          },
          DIRECCION: {
            CUENTA: socioLista.DNI,
            TIPO_DIR: "01",
            TIPO_VIA: "",
            NOM_VIA: "",
            NUMERO: "",
            INTERIOR: "",
            TIPO_ZONA: "",
            NOM_ZONA: "",
            REFERENCIA: "",
            DPTO: "",
            PROV: "",
            DIST: "",
            TIPO_SECTOR: "",
            COD_USER: ""
          }
        };
        setSelectedSocio(socioBasico);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar datos completos:', error);
      alert('Error al cargar la información completa del socio');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleAprobar = () => {
    if (selectedSocio) {
      // Actualizar en la lista principal también
      setSociosLista(prev =>
        prev.map(s =>
          s.DNI === selectedSocio.DATOS.NRO_DI
            ? { ...s, ESTADO: "APROBADO" }
            : s
        )
      );
      setIsModalOpen(false);
      setSelectedSocio(null);
    }
  };

  const handleRechazar = () => {
    if (selectedSocio) {
      // Actualizar en la lista principal también
      setSociosLista(prev =>
        prev.map(s =>
          s.DNI === selectedSocio.DATOS.NRO_DI
            ? { ...s, ESTADO: "RECHAZADO" }
            : s
        )
      );
      setIsModalOpen(false);
      setSelectedSocio(null);
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
        
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro. DNI</th>
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
                      disabled={socio.ESTADO !== 'PRE_AFILIADO' || loadingModal}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      {loadingModal ? (
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
                    value={selectedSocio.DATOS.AGENCIA}
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
                  <EditableField
                    label="Tipo de Profesión"
                    value={selectedSocio.DATOS.TIPO_PROFESION}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_PROFESION"
                  />
                  <EditableField
                    label="Tipo de Instrucción"
                    value={selectedSocio.DATOS.TIPO_INSTRUCCION}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_INSTRUCCION"
                  />
                  <EditableField
                    label="Tipo de Actividad"
                    value={selectedSocio.DATOS.TIPO_ACTI}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_ACTI"
                  />
                  <EditableField
                    label="Sexo"
                    value={selectedSocio.DATOS.SEXO === 'M' ? 'Masculino' : 'Femenino'}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="SEXO"
                  />
                  <EditableField
                    label="Estado Civil"
                    value={selectedSocio.DATOS.EST_CIVIL}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="EST_CIVIL"
                  />
                  <EditableField
                    label="Tipo de Vivienda"
                    value={selectedSocio.DATOS.TIPO_VIVIENDA}
                    onChange={(key, value) => handleFieldChange('DATOS', key, value)}
                    fieldKey="TIPO_VIVIENDA"
                  />
                </div>
              </div>

              {/* Documentos de Verificación - IMÁGENES */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Documentos de Verificación</h4>
                
                {/* DNI - Ambas caras */}
                <div className="mb-6">
                  <h5 className="text-md font-medium mb-3 text-gray-700">Documento de Identidad (DNI)</h5>
                  <DNIImageViewer nroDni={selectedSocio.DATOS.NRO_DI} />
                </div>

                {/* Comprobante de Pago */}
                <div className="mb-4">
                  <h5 className="text-md font-medium mb-3 text-gray-700">Comprobante de Pago</h5>
                  <VoucherViewer nroDni={selectedSocio.DATOS.NRO_DI} />
                </div>
                
                {/* Información adicional sobre las imágenes */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Instrucciones para verificación:</strong> Verifique que los datos del DNI (ambas caras) coincidan con la información registrada 
                    y que el comprobante de pago sea válido y esté a nombre del socio. Revise la foto, firma y demás elementos de seguridad del documento.
                  </p>
                </div>
              </div>

              {/* Observaciones */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Observaciones del Analista</h4>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Agregar observaciones sobre la verificación de documentos, inconsistencias encontradas, validación de datos con el DNI, o cualquier comentario relevante para la decisión de afiliación..."
                ></textarea>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end border-t pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRechazar}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                >
                  Rechazar Afiliación
                </button>
                <button
                  onClick={handleAprobar}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                >
                  Aprobar Afiliación
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}