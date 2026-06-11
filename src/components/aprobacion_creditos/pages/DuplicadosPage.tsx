import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { useAuth } from '../../../hooks/useAuth';
import { CalificacionPDFView } from './CalificacionPDF';

type TipoBusqueda = 'fecha' | 'cuenta' | 'documento';

interface DuplicadoResult {
  codigo: string;
  datos: string;
  fecha_otorga: string;
  pagare: string;
  cuenta: string;
}

const DuplicadosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>('fecha');
  const [isLoading, setIsLoading] = useState(false);
  const [resultados, setResultados] = useState<DuplicadoResult[]>([]);
  const [buscado, setBuscado] = useState(false);

  const agenciaNombre = user?.id_age || 'Sin agencia';

  const handleBuscar = async () => {
    setIsLoading(true);
    setBuscado(true);
    // TODO: conectar API real
    setResultados([]);
    setIsLoading(false);
  };
  const handleExportarPDF = () => {
  const contenido = printRef.current;
  if (!contenido) return;

  const ventana = window.open('', '_blank', 'width=900,height=700');
  if (!ventana) return;

  ventana.document.write(`
    <html>
      <head>
        <title>Calificacion de Solicitud de Credito</title>
        <style>
          @page { margin: 0; size: A4; }
          body { margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact; }
        </style>
      </head>
      <body>
        ${contenido.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>
  `);
  ventana.document.close();
};

  return (
    <Layout title="DUPLICADOS" showBackButton={true}>
      <div className="h-full flex flex-col space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">DUPLICADOS</h2>
          <p className="text-white/80 text-sm">Agencia: <span className="font-semibold">{agenciaNombre}</span></p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por
            </label>
            <select
              value={tipoBusqueda}
              onChange={(e) => setTipoBusqueda(e.target.value as TipoBusqueda)}
              className="w-full sm:w-72 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="fecha">Por Fecha</option>
              <option value="cuenta">Por Cuenta</option>
              <option value="documento">Por Documento</option>
            </select>
          </div>

          <button
            onClick={handleBuscar}
            disabled={isLoading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Buscando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </>
            )}
          </button>

          {/* Botón exportar — dentro del bloque de filtros, al lado del botón Buscar */}
          <button
            onClick={handleExportarPDF}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-300"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Exportar PDF
          </button>

          {/* Componente oculto que se imprime */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <CalificacionPDFView ref={printRef} />
          </div>
        </div>

        {/* Tabla resultados */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-gray-500 text-sm">Buscando duplicados...</p>
              </div>
            </div>
          ) : !buscado ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 text-sm">Selecciona un criterio y presiona Buscar</p>
              </div>
            </div>
          ) : resultados.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">No se encontraron duplicados</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Otorga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagaré</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultados.map((item, idx) => (
                    <tr key={idx} className="hover:bg-cyan-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.datos}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.fecha_otorga}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{item.pagare}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.cuenta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default DuplicadosPage;