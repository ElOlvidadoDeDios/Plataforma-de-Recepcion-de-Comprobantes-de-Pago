import React from 'react';

interface DatosPagoAplicado {
  fecha_pago: string;
  hora_pago: string;
  dni_cliente: string;
  nombre_cliente: string;
  credito_id: string;
  agencia: string;
  tipo_pago: string;
  tipo_operacion: string;
  estado_anterior: string;
  estado_final: string;
  monto_total_aplicado: number;
  vouchers_aceptados: number;
  vouchers_rechazados: number;
  procesado_por: string;
  email_procesador: string;
  detalle_vouchers: Array<{
    indice: number;
    nro_operacion: string;
    tipo_operacion: string;
    monto: number;
    estado: string;
  }>;
}

interface ReportPreviewProps {
  mostrandoVista: boolean;
  datosPagos: DatosPagoAplicado[];
}

// Función para formatear fecha y hora
function formatearFechaYHora(fechaStr: string, horaStr: string) {
  const fecha = new Date(`${fechaStr}T${horaStr}`);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const hora = fecha.toTimeString().split(' ')[0];
  return `${dia}/${mes}/${anio} ${hora}`;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  mostrandoVista,
  datosPagos
}) => {
  if (!mostrandoVista || datosPagos.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Vista Previa del Reporte</h3>
        <p className="text-sm text-gray-600">
          {datosPagos.length} registro{datosPagos.length !== 1 ? 's' : ''} |
          Total: S/ {datosPagos.reduce((total, d) => total + d.monto_total_aplicado, 0).toFixed(2)}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-cyan-500 text-white">
              <th className="px-3 py-2 text-left text-xs font-medium">Fecha y Hora</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Cliente</th>
              <th className="px-3 py-2 text-left text-xs font-medium">DNI</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Crédito ID</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Tipo Pago</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Agencia</th>
              <th className="px-3 py-2 text-right text-xs font-medium">Monto</th>
              <th className="px-3 py-2 text-center text-xs font-medium">Vouchers</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Procesado Por</th>
            </tr>
          </thead>
          <tbody>
            {datosPagos.map((pago, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-xs">{formatearFechaYHora(pago.fecha_pago, pago.hora_pago)}</td>
                <td className="px-3 py-2 text-xs">{pago.nombre_cliente}</td>
                <td className="px-3 py-2 text-xs font-mono">{pago.dni_cliente}</td>
                <td className="px-3 py-2 text-xs font-mono">{pago.credito_id}</td>
                <td className="px-3 py-2 text-xs">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pago.tipo_pago === 'Pago Normal' ? 'bg-green-100 text-green-800' :
                    pago.tipo_pago === 'Liquidación' ? 'bg-blue-100 text-blue-800' :
                    pago.tipo_pago === 'Rechazo Total' ? 'bg-red-100 text-red-800' :
                    pago.tipo_pago === 'Rechazo Parcial' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pago.tipo_pago}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{pago.agencia}</td>
                <td className="px-3 py-2 text-xs text-right font-medium">S/ {pago.monto_total_aplicado.toFixed(2)}</td>
                <td className="px-3 py-2 text-xs text-center">
                  <span className="text-green-600">{pago.vouchers_aceptados} ✓</span>
                  {pago.vouchers_rechazados > 0 && <span className="text-red-600 ml-1">{pago.vouchers_rechazados} ✗</span>}
                </td>
                <td className="px-3 py-2 text-xs">{pago.procesado_por}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportPreview;