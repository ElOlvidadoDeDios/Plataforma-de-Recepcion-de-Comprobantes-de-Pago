import { useState } from 'react';
import { ClienteResponse } from '../../../api/customerConsultationAPI';
import DatosBancariosForm from './DatosBancariosForm';

interface ClienteDetailsProps {
  clientData: ClienteResponse;
  onRefreshData?: () => void;
}

const ClienteDetails = ({ clientData, onRefreshData }: ClienteDetailsProps) => {
  const { INFO_SOCIO } = clientData;
  const [showDatosBancariosForm, setShowDatosBancariosForm] = useState(false);
  
  return (
    <div className="mb-4 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl">
      {/* Encabezado */}
      <div className="flex flex-col mb-3 px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              Ficha de Cliente
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              ID Cliente: <span className="font-medium text-cyan-600">#{INFO_SOCIO.DATOS_PERSONALES.DNI}</span>
            </p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded"></div>
      </div>

      {/* Datos Personales */}
      <div className="mb-4 px-4">
        <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          DATOS PERSONALES
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <DataField label="DNI" value={INFO_SOCIO.DATOS_PERSONALES.DNI} />
          <DataField label="APELLIDO PATERNO" value={INFO_SOCIO.DATOS_PERSONALES.APE_PAT} />
          <DataField label="NOMBRES" value={INFO_SOCIO.DATOS_PERSONALES.NOMBRES} />
          <DataField label="APELLIDO MATERNO" value={INFO_SOCIO.DATOS_PERSONALES.APE_MAT} />
        </div>
      </div>

      {/* Sociodemográfico */}
      <div className="mb-4 px-4">
        <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          SOCIODEMOGRÁFICO
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
          <DataField label="DEPARTAMENTO" value={INFO_SOCIO.SOCIODEMOGRAFICO.DEPARTAMENTO} />
          <DataField label="SEXO" value={INFO_SOCIO.SOCIODEMOGRAFICO.SEXO} />
          <DataField label="PROVINCIA" value={INFO_SOCIO.SOCIODEMOGRAFICO.PROVINCIA} />
          <DataField label="EDAD" value={INFO_SOCIO.SOCIODEMOGRAFICO.EDAD} />
          <DataField label="DISTRITO" value={INFO_SOCIO.SOCIODEMOGRAFICO.DISTRITO} />
          <DataField label="ESTADO CIVIL" value={INFO_SOCIO.SOCIODEMOGRAFICO.ESTADO_CIVIL} />
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center border border-gray-200 hover:border-cyan-200 transition-colors mb-3">
          <div className="font-medium text-gray-600 w-full md:w-1/3 text-sm md:text-base mb-1 md:mb-0">DIRECCIÓN</div>
          <div className="w-full md:w-2/3 md:text-right text-gray-800 font-semibold text-sm md:text-base">{INFO_SOCIO.SOCIODEMOGRAFICO.DIRECCION}</div>
        </div>
        <DataField label="RUBRO" value={INFO_SOCIO.SOCIODEMOGRAFICO.RUBRO} />
      </div>

      {/* Contacto */}
      <div className="mb-4 px-4">
        <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          CONTACTO
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <DataField label="CELULAR" value={INFO_SOCIO.CONTACTO.CELULAR} />
          <DataField label="CORREO" value={INFO_SOCIO.CONTACTO.EMAIL} />
        </div>
      </div>

      {/* Datos Bancarios */}
      <div className="mb-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 border-b-4 border-cyan-500 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            DATOS BANCARIOS
          </h3>
          <button
            onClick={() => setShowDatosBancariosForm(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {INFO_SOCIO["DATOS BANCARIOS"] && INFO_SOCIO["DATOS BANCARIOS"].length > 0 &&
             (INFO_SOCIO["DATOS BANCARIOS"][0].TITULAR || INFO_SOCIO["DATOS BANCARIOS"][0].BANCO) ? 'Editar' : 'Agregar'}
          </button>
        </div>
        
        {INFO_SOCIO["DATOS BANCARIOS"] && INFO_SOCIO["DATOS BANCARIOS"].length > 0 &&
         (INFO_SOCIO["DATOS BANCARIOS"][0].TITULAR || INFO_SOCIO["DATOS BANCARIOS"][0].BANCO) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <DataField label="TITULAR" value={INFO_SOCIO["DATOS BANCARIOS"][0].TITULAR || 'No especificado'} />
            <DataField label="BANCO" value={INFO_SOCIO["DATOS BANCARIOS"][0].BANCO || 'No especificado'} />
            {(INFO_SOCIO["DATOS BANCARIOS"][0].BANCO === 'Yape' || INFO_SOCIO["DATOS BANCARIOS"][0].BANCO === 'Plin') && (
              <DataField label="CELULAR" value={INFO_SOCIO["DATOS BANCARIOS"][0].CELULAR || 'No especificado'} />
            )}
            <DataField label="TIPO CUENTA" value={INFO_SOCIO["DATOS BANCARIOS"][0].TIPO_CUENTA || 'No especificado'} />
            <DataField label="NÚMERO CUENTA" value={INFO_SOCIO["DATOS BANCARIOS"][0].NUM_CUENTA || 'No especificado'} />
            <DataField label="ESTADO" value={INFO_SOCIO["DATOS BANCARIOS"][0].ESTADO || 'No especificado'} />
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p>No hay datos bancarios registrados</p>
          </div>
        )}
      </div>

      {/* Otros */}
      <div className="mb-4 px-4">
        <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          OTROS
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
          <DataField label="FECHA INICIO" value={INFO_SOCIO.OTROS.FECHA_INICIO} />
          <DataField label="CUENTA DILE" value={INFO_SOCIO.OTROS.CUENTA_DILE} />
          <DataField label="ESTADO" value={INFO_SOCIO.OTROS.ESTADO} />
        </div>
      </div>

      {/* Modal del formulario de datos bancarios */}
      {showDatosBancariosForm && (
        <DatosBancariosForm
          dni={INFO_SOCIO.DATOS_PERSONALES.DNI}
          datosBancarios={INFO_SOCIO["DATOS BANCARIOS"] || []}
          onSave={() => {
            setShowDatosBancariosForm(false);
            if (onRefreshData) {
              onRefreshData();
            }
          }}
          onCancel={() => setShowDatosBancariosForm(false)}
        />
      )}
    </div>
  );
};

const DataField = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
    <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">{label}</div>
    <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{value}</div>
  </div>
);

export default ClienteDetails;