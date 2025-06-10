import React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
      <div className="w-full sm:w-auto">
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha Inicio
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-white hover:bg-cyan-50 transition-colors"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha Fin
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-white hover:bg-cyan-50 transition-colors"
        />
      </div>
    </div>
  );
};