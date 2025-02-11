import { useState, useEffect } from 'react';
import { getBotInteractions, getBotInteractionsByDni, type BotInteraction } from '../api/botInteractionsApi';
import Layout from './Layout';

const BotInteractionsPage = () => {
  const [interactions, setInteractions] = useState<BotInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDni, setSearchDni] = useState('');

  const fetchInteractions = async (dni?: string) => {
    try {
      setLoading(true);
      const response = dni
        ? await getBotInteractionsByDni(dni)
        : await getBotInteractions();
      
      // Sort interactions by date and time in descending order
      const sortedInteractions = response.data.sort((a, b) => {
        const dateA = new Date(`${a.fecha} ${a.hora}`);
        const dateB = new Date(`${b.fecha} ${b.hora}`);
        return dateB.getTime() - dateA.getTime();
      });
      setInteractions(sortedInteractions);
      setError('');
    } catch (err: any) {
      console.error('Error al cargar interacciones:', err);
      setError(err.message || 'Error al cargar las interacciones. Por favor, verifica que el servidor esté corriendo.');
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDni) {
      fetchInteractions(searchDni);
    } else {
      fetchInteractions();
    }
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
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 mt-4 sm:mt-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              placeholder="Buscar por DNI"
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-cyan-600 text-white px-6 py-2.5 rounded-md hover:bg-cyan-700 transition-colors font-medium"
          >
            Buscar
          </button>
        </form>
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
              {interactions.map((interaction, index) => (
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
        {interactions.map((interaction, index) => (
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