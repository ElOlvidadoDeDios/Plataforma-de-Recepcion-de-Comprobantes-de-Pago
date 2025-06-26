import { CuotaCronograma } from '../../../api/cronogramaApi';

interface DataRowProps {
  icon?: JSX.Element; // Haciendo el icono opcional
  label: string;
  value: string | number;
  boldValue?: boolean;
  highlight?: boolean;
  status?: boolean;
}

// Componente para mostrar cada fila de datos
export const DataRow = ({
  icon,
  label,
  value,
  boldValue = false,
  highlight = false,
  status = false
}: DataRowProps) => (
  <div className="flex items-center space-x-2">
    {icon && (
      <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
    )}
    <span className="text-gray-600">{label}:</span>
    <span
      className={`${boldValue ? 'font-semibold' : ''} ${
        highlight ? 'text-cyan-600 font-semibold' : ''
      } ${status ? value === 'VIGENTE' ? 'text-green-600' : 'text-red-600' : ''}`}
    >
      {value}
    </span>
  </div>
);

// Componente para la tabla del cronograma
export const CronogramaTable = ({ cuotas }: { cuotas: CuotaCronograma[] }) => (
  <table className="w-full bg-white border border-gray-300 text-xs">
    <thead>
      <tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white">
        <th className="px-2 py-2 border border-gray-300">N°CUO.</th>
        <th className="px-2 py-2 border border-gray-300">F.Venc</th>
        <th className="px-2 py-2 border border-gray-300">F.Pago</th>
        <th className="px-2 py-2 border border-gray-300">Mora</th>
        <th className="px-2 py-2 border border-gray-300">Cuota</th>
        <th className="px-2 py-2 border border-gray-300">Capital</th>
        <th className="px-2 py-2 border border-gray-300">Interés</th>
        <th className="px-2 py-2 border border-gray-300">Desgrav.</th>
        <th className="px-2 py-2 border border-gray-300">Seguro</th>
        <th className="px-2 py-2 border border-gray-300">Saldo</th>
        <th className="px-2 py-2 border border-gray-300">Estado</th>
      </tr>
    </thead>
    <tbody>
      {cuotas.map((cuota) => (
        <tr key={cuota.NUMERO_CUOTA} className="hover:bg-gray-50">
          <td className="px-2 py-1 border border-gray-200 text-center">{cuota.NUMERO_CUOTA}</td>
          <td className="px-2 py-1 border border-gray-200 text-center">{formatDate(cuota.FECHA_VENCIMIENTO)}</td>
          <td className="px-2 py-1 border border-gray-200 text-center">{formatDate(cuota.FECHA_PAGO)}</td>
          <td className="px-2 py-1 border border-gray-200 text-center">{cuota.DIAS_MORA}</td>
          <td className="px-2 py-1 border border-gray-200 text-right">{formatNumber(cuota.CUOTA_TOTAL)}</td>
          <td className="px-2 py-1 border border-gray-200 text-right">{formatNumber(cuota.PAGO_CAPITAL)}</td>
          <td className="px-2 py-1 border border-gray-200 text-right">{formatNumber(cuota.PAGO_INTERES)}</td>
          <td className="px-2 py-1 border border-gray-200 text-right">{formatNumber(cuota.DESGRAVAMEN)}</td>
          <td className="px-2 py-1 border border-gray-200 text-right">{formatNumber(cuota.SEGURO)}</td>
          <td className="px-2 py-1 border border-gray-200 text-right">{formatNumber(cuota.SALDO_PROYECTADO)}</td>
          <td className={`px-2 py-1 border border-gray-200 text-center ${
            cuota.ESTADO === 'CANCELADO'
              ? 'text-green-600'
              : cuota.ESTADO === 'VENCIDO'
              ? 'text-red-600'
              : cuota.ESTADO === 'PENDIENTE'
              ? 'text-gray-800'
              : 'text-gray-600'
          }`}>
            {cuota.ESTADO}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Funciones de utilidad
import { formatDate, formatNumber } from './cronogramaUtils';