import { useState } from 'react';
import { GestionXEstados } from '../services/gestios_recuperadores.service';

interface Props {
  data: GestionXEstados;
}
const GestionesXEstados = ({ data }: Props) => {
  const [activeTab, setActiveTab] = useState<'PENDIENTE' | 'CUMPLIDO' | 'INCUMPLIDOS'>('PENDIENTE');


  const tabs = [
    { key: 'PENDIENTE', label: 'Pendientes', count: data.resumen?.total_pending || 0, color: 'text-yellow-700 border-yellow-400 bg-yellow-50' },
    { key: 'CUMPLIDO', label: 'Cumplidos', count: data.resumen?.total_cumplido || 0, color: 'text-green-700 border-green-400 bg-green-50' },
    { key: 'INCUMPLIDOS', label: 'Incumplidos', count: data.resumen?.total_incumplido || 0, color: 'text-red-700 border-red-400 bg-red-50' },
  ];

  const detalles = data.detalles?.[activeTab] || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-[800px] max-w-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Gestiones por estado</h2>
        <p className="text-xs text-gray-400 mt-0.5">Total: {data.resumen?.TOTAL_GESTIONES || 0} gestiones registradas</p>
      </div>

      {/* Responsables */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Responsables</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Agencia</th>
              <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-center px-3 py-2 font-semibold text-yellow-500 uppercase tracking-wider">Pend.</th>
              <th className="text-center px-3 py-2 font-semibold text-green-500 uppercase tracking-wider">Cum.</th>
              <th className="text-center px-3 py-2 font-semibold text-red-500 uppercase tracking-wider">Incum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(data.resumen_responsables || {}).map(([nombre, info]: [string, any]) => (
              <tr key={nombre} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#0f2d5e] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {nombre.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-700">{nombre}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {info.agencias.join(', ')}
                </td>
                <td className="px-3 py-2 text-center font-semibold text-gray-700">{info.total_gestiones}</td>
                <td className="px-3 py-2 text-center">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    {info.por_estado.PENDING}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {info.por_estado.CUMPLIDO}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {info.por_estado.INCUMPLIMIENTO}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? `${tab.color} border-current`
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Detalles */}
      <div className="p-4">
        {detalles.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Sin gestiones en este estado
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Pagaré</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Compromiso</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">F. Compromiso</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detalles.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 font-medium text-gray-700">{item.PAGARE}</td>
                  <td className="px-3 py-2 text-gray-600" title={item.DETALLE_GESTION.MOTIVO_RETRASO}>
                    {item.DETALLE_GESTION.MOTIVO_RETRASO}
                  </td>
                  <td className="px-3 py-2 text-gray-600" title={item.DETALLE_GESTION.COMPROMISO}>
                    {item.DETALLE_GESTION.COMPROMISO}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{item.DETALLE_GESTION.FECHA_COMPROMISO}</td>
                  <td className="px-3 py-2 text-gray-600" title={item.DETALLE_GESTION.RESPONSABLE}>
                    {item.DETALLE_GESTION.RESPONSABLE}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      item.DETALLE_GESTION.ESTADO === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      item.DETALLE_GESTION.ESTADO === 'CUMPLIDO' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
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
  );
};

export default GestionesXEstados;