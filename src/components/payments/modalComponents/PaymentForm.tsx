import React, { useState } from 'react';

interface VoucherDetail {
  montoPago: string;
  nroOperacion: string;
  nro_banco: string; // Campo para número de banco
  tipoOperacion: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  imageIndex: number; // Índice de la imagen correspondiente
  ruta: string; // Ruta de la imagen
  fecha_voucher: string; // Nueva propiedad para la fecha de pago
}

interface PaymentFormProps {
  vouchers: VoucherDetail[];
  onUpdateVoucher: (index: number, field: keyof VoucherDetail, value: string) => void;
  onRejectVoucher: (index: number) => void;
  onAcceptVoucher?: (index: number) => void;
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
  onAcceptVoucher,
  isEditable,
  userData,
  agenciaCode
}) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="w-full h-full rounded-lg flex flex-col p-2 pt-8 space-y-6 overflow-y-auto">
      {vouchers.map((voucher, index) => (
        <div key={voucher.imageIndex} className="border rounded-lg p-4 relative">
          {/* Botones de acción individual - movidos arriba del título */}
          {isEditable && voucher.estado === 'pendiente' && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {/* Botón Aceptar Parcial */}
              {onAcceptVoucher && (
                <button
                  onClick={async () => {
                    if (loading) return; // SIMPLE: Evitar múltiples clics
                    setLoading(true);

                    // VALIDAR DATOS OBLIGATORIOS PRIMERO
                    const validationError = validateRequiredData();
                    if (validationError) {
                      setErrorMessage(validationError);
                      setLoading(false);
                      return;
                    }

                    const currentVoucher = vouchers[index];
                    if (!currentVoucher.montoPago || !currentVoucher.nroOperacion || !currentVoucher.nro_banco || !currentVoucher.tipoOperacion || !currentVoucher.fecha_voucher) {
                      setErrorMessage('Debe completar todos los datos del comprobante antes de aceptarlo');
                      setLoading(false);
                      return;
                    }
                    
                    try {
                      setErrorMessage('');
                      await onAcceptVoucher?.(index);
                    } catch (error: any) {
                      setErrorMessage(error.message || 'Error al procesar la aceptación parcial');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading} // Deshabilitar cuando está cargando
                  className={`text-green-500 hover:text-green-700 flex items-center gap-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Aceptar solo este comprobante"
                >
                  <span className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                    loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}>
                    {loading ? 'Procesando...' : 'Aceptar parcial'}
                  </span>
                </button>
              )}
              
              {/* Botón Rechazar Parcial */}
              <button
                onClick={() => {
                  if (loading) return; // SIMPLE: Evitar múltiples clics

                  // VALIDAR DATOS OBLIGATORIOS PRIMERO
                  const validationError = validateRequiredData();
                  if (validationError) {
                    setErrorMessage(validationError);
                    return;
                  }

                  const currentVoucher = vouchers[index];
                  if (!currentVoucher.montoPago || !currentVoucher.nroOperacion || !currentVoucher.nro_banco || !currentVoucher.tipoOperacion || !currentVoucher.fecha_voucher) {
                    setErrorMessage('Debe completar todos los datos del comprobante antes de rechazarlo');
                    return;
                  }
                  setErrorMessage('');
                  onRejectVoucher(index);
                }}
                disabled={loading} // Deshabilitar cuando está cargando
                className={`text-red-500 hover:text-red-700 flex items-center gap-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Rechazar solo este comprobante"
              >
                <span className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}>
                  {loading ? 'Procesando...' : 'Rechazo parcial'}
                </span>
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-4">
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
              <select
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors outline-none focus:outline-none ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                value={voucher.tipoOperacion}
                onChange={(e) => onUpdateVoucher(index, 'tipoOperacion', e.target.value)}
                disabled={!isEditable || voucher.estado === 'rechazado'}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="PLIN">PLIN</option>
                <option value="YAPE">YAPE</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              </select>
            </div>

            {/* Número de banco */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Número de banco:
              </label>
              <input
                type="text"
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                maxLength={20}
                value={voucher.nro_banco}
                onChange={(e) => onUpdateVoucher(index, 'nro_banco', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
                placeholder="Ej: 002, 009, etc."
              />
            </div>
            {/* FECHA DE PAGO */}
            <div className="flex flex-col">
              <label className="text-sm text-center font-medium text-gray-700">Fecha de pago</label>

              <input
                type="date"
                className={`mt-4 block w1/2 mx-auto text-center rounded-md border-gray-300 shadow-sm
                  focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm
                  ${!isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                  }`}
                
                /* ✅ CORREGIDO: usar value directamente ya que siempre tendrá valor desde PaymentDetailsModalState */
                value={voucher.fecha_voucher}

                onChange={(e) => onUpdateVoucher(index, 'fecha_voucher', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>
          </div>
          
          {/* Indicador del comprobante en la parte inferior */}
          <div className="mt-4 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              📄 Comprobante {voucher.imageIndex + 1}
              {voucher.estado !== 'pendiente' && (
                <span className={`ml-2 font-medium ${voucher.estado === 'rechazado' ? 'text-red-500' : 'text-green-500'}`}>
                  • {voucher.estado.toUpperCase()}
                </span>
              )}
            </p>
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