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
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value)}
                placeholder="Buscar por DNI"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button
                type="submit"
                className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
    </Layout>
  );
};

export default BotInteractionsPage;