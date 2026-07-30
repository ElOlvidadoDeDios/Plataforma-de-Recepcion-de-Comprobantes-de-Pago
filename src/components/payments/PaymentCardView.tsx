import React, { useState, useEffect } from 'react';
import { PaymentRecord } from '../../types';
import StatusBadge from '../shared/StatusBadge';

interface PaymentCardViewProps {
  payment: PaymentRecord;
  currentPayment: PaymentRecord;
  isLoading: boolean;
  onOpenModal: (e: React.MouseEvent) => void;
  isReadOnlyMode?: boolean;
}

export const PaymentCardView: React.FC<PaymentCardViewProps> = ({
  payment,
  currentPayment,
  isLoading,
  onOpenModal,
  isReadOnlyMode = false
}) => {
  const [agenciaNombre, setAgenciaNombre] = useState<string>('Cargando...');
  const [loadingAgencia, setLoadingAgencia] = useState<boolean>(true);

  useEffect(() => {
    const obtenerAgencia = async () => {
      if (!currentPayment.creditoId) {
        setAgenciaNombre('No disponible');
        setLoadingAgencia(false);
        return;
      }

      try {
        setLoadingAgencia(true);
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL_GEODILE;
        const apiToken = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
        
        const url = `${apiBaseUrl}/api_app_dile_v1_1/api/asignar_agencia_pago`;
        const body = { PAGARE: currentPayment.creditoId };
      
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${apiToken}`,
          },
          body: JSON.stringify(body)
        });


        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data && data.length > 0 && data[0].AGE_ACTUAL) {
          setAgenciaNombre(data[0].AGE_ACTUAL);
        } else {
          setAgenciaNombre('No disponible');
        }
      } catch (error) {
        console.error('❌ Error al obtener agencia:', error);
        setAgenciaNombre('No disponible');
      } finally {
        setLoadingAgencia(false);
      }
    };

    obtenerAgencia();
  }, [currentPayment.creditoId]);

  const formatDate = (fecha: string, hora: string) => {
    try {
      return new Date(`${fecha} ${hora}`).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return `${fecha} ${hora}`;
    }
  };

  return (
    <div
      className="bg-white/90 rounded-lg shadow-md p-6 mb-4"
      data-payment-id={`${payment.dni}-${payment.fecha}-${payment.hora}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{currentPayment.nombreSocio}</h3>
          <p className="text-gray-600">DNI: {currentPayment.dni}</p>
          <p className="text-gray-600">{formatDate(currentPayment.fecha, currentPayment.hora)}</p>
          <p className="text-gray-800">Págare: <strong>{currentPayment.creditoId}</strong></p>
          
          {/* Mostrar Agencia */}
          <div className="mt-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div className="text-sm">
              <span className="text-gray-500">Agencia:</span>{' '}
              {loadingAgencia ? (
                <span className="text-gray-400 italic">Cargando...</span>
              ) : (
                <span className="font-medium text-gray-700">{agenciaNombre}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <StatusBadge estado={currentPayment.estadoGeneral} />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={onOpenModal}
          disabled={isLoading}
          className={`${
            isReadOnlyMode
              ? 'bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600'
              : 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading
            ? 'Cargando...'
            : isReadOnlyMode
              ? 'Ver Detalles'
              : currentPayment.estadoGeneral === 'pendiente' || currentPayment.estadoGeneral === 'parcial'
                ? 'Aplicar Pago'
                : 'Ver Comprobante'
          }
        </button>
        {/* 🔧 Indicador visual de modo solo lectura */}
        {isReadOnlyMode && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Solo Lectura
          </span>
        )}
      </div>
    </div>
  );
};