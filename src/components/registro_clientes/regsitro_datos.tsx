import { memo, useEffect } from 'react';
import { Search } from 'lucide-react';
import {  useComboBoxData } from '../../api/registroDeclientesApi';

export interface PersonData {
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  lugarNacimiento: string;
  fechaNac: string;
  nacionalidad: string;
  sexo: 'M' | 'F' | '';
  estadoCivil: string;
  vivienda: string;
  telefonoFijo1: string;
  telefonoFijo2: string;
  movil1: string;
  movil2: string;
  instruccion: string;
  profesion: string;
  ocupacion: string;
  activEconomica: string;
  email: string;
  tipoSocio: string;
  grupoSolidario: string;
  delegadoGrupo: boolean;
  situacion: string;
}


// Componente DatosForm mejorado
export const DatosForm = memo(({ formData, handleInputChange, searchByDNI, loading: searchLoading }: {
  formData: PersonData;
  handleInputChange: (field: keyof PersonData, value: string | boolean) => void;
  searchByDNI: () => void;
  loading: boolean;
}) => {
  const { comboData, loading: comboLoading, error: comboError } = useComboBoxData();

  // Función para obtener el valor por defecto de Perú
  const getPeruNacionalidad = () => {
    if (!comboData?.NACIONALIDAD) return '';
    const peru = comboData.NACIONALIDAD.find(n => 
      n.NOM_NAC.toLowerCase().includes('per') || n.NOM_NAC.toLowerCase().includes('perú')
    );
    return peru ? peru.TIPO_NAC : '';
  };

  // Establecer valores por defecto cuando se cargan los datos
  useEffect(() => {
    if (comboData && !formData.nacionalidad) {
      const peruCode = getPeruNacionalidad();
      if (peruCode) {
        handleInputChange('nacionalidad', peruCode);
      }
    }
  }, [comboData, formData.nacionalidad]);

  if (comboError) {

  }

  return (
    <div>
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 md:p-4 rounded-t-lg">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm md:text-base font-medium mb-1">Agencia</label>
              <select className="bg-white text-black rounded px-3 py-1 w-full text-sm md:text-base">
                <option>OFICINA PRINCIPAL</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-sm md:text-base whitespace-nowrap">Tipo de Persona:</span>
              <div className="flex gap-2 sm:gap-4">
                <label className="flex items-center gap-1">
                  <input type="radio" name="tipoPersona" value="natural" defaultChecked />
                  <span className="text-sm md:text-base">Natural</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="tipoPersona" value="juridica" />
                  <span className="text-sm md:text-base">Jurídica</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-4">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm md:text-base font-medium mb-1">Cuenta</label>
              <select className="bg-white text-black rounded px-3 py-1 w-full text-sm md:text-base">
                <option>&lt;AUTOMATICO&gt;</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm md:text-base font-medium mb-1">Fecha Ingreso</label>
              <input
                type="text"
                value={new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                className="bg-white text-black rounded px-3 py-1 w-full text-sm md:text-base"
                readOnly
              />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="block text-sm md:text-base font-medium whitespace-nowrap">Tipo Doc.</label>
                <select className="bg-white text-black rounded px-3 py-1 text-sm md:text-base">
                  {comboLoading ? (
                    <option>Cargando...</option>
                  ) : comboData?.TIPO_DOCUMENTO ? (
                    comboData.TIPO_DOCUMENTO.map((doc) => (
                      <option key={doc.TIPO_DI} value={doc.TIPO_DI}>
                        {doc.NOM_DI}
                      </option>
                    ))
                  ) : (
                    <>
                      <option disabled>No hay tipos de documento disponibles</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="block text-sm md:text-base font-medium whitespace-nowrap">Nro. Doc.</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className="bg-white text-black rounded px-3 py-1 text-sm md:text-base w-24 md:w-28"
                    placeholder="DNI"
                  />
                  <button
                    onClick={searchByDNI}
                    disabled={searchLoading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    {searchLoading ? '...' : <Search size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
              <input
                type="text"
                value={formData.apellidoPaterno}
                onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
              <input
                type="text"
                value={formData.apellidoMaterno}
                onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
              <input
                type="text"
                value={formData.nombres}
                onChange={(e) => handleInputChange('nombres', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Nacimiento</label>
              <input
                type="text"
                value={formData.lugarNacimiento}
                onChange={(e) => handleInputChange('lugarNacimiento', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento:</label>
              <input
                type="date"
                value={new Date(formData.fechaNac).toISOString().split('T')[0]}
                onChange={(e) => handleInputChange("fechaNac", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
              <select
                value={formData.nacionalidad}
                onChange={(e) => handleInputChange('nacionalidad', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={comboLoading}
              >
                {comboLoading ? (
                  <option>Cargando...</option>
                ) : comboData?.NACIONALIDAD ? (
                  comboData.NACIONALIDAD.map((nac) => (
                    <option key={nac.TIPO_NAC} value={nac.TIPO_NAC}>
                      {nac.NOM_NAC}
                    </option>
                  ))
                ) : (
                  <>
                    <option disabled>No hay opciones disponibles</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexo"
                    value="M"
                    checked={formData.sexo === 'M'}
                    onChange={(e) => handleInputChange('sexo', e.target.value)}
                  />
                  <span className="text-sm">Masculino</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexo"
                    value="F"
                    checked={formData.sexo === 'F'}
                    onChange={(e) => handleInputChange('sexo', e.target.value)}
                  />
                  <span className="text-sm">Femenino</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil</label>
              <select
                value={formData.estadoCivil}
                onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={comboLoading}
              >
                {comboLoading ? (
                  <option>Cargando...</option>
                ) : comboData?.ESTADO_CIVIL ? (
                  comboData.ESTADO_CIVIL.map((estado) => (
                    <option key={estado.EST_CIVIL} value={estado.EST_CIVIL}>
                      {estado.NOM_ECIVIL}
                    </option>
                  ))
                ) : (
                  <>
                    <option disabled>No hay opciones disponibles</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vivienda</label>
              <select
                value={formData.vivienda}
                onChange={(e) => handleInputChange('vivienda', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={comboLoading}
              >
                {comboLoading ? (
                  <option>Cargando...</option>
                ) : comboData?.TIPO_VIVIENDA ? (
                  comboData.TIPO_VIVIENDA.map((vivienda) => (
                    <option key={vivienda.TIPO_VIVIENDA} value={vivienda.TIPO_VIVIENDA}>
                      {vivienda.NOM_VIVIENDA}
                    </option>
                  ))
                ) : (
                  <>
                    <option disabled>No hay opciones disponibles</option>
                  </>
                )}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo 1</label>
              <input
                type="text"
                value={formData.telefonoFijo1}
                onChange={(e) => handleInputChange('telefonoFijo1', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo 2</label>
              <input
                type="text"
                value={formData.telefonoFijo2}
                onChange={(e) => handleInputChange('telefonoFijo2', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Móvil 1</label>
              <input
                type="text"
                value={formData.movil1}
                onChange={(e) => handleInputChange('movil1', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Móvil 2</label>
              <input
                type="text"
                value={formData.movil2}
                onChange={(e) => handleInputChange('movil2', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrucción</label>
              <select
                value={formData.instruccion}
                onChange={(e) => handleInputChange('instruccion', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={comboLoading}
              >
                {comboLoading ? (
                  <option>Cargando...</option>
                ) : comboData?.NIVEL_INSTRUCCION ? (
                  <>
                    <option value="">Seleccione una opción</option>
                    {comboData.NIVEL_INSTRUCCION.map((instruccion) => (
                      <option key={instruccion.TIPO_INSTRUCCION} value={instruccion.TIPO_INSTRUCCION}>
                        {instruccion.NOM_TINSTRUC}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option disabled>No hay opciones disponibles</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
              <select
                value={formData.profesion}
                onChange={(e) => handleInputChange('profesion', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={comboLoading}
              >
                {comboLoading ? (
                  <option>Cargando...</option>
                ) : comboData?.TIPO_PROFESION ? (
                  <>
                    <option value="">Seleccione una opción</option>
                    {comboData.TIPO_PROFESION.map((profesion) => (
                      <option key={profesion.TIPO_PROFESION} value={profesion.TIPO_PROFESION}>
                        {profesion.NOM_TPROF}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option disabled>No hay opciones disponibles</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
              <input
                type="text"
                value={formData.ocupacion}
                onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activ. Económica</label>
            <select
              value={formData.activEconomica}
              onChange={(e) => handleInputChange('activEconomica', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={comboLoading}
            >
              {comboLoading ? (
                <option>Cargando...</option>
              ) : comboData?.ACTIVIDAD_ECONOMICA ? (
                <>
                  <option value="">Seleccione una opción</option>
                  {comboData.ACTIVIDAD_ECONOMICA.map((actividad) => (
                    <option key={actividad.TIPO_ACTI} value={actividad.TIPO_ACTI}>
                      {actividad.NOM_ACTI}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="">Seleccione una opción</option>
                  <option>AMBULANTES Y PUESTOS DE VENTA EN MERCADO</option>
                  <option>BODEGA</option>
                  <option>VENTA AL POR MAYOR DE ABARROTES</option>
                  <option>OTROS SERVICIOS</option>
                </>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situación</label>
            <select
              value={formData.situacion}
              onChange={(e) => handleInputChange('situacion', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={comboLoading}
            >
              {comboLoading ? (
                <option>Cargando...</option>
              ) : comboData?.ESTADO_SOCIO ? (
                comboData.ESTADO_SOCIO.map((estado) => (
                  <option key={estado.EST_SOCIO} value={estado.EST_SOCIO}>
                    {estado.NOM_ESOCIO}
                  </option>
                ))
              ) : (
                <>
                  <option>ACTIVO</option>
                  <option>INACTIVO</option>
                  <option>SUSPENDIDO</option>
                </>
              )}
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TipoSocio</label>
            <select
              value={formData.tipoSocio}
              onChange={(e) => handleInputChange('tipoSocio', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={comboLoading}
            >
              {comboLoading ? (
                <option>Cargando...</option>
              ) : comboData?.TIPO_SOCIO ? (
                comboData.TIPO_SOCIO.map((tipo) => (
                  <option key={tipo.TIPO_SOCIO} value={tipo.TIPO_SOCIO}>
                    {tipo.NOM_TSOCIO}
                  </option>
                ))
              ) : (
                <>
                  <option>SOCIO NORMAL</option>
                  <option>DIRECTIVO</option>
                  <option>DELEGADO</option>
                  <option>FUNCIONARIO</option>
                  <option>TRABAJADOR</option>
                </>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GrupoSolidario</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.grupoSolidario}
                onChange={(e) => handleInputChange('grupoSolidario', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md">
                ...
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.delegadoGrupo}
              onChange={(e) => handleInputChange('delegadoGrupo', e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Delegado de GrupoSolidario</label>
          </div>
          
          <div className="mt-8">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md mb-2 font-medium">
              F.P.S.
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de carga para el combo data */}
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
});