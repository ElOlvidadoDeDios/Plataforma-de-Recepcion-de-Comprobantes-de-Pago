import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from './Layout';
import { fetchAllConsultas } from '../api';
import { ConsultaCuota } from '../types/consultaCuotas';

const ConsultaCuotasPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const { data: consultas = [], isLoading, isError } = useQuery({
    queryKey: ['consultas-cuotas'],
    queryFn: fetchAllConsultas,
    staleTime: 30000,
    retry: 3
  });

  const toggleView = () => {
    setViewMode(prev => prev === 'table' ? 'cards' : 'table');
  };

  const TableView = () => (
    <div className="overflow-x-auto ">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">DNI/Socio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Teléfonos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Pagaré</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-y border-gray-200">Fecha</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {consultas.map((consulta: ConsultaCuota) => (
            <tr key={consulta._id} className="hover:bg-gray-50">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {consultas.map((consulta: ConsultaCuota) => (
        <div key={consulta._id} className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{consulta.nombreSocio}</h3>
              <p className="text-sm text-gray-600">DNI: {consulta.dni}</p>
            </div>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">
              {consulta.estado}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Teléfonos:</p>
              <div className="flex flex-wrap gap-2 mt-1">
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
            </div>
            <p className="text-sm">
              <span className="font-medium">Pagaré:</span> {consulta.pagare}
            </p>
            <p className="text-sm">
              <span className="font-medium">Fecha:</span> {consulta.fecha} {consulta.hora}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout title="Consultas de Cuotas">
      <div className="px-4 sm:px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Listado de Consultas
          </h2>
          <button
            onClick={toggleView}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            {viewMode === 'table' ? 'Ver Tarjetas' : 'Ver Tabla'}
          </button>
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