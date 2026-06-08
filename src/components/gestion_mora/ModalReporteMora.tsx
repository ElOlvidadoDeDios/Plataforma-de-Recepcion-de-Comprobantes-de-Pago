import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getReporteMora, ReporteMoraData } from '../../api/registroDeclientesApi';

interface ModalReporteMoraProps {
  isOpen: boolean;
  onClose: () => void;
  agencia: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};


const ModalReporteMora: React.FC<ModalReporteMoraProps> = ({ isOpen, onClose, agencia }) => {
  const [reporteData, setReporteData] = useState<ReporteMoraData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedResponsable, setSelectedResponsable] = useState<string | null>(null);
  const [showSemiModal, setShowSemiModal] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<'PENDIENTE' | 'CUMPLIDO' | 'INCUMPLIDOS'>('PENDIENTE');

  useEffect(() => {
    if (isOpen && agencia) {
      const fetchReporte = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await getReporteMora(agencia);
          if (response.status) {
            setReporteData(response);
          } else {
            setError(response.message || 'Error al cargar el reporte de mora');
          }
        } catch (err) {
          setError('Error al conectar con el servidor');
        } finally {
          setLoading(false);
        }
      };
      fetchReporte();
    }
  }, [isOpen, agencia]);

  const handleResponsableClick = (responsable: string) => {
    setSelectedResponsable(responsable);
    setShowSemiModal(true);
  };

  const getFilteredDetails = () => {
    if (!reporteData || !selectedResponsable) return [];

    const allDetails = [
      ...reporteData.detalles.PENDIENTE,
      ...reporteData.detalles.CUMPLIDO,
      ...reporteData.detalles.INCUMPLIDOS
    ];

    return allDetails.filter(detalle =>
      detalle.DETALLE_GESTION.RESPONSABLE === selectedResponsable
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDING':
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CUMPLIDO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'INCUMPLIMIENTO':
      case 'INCUMPLIDOS':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 md:p-4">
      {/* Modal Principal - Responsivo */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-2xl w-full max-w-full md:max-w-7xl max-h-[95vh] overflow-hidden border border-cyan-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Reporte de Mora</h2>
              <p className="text-cyan-100 text-xs mt-1">Agencia: {agencia}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-cyan-200 transition-colors duration-200 bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-30"
            >
              <span className="text-lg font-bold">×</span>
            </button>
          </div>
        </div>

        {/* Content - Scroll optimizado */}
        <div className="p-2 md:p-4 overflow-y-auto max-h-[calc(95vh-100px)]">
          {loading && (
            <div className="flex justify-center items-center py-6">
              <div className="bg-white rounded-lg p-4 shadow-lg border border-cyan-200">
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-6 w-6 text-cyan-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-gray-700 font-medium text-sm">Cargando reporte...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-lg">❌</span>
                <span className="text-red-700 font-medium text-sm">{error}</span>
              </div>
            </div>
          )}

          {reporteData && (
            <div className="space-y-3">
              {/* Resumen General - Compacto */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="bg-cyan-500 w-1.5 h-5 rounded-full mr-2"></span>
                  Resumen General
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { title: 'Total Gestiones', value: reporteData.resumen.TOTAL_GESTIONES, color: 'gray', icon: '📊' },
                    { title: 'Pendientes', value: reporteData.resumen.total_pending, color: 'amber', icon: '⏳' },
                    { title: 'Cumplidos', value: reporteData.resumen.total_cumplido, color: 'emerald', icon: '✅' },
                    { title: 'Incumplidos', value: reporteData.resumen.total_incumplido, color: 'red', icon: '❌' }
                  ].map((item, index) => (
                    <div key={index} className={`bg-${item.color}-50 p-2 rounded-lg border border-${item.color}-200`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-semibold text-${item.color}-700`}>{item.title}</p>
                          <p className={`text-base font-bold text-${item.color}-800 mt-1`}>{item.value}</p>
                        </div>
                        <div className={`bg-${item.color}-100 w-6 h-6 rounded-full flex items-center justify-center`}>
                          <span className={`text-${item.color}-700 text-xs`}>{item.icon}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen por Responsables - Tabla responsiva */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-200 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="bg-cyan-500 w-1.5 h-5 rounded-full mr-2"></span>
                  Resumen por Responsable
                </h3>
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-blue-600">
                      {['Responsable', 'Total', 'Pendientes', 'Cumplidos', 'Incumplidos'].map((header, i) => (
                        <th key={i} className={`px-2 py-1.5 text-left text-xs font-bold text-white uppercase tracking-wider ${i === 0 ? 'rounded-tl-lg' : i === 4 ? 'rounded-tr-lg' : ''}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(reporteData.resumen_responsables).map(([responsable, data]) => (
                      <tr
                        key={responsable}
                        className="hover:bg-cyan-50 transition-colors cursor-pointer"
                        onClick={() => handleResponsableClick(responsable)}
                      >
                        <td className="px-2 py-1.5 text-xs font-medium text-gray-900 flex items-center">
                          <span className="bg-cyan-500 w-1.5 h-3 rounded-full mr-1.5"></span>
                          <span className="truncate max-w-[120px]">{responsable}</span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">{data.total_gestiones}</span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-xs font-medium">{data.por_estado.PENDING}</span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full text-xs font-medium">{data.por_estado.CUMPLIDO}</span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="bg-red-100 border border-red-300 px-2 py-0.5 rounded-full text-xs font-medium">{data.por_estado.INCUMPLIMIENTO}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selector de Estados y Tabla Filtrada - Optimizada */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-200 overflow-x-auto">
                <div className="mb-2">
                  <div className="flex space-x-1 overflow-x-auto pb-1">
                    {['PENDIENTE', 'CUMPLIDO', 'INCUMPLIDOS'].map((estado) => (
                      <button
                        key={estado}
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${selectedEstado === estado ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setSelectedEstado(estado as 'PENDIENTE' | 'CUMPLIDO' | 'INCUMPLIDOS')}
                      >
                        {estado} ({reporteData.detalles[estado as keyof ReporteMoraData['detalles']].length})
                      </button>
                    ))}
                  </div>
                </div>

                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className={`${getEstadoColor(selectedEstado)} border`}>
                      {['Pagaré', 'Cuenta', 'Otorga', 'Motivo', 'Compromiso', 'Fecha', 'Responsable'].map((header, i) => (
                        <th key={i} className={`px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wider ${i === 0 ? 'rounded-tl-lg' : i === 6 ? 'rounded-tr-lg' : ''}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reporteData.detalles[selectedEstado].length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <p className="text-gray-500 text-xs">No hay gestiones en estado {selectedEstado}</p>
                        </td>
                      </tr>
                    ) : (
                      reporteData.detalles[selectedEstado].map((detalle, index) => (
                        <tr key={`${detalle.PAGARE}-${index}`} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-xs font-medium">{detalle.PAGARE}</td>
                          <td className="px-2 py-1.5 text-xs">{detalle.CUENTA}</td>
                          <td className="px-2 py-1.5 text-xs">{detalle.OTORGA}</td>
                          <td className="px-2 py-1.5 text-xs truncate max-w-[150px]" title={detalle.DETALLE_GESTION.MOTIVO_RETRASO}>
                            {detalle.DETALLE_GESTION.MOTIVO_RETRASO}
                          </td>
                          <td className="px-2 py-1.5 text-xs truncate max-w-[150px]" title={detalle.DETALLE_GESTION.COMPROMISO}>
                            {detalle.DETALLE_GESTION.COMPROMISO}
                          </td>
                          <td className="px-2 py-1.5 text-xs">
                            {formatDate(detalle.DETALLE_GESTION.FECHA_COMPROMISO)}
                          </td>
                          <td className="px-2 py-1.5 text-xs font-medium text-cyan-700 truncate max-w-[120px]">
                            {detalle.DETALLE_GESTION.RESPONSABLE}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-center mt-4 pt-3 border-t border-cyan-200">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all font-medium text-xs shadow-sm"
            >
              Cerrar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Semi-Modal - Totalmente responsivo */}
      {showSemiModal && selectedResponsable && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60 p-2 md:p-4">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-2xl w-full max-w-full md:max-w-5xl max-h-[90vh] overflow-hidden border border-cyan-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Detalles del Responsable</h3>
                  <p className="text-cyan-100 text-xs mt-1 truncate max-w-[200px]">{selectedResponsable}</p>
                </div>
                <button
                  onClick={() => setShowSemiModal(false)}
                  className="text-white hover:text-cyan-200 transition-colors bg-white bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-30"
                >
                  <span className="text-base font-bold">×</span>
                </button>
              </div>
            </div>

            {/* Content - Sin scroll horizontal */}
            <div className="p-2 md:p-3 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-blue-600">
                      {['Pagaré', 'Cuenta', 'Otorga', 'Estado', 'Motivo', 'Compromiso', 'Fecha'].map((header, i) => (
                        <th key={i} className={`px-2 py-1.5 text-left text-xs font-bold text-white uppercase tracking-wider ${i === 0 ? 'rounded-tl-lg' : i === 6 ? 'rounded-tr-lg' : ''}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredDetails().map((detalle, index) => {
                      let estado = '';
                      if (reporteData?.detalles.PENDIENTE.some(d => d.PAGARE === detalle.PAGARE && d.CUENTA === detalle.CUENTA)) {
                        estado = 'PENDIENTE';
                      } else if (reporteData?.detalles.CUMPLIDO.some(d => d.PAGARE === detalle.PAGARE && d.CUENTA === detalle.CUENTA)) {
                        estado = 'CUMPLIDO';
                      } else {
                        estado = 'INCUMPLIDO';
                      }

                      return (
                        <tr key={`${detalle.PAGARE}-${index}`} className="hover:bg-cyan-50">
                          <td className="px-2 py-1.5 text-xs font-medium">{detalle.PAGARE}</td>
                          <td className="px-2 py-1.5 text-xs">{detalle.CUENTA}</td>
                          <td className="px-2 py-1.5 text-xs">{detalle.OTORGA}</td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getEstadoColor(estado)}`}>
                              {estado}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-xs truncate max-w-[120px]" title={detalle.DETALLE_GESTION.MOTIVO_RETRASO}>
                            {detalle.DETALLE_GESTION.MOTIVO_RETRASO}
                          </td>
                          <td className="px-2 py-1.5 text-xs truncate max-w-[120px]" title={detalle.DETALLE_GESTION.COMPROMISO}>
                            {detalle.DETALLE_GESTION.COMPROMISO}
                          </td>
                          <td className="px-2 py-1.5 text-xs">
                            {formatDate(detalle.DETALLE_GESTION.FECHA_COMPROMISO)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-3">
                <button
                  onClick={() => setShowSemiModal(false)}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all font-medium text-xs shadow-sm"
                >
                  Cerrar Detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};


export default ModalReporteMora;

