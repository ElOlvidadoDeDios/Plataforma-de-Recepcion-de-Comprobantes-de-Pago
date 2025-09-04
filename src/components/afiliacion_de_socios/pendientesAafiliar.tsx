import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../Layout';
//import { useComboBoxData, saveCliente, useComboBoxrellenarData } from '../../api/registroDeclientesApi';
//import { AGENCIAS } from '../../types/index';
//import { AuthContext } from '../../contexts/AuthContext';
//import { verificarSocioReniec } from '../../api/geodileApi';
//import {PersonData, TipoDocumento, SelectField, InputField, RadioGroup, DatosDireccionApi, DatosBasicos} from '../../FormFields';


// Interfaz de datos reales del socio
interface SocioData {
  CUENTA: string;
  AGENCIA: string;
  TIPO_SOCIO: string;
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
}

// Componente Modal usando Portal
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

// Componente para mostrar imágenes
const ImageViewer = ({ title, imageSrc, altText }: { title: string; imageSrc?: string; altText: string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h5 className="font-medium text-gray-700 mb-3">{title}</h5>
      <div className="bg-gray-100 min-h-[200px] rounded-lg flex items-center justify-center">
        {imageSrc && !imageError ? (
          <img 
            src={imageSrc}
            alt={altText}
            className={`max-w-full max-h-[300px] object-contain rounded ${!imageLoaded ? 'hidden' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : null}
        
        {(!imageSrc || imageError || !imageLoaded) && (
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">
              {title.includes('DNI') || title.includes('Identidad') ? '🆔' : '🧾'}
            </div>
            <p className="text-sm text-gray-500">{altText}</p>
            <p className="text-xs text-gray-400 mt-1">
              {imageError ? 'Error al cargar la imagen' : 'Imagen pendiente de verificación'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AfiliacionSocios() {
  const [socios, setSocios] = useState<SocioData[]>([]);
  const [selectedSocio, setSelectedSocio] = useState<SocioData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [_loading, setLoading] = useState(false);

  // Datos reales de ejemplo
  const mockData: SocioData[] = [
    {
      CUENTA: "000000036714",
      AGENCIA: "01",
      TIPO_SOCIO: "01",
      TIPO_DI: "01",
      NRO_DI: "75654690",
      APE_PATERNO: "VILA",
      APE_MATERNO: "PUICON",
      NOMBRE: "VALERIA SUEY",
      FECHA_APERTURA: "2025-08-30 00:00:00",
      FECHA_NAC: "2000-12-19 00:00:00",
      LUGAR_NAC: "cusco",
      EST_SOCIO: "01",
      TIPO_PERSONA: "01",
      TIPO_VIVIENDA: "02",
      EST_CIVIL: "02",
      SEXO: "F",
      TIPO_PROFESION: "0019",
      TIPO_INSTRUCCION: "02",
      OCUPACION: "ayudante",
      EMAIL: "alexanderhanccoleon4@gmail.com",
      TLF_FIJO1: "901579322",
      TLF_FIJO2: "",
      TLF_CEL1: "931941085",
      TLD_CEL2: "",
      TIPO_NAC: "132",
      TIPO_ACTI: "18"
    },
    // Agregar más datos de ejemplo si es necesario
    {
      CUENTA: "000000036715",
      AGENCIA: "01",
      TIPO_SOCIO: "02",
      TIPO_DI: "01",
      NRO_DI: "12345678",
      APE_PATERNO: "GARCIA",
      APE_MATERNO: "LOPEZ",
      NOMBRE: "CARLOS ANTONIO",
      FECHA_APERTURA: "2025-08-29 00:00:00",
      FECHA_NAC: "1985-05-15 00:00:00",
      LUGAR_NAC: "lima",
      EST_SOCIO: "01",
      TIPO_PERSONA: "01",
      TIPO_VIVIENDA: "01",
      EST_CIVIL: "01",
      SEXO: "M",
      TIPO_PROFESION: "0025",
      TIPO_INSTRUCCION: "03",
      OCUPACION: "ingeniero",
      EMAIL: "carlos.garcia@email.com",
      TLF_FIJO1: "014567890",
      TLF_FIJO2: "",
      TLF_CEL1: "987654321",
      TLD_CEL2: "",
      TIPO_NAC: "132",
      TIPO_ACTI: "12"
    }
  ];

  useEffect(() => {
    // Aquí iría la llamada real al endpoint
    // fetchSocios();
    setLoading(true);
    setTimeout(() => {
      setSocios(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  // Función para obtener edad a partir de fecha de nacimiento
  const calcularEdad = (fechaNac: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Función para obtener el estado legible
  const getEstadoSocio = (estado: string) => {
    switch (estado) {
      case '01': return 'Pendiente';
      case '02': return 'Aprobado';
      case '03': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  // Función para obtener tipo de documento
  const getTipoDocumento = (tipo: string) => {
    switch (tipo) {
      case '01': return 'DNI';
      case '02': return 'Carnet de Extranjería';
      case '03': return 'Pasaporte';
      default: return 'Otro';
    }
  };

  const handleAfiliar = (socio: SocioData) => {
    setSelectedSocio(socio);
    setIsModalOpen(true);
  };

  const handleAprobar = () => {
    if (selectedSocio) {
      setSocios(prev => 
        prev.map(s => 
          s.NRO_DI === selectedSocio.NRO_DI 
            ? { ...s, EST_SOCIO: "02" }
            : s
        )
      );
      setIsModalOpen(false);
      setSelectedSocio(null);
    }
  };

  const handleRechazar = () => {
    if (selectedSocio) {
      setSocios(prev => 
        prev.map(s => 
          s.NRO_DI === selectedSocio.NRO_DI 
            ? { ...s, EST_SOCIO: "03" }
            : s
        )
      );
      setIsModalOpen(false);
      setSelectedSocio(null);
    }
  };

  return (
  <Layout title="Afiliación de Socios">
    <div className="p-4 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Afiliación de Socios</h2>
      
      {/* Tabla Responsiva */}
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro. DNI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombres</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Nacimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lugar Nac.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {socios.map((socio) => (
              <tr key={socio.NRO_DI} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {socio.NRO_DI}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {socio.APE_PATERNO} {socio.APE_MATERNO}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {socio.NOMBRE}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {calcularEdad(socio.FECHA_NAC)} años
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(socio.FECHA_NAC).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {socio.LUGAR_NAC}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    socio.EST_SOCIO === '01' ? 'bg-yellow-100 text-yellow-800' :
                    socio.EST_SOCIO === '02' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getEstadoSocio(socio.EST_SOCIO)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleAfiliar(socio)}
                    disabled={socio.EST_SOCIO !== '01'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Revisar Afiliación
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de DNI</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.NRO_DI}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getTipoDocumento(selectedSocio.TIPO_DI)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.CUENTA}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.APE_PATERNO}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.APE_MATERNO}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.NOMBRE}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{calcularEdad(selectedSocio.FECHA_NAC)} años</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{new Date(selectedSocio.FECHA_NAC).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Nacimiento</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded capitalize">{selectedSocio.LUGAR_NAC}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.SEXO === 'M' ? 'Masculino' : 'Femenino'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.EMAIL}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded capitalize">{selectedSocio.OCUPACION}</p>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información de Contacto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo 1</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TLF_FIJO1 || 'No registrado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo 2</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TLF_FIJO2 || 'No registrado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular 1</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TLF_CEL1}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular 2</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TLD_CEL2 || 'No registrado'}</p>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información Adicional</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Socio</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TIPO_SOCIO}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agencia</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.AGENCIA}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Apertura</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{new Date(selectedSocio.FECHA_APERTURA).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Profesión</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TIPO_PROFESION}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Instrucción</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TIPO_INSTRUCCION}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Actividad</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSocio.TIPO_ACTI}</p>
                </div>
              </div>
            </div>

            {/* Documentos de Verificación - IMÁGENES */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Documentos de Verificación</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen del DNI del Socio */}
                <ImageViewer 
                  title="Documento de Identidad (DNI) del Socio"
                  imageSrc={`/api/images/dni/${selectedSocio.NRO_DI}.jpg`} // URL donde estarían las imágenes del DNI
                  altText="Imagen del DNI del socio para verificación de identidad"
                />

                {/* Comprobante de Pago */}
                <ImageViewer 
                  title="Comprobante de Pago de Afiliación"
                  imageSrc={`/api/images/voucher/${selectedSocio.NRO_DI}_voucher.jpg`} // URL donde estarían los vouchers
                  altText="Voucher de pago de afiliación del socio"
                />
              </div>
              
              {/* Información adicional sobre las imágenes */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instrucciones para verificación:</strong> Verifique que los datos del DNI coincidan con la información registrada 
                  y que el comprobante de pago sea válido y esté a nombre del socio.
                </p>
              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Observaciones del Analista</h4>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Agregar observaciones sobre la verificación de documentos, inconsistencias encontradas, o cualquier comentario relevante para la decisión de afiliación..."
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