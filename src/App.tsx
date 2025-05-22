import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import CompleteRegister from './components/CompleteRegister';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Welcome from './components/Welcome';
import PaymentsPage from './components/PaymentsPage';
import UserManagementPage from './components/UserManagementPage';
import CreditRequestsPage from './components/CreditRequestsPage';
import BotInteractionsPage from './components/BotInteractionsPage';
import ConsultaCuotasPage from './components/ConsultaCuotasPage';
import CustomerConsultation from './components/customerConsultation/customerConsultation';
import NonBasicUserRoute from './components/NonBasicUserRoute';
import { EmailProvider } from './components/EmailContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { useSocket } from './hooks/useSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30000, // 30 segundos
      gcTime: 300000, // 5 minutos
    },
  },
});

const PaymentsPageWithSocket: React.FC = () => {
  const { socket } = useSocket();
  return <PaymentsPage socket={socket} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmailProvider>
          <SocketProvider>
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
                      <Welcome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <PaymentsPageWithSocket />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-management"
                  element={
                    <ProtectedRoute>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/credit-requests"
                  element={
                    <ProtectedRoute>
                      <CreditRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bot-interactions"
                  element={
                    <ProtectedRoute>
                      <NonBasicUserRoute>
                        <BotInteractionsPage />
                      </NonBasicUserRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consultas-cuotas"
                  element={
                    <ProtectedRoute>
                      <NonBasicUserRoute>
                        <ConsultaCuotasPage />
                      </NonBasicUserRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consulta-clientes"
                  element={
                    <ProtectedRoute>
                      <NonBasicUserRoute>
                        <CustomerConsultation />
                      </NonBasicUserRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cronograma/:id"
                  element={
                    <ProtectedRoute>
                      <NonBasicUserRoute>
                        <Suspense fallback={<div>Cargando...</div>}>
                          {React.createElement(lazy(() => import('./components/cronograma/CronogramaPage')))}
                        </Suspense>
                      </NonBasicUserRoute>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
            <Toaster position="top-right" />
          </SocketProvider>
        </EmailProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
