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
       <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
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
                 className="w-40 rounded-md border border-gray-300 px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
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
                   className="w-40 rounded-md border border-gray-300 pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                 />
               </div>
             </div>

             <button
               type="button"
               onClick={handleRefresh}
               className="flex-none bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
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

      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInteractions.map((interaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{interaction.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{interaction.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{interaction.apellido}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{interaction.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{interaction.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{interaction.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil */}
      <div className="md:hidden space-y-4">
        {filteredInteractions.map((interaction, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">DNI: {interaction.dni}</span>
              <div className="text-sm text-gray-500">
                {interaction.fecha} - {interaction.hora}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm text-gray-500">Nombre:</span>
                <p className="font-medium">{interaction.nombre}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Apellido:</span>
                <p className="font-medium">{interaction.apellido}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-500">Teléfono:</span>
                <p className="font-medium">{interaction.phone_number}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default BotInteractionsPage;