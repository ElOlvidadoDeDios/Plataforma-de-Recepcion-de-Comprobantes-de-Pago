import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { PaymentCard } from './components/PaymentCard';
import { DateRangePicker } from './components/DateRangePicker';
import { usePayments } from './hooks/usePayments';
import { getCurrentDate } from './utils/date';

const REFRESH_INTERVAL = 1 * 60 * 1000; // 1 minuto (20 minutos sería 20 * 60 * 1000)

function App() {
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());

  const {
    payments,
    loading,
    fetchData,
    handleUpdateStatus
  } = usePayments(startDate, endDate);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

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
                onUpdateStatus={(status) => handleUpdateStatus(payment, status)}
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
