import React from 'react';
import { DetalleCredito, ClienteResponse } from '../../../api/customerConsultationAPI';

interface DetallePagosContentProps {
  prestamo: DetalleCredito;
  clientData: ClienteResponse;
}

interface DetallePago {
  id: string;
  fecha: string;
  monto: number;
  concepto: string;
  estado: string;
  metodoPago: string;
  referencia: string;
  cuotaNumero: number;
}

const DetallePagosContent: React.FC<DetallePagosContentProps> = ({
  prestamo,
}) => {
  // Datos de desarrollo - aquí se conectará con la API real
  const detallesPagos: DetallePago[] = [
    {
      id: "1",
      fecha: "2024-01-15",
      monto: 250.00,
      concepto: "Cuota mensual",
      estado: "Pagado",
      metodoPago: "Transferencia bancaria",
      referencia: "TRF001234",
      cuotaNumero: 1
    },
    {
      id: "2",
      fecha: "2024-02-15",
      monto: 250.00,
      concepto: "Cuota mensual",
      estado: "Pagado",
      metodoPago: "Depósito en cuenta",
      referencia: "DEP005678",
      cuotaNumero: 2
    },
    {
      id: "3",
      fecha: "2024-03-15",
      monto: 250.00,
      concepto: "Cuota mensual",
      estado: "Pendiente",
      metodoPago: "-",
      referencia: "-",
      cuotaNumero: 3
    },
    {
      id: "4",
      fecha: "2024-04-15",
      monto: 250.00,
      concepto: "Cuota mensual",
      estado: "Vencido",
      metodoPago: "-",
      referencia: "-",
      cuotaNumero: 4
    }
  ];

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pagado':
        return 'text-green-600 bg-green-100';
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100';
      case 'vencido':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white p-6 space-y-6">
      {/* Información del crédito */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-3">Información del Crédito</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">ID Préstamo:</span>
            <div className="font-bold text-cyan-700">{prestamo.ID_PRESTAMO}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Monto:</span>
            <div className="font-bold text-cyan-700">S/ {prestamo.MONTO}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Estado:</span>
            <div className="font-bold text-cyan-700">{prestamo.ESTADO}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Saldo Capital:</span>
            <div className="font-bold text-cyan-700">S/ {prestamo.SALDO_CAPITAL || '0'}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Frecuencia:</span>
            <div className="font-bold text-cyan-700">{prestamo.FRECUENCIA}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Producto:</span>
            <div className="font-bold text-cyan-700">{prestamo.PRODUCTO || 'No especificado'}</div>
          </div>
        </div>
      </div>

      {/* Resumen de pagos */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Resumen de Pagos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center bg-white p-3 rounded border">
            <div className="font-semibold text-green-600 text-lg">
              {formatearMonto(detallesPagos.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.monto, 0))}
            </div>
            <div className="text-gray-600">Total Pagado</div>
          </div>
          <div className="text-center bg-white p-3 rounded border">
            <div className="font-semibold text-yellow-600 text-lg">
              {formatearMonto(detallesPagos.filter(p => p.estado === 'Pendiente').reduce((sum, p) => sum + p.monto, 0))}
            </div>
            <div className="text-gray-600">Pendiente</div>
          </div>
          <div className="text-center bg-white p-3 rounded border">
            <div className="font-semibold text-red-600 text-lg">
              {formatearMonto(detallesPagos.filter(p => p.estado === 'Vencido').reduce((sum, p) => sum + p.monto, 0))}
            </div>
            <div className="text-gray-600">Vencido</div>
          </div>
          <div className="text-center bg-white p-3 rounded border">
            <div className="font-semibold text-blue-600 text-lg">
              {formatearMonto(detallesPagos.reduce((sum, p) => sum + p.monto, 0))}
            </div>
            <div className="text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Tabla de detalles de pago */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">Historial Detallado de Pagos</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota N°
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detallesPagos.map((pago) => (
                <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pago.cuotaNumero}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(pago.fecha).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {pago.concepto}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatearMonto(pago.monto)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(pago.estado)}`}>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {pago.metodoPago}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {pago.referencia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota de desarrollo */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Nota de Desarrollo
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Este componente muestra datos de prueba. Se conectará con la API real para obtener 
                el detalle de pagos del crédito. Los datos incluirán información real de pagos, 
                estados de cuotas, y métodos de pago utilizados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePagosContent;