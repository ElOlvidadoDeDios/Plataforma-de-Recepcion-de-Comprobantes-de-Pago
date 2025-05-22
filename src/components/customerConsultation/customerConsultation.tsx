import { useState, useEffect } from 'react';
import {
  ClienteResponse,
  searchClientes,
  searchClientesByDNI,
  TipoDocumento,
  ClienteBasico,
} from '../../api/customerConsultationAPI';
import Layout from '../Layout';
import SearchBar from './components/SearchBar';
import ClienteList from './components/ClienteList';
import LoadingState from './components/LoadingState';
import ClienteDetails from './components/ClienteDetails';
import CreditosTable from './components/CreditosTable';

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
          if (searchQuery !== '') {
            setClienteSeleccionado(null);
            setClientData(null);
          }
          setIsLoading(false);
        }
      } else if (searchQuery === '') {
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
      setIsLoading(true);
      setClienteSeleccionado(cliente);
      setClientData(null);

      const detalleCliente = await searchClientesByDNI(cliente.NRO_DI);

      if (detalleCliente && detalleCliente.INFO_SOCIO) {
        setClientData(detalleCliente);
        setResultadosBusqueda([]);
        setSearchQuery('');
      } else {
        setClienteSeleccionado(null);
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

  return (
    <Layout title="Consulta de Clientes">
      <div className="h-full w-full bg-gradient-to-r from-cyan-50 to-teal-50">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4 text-white bg-gradient-to-r from-cyan-500 to-blue-500 py-3 rounded-lg shadow-lg">
          Consulta de Clientes
        </h1>

        <SearchBar 
          searchQuery={searchQuery}
          tipoDocumento={tipoDocumento}
          onSearchChange={setSearchQuery}
          onTipoDocumentoChange={setTipoDocumento}
        />

        {isLoading ? (
          <LoadingState />
        ) : resultadosBusqueda.length > 0 && !clientData ? (
          <ClienteList
            clientes={resultadosBusqueda}
            clienteSeleccionado={clienteSeleccionado}
            onClienteSelect={handleClienteSelect}
          />
        ) : clientData ? (
          <>
            <ClienteDetails clientData={clientData} />
            <CreditosTable
              creditos={clientData.CREDITO_VIGENTE || []}
              clientData={clientData}
            />
          </>
        ) : (
          !resultadosBusqueda.length && (
            <div className="text-center py-6 bg-white rounded-lg shadow-lg">
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
        )}
      </div>
    </Layout>
  );
};

export default ConsultaClientes;
