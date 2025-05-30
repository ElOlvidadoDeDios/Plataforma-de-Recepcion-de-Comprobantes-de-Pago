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
  isEditable
}) => {
  return (
    <div className="w-full h-full rounded-lg flex flex-col p-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-center font-medium text-gray-700">
            Monto pago:
          </label>
          <input
            type="number"
            className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
            value={montoPago}
            onChange={(e) => onUpdateDetail('montoPago', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-center font-medium text-gray-700">
            Número de operación:
          </label>
          <input
            type="text"
            className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
            maxLength={25}
            value={nroOperacion}
            onChange={(e) => onUpdateDetail('nroOperacion', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-center font-medium text-gray-700">
            Tipo de operación:
          </label>
          <input
            type="text"
            className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
            maxLength={25}
            value={tipoOperacion}
            onChange={(e) => onUpdateDetail('tipoOperacion', e.target.value)}
            disabled={!isEditable}
          />
        </div>
      </div>
      
    </div>
  );
};