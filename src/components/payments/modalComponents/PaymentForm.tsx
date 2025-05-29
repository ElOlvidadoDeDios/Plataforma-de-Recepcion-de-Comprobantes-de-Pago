import React from 'react';

interface PaymentFormProps {
  montoPago: string;
  nroOperacion: string;
  tipoOperacion: string;
  onUpdateDetail: (field: 'montoPago' | 'nroOperacion' | 'tipoOperacion', value: string) => void;
  agenciaName: string;
  isEditable: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  montoPago,
  nroOperacion,
  tipoOperacion,
  onUpdateDetail,
  agenciaName,
  isEditable
}) => {
  return (
    <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col p-2 lg:p-3">
      <div className="flex flex-col gap-2 lg:gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Monto pago:
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 lg:py-1.5 text-sm focus:ring-2 focus:ring-cyan-500"
            value={montoPago}
            onChange={(e) => onUpdateDetail('montoPago', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Número de operación:
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 lg:py-1.5 text-sm focus:ring-2 focus:ring-cyan-500"
            value={nroOperacion}
            onChange={(e) => onUpdateDetail('nroOperacion', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Tipo de operación:
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 lg:py-1.5 text-sm focus:ring-2 focus:ring-cyan-500"
            value={tipoOperacion}
            onChange={(e) => onUpdateDetail('tipoOperacion', e.target.value)}
            disabled={!isEditable}
          />
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Agencia:</span>
          <span className="text-sm font-medium text-gray-900">{agenciaName}</span>
        </div>
      </div>
    </div>
  );
};