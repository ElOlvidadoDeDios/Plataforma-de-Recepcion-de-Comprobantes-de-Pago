import { useState, useEffect } from 'react';
import { getBotInteractions, getBotInteractionsByDni, type BotInteraction } from '../api/botInteractionsApi';
import Layout from './Layout';
import { DateRangePicker } from './DateRangePicker';

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const BotInteractionsPage = () => {
  const [interactions, setInteractions] = useState<BotInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDni, setSearchDni] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [startDate, setStartDate] = useState(formatDate(new Date(new Date().setDate(new Date().getDate() - 30))));
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [filteredInteractions, setFilteredInteractions] = useState<BotInteraction[]>([]);

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/[^0-9]/g, '');
    return cleaned.startsWith('51') ? cleaned : `51${cleaned}`;
  };

  const filterInteractionsByDate = (interactions: BotInteraction[]) => {
    return interactions.filter(interaction => {
      const interactionDate = new Date(interaction.fecha);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return interactionDate >= start && interactionDate <= end;
    });
  };

  const fetchInteractions = async (dni?: string) => {
    try {
      setLoading(true);
      const response = dni
        ? await getBotInteractionsByDni(dni)
        : await getBotInteractions();
      
      const sortedInteractions = response.data.sort((a, b) => {
        const dateA = new Date(`${a.fecha} ${a.hora}`);
        const dateB = new Date(`${b.fecha} ${b.hora}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setInteractions(sortedInteractions);
      setFilteredInteractions(filterInteractionsByDate(sortedInteractions));
      setError('');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setInteractions([]);
        setFilteredInteractions([]);
      } else {
        console.error('Error al cargar interacciones:', err);
        setError('Error al cargar las interacciones');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  useEffect(() => {
    let filtered = interactions;
    
    // Aplicar filtros en orden
    filtered = filterInteractionsByDate(filtered);
    
    if (searchDni) {
      filtered = filtered.filter(i => i.dni.includes(searchDni));
    }
    
    if (searchPhone) {
      filtered = filtered.filter(i => i.phone_number.includes(searchPhone));
    }
    
    setFilteredInteractions(filtered);
  }, [interactions, startDate, endDate, searchDni, searchPhone]);

  const handleRefresh = () => {
    setSearchDni('');
    setSearchPhone('');
    setStartDate(formatDate(new Date(new Date().setFullYear(2000))));  // Fecha muy anterior
    setEndDate(formatDate(new Date(new Date().setFullYear(2050))));    // Fecha muy posterior
    fetchInteractions();
  };

  if (loading) {
    return (
      <Layout title="Interacciones con el Bot">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Interacciones con el Bot">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Interacciones con el Bot">
     <div className="space-y-4">
       {/* Panel de Filtros con Sombreado de Dos Colores */}
       <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-blue-200">
         <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-inner border border-white/50">
           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
             <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
             </svg>
             Panel de Filtros
           </h3>
           <div className="space-y-4">
             <div className="flex flex-wrap gap-4 items-start">
               <div className="flex-none flex gap-2">
                 <input
                   type="text"
                   value={searchDni}
                   onChange={(e) => {
                     const value = e.target.value;
                     setSearchDni(value);
                     if (value) {
                       setFilteredInteractions(interactions.filter(i => i.dni.includes(value)));
                     } else {
                       setFilteredInteractions(filterInteractionsByDate(interactions));
                     }
                   }}
                   placeholder="Buscar por DNI"
                   className="w-40 rounded-md border border-gray-300 px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                 />
               </div>

               <div className="flex-none flex gap-2">
                 <div className="relative">
                   <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">51</span>
                   <input
                     type="text"
                     value={searchPhone}
                     onChange={(e) => {
                       const value = formatPhoneNumber(e.target.value);
                       setSearchPhone(value);
                       if (value) {
                         setFilteredInteractions(interactions.filter(i => i.phone_number.includes(value)));
                       } else {
                         setFilteredInteractions(filterInteractionsByDate(interactions));
                       }
                     }}
                     placeholder="Buscar por celular"
                     className="w-40 rounded-md border border-gray-300 pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                   />
                 </div>
               </div>

               <button
                 type="button"
                 onClick={handleRefresh}
                 className="flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm shadow-md"
               >
                 Ver Todos
               </button>
             </div>

             <DateRangePicker
               startDate={startDate}
               endDate={endDate}
               onStartDateChange={setStartDate}
               onEndDateChange={setEndDate}
             />
           </div>
         </div>
       </div>
     </div>

      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInteractions.map((interaction, index) => (
                <tr key={interaction._id || index} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{interaction.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {interaction.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      interaction.status === 'PROCESADO'
                        ? 'bg-green-100 text-green-800'
                        : interaction.status === 'PENDIENTE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {interaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{interaction.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{interaction.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{interaction.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil */}
      <div className="md:hidden space-y-4">
        {filteredInteractions.map((interaction, index) => (
          <div key={interaction._id || index} className="bg-white rounded-lg shadow-md p-4 space-y-3 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">DNI: {interaction.dni}</span>
              <div className="text-sm text-gray-500">
                {interaction.fecha} - {interaction.hora}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tipo:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {interaction.tipo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Estado:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  interaction.status === 'PROCESADO'
                    ? 'bg-green-100 text-green-800'
                    : interaction.status === 'PENDIENTE'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {interaction.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Teléfono:</span>
                <p className="font-medium font-mono text-sm">{interaction.phone_number}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen estadístico */}
      {filteredInteractions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumen Estadístico
          </h3>
          
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/70 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{filteredInteractions.length}</div>
              <div className="text-sm text-gray-600">Total Interacciones</div>
            </div>
            <div className="bg-white/70 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {filteredInteractions.filter(i => i.status === 'PROCESADO').length}
              </div>
              <div className="text-sm text-gray-600">Procesadas</div>
            </div>
          </div>

          {/* Estadísticas por Tipo de Interacción */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 mb-3">Tipos de Interacciones</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-orange-400">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredInteractions.filter(i => i.tipo === 'PAGAR_CUOTAS').length}
                </div>
                <div className="text-sm text-gray-600">Pagar Cuotas</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-purple-400">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredInteractions.filter(i => i.tipo === 'VER_CUOTAS').length}
                </div>
                <div className="text-sm text-gray-600">Ver Cuotas</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-indigo-400">
                <div className="text-2xl font-bold text-indigo-600">
                  {filteredInteractions.filter(i => i.tipo === 'SOLICITAR_CREDITO').length}
                </div>
                <div className="text-sm text-gray-600">Solicitar Crédito</div>
              </div>
            </div>
          </div>

          {/* Estadísticas por Estado */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">Estados de Procesamiento</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-green-400">
                <div className="text-2xl font-bold text-green-600">
                  {filteredInteractions.filter(i => i.status === 'PROCESADO').length}
                </div>
                <div className="text-sm text-gray-600">Procesadas</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-yellow-400">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredInteractions.filter(i => i.status === 'PENDIENTE').length}
                </div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-gray-400">
                <div className="text-2xl font-bold text-gray-600">
                  {filteredInteractions.filter(i => i.status !== 'PROCESADO' && i.status !== 'PENDIENTE').length}
                </div>
                <div className="text-sm text-gray-600">Otros Estados</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BotInteractionsPage;