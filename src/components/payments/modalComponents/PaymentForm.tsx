import React from 'react';

interface VoucherDetail {
  montoPago: string;
  nroOperacion: string;
  tipoOperacion: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  imageIndex: number; // Índice de la imagen correspondiente
  ruta: string; // Ruta de la imagen
}

interface PaymentFormProps {
  vouchers: VoucherDetail[];
  onUpdateVoucher: (index: number, field: keyof VoucherDetail, value: string) => void;
  onRejectVoucher: (index: number) => void;
  agenciaName: string;
  isEditable: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  vouchers,
  onUpdateVoucher,
  onRejectVoucher,
  isEditable
}) => {
  return (
    <div className="w-full h-full rounded-lg flex flex-col p-2 space-y-6 overflow-y-auto">
      {vouchers.map((voucher, index) => (
        <div key={voucher.imageIndex} className="border rounded-lg p-4 relative">
          {/* Título del voucher */}
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Comprobante {voucher.imageIndex + 1}
            {voucher.estado !== 'pendiente' && (
              <span className={`ml-2 ${voucher.estado === 'rechazado' ? 'text-red-500' : 'text-green-500'}`}>
                ({voucher.estado})
              </span>
            )}
          </h3>
          
          {/* Botón de rechazar voucher individual */}
          {isEditable && voucher.estado !== 'rechazado' && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="text-xs text-gray-500"></span>
                <button
                  onClick={() => onRejectVoucher(index)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  title="Rechazar comprobante actual"
                >
                  Rechazo parcial
                </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Monto */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Monto pago:
              </label>
              <input
                type="number"
                className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
                value={voucher.montoPago}
                onChange={(e) => onUpdateVoucher(index, 'montoPago', e.target.value)}
                disabled={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>

            {/* Número de operación */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Número de operación:
              </label>
              <input
                type="text"
                className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
                maxLength={25}
                value={voucher.nroOperacion}
                onChange={(e) => onUpdateVoucher(index, 'nroOperacion', e.target.value)}
                disabled={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>

            {/* Tipo de operación */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Tipo de operación:
              </label>
              <input
                type="text"
                className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
                maxLength={25}
                value={voucher.tipoOperacion}
                onChange={(e) => onUpdateVoucher(index, 'tipoOperacion', e.target.value)}
                disabled={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};