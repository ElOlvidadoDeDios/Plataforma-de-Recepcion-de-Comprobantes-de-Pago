import { useState, useEffect } from 'react';
import {
  ClienteResponse,
  searchClientes,
  searchClientesByDNI,
  TipoDocumento,
  ClienteBasico,
  DetalleCredito
} from '../../api/customerConsultationAPI';
import Layout from '../Layout';

const ConsultaClientes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(TipoDocumento.DNI);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ClienteBasico[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteBasico | null>(null);
  const [clientData, setClientData] = useState<ClienteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Búsqueda inicial de clientes
  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsLoading(true);
        const result = await searchClientes(tipoDocumento, searchQuery, controller.signal)
          .catch(() => ({
            status: false,
            count: 0,
            data: []
          }));
          
        if (isActive) {
          setResultadosBusqueda(result?.data || []);
          // Solo limpiar cliente seleccionado y datos si estamos realmente buscando
          // no cuando se limpia el input por una selección
          if (searchQuery !== '') {
            setClienteSeleccionado(null);
            setClientData(null);
          }
          setIsLoading(false);
        }
      } else if (searchQuery === '') {
        // Solo limpiar los resultados de búsqueda cuando el input está vacío
        setResultadosBusqueda([]);
      }
    }, 500);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(searchTimeout);
    };
  }, [searchQuery, tipoDocumento]);

  // Cargar detalles del cliente cuando se selecciona uno
  const handleClienteSelect = async (cliente: ClienteBasico) => {
    try {
      console.log('Cliente seleccionado:', cliente);
      setIsLoading(true);
      setClienteSeleccionado(cliente);
      setClientData(null); // Limpiar datos anteriores
    
      console.log('Consultando DNI:', cliente.NRO_DI);
      const detalleCliente = await searchClientesByDNI(cliente.NRO_DI);
      
      console.log('Detalle cliente recibido:', detalleCliente);
    
      if (detalleCliente && detalleCliente.INFO_SOCIO) {
        console.log('Actualizando datos del cliente');
        setClientData(detalleCliente);
        setResultadosBusqueda([]);
        setSearchQuery('');
      } else {
        console.log('No se obtuvieron detalles del cliente');
        setClienteSeleccionado(null);
        // Mostrar algún mensaje de error al usuario
        alert('No se pudieron obtener los detalles del cliente. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      setClienteSeleccionado(null);
      alert('Ocurrió un error al consultar los detalles del cliente. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gradiente de color celeste agua
  const headerBg = "bg-gradient-to-r from-cyan-500 to-blue-500";

  return (
    <Layout title="Consulta de Clientes">
      <div className="p-4 md:p-8 w-full min-h-screen bg-gradient-to-r from-cyan-50 to-teal-50">
        <h1 className={`text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-white ${headerBg} py-3 md:py-4 rounded-lg shadow-lg`}>
          Consulta de Clientes
        </h1>

        {/* Búsqueda */}
        <div className="mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-none">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de búsqueda:</label>
              <select
                id="tipo-documento"
                name="tipo-documento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                className="w-full md:w-40 border-2 border-cyan-200 rounded-lg p-2 focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value={TipoDocumento.DNI}>DNI</option>
                <option value={TipoDocumento.NOMBRE}>Razon Social</option>
                <option value={TipoDocumento.CUENTA}>Cuenta</option>
              </select>
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda:</label>
              <div className="relative">
                <input
                  id="busqueda-cliente"
                  name="busqueda-cliente"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo permitir números para DNI y CUENTA
                    if ((tipoDocumento === TipoDocumento.DNI || tipoDocumento === TipoDocumento.CUENTA)) {
                      if (!/^\d*$/.test(value)) {
                        return; // No actualizar si no son números
                      }
                    }
                    setSearchQuery(value);
                  }}
                  className="w-full border-2 border-cyan-200 rounded-lg p-2 md:p-3 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder={`Escriba el ${tipoDocumento === TipoDocumento.DNI ? 'DNI (solo números)' :
                    tipoDocumento === TipoDocumento.NOMBRE ? 'nombre' :
                    'número de cuenta (solo números)'} (mínimo 3 caracteres)...`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados de búsqueda inicial */}
        {resultadosBusqueda.length > 0 && !clientData && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-semibold text-cyan-800 mb-4">Resultados de búsqueda</h2>
            <div className="grid gap-3">
              {resultadosBusqueda.map((cliente) => (
                <button
                  key={`${cliente.NRO_DI}-${cliente.CUENTA}`}
                  onClick={() => handleClienteSelect(cliente)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                    ${clienteSeleccionado?.NRO_DI === cliente.NRO_DI
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{cliente.RAZON_SOCIAL}</p>
                      <p className="text-sm text-gray-600">DNI: {cliente.NRO_DI}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Cuenta: {cliente.CUENTA}</p>
                      <p className="text-sm text-gray-500">{cliente.AGENCIA}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4">
                    <span className="text-sm text-cyan-600">
                      Créditos vigentes: {cliente.CREDITOS_VIGENTES}
                    </span>
                    <span className="text-sm text-gray-500">
                      Créditos cancelados: {cliente.CREDITOS_CANCELADOS}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 md:py-10 bg-white rounded-lg shadow-lg">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-gray-600">Buscando cliente...</p>
          </div>
        ) : clientData ? (
          /* Información del Cliente - Solo se muestra después de buscar */
          <div className="mb-6 md:mb-8 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl">
            <div className="flex flex-col mb-4 md:mb-6 px-4">
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
                    ID Cliente: <span className="font-medium text-cyan-600">#{clientData.INFO_SOCIO.DATOS_PERSONALES.DNI}</span>
                  </p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded"></div>
            </div>

            {/* Datos Personales */}
            <div className="mb-6 px-4">
              <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                DATOS PERSONALES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-500 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">DNI</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.DATOS_PERSONALES.DNI}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">APELLIDO PATERNO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.DATOS_PERSONALES.APE_PAT}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">NOMBRES</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.DATOS_PERSONALES.NOMBRES}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">APELLIDO MATERNO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.DATOS_PERSONALES.APE_MAT}</div>
                </div>
              </div>
            </div>

            {/* Sociodemográfico */}
            <div className="mb-6 px-4">
              <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                SOCIODEMOGRÁFICO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">DEPARTAMENTO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.DEPARTAMENTO}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">SEXO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.SEXO}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">PROVINCIA</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.PROVINCIA}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">EDAD</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.EDAD}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">DISTRITO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.DISTRITO}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">ESTADO CIVIL</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.ESTADO_CIVIL}</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center border border-gray-200 hover:border-cyan-200 transition-colors mb-3">
                <div className="font-medium text-gray-600 w-full md:w-1/3 text-sm md:text-base mb-1 md:mb-0">DIRECCIÓN</div>
                <div className="w-full md:w-2/3 md:text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.DIRECCION}</div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">RUBRO</div>
                <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.SOCIODEMOGRAFICO.RUBRO}</div>
              </div>
            </div>

            {/* Contacto */}
            <div className="mb-6 px-4">
              <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                CONTACTO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">CELULAR</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.CONTACTO.CELULAR}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">CORREO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.CONTACTO.EMAIL}</div>
                </div>
              </div>
            </div>

            {/* Otros */}
            <div className="mb-6 px-4">
              <h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                OTROS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">FECHA INICIO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.OTROS.FECHA_INICIO}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">CUENTA DILE</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{clientData.INFO_SOCIO.OTROS.CUENTA_DILE}</div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
                  <div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">ESTADO</div>
                  <div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base">{clientData.INFO_SOCIO.OTROS.ESTADO}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !resultadosBusqueda.length && (
            !clientData && (
              <div className="text-center py-8 md:py-10 bg-white rounded-lg shadow-lg">
                <svg className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600">
                  {searchQuery.length >= 2 ?
                    `No se encontraron coincidencias para: ${searchQuery}` :
                    `Ingrese ${tipoDocumento === TipoDocumento.DNI ? 'DNI' :
                      tipoDocumento === TipoDocumento.NOMBRE ? 'nombre' :
                      'número de cuenta'} para iniciar la búsqueda`}
                </p>
              </div>
            )
          )
        )}
        {/* Tabla de Préstamos - Forzar modo horizontal */}
        {clientData && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 overflow-hidden">
            <h2 className="text-lg md:text-xl font-bold uppercase text-cyan-800 mb-4 md:mb-6 pb-2 border-b-2 border-cyan-200">
              HISTORIAL DE PRÉSTAMOS
            </h2>
            {clientData.CREDITO_VIGENTE && clientData.CREDITO_VIGENTE.length > 0 ? (
              <div className="w-full overflow-x-auto"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  maxHeight: 'calc(100vh - 400px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#0891b2 #f3f4f6'
                }}>
                <table className="w-full whitespace-nowrap table-fixed border-collapse" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0 z-10">
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white" style={{ width: '150px' }}>ID PRESTAMO</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white" style={{ width: '80px' }}>ESTADO</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white" style={{ width: '80px' }}>REPROG.</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '100px' }}>MONTO</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '130px' }}>SALDO CAPITAL</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '100px' }}>TASA</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '100px' }}>FRECUENCIA</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '80px' }}>PLAZO</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '100px' }}>CUOTA</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white" style={{ width: '200px' }}>PRODUCTO</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white" style={{ width: '110px' }}>OTORGA</th>
                      <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white" style={{ width: '300px' }}>ANALISTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientData.CREDITO_VIGENTE.map((credito: DetalleCredito, index: number) => (
                      <tr
                        key={`${credito.ID_PRESTAMO}-${index}`}
                        className={`transition-colors duration-200 ease-in-out hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50`}
                      >
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '120px' }}>{credito.ID_PRESTAMO}</td>
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '80px' }}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium `}>
                            {credito.ESTADO}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-center border border-gray-200" style={{ width: '80px' }}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium `}>
                            {credito.REPROGRAMA || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '100px' }}>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-500">S/</span>
                            <span className="font-medium">{credito.MONTO}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '100px' }}>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-500">S/</span>
                            <span className="font-medium">{credito.MONTO}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '80px' }}>
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-medium">{credito.TASA}</span>
                            <span className="text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-center border border-gray-200" style={{ width: '100px' }}>{credito.FRECUENCIA}</td>
                        <td className="px-4 py-2 text-sm font-medium text-center border border-gray-200" style={{ width: '80px' }}>{credito.PLAZO}</td>
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '100px' }}>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-500">S/</span>
                            <span className="font-medium">{credito.CUOTA}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm border border-gray-200" style={{ width: '150px' }}>
                          <span className="font-medium text-gray-800">{credito.PRODUCTO}</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-center border border-gray-200" style={{ width: '100px' }}>
                          {credito.OTORGA}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200" style={{ width: '180px' }}>{credito.ANALISTA}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">
                  No hay datos de préstamos para mostrar
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ConsultaClientes;
