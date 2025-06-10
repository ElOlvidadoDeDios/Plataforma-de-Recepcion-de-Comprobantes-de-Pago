import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from './Layout';
import { fetchAllConsultas, fetchConsultasByDniAndPagare, fetchConsultasByFecha } from '../api';
import { ConsultaCuota } from '../types/consultaCuotas';
import { DateRangePicker } from './DateRangePicker';

const ConsultaCuotasPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dni, setDni] = useState('');
  const [pagare, setPagare] = useState('');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewMode(mobile ? 'cards' : 'table');
    };

    window.addEventListener('resize', handleResize);
    // Establecer vista inicial
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: consultas = [], isLoading, isError, refetch } = useQuery<ConsultaCuota[]>({
    queryKey: ['consultas-cuotas', dni, pagare, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (dni && pagare) {
        return fetchConsultasByDniAndPagare(dni, pagare);
      } else if (dateRange.startDate && dateRange.endDate) {
        return fetchConsultasByFecha({
          fechaInicio: dateRange.startDate,
          fechaFin: dateRange.endDate
        });
      }
      return fetchAllConsultas();
    },
    staleTime: 30000,
    retry: 3
  });

  const toggleView = () => {
    setViewMode(prev => prev === 'table' ? 'cards' : 'table');
  };

  const TableView = () => (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-cyan-50 to-blue-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">DNI/Socio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Teléfonos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Pagaré</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Fecha</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {consultas.map((consulta: ConsultaCuota, index) => (
            <tr key={consulta._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-cyan-50 transition-colors`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{consulta.dni}</div>
                  <div className="text-sm text-gray-500">{consulta.nombreSocio}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  {consulta.telefonos && consulta.telefonos.length > 0 ? (
                    consulta.telefonos.map((telefono, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                      >
                        {telefono}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Sin teléfonos registrados</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {consulta.pagare}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                  {consulta.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {consulta.fecha} {consulta.hora}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {consultas.map((consulta: ConsultaCuota) => (
        <div key={consulta._id} className="bg-white shadow-lg rounded-xl border border-gray-200 p-4 hover:shadow-xl transition-all duration-200">
          <div className="mb-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{consulta.nombreSocio}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">DNI: {consulta.dni}</span>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 whitespace-nowrap">
                  {consulta.estado}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Teléfonos:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {consulta.telefonos && consulta.telefonos.length > 0 ? (
                  consulta.telefonos.map((telefono, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500 text-white shadow-sm"
                    >
                      {telefono}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">Sin teléfonos registrados</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm"><span className="font-medium text-gray-700">Pagaré:</span> <span className="text-blue-600 font-semibold">{consulta.pagare}</span></span>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8l-1 10H9L8 7z" />
              </svg>
              <span className="text-sm text-gray-600">{consulta.fecha} {consulta.hora}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout title="Consultas de Cuotas">
      <div className="px-4 sm:px-6 py-6">
        {/* Filtros de búsqueda */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Ingrese DNI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagaré</label>
              <input
                type="text"
                value={pagare}
                onChange={(e) => setPagare(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Número de pagaré"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={() => {
                refetch();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setDni('');
                setPagare('');
                setDateRange({ startDate: '', endDate: '' });
                refetch();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Listado de Consultas
          </h2>
          <span className="text-sm text-gray-500">
            Vista: {isMobile ? 'Tarjetas' : 'Tabla'}
          </span>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error al cargar las consultas. Por favor, intenta más tarde.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          viewMode === 'table' ? <TableView /> : <CardsView />
        )}
      </div>
    </Layout>
  );
};

export default ConsultaCuotasPage;