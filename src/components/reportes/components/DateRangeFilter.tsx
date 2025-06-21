import React from 'react';
import { format } from 'date-fns';

interface DateRangeFilterProps {
  rangoExporte: 'hoy' | 'rango' | 'todo';
  setRangoExporte: (value: 'hoy' | 'rango' | 'todo') => void;
  fechaInicioExporte: string;
  setFechaInicioExporte: (value: string) => void;
  fechaFinExporte: string;
  setFechaFinExporte: (value: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  rangoExporte,
  setRangoExporte,
  fechaInicioExporte,
  setFechaInicioExporte,
  fechaFinExporte,
  setFechaFinExporte
}) => {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">📅 Rango de fechas:</label>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="rango"
            value="hoy"
            checked={rangoExporte === 'hoy'}
            onChange={(e) => setRangoExporte(e.target.value as 'hoy')}
            className="mr-2"
          />
          📅 Pagos aplicados hoy ({format(new Date(), 'dd/MM/yyyy')})
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="rango"
            value="rango"
            checked={rangoExporte === 'rango'}
            onChange={(e) => setRangoExporte(e.target.value as 'rango')}
            className="mr-2"
          />
          📆 Rango de fechas personalizado
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="rango"
            value="todo"
            checked={rangoExporte === 'todo'}
            onChange={(e) => setRangoExporte(e.target.value as 'todo')}
            className="mr-2"
          />
          📋 Todos los pagos aplicados
        </label>
      </div>

      {rangoExporte === 'rango' && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicioExporte}
              onChange={(e) => setFechaInicioExporte(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFinExporte}
              onChange={(e) => setFechaFinExporte(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;