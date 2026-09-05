import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { PaymentRecord } from '../../../types';
import { procesarInfoPago } from '../../../api/paymentsApi';
import StatusBadge from '../../shared/StatusBadge';

interface PaymentDetails {
  PAGARE: string;
  FRECUENCIA: string;
  OTORGA: string;
  SOCIO: string;
  DNI: string;
  CUENTA: string;
  DEBE: number;
  DETALLE_CUOTAS: Array<{
    NumeroCuota: string;
    FechaVencimiento: string;
    EstadoCuota: string;
    TotalCuota: number;
  }>;
  NUM_CUOTAS: number;
  MAXIMO_PAGO: number;
  MONTO_LIQUIDA: number;
  DETALLE: string;
}

interface PaymentHeaderProps {
  displayedPayment: PaymentRecord;
  totalAmount?: string;
  currentIndex?: number;
  totalPayments?: number;
  onCloseModal: () => void;
  showImage: boolean;
  onTypeChange?: (type: 'normal' | 'liquidacion', maxAmount: number) => void;
}

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  onTypeChange,
  displayedPayment,
  currentIndex,
  totalPayments,
  onCloseModal,
  showImage
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentType, setPaymentType] = useState<'normal' | 'liquidacion'>('normal');
  const currentPayment = useRef<string | null>(null);

  useEffect(() => {
    if (paymentDetails) {
      // Solo establecer el tipo normal en la primera carga
      if (paymentType === 'normal') {
        onTypeChange?.('normal', paymentDetails.MAXIMO_PAGO);
      } else {
        // Mantener el tipo actual pero actualizar el límite
        const limit = paymentType === 'liquidacion' ? paymentDetails.MONTO_LIQUIDA : paymentDetails.MAXIMO_PAGO;
        onTypeChange?.(paymentType, limit);
      }
    }
  }, [paymentDetails, paymentType]);

  useEffect(() => {
    const shouldFetchData =
      showImage && // Modal visible
      displayedPayment.creditoId && // Tenemos ID
      displayedPayment.dni && // Tenemos DNI
      currentPayment.current !== displayedPayment.creditoId; // No es el mismo pago

    if (shouldFetchData) {
      const fetchData = async () => {
        try {
          currentPayment.current = displayedPayment.creditoId;
          const data = await procesarInfoPago(displayedPayment.creditoId, displayedPayment.dni);
          if (Array.isArray(data) && data[0]?.status === false) {
            toast.error(data[0].message);
            return;
          }
          setPaymentDetails(data);
        } catch (error: any) {
          toast.error(error.message || 'Error al obtener datos del pagaré');
        }
      };

      fetchData();
    }

    // Limpiar datos cuando se cierra el modal
    if (!showImage) {
      setPaymentDetails(null);
      setPaymentType('normal');
      currentPayment.current = null;
    }
  }, [displayedPayment.creditoId, displayedPayment.dni, showImage]);

  return (
    <div className="p-1 border-b border-gray-200 text-xs leading-tight">
      <div className="flex justify-between items-start gap-1">
        <div className="flex-1 min-w-0 max-w-[90%]">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">{paymentDetails?.SOCIO || 'Cargando...'}</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-1 text-[11px] sm:text-xs">
            <p className="text-gray-600">DNI: {paymentDetails?.DNI}</p>
            <p className="text-gray-600">Cuenta: {paymentDetails?.CUENTA}</p>
            <p className="text-gray-600">Pagaré: {paymentDetails?.PAGARE}</p>
            <p className="text-gray-600">Frecuencia: {paymentDetails?.FRECUENCIA}</p>
            <p className="text-gray-600">Fecha Otorgamiento: {paymentDetails?.OTORGA}</p>
            <p className="text-gray-600">Número de Cuotas: {paymentDetails?.NUM_CUOTAS}</p>
            <p className="text-gray-700 font-medium">Monto Adeudado: S/ {paymentDetails?.DEBE?.toFixed(2)}</p>
            <div className="inline-flex items-center text-gray-700 font-medium">Estado: <StatusBadge estado={displayedPayment.estadoGeneral} /></div>

            <div className="xl:col-span-2 border-t border-gray-200 pt-2 mt-2">
              {paymentDetails?.DETALLE && (
                <div className="mb-2 text-xs text-red-600 font-medium text-center bg-red-50 p-1.5 rounded-md">
                  {paymentDetails.DETALLE}
                </div>
              )}
              <div className="flex gap-1 sm:gap-2">
                <label className="flex-1 flex items-center hover:bg-gray-50 p-1 rounded-md cursor-pointer transition-colors border border-gray-200">
                  <input
                    type="radio"
                    name="paymentType"
                    className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 border-2 border-gray-300 focus:ring-blue-500"
                    checked={paymentType === 'normal'}
                    disabled={!paymentDetails}
                    onChange={() => {
                      setPaymentType('normal');
                      const maxPago = paymentDetails?.MAXIMO_PAGO || 0;
                      onTypeChange?.('normal', maxPago);
                    }}
                  />
                  <span className="ml-1 text-[10px] sm:text-xs text-gray-700 leading-tight">
                    Pago Normal
                    <span className="text-[9px] sm:text-[10px] text-gray-500 ml-1 block sm:inline">
                      (Máximo: S/ {paymentDetails?.MAXIMO_PAGO?.toFixed(2) || '0.00'})
                    </span>
                  </span>
                </label>

                <label className="flex-1 flex items-center hover:bg-gray-50 p-1 rounded-md cursor-pointer transition-colors border border-gray-200">
                  <input
                    type="radio"
                    name="paymentType"
                    className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 border-2 border-gray-300 focus:ring-blue-500"
                    checked={paymentType === 'liquidacion'}
                    disabled={!paymentDetails}
                    onChange={() => {

                      setPaymentType('liquidacion');
                      const montoLiquida = paymentDetails?.MONTO_LIQUIDA || 0;
                      onTypeChange?.('liquidacion', montoLiquida);
                    }}
                  />
                  <span className="ml-1 text-[10px] sm:text-xs text-gray-700 leading-tight">
                    Liquidación Total
                    <span className="text-[9px] sm:text-[10px] text-gray-500 ml-1 block sm:inline">(Monto: S/ {paymentDetails?.MONTO_LIQUIDA?.toFixed(2) || '0.00'})</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onCloseModal}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {totalPayments && totalPayments > 1 && (
        <div className="text-[11px] sm:text-xs font-medium text-gray-600 mt-1.5">
          Mostrando comprobante {currentIndex! + 1} de {totalPayments}
        </div>
      )}
    </div>
  );
};