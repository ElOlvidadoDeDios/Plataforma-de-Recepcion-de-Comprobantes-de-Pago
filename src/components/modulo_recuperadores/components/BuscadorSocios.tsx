import React, { useState } from 'react';
import { SocioMora, consultarSocioEnMora } from '../services/gestios_recuperadores.service';

interface BuscadorSociosProps {
  onSocioSelect: (socio: SocioMora, action: 'ver' | 'gestionar' | 'whatsapp') => void;
}

const BuscadorSocios: React.FC<BuscadorSociosProps> = ({ onSocioSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('01'); // 01 = DNI, 02 = Razón Social
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SocioMora[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Función de búsqueda usando el endpoint real con tipo seleccionado
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    try {
      const results = await consultarSocioEnMora(searchType, searchTerm.trim());
      setSearchResults(results || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const selectSocio = (socio: SocioMora, action: 'ver' | 'gestionar' | 'whatsapp') => {
    onSocioSelect(socio, action);
    // Removido clearSearch() para mantener los resultados visibles
  };

  // Función para manejar Enter en el input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">🔍</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Búsqueda Directa de Socio</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Selector de tipo de búsqueda */}
        <div className="sm:w-48">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white transition-all duration-200 hover:border-gray-400"
          >
            <option value="01">🆔 Por DNI</option>
            <option value="02">👤 Por Razón Social</option>
          </select>
        </div>
        
        {/* Input de búsqueda */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={searchType === '01' ? 'Ingrese el número de DNI...' : 'Ingrese la razón social o nombre...'}
            className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white transition-all duration-200 hover:border-gray-400"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              title="Limpiar búsqueda"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Buscar</span>
            </>
          )}
        </button>
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span>📋</span>
                Resultados de búsqueda ({searchResults.length})
              </h4>
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Cerrar resultados"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  <p className="text-sm">No se encontraron socios con ese criterio de búsqueda</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((socio, index) => (
                  <div
                    key={`${socio.CREDITO_MORA.CUENTA}-${socio.CREDITO_MORA.PAGARE}-${index}`}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {socio.CREDITO_MORA.SOCIO}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            Number(socio.CREDITO_MORA.DIAS_ATRASO) <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : Number(socio.CREDITO_MORA.DIAS_ATRASO) <= 60
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {socio.CREDITO_MORA.DIAS_ATRASO} días
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <span>📄</span>
                            Pagaré: {socio.CREDITO_MORA.PAGARE}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🏦</span>
                            Cuenta: {socio.CREDITO_MORA.CUENTA}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>💰</span>
                            S/ {Number(socio.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-2">
                          {socio.CREDITO_MORA.PRODUCTO}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => selectSocio(socio, 'ver')}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                            title="Ver detalles"
                          >
                            <span>👁️</span>
                            Ver
                          </button>
                          <button
                            onClick={() => selectSocio(socio, 'gestionar')}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                            title="Gestionar mora"
                          >
                            <span>📝</span>
                            Gestionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {!showResults && (
        <div className="mt-3 text-xs text-gray-500 bg-white bg-opacity-50 rounded-lg p-2">
          <p className="flex items-center gap-1">
            <span>💡</span>
            <span>Selecciona el tipo de búsqueda y ingresa el <strong>DNI</strong> o <strong>Razón Social</strong>. Los resultados se mostrarán aquí mismo.</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default BuscadorSocios;