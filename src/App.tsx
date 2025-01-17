import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { fetchPaymentsByDNI, fetchPaymentsByStatus, updatePaymentStatus } from './api';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import { LogoutButton } from './components/LogoutButton';
import CompleteRegister from './components/CompleteRegister';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { EmailProvider } from './components/EmailContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import UserInfo from './components/UserInfo';
import { PaymentCard } from './components/PaymentCard';
import { PaymentRecord } from './types';
import logo from './logo_dile.webp'

// Asegúrate de que esta URL sea correcta y esté usando wss
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initializeSocket = () => {
  return io(API_BASE_URL, {
   transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      token: localStorage.getItem('token'),
    }
  });
};

function AppContent() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dniFilter, setDniFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pendiente');
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (user && !socket) {
      const newSocket = initializeSocket();
      setSocket(newSocket);

      // Cleanup
      return () => {
        if (newSocket) {
          console.log('Desconectando socket');
          newSocket.disconnect();
          newSocket.removeAllListeners();
        }
      };
    }
  }, [user]);

  useEffect(() => {
    fetchInitialPayments();
  }, []);

  const fetchInitialPayments = async () => {
    setLoading(true);
    try {
      const response = await fetchPaymentsByStatus('pendiente');
      if (response?.comprobantes) {
        setPayments(response.comprobantes);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error al cargar pagos iniciales:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDNISearch = async () => {
    if (!dniFilter.trim()) {
      toast.error('Por favor ingrese un DNI válido');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchPaymentsByDNI(dniFilter);
      if (response?.comprobantes) {
        const filteredPayments = response.comprobantes.filter(
          payment => selectedStatus === 'todos' || payment.estado === selectedStatus
        );
        setPayments(filteredPayments);

        if (filteredPayments.length > 0) {
          toast.success(`Se encontraron ${filteredPayments.length} pagos para el DNI: ${dniFilter}`);
        }
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error al buscar por DNI:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value;
    setSelectedStatus(newStatus);

    setLoading(true);
    try {
      let response;
      if (dniFilter.trim()) {
        response = await fetchPaymentsByDNI(dniFilter);
        if (response?.comprobantes) {
          const filteredPayments = response.comprobantes.filter(
            payment => newStatus === 'todos' || payment.estado === newStatus
          );
          setPayments(filteredPayments);
        } else {
          setPayments([]); // Si no hay resultados, vaciar el estado de pagos
        }
      } else {
        if (newStatus === 'todos') {
          const allPayments = await Promise.all([
            fetchPaymentsByStatus('pendiente'),
            fetchPaymentsByStatus('aceptado'),
            fetchPaymentsByStatus('rechazado')
          ]);
          const combinedPayments = allPayments.flatMap(payments => payments.comprobantes || []);
          setPayments(combinedPayments.length > 0 ? combinedPayments : []); // Vaciar si no hay resultados
        } else {
          response = await fetchPaymentsByStatus(newStatus);
          if (response?.comprobantes) {
            setPayments(response.comprobantes);
          } else {
            setPayments([]); // Vaciar si no hay resultados
          }
        }
      }
    } catch (error) {
      console.error('Error al filtrar por estado:', error);
      setPayments([]); // Vaciar en caso de error
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setDniFilter('');
    setSelectedStatus('pendiente');
    await fetchInitialPayments();
  };

  const handleUpdatePaymentStatus = async (payment: PaymentRecord, estado: string) => {
    try {
      await updatePaymentStatus(payment.dni, payment.fecha, payment.hora, estado);
      setPayments(prevPayments =>
        prevPayments.filter(p =>
          !(p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora && selectedStatus === 'pendiente')
        ).map(p =>
          p.dni === payment.dni && p.fecha === payment.fecha && p.hora === payment.hora
            ? { ...p, estado }
            : p
        )
      );
      toast.success('Estado actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('No se pudo actualizar el estado del pago.');
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('paymentUpdated', (updatedPayment: PaymentRecord) => {
        setPayments(prevPayments =>
          prevPayments.filter(p =>
            !(p.dni === updatedPayment.dni && p.fecha === updatedPayment.fecha && p.hora === updatedPayment.hora && selectedStatus === 'pendiente')
          ).map(payment =>
            payment.dni === updatedPayment.dni &&
            payment.fecha === updatedPayment.fecha &&
            payment.hora === updatedPayment.hora
              ? updatedPayment
              : payment
          )
        );
      });

      return () => {
        socket.off('paymentUpdated');
      };
    }
  }, [socket, selectedStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-customLightBlue to-white">
      <div className="w-full px-6 pb-8">
      <div className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-lg shadow-lg">
          <div className="w-full flex items-center px-6 py-4">
            <div className="flex items-center space-x-6">
              <motion.div
                className="relative w-48 h-48"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.1 }}
              >
                <img
                  src={logo}
                  alt="Logo DILE"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <motion.h1
                className="text-white font-bold text-2xl md:text-3xl"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Plataforma de Pagos
              </motion.h1>
            </div>
            <div className="flex items-center ml-auto">
              <UserInfo />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 to-blue-500 flex justify-end px-6 py-2 rounded-b-lg shadow-lg">
          <LogoutButton />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="dni-input" className="block text-sm font-medium text-gray-700">
                Buscar por DNI
              </label>
              <div className="flex space-x-2">
                <input
                  id="dni-input"
                  type="text"
                  value={dniFilter}
                  onChange={(e) => setDniFilter(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Ingrese DNI"
                />
                <button
                  onClick={handleDNISearch}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
                >
                  Buscar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
                Filtrar por Estado
              </label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Cargando pagos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 font-medium">
              {dniFilter
                ? `No se encontraron comprobantes para el DNI ${dniFilter}${selectedStatus !== 'todos' ? ` con estado ${selectedStatus}` : ''}`
                : `No se encontraron comprobantes${selectedStatus !== 'todos' ? ` con estado ${selectedStatus}` : ''}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {payments.map((payment) => (
              <PaymentCard
                key={`${payment.dni}-${payment.fecha}-${payment.hora}`}
                payment={payment}
                onUpdateStatus={(payment, estado) => handleUpdatePaymentStatus(payment, estado)}
                socket={socket} // Pasa el socket aquí
              />
            ))}
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <EmailProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:verificationCode" element={<VerifyEmail />} />
            <Route path="/complete-register" element={<CompleteRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </EmailProvider>
    </AuthProvider>
  );
}

export default App;
