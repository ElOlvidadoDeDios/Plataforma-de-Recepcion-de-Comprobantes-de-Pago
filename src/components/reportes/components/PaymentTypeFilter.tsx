import React from 'react';

interface PaymentTypeFilterProps {
  filtroTipoPago: 'todos' | 'pago_normal' | 'pago_liquida';
  setFiltroTipoPago: (value: 'todos' | 'pago_normal' | 'pago_liquida') => void;
}

const PaymentTypeFilter: React.FC<PaymentTypeFilterProps> = ({
  filtroTipoPago,
  setFiltroTipoPago
}) => {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">💰 Filtrar por tipo de pago:</label>
      <div className="space-y-2">
        <div className="bg-blue-50 p-3 rounded-lg mb-3">
          <p className="text-xs text-blue-700 font-medium">
            📋 Nota: Este reporte solo incluye pagos aplicados exitosamente (Pago Normal y Liquidación).
            Los rechazos no se incluyen automáticamente.
          </p>
        </div>
        <label className="flex items-center">
          <input
            type="radio"
            name="tipoPago"
            value="todos"
            checked={filtroTipoPago === 'todos'}
            onChange={(e) => setFiltroTipoPago(e.target.value as 'todos')}
            className="mr-2"
          />
          📋 Todos los pagos aplicados
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="tipoPago"
            value="pago_normal"
            checked={filtroTipoPago === 'pago_normal'}
            onChange={(e) => setFiltroTipoPago(e.target.value as 'pago_normal')}
            className="mr-2"
          />
          💰 Solo pagos normales
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="tipoPago"
            value="pago_liquida"
            checked={filtroTipoPago === 'pago_liquida'}
            onChange={(e) => setFiltroTipoPago(e.target.value as 'pago_liquida')}
            className="mr-2"
          />
          🔄 Solo liquidaciones
        </label>
      </div>
    </div>
  );
};

export default PaymentTypeFilter;