import React, { useState, useEffect, useRef } from 'react';
import { type BotInteraction } from '../api/botInteractionsApi';
import { useBotInteractions } from '../hooks/useBotInteractions';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollIndicator from './shared/InfiniteScrollIndicator';
import Layout from './Layout';
import { DateRangePicker } from './DateRangePicker';

const formatDate = (date: Date) => {
  return date.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
};


const BotInteractionsPage = () => {
  const { interactions, loading, error, loadingMore, pagination, loadInteractions, loadMoreData, resetData } = useBotInteractions();
  const [searchDni, setSearchDni] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [startDate, setStartDate] = useState(formatDate(new Date(new Date().setDate(new Date().getDate() - 30))));
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [searchMode, setSearchMode] = useState(false); // Para diferenciar búsqueda específica vs filtros
  const [filteredInteractions, setFilteredInteractions] = useState<BotInteraction[]>([]);
  
  // Ref para mantener el foco en el input DNI
  const dniInputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/[^0-9]/g, '');
    return cleaned.startsWith('51') ? cleaned : `51${cleaned}`;
  };

  // Función para cargar más datos
  const handleLoadMore = React.useCallback(() => {
    if (!searchMode) {
      const filters = {
        fechaInicio: startDate,
        fechaFin: endDate
      };
      loadMoreData(filters);
    }
  }, [searchMode, startDate, endDate, loadMoreData]);

  // 🚀 Hook para infinite scroll optimizado
  const { setSentinelRef } = useInfiniteScroll({
    hasNext: pagination.hasNext && !searchMode,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
    disabled: false,
    threshold: 300
  });


  // Cargar datos iniciales solo con fechas
  useEffect(() => {
    const filters = {
      fechaInicio: startDate,
      fechaFin: endDate
    };
    loadInteractions(filters, 1, false);
    setSearchMode(false);
  }, [startDate, endDate, loadInteractions]);

  // Búsqueda por DNI con la misma lógica que customerConsultation
  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const searchTimeout = setTimeout(async () => {
      if (searchDni.length >= 3) {  // Mínimo 3 caracteres como customerConsultation
        const filters = {
          fechaInicio: startDate,
          fechaFin: endDate,
          dni: searchDni.trim()
        };
        
        if (isActive) {
          loadInteractions(filters, 1, false, true); // isSearching = true
        }
      } else if (searchDni === '') {
        // Si está vacío, cargar datos normales
        const filters = {
          fechaInicio: startDate,
          fechaFin: endDate
        };
        if (isActive) {
          loadInteractions(filters, 1, false, false); // isSearching = false
        }
      }
    }, 500);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(searchTimeout);
    };
  }, [searchDni, startDate, endDate, loadInteractions]);

  // Aplicar filtros locales solo para el teléfono (el resto se maneja en el backend)
  useEffect(() => {
    if (searchMode) {
      // En modo búsqueda, usar directamente los datos del hook
      setFilteredInteractions(interactions);
    } else {
      // En modo normal, aplicar solo filtro de teléfono localmente
      let filtered = interactions;
      if (searchPhone) {
        filtered = interactions.filter(i => i.phone_number.includes(searchPhone));
      }
      setFilteredInteractions(filtered);
    }
  }, [interactions, searchPhone, searchMode]);


  const handleRefresh = () => {
    setSearchDni('');
    setSearchPhone('');
    setSearchMode(false);
    setStartDate(formatDate(new Date(new Date().setDate(new Date().getDate() - 30))));
    setEndDate(formatDate(new Date()));
    
    const filters = {
      fechaInicio: formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
      fechaFin: formatDate(new Date())
    };
    resetData();
    loadInteractions(filters, 1, false);
  };

  // Usar directamente los datos según el modo
  const displayInteractions = searchMode ? interactions : filteredInteractions;

  if (loading && !loadingMore) {
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
          <button
            onClick={handleRefresh}
            className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Reintentar
          </button>
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
                   ref={dniInputRef}
                   type="text"
                   value={searchDni}
                   onChange={(e) => setSearchDni(e.target.value)}
                   placeholder="Buscar por DNI (mín. 3 caracteres)"
                   className="w-40 rounded-md border border-gray-300 px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/90"
                   onBlur={(e) => {
                     // Restaurar foco si se pierde durante la búsqueda
                     setTimeout(() => {
                       if (document.activeElement !== e.target && searchDni.length >= 3) {
                         dniInputRef.current?.focus();
                       }
                     }, 100);
                   }}
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
              {displayInteractions.map((interaction, index) => (
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
        {displayInteractions.map((interaction, index) => (
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

      {/* 🚀 Sentinel element para Intersection Observer - SOLO en modo normal */}
      {!searchMode && pagination.hasNext && displayInteractions.length > 0 && (
        <div ref={setSentinelRef} className="h-4" />
      )}

      {/* 🚀 Indicador de infinite scroll - SOLO en modo normal */}
      {!searchMode && displayInteractions.length > 0 && (
        <InfiniteScrollIndicator
          loading={loadingMore}
          hasMore={pagination.hasNext}
          total={pagination.total}
          itemName="interacciones"
        />
      )}

      {/* Contador de resultados */}
      {displayInteractions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <p className="text-sm text-gray-600 text-center">
            Mostrando {displayInteractions.length} interacciones
            {!searchMode && pagination.total > 0 && ` de ${pagination.total} total`}
            {searchMode && searchDni && <span className="text-blue-600 ml-1">para DNI: {searchDni}</span>}
          </p>
        </div>
      )}

      {/* Resumen estadístico */}
      {displayInteractions.length > 0 && (
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
              <div className="text-3xl font-bold text-blue-600">{displayInteractions.length}</div>
              <div className="text-sm text-gray-600">{searchMode ? 'Encontradas' : 'Mostrando'}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {displayInteractions.filter(i => i.status === 'PROCESADO').length}
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
                  {displayInteractions.filter(i => i.tipo === 'PAGAR_CUOTAS').length}
                </div>
                <div className="text-sm text-gray-600">Pagar Cuotas</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-purple-400">
                <div className="text-2xl font-bold text-purple-600">
                  {displayInteractions.filter(i => i.tipo === 'VER_CUOTAS').length}
                </div>
                <div className="text-sm text-gray-600">Ver Cuotas</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-indigo-400">
                <div className="text-2xl font-bold text-indigo-600">
                  {displayInteractions.filter(i => i.tipo === 'SOLICITAR_CREDITO').length}
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
                  {displayInteractions.filter(i => i.status === 'PROCESADO').length}
                </div>
                <div className="text-sm text-gray-600">Procesadas</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-yellow-400">
                <div className="text-2xl font-bold text-yellow-600">
                  {displayInteractions.filter(i => i.status === 'PENDIENTE').length}
                </div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 text-center border-l-4 border-gray-400">
                <div className="text-2xl font-bold text-gray-600">
                  {displayInteractions.filter(i => i.status !== 'PROCESADO' && i.status !== 'PENDIENTE').length}
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
