import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GestionXEstados } from '../services/gestios_recuperadores.service';

interface Props {
  data: GestionXEstados;
}

const GestionesXEstados = ({ data }: Props) => {
  const [activeTab, setActiveTab] = useState<'PENDIENTE' | 'CUMPLIDO' | 'INCUMPLIDOS'>('PENDIENTE');
  const [selectedResponsable, setSelectedResponsable] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleResponsableClick = (responsable: string) => {
    setSelectedResponsable(responsable);
    setShowModal(true);
  };

  const getFilteredGestionsByResponsable = () => {
    if (!selectedResponsable) return [];
    const allGestiones = [
      ...(data.detalles?.PENDIENTE || []),
      ...(data.detalles?.CUMPLIDO || []),
      ...(data.detalles?.INCUMPLIDOS || []),
    ];
    return allGestiones.filter(
      (g) => g.DETALLE_GESTION?.RESPONSABLE === selectedResponsable
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

  const tabs = [
    {
      key: 'PENDIENTE',
      label: 'Pendientes',
      count: data.resumen?.total_pending || 0,
      active: 'text-amber-700 border-amber-400 bg-amber-50',
    },
    {
      key: 'CUMPLIDO',
      label: 'Cumplidos',
      count: data.resumen?.total_cumplido || 0,
      active: 'text-emerald-700 border-emerald-400 bg-emerald-50',
    },
    {
      key: 'INCUMPLIDOS',
      label: 'Incumplidos',
      count: data.resumen?.total_incumplido || 0,
      active: 'text-red-700 border-red-400 bg-red-50',
    },
  ];

  const detalles = data.detalles?.[activeTab] || [];

  return (
    <div className="space-y-3">

      {/* ── Resumen General ── */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-200">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
          <span className="bg-cyan-500 w-1.5 h-5 rounded-full mr-2"></span>
          Resumen General
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              title: 'Total Gestiones',
              value: data.resumen?.TOTAL_GESTIONES || 0,
              color: 'gray',
              icon: '📊',
            },
            {
              title: 'Pendientes',
              value: data.resumen?.total_pending || 0,
              color: 'amber',
              icon: '⏳',
            },
            {
              title: 'Cumplidos',
              value: data.resumen?.total_cumplido || 0,
              color: 'emerald',
              icon: '✅',
            },
            {
              title: 'Incumplidos',
              value: data.resumen?.total_incumplido || 0,
              color: 'red',
              icon: '❌',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`bg-${item.color}-50 p-2 rounded-lg border border-${item.color}-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold text-${item.color}-700`}>
                    {item.title}
                  </p>
                  <p className={`text-base font-bold text-${item.color}-800 mt-1`}>
                    {item.value}
                  </p>
                </div>
                <div
                  className={`bg-${item.color}-100 w-6 h-6 rounded-full flex items-center justify-center`}
                >
                  <span className="text-xs">{item.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Resumen por Responsable ── */}
      {data.resumen_responsables && (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-200 overflow-x-auto">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-cyan-500 w-1.5 h-5 rounded-full mr-2"></span>
            Gestiones por Responsable
          </h3>
          <table className="w-full min-w-[600px] text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-cyan-500 to-blue-600">
                {['Responsable', 'Agencia', 'Total', 'Pendientes', 'Cumplidos', 'Incumplidos'].map(
                  (h, i, arr) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-left font-bold text-white uppercase tracking-wider
                        ${i === 0 ? 'rounded-tl-lg' : ''}
                        ${i === arr.length - 1 ? 'rounded-tr-lg' : ''}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(data.resumen_responsables).map(
                ([nombre, info]: [string, any]) => (
                  <tr
                    key={nombre}
                    className="hover:bg-cyan-50 transition-colors cursor-pointer"
                    onClick={() => handleResponsableClick(nombre)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#0f2d5e] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {nombre.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-700">{nombre}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {info.agencias?.join(', ')}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full font-semibold text-gray-700">
                        {info.total_gestiones}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full font-medium text-amber-700">
                        {info.por_estado?.PENDING || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-medium text-emerald-700">
                        {info.por_estado?.CUMPLIDO || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-red-100 border border-red-300 px-2 py-0.5 rounded-full font-medium text-red-700">
                        {info.por_estado?.INCUMPLIMIENTO || 0}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tabs de detalle por estado ── */}
      <div className="bg-white rounded-lg shadow-sm border border-cyan-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 flex items-center">
            <span className="bg-cyan-500 w-1.5 h-5 rounded-full mr-2"></span>
            Detalle por Estado
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Total: {data.resumen?.TOTAL_GESTIONES || 0} gestiones registradas
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? `${tab.active} border-current`
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tabla de detalle */}
        <div className="p-3 overflow-x-auto">
          {detalles.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Sin gestiones en este estado
            </p>
          ) : (
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  {['Pagaré', 'Motivo', 'Compromiso', 'F. Compromiso', 'Responsable', 'Estado'].map(
                    (h, i, arr) => (
                      <th
                        key={h}
                        className={`px-3 py-2 text-left font-bold text-white uppercase tracking-wider
                          ${i === 0 ? 'rounded-tl-lg' : ''}
                          ${i === arr.length - 1 ? 'rounded-tr-lg' : ''}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detalles.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-cyan-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-gray-700">{item.PAGARE}</td>
                    <td
                      className="px-3 py-2 text-gray-600"
                      title={item.DETALLE_GESTION.MOTIVO_RETRASO}
                    >
                      {item.DETALLE_GESTION.MOTIVO_RETRASO}
                    </td>
                    <td
                      className="px-3 py-2 text-gray-600"
                      title={item.DETALLE_GESTION.COMPROMISO}
                    >
                      {item.DETALLE_GESTION.COMPROMISO}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {item.DETALLE_GESTION.FECHA_COMPROMISO}
                    </td>
                    <td
                      className="px-3 py-2 text-gray-600"
                      title={item.DETALLE_GESTION.RESPONSABLE}
                    >
                      {item.DETALLE_GESTION.RESPONSABLE}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getEstadoColor(
                          item.DETALLE_GESTION.ESTADO
                        )}`}
                      >
                        {item.DETALLE_GESTION.ESTADO}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal detalle por responsable ── */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-2xl w-full max-w-full md:max-w-7xl max-h-[95vh] overflow-hidden border border-cyan-300">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-white">
                      Detalles del Responsable
                    </h3>
                    <p className="text-cyan-100 text-xs mt-0.5 truncate max-w-[250px]">
                      {selectedResponsable}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:text-cyan-200 transition-colors bg-white bg-opacity-20 rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-30"
                  >
                    <span className="text-base font-bold">×</span>
                  </button>
                </div>
              </div>

              <div className="p-2 md:p-3 overflow-y-auto max-h-[calc(90vh-70px)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-xs">
                    <thead>
                      <tr className="bg-gradient-to-r from-cyan-500 to-blue-600">
                        {['Pagaré', 'Cuenta', 'Otorga', 'Estado', 'Motivo', 'Compromiso', 'Fecha Compromiso'].map(
                          (h, i, arr) => (
                            <th
                              key={h}
                              className={`px-2 py-1.5 text-left font-bold text-white uppercase tracking-wider
                                ${i === 0 ? 'rounded-tl-lg' : ''}
                                ${i === arr.length - 1 ? 'rounded-tr-lg' : ''}`}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredGestionsByResponsable().map((detalle, index) => (
                        <tr
                          key={`${detalle.PAGARE}-${index}`}
                          className="hover:bg-cyan-50 transition-colors"
                        >
                          <td className="px-2 py-1.5 font-medium">{detalle.PAGARE}</td>
                          <td className="px-2 py-1.5">{detalle.CUENTA}</td>
                          <td className="px-2 py-1.5">{detalle.OTORGA}</td>
                          <td className="px-2 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getEstadoColor(
                                detalle.DETALLE_GESTION.ESTADO
                              )}`}
                            >
                              {detalle.DETALLE_GESTION.ESTADO}
                            </span>
                          </td>
                          <td
                            className="px-2 py-1.5"
                            title={detalle.DETALLE_GESTION.MOTIVO_RETRASO}
                          >
                            {detalle.DETALLE_GESTION.MOTIVO_RETRASO}
                          </td>
                          <td
                            className="px-2 py-1.5"
                            title={detalle.DETALLE_GESTION.COMPROMISO}
                          >
                            {detalle.DETALLE_GESTION.COMPROMISO}
                          </td>
                          <td className="px-2 py-1.5">
                            {detalle.DETALLE_GESTION.FECHA_COMPROMISO}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all font-medium text-xs shadow-sm"
                  >
                    Cerrar Detalles
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default GestionesXEstados;