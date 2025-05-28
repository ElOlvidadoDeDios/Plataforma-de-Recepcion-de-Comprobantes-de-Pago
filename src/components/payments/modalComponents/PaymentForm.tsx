import React from 'react';

interface PaymentFormProps {
  montoPago: string;
  nroOperacion: string;
  tipoOperacion: string;
  onUpdateDetail: (field: 'montoPago' | 'nroOperacion' | 'tipoOperacion', value: string) => void;
  totalMonto: string;
  onMontoTotalChange: (value: string) => void;
  agenciaName: string;
  isEditable: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  montoPago,
  nroOperacion,
  tipoOperacion,
  onUpdateDetail,
  totalMonto,
  onMontoTotalChange,
  agenciaName,
  isEditable
}) => {
  return (
    <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col">
      <div className="p-4 flex flex-col gap-4">
        <div>
          <input
            type="number"
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="Monto pago"
            value={montoPago}
            onChange={(e) => onUpdateDetail('montoPago', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="Nro. operación"
            value={nroOperacion}
            onChange={(e) => onUpdateDetail('nroOperacion', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="Tipo operación"
            value={tipoOperacion}
            onChange={(e) => onUpdateDetail('tipoOperacion', e.target.value)}
            disabled={!isEditable}
          />
        </div>
      </div>
      
      {isEditable && (
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Monto Total:
            </label>
            <input
              type="number"
              step="0.01"
              value={totalMonto}
              onChange={(e) => onMontoTotalChange(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500"
              placeholder="Monto"
            />
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Agencia: <span className="text-gray-900">{agenciaName}</span>
          </div>
        </div>
      )}
    </div>
  );
};