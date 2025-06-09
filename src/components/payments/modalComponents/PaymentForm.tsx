import React, { useState } from 'react';

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
  userData?: {
    agencias?: { cod_caja: string; user_caja: string }[];
    email?: string;
    dni?: string;
  } | null;
  agenciaCode?: string;
}

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm mt-2">
    {message}
  </div>
);

export const PaymentForm: React.FC<PaymentFormProps> = ({
  vouchers,
  onUpdateVoucher,
  onRejectVoucher,
  isEditable,
  userData,
  agenciaCode
}) => {
  const [errorMessage, setErrorMessage] = useState('');

  // Función para validar datos obligatorios
  const validateRequiredData = (): string | null => {
    if (!agenciaCode || agenciaCode.trim() === '') {
      return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
    }

    const codCaja = userData?.agencias?.[0]?.cod_caja || '';
    const userCaja = userData?.agencias?.[0]?.user_caja || '';

    if (!codCaja || codCaja.trim() === '') {
      return 'Falta información de código de caja. Contacte al administrador para configurar su agencia correctamente.';
    }

    if (!userCaja || userCaja.trim() === '') {
      return 'Falta información de usuario de caja. Contacte al administrador para configurar su agencia correctamente.';
    }

    if (!userData?.email || userData.email.trim() === '') {
      return 'Falta información del usuario (email). Inicie sesión nuevamente.';
    }

    if (!userData?.dni || userData.dni.trim() === '') {
      return 'Falta información del usuario (DNI). Inicie sesión nuevamente.';
    }

    return null;
  };
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
                onClick={() => {
                  // VALIDAR DATOS OBLIGATORIOS PRIMERO
                  const validationError = validateRequiredData();
                  if (validationError) {
                    setErrorMessage(validationError);
                    return;
                  }

                  const currentVoucher = vouchers[index];
                  if (!currentVoucher.montoPago || !currentVoucher.nroOperacion || !currentVoucher.tipoOperacion) {
                    setErrorMessage('Debe completar todos los datos del comprobante antes de rechazarlo');
                    return;
                  }
                  setErrorMessage('');
                  onRejectVoucher(index);
                }}
                className="text-red-500 hover:text-red-700 flex items-center gap-1"
                title="Rechazar comprobante actual"
              >
                <span className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors">Rechazo parcial</span>
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
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                maxLength={25}
                value={voucher.nroOperacion}
                onChange={(e) => onUpdateVoucher(index, 'nroOperacion', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>

            {/* Tipo de operación */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Tipo de operación:
              </label>
              <input
                type="text"
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                maxLength={25}
                value={voucher.tipoOperacion}
                onChange={(e) => onUpdateVoucher(index, 'tipoOperacion', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>
          </div>
          {errorMessage && (
            <div className="mt-4">
              <ErrorMessage message={errorMessage} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};