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
    <div className="flex space-x-4 items-center mb-6">
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha Inicio
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-blue-300"
        />
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha Fin
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-red-300"
        />
      </div>
    </div>
  );
};