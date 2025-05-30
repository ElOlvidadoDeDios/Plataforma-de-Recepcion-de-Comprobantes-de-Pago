import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { PaymentRecord } from '../../../types';
import { procesarInfoPago } from '../../../api/paymentsApi';

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
  showImage: boolean; // Para saber cuando el modal está visible
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
  const [isLoading, setIsLoading] = useState(false);
  const currentPaymentRef = useRef<string>('');


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

  // Limpiar datos cuando se cierra el modal o cambia el pago
  useEffect(() => {
    if (!showImage || currentPaymentRef.current !== displayedPayment.creditoId) {
      setPaymentDetails(null);
      setPaymentType('normal');
      setIsLoading(false);
      if (showImage) {
        currentPaymentRef.current = displayedPayment.creditoId;
      } else {
        currentPaymentRef.current = '';
      }
    }
  }, [displayedPayment.creditoId, showImage]);

  // Cargar datos solo cuando el modal está visible
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!showImage || !displayedPayment.creditoId || !displayedPayment.dni || isLoading) return;
      
      setIsLoading(true);
      
      try {
        const data = await procesarInfoPago(displayedPayment.creditoId, displayedPayment.dni);
        if (Array.isArray(data) && data[0]?.status === false) {
          toast.error(data[0].message);
          return;
        }
        if (currentPaymentRef.current === displayedPayment.creditoId) {
          setPaymentDetails(data);
        }
      } catch (error: any) {
        toast.error(error.message || 'Error al obtener datos del pagaré');
      } finally {
        if (currentPaymentRef.current === displayedPayment.creditoId) {
          setIsLoading(false);
        }
      }
    };

    // Solo llamar si no tenemos datos para este pago
    if (paymentDetails === null) {
      fetchPaymentDetails();
    }
  }, [displayedPayment.creditoId, displayedPayment.dni, paymentDetails]);

// const formatDate = (fecha: string, hora: string) => {
//   try {
//     return new Date(`${fecha} ${hora}`).toLocaleString('es-ES', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   } catch (error) {
//     return `${fecha} ${hora}`;
//   }
// };

const StatusBadge = ({ estado }: { estado: 'pendiente' | 'aceptado' | 'rechazado' }) => {
  const badgeStyles = {
    aceptado: "flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full",
    rechazado: "flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full",
    pendiente: "flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full"
  };
  
  return (
    <div className={badgeStyles[estado]}>
      <span>{estado === 'aceptado' ? 'Pagado' : estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}</span>
    </div>
  );
};

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{paymentDetails?.SOCIO || 'Cargando...'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p className="text-gray-600 text-sm">DNI: {paymentDetails?.DNI}</p>
            <p className="text-gray-600 text-sm">Cuenta: {paymentDetails?.CUENTA}</p>
            <p className="text-gray-600 text-sm">Pagaré: {paymentDetails?.PAGARE}</p>
            <p className="text-gray-600 text-sm">Frecuencia: {paymentDetails?.FRECUENCIA}</p>
            <p className="text-gray-600 text-sm">Fecha Otorgamiento: {paymentDetails?.OTORGA}</p>
            <p className="text-gray-600 text-sm">Número de Cuotas: {paymentDetails?.NUM_CUOTAS}</p>
            <p className="text-gray-600 text-sm font-medium mb-2">Monto Adeudado: S/ {paymentDetails?.DEBE?.toFixed(2)}</p>
            
            {/* Radio buttons para tipo de pago */}
            <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
              {paymentDetails?.DETALLE && (
                <div className="mb-3 text-sm text-red-600 font-medium text-center">
                  {paymentDetails.DETALLE}
                </div>
              )}
              <div className="flex justify-around">
                <label className="flex items-center hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
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
                  <span className="ml-2 text-sm text-gray-700">
                    Pago Normal
                    <span className="text-xs text-gray-500 ml-1">
                      (Máximo: S/ {paymentDetails?.MAXIMO_PAGO?.toFixed(2) || '0.00'})
                    </span>
                  </span>
                </label>

                <label className="flex items-center hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
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
            <div className="col-span-2 flex items-center justify-between border-t border-gray-200 pt-3 mt-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-2">Estado:</span>
                <StatusBadge estado={displayedPayment.estado as 'pendiente' | 'aceptado' | 'rechazado'} />
              </div>
              {totalAmount && (
                <p className="text-gray-600 text-sm font-semibold">
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
        <div className="text-sm font-medium text-gray-600 mt-3">
          Mostrando comprobante {currentIndex! + 1} de {totalPayments}
        </div>
      )}
    </div>
  );
};