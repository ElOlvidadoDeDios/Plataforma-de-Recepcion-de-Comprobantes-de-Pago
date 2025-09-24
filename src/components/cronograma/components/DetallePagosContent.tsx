import React from 'react';
import { DetalleCredito, ClienteResponse } from '../../../api/customerConsultationAPI';
import { getMovimientosPrestamo } from '../../../api/cronogramaApi';

interface DetallePagosContentProps {
  prestamo: DetalleCredito & { CUENTA: string; OTORGA: string };
  clientData: ClienteResponse;
}

interface DetallePago {
  id: string;
  FECHA_MOV: string;
  COD_AGENCIA: string;
  COD_CAJA: string;
  MONEDA: string;
  NRO_DOC: string;
  cuotaNumero: number;
  GLOSA: string;
  TIPO_PAGO: string;
  TOTAL: number;
  CAPITAL: number;
  INTERES: number;
  MORA: number;
  SEGURO: number;
  PORTES: number;
  DESGRAV: number;
  APORTE: number;
}

const DetallePagosContent: React.FC<DetallePagosContentProps> = ({ prestamo }) => {
  const [detallesPagos, setDetallesPagos] = React.useState<DetallePago[]>([]);

  React.useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const movimientos = await getMovimientosPrestamo(prestamo.ID_PRESTAMO, prestamo.CUENTA, prestamo.OTORGA);
        // Mapear y ordenar por fecha ascendente
        const pagosOrdenados = movimientos
          .map((mov: any) => ({
            id: mov.NRO_DOC,
            FECHA_MOV: mov.FECHA_MOV,
            COD_AGENCIA: mov.COD_AGENCIA,
            COD_CAJA: mov.COD_CAJA,
            MONEDA: mov.MONEDA,
            NRO_DOC: mov.NRO_DOC,
            GLOSA: mov.GLOSA,
            TIPO_PAGO: mov.TIPO_PAGO,
            TOTAL: parseFloat(mov.TOTAL),
            CAPITAL: parseFloat(mov.CAPITAL),
            INTERES: parseFloat(mov.INTERES),
            MORA: parseFloat(mov.MORA),
            SEGURO: parseFloat(mov.SEGURO),
            PORTES: parseFloat(mov.PORTES),
            DESGRAV: parseFloat(mov.DESGRAV),
            APORTE: parseFloat(mov.APORTE),
          }))
          .map((pago, idx) => ({
            ...pago,
            cuotaNumero: idx + 1,
          }));
        setDetallesPagos(pagosOrdenados);
      } catch (error) {
      }
    };

    fetchMovimientos();
  }, [prestamo]);

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  // Función para filtrar movimientos que no sean desembolsos
  const movimientosNonDesembolso = detallesPagos.filter(p => 
    !p.GLOSA.toLowerCase().includes('desembolso') && 
    !p.GLOSA.toLowerCase().includes('desemb')
  );

  return (
    <div className="w-full h-full bg-white  md:p-0 space-y-1">
      <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm md:text-base">Información del Crédito</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs md:text-sm">
          <div>
            <span className="font-medium text-gray-600 text-xs">ID Préstamo:</span>
            <div className="font-bold text-cyan-700 text-xs md:text-sm">{prestamo.ID_PRESTAMO}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600 text-xs">Monto:</span>
            <div className="font-bold text-cyan-700 text-xs md:text-sm">S/ {prestamo.MONTO}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600 text-xs">Estado:</span>
            <div className="font-bold text-cyan-700 text-xs md:text-sm">{prestamo.ESTADO}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600 text-xs">Saldo Capital:</span>
            <div className="font-bold text-cyan-700 text-xs md:text-sm">S/ {prestamo.SALDO_CAPITAL || '0'}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600 text-xs">Frecuencia:</span>
            <div className="font-bold text-cyan-700 text-xs md:text-sm">{prestamo.FRECUENCIA}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600 text-xs">Producto:</span>
            <div className="font-bold text-cyan-700 text-xs md:text-sm">{prestamo.PRODUCTO || 'No especificado'}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">Resumen de Pagos</h3>
        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
          <div className="text-center bg-white p-2 rounded border">
            <div className="font-semibold text-green-600 text-xs md:text-sm">
              {formatearMonto(movimientosNonDesembolso.reduce((sum, p) => sum + p.TOTAL, 0))}
            </div>
            <div className="text-gray-600 text-xs">Total Pagado</div>
          </div>
          <div className="text-center bg-white p-2 rounded border">
            <div className="font-semibold text-blue-600 text-xs md:text-sm">
              {formatearMonto(detallesPagos.reduce((sum, p) => sum + p.TOTAL, 0))}
            </div>
            <div className="text-gray-600 text-xs">Total Movimientos</div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 md:px-3 py-2 border-b">
          <h3 className="font-semibold text-sm md:text-base">Movimiento de Pagos</h3>
        </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full divide-y divide-gray-200 text-[10px] md:text-xs h-full">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">N°</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden sm:table-cell">Agencia</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden sm:table-cell">Caja</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Capital</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Interés</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden md:table-cell">Mora</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden md:table-cell">Seguro</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden lg:table-cell">Portes</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden lg:table-cell">Desgrav</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden lg:table-cell">Aporte</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden sm:table-cell">Tipo</th>
                  <th className="px-1 md:px-2 py-1 text-left text-[9px] md:text-[10px] font-medium text-gray-500 uppercase hidden md:table-cell">Doc</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detallesPagos.map((pago) => (
                  <tr
                    key={pago.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      pago.cuotaNumero === 1 && pago.GLOSA === 'DESEMBOLSO PRESTAMO'
                        ? 'bg-blue-100 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-[10px] md:text-xs">{pago.cuotaNumero}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 text-[10px] md:text-xs">{pago.FECHA_MOV}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden sm:table-cell text-[8px] md:text-xs">{pago.COD_AGENCIA}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden sm:table-cell text-[8px] md:text-xs">{pago.COD_CAJA}</td>
                    <td className="px-1 md:px-2 py-1 text-gray-900 max-w-[130px] truncate text-[10px] md:text-xs">{pago.GLOSA}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 text-[10px] md:text-xs">{formatearMonto(pago.CAPITAL)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 text-[10px] md:text-xs">{formatearMonto(pago.INTERES)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden md:table-cell text-[8px] md:text-xs">{formatearMonto(pago.MORA)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden md:table-cell text-[8px] md:text-xs">{formatearMonto(pago.SEGURO)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden lg:table-cell text-[8px] md:text-xs">{formatearMonto(pago.PORTES)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden lg:table-cell text-[8px] md:text-xs">{formatearMonto(pago.DESGRAV)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden lg:table-cell text-[8px] md:text-xs">{formatearMonto(pago.APORTE)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-[10px] md:text-xs">{formatearMonto(pago.TOTAL)}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden sm:table-cell text-[8px] md:text-[10px]">{pago.TIPO_PAGO}</td>
                    <td className="px-1 md:px-2 py-1 whitespace-nowrap text-gray-900 hidden md:table-cell text-[8px] md:text-xs">{pago.NRO_DOC}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default DetallePagosContent;


