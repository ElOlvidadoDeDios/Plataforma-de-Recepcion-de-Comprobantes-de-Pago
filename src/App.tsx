import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PaymentCard } from './components/PaymentCard';
import { DateRangePicker } from './components/DateRangePicker';
import { getCurrentDate } from './utils/date';
import io from 'socket.io-client';
import { PaymentRecord } from './types'; 
import axios from 'axios';
//const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:3030/api';
const API_BASE_URL = 'http://localhost:3030';
const socket = io(API_BASE_URL);

function App() {
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.emit('fetchPayments', { fechaInicio: startDate, fechaFin: endDate });

    socket.on('payments', (data: PaymentRecord[]) => {
      setPayments(data);
      setLoading(false);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Error al obtener pagos:', error);
      setLoading(false);
    });

    return () => {
      socket.off('payments');
      socket.off('error');
    };
  }, [startDate, endDate]);

  const handleUpdateStatus = async (payment: PaymentRecord, estado: 'pendiente' | 'aceptado' | 'rechazado') => {
    try {
      await axios.put(`${API_BASE_URL}/api/comprobantes/${payment.dni}`, {
        fecha: payment.fecha,
        hora: payment.hora,
        estado: estado,
      });

      // Actualizar el estado local
      setPayments(prevPayments =>
        prevPayments.map(p =>
          p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora
            ? { ...p, estado }
            : p
        )
      );
    } catch (error) {
      console.error('Error al actualizar el estado del pago:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 bg-red-500">Plataforma de Pagos</h1>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando pagos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay pagos para mostrar en el rango de fechas seleccionado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map((payment) => (
              <PaymentCard
                key={`${payment.dni}-${payment.fecha}-${payment.hora}`}
                payment={payment}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
