import { forwardRef } from 'react';
import { format } from 'date-fns';

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

interface PrintableReportProps {
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

const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(({ datosPagos }, ref) => {
  // Dividir los datos en grupos para mejor paginación (aprox. 25 filas por página)
  const ROWS_PER_PAGE = 25;
  const pageGroups = [];
  for (let i = 0; i < datosPagos.length; i += ROWS_PER_PAGE) {
    pageGroups.push(datosPagos.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <div ref={ref} className="print:block hidden">
      {/* Encabezado del reporte */}
      <div className="text-center mb-6 print:mb-4">
        <h1 className="text-2xl font-bold mb-2 print:text-xl print:mb-1">
          REPORTE DE PAGOS APLICADOS
        </h1>
        <p className="text-sm text-gray-600 mb-1 print:text-xs">
          Generado el {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </p>
        <p className="text-sm text-gray-600 mb-1 print:text-xs">
          Total de registros: {datosPagos.length}
        </p>
        <p className="text-sm text-gray-600 print:text-xs">
          Monto total: S/ {datosPagos.reduce((total, p) => total + p.monto_total_aplicado, 0).toFixed(2)}
        </p>
      </div>
      
      {datosPagos.length > 0 ? (
        pageGroups.map((group, pageIndex) => (
          <div key={pageIndex} className={pageIndex > 0 ? "page-break" : ""}>
            {/* Repetir encabezado en páginas siguientes */}
            {pageIndex > 0 && (
              <div className="text-center mb-4 print:block hidden">
                <h2 className="text-lg font-bold">REPORTE DE PAGOS APLICADOS (Continuación)</h2>
                <p className="text-xs">Página {pageIndex + 1}</p>
              </div>
            )}
            
            <table className="w-full border-collapse border border-black text-xs print:text-[10px]">
              <thead className="print:table-header-group">
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 font-bold print:p-1">Fecha/Hora</th>
                  <th className="border border-black p-1 font-bold print:p-1">Cliente</th>
                  <th className="border border-black p-1 font-bold print:p-1">DNI</th>
                  <th className="border border-black p-1 font-bold print:p-1">Crédito</th>
                  <th className="border border-black p-1 font-bold print:p-1">Agencia</th>
                  <th className="border border-black p-1 font-bold print:p-1">Monto</th>
                  <th className="border border-black p-1 font-bold print:p-1">Vouchers</th>
                  <th className="border border-black p-1 font-bold print:p-1">Procesado Por</th>
                </tr>
              </thead>
              <tbody className="print:table-row-group">
                {group.map((pago, index) => (
                  <tr key={index} className="print:break-inside-avoid">
                    <td className="border border-black p-1 print:p-1">
                      {formatearFechaYHora(pago.fecha_pago, pago.hora_pago)}
                    </td>
                    <td className="border border-black p-1 print:p-1">{pago.nombre_cliente}</td>
                    <td className="border border-black p-1 print:p-1">{pago.dni_cliente}</td>
                    <td className="border border-black p-1 print:p-1">{pago.credito_id}</td>
                    <td className="border border-black p-1 print:p-1">{pago.agencia}</td>
                    <td className="border border-black p-1 text-right print:p-1">
                      S/ {pago.monto_total_aplicado.toFixed(2)}
                    </td>
                    <td className="border border-black p-1 text-center print:p-1">
                      {pago.vouchers_aceptados} ✓ {pago.vouchers_rechazados > 0 && `${pago.vouchers_rechazados} ✗`}
                    </td>
                    <td className="border border-black p-1 print:p-1">{pago.procesado_por}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Mostrar resumen al final de la última página */}
            {pageIndex === pageGroups.length - 1 && (
              <div className="mt-4 text-center print:mt-2">
                <p className="text-xs text-gray-500 print:text-[10px]">
                  --- Fin del Reporte - Página {pageGroups.length} de {pageGroups.length} ---
                </p>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos para mostrar</p>
        </div>
      )}
    </div>
  );
});

PrintableReport.displayName = 'PrintableReport';

export default PrintableReport;