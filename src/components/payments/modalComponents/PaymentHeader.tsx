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
  totalAmount,
  currentIndex,
  totalPayments,
  onCloseModal,
  showImage
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentType, setPaymentType] = useState<'normal' | 'liquidacion'>('normal');
  const currentPayment = useRef<string | null>(null);

  useEffect(() => {
    if (paymentDetails && totalAmount) {
      const totalAmountNum = parseFloat(totalAmount);
      const isMensual = paymentDetails.FRECUENCIA?.toUpperCase() === 'MESES';
      
      if ((isMensual && totalAmountNum > paymentDetails.MAXIMO_PAGO) ||
          (!isMensual && totalAmountNum >= paymentDetails.MONTO_LIQUIDA)) {
        setPaymentType('liquidacion');
        onTypeChange?.('liquidacion', paymentDetails.MONTO_LIQUIDA);
      }
    }
  }, [totalAmount, paymentDetails, onTypeChange]);

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
    <div className="p-3 lg:p-4 border-b border-gray-200">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0 max-w-[90%]">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">{paymentDetails?.SOCIO || 'Cargando...'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
            <p className="text-gray-600 text-xs sm:text-sm">DNI: {paymentDetails?.DNI}</p>
            <p className="text-gray-600 text-xs sm:text-sm">Cuenta: {paymentDetails?.CUENTA}</p>
            <p className="text-gray-600 text-xs sm:text-sm">Pagaré: {paymentDetails?.PAGARE}</p>
            <p className="text-gray-600 text-xs sm:text-sm">Frecuencia: {paymentDetails?.FRECUENCIA}</p>
            <p className="text-gray-600 text-xs sm:text-sm">Fecha Otorgamiento: {paymentDetails?.OTORGA}</p>
            <p className="text-gray-600 text-xs sm:text-sm">Número de Cuotas: {paymentDetails?.NUM_CUOTAS}</p>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Monto Adeudado: S/ {paymentDetails?.DEBE?.toFixed(2)}</p>
            
            <div className="col-span-2 border-t border-gray-200 pt-4 mt-3">
              {paymentDetails?.DETALLE && (
                <div className="mb-4 text-sm text-red-600 font-medium text-center bg-red-50 p-2 rounded-md">
                  {paymentDetails.DETALLE}
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center hover:bg-gray-50 p-2 rounded-md cursor-pointer transition-colors border border-gray-200">
                  <input
                    type="radio"
                    name="paymentType"
                    className="form-radio h-5 w-5 text-blue-600 border-2 border-gray-300 focus:ring-blue-500"
                    checked={paymentType === 'normal'}
                    onChange={() => {
                      setPaymentType('normal');
                      onTypeChange?.('normal', paymentDetails?.MAXIMO_PAGO || 0);
                    }}
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-700">
                    Pago Normal
                    <span className="text-[10px] sm:text-xs text-gray-500 ml-1">
                      (Máximo: S/ {paymentDetails?.MAXIMO_PAGO?.toFixed(2) || '0.00'})
                    </span>
                  </span>
                </label>

                <label className="flex-1 flex items-center hover:bg-gray-50 p-2 rounded-md cursor-pointer transition-colors border border-gray-200">
                  <input
                    type="radio"
                    name="paymentType"
                    className="form-radio h-5 w-5 text-blue-600 border-2 border-gray-300 focus:ring-blue-500"
                    checked={paymentType === 'liquidacion'}
                    onChange={() => {
                      setPaymentType('liquidacion');
                      onTypeChange?.('liquidacion', paymentDetails?.MONTO_LIQUIDA || 0);
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Liquidación Total
                    <span className="text-xs text-gray-500 ml-1">(Monto: S/ {paymentDetails?.MONTO_LIQUIDA?.toFixed(2) || '0.00'})</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="col-span-2 flex items-center flex-wrap gap-2 border-t border-gray-200 pt-3 mt-3">
              <div className="flex items-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium text-gray-700 mr-2">Estado:</span>
                <StatusBadge estado={displayedPayment.estadoGeneral} />
              </div>
              {totalAmount && (
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">
                  Total Acumulado: S/ {totalAmount}
                </p>
              )}
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
        <div className="text-xs sm:text-sm font-medium text-gray-600 mt-3">
          Mostrando comprobante {currentIndex! + 1} de {totalPayments}
        </div>
      )}
    </div>
  );
};