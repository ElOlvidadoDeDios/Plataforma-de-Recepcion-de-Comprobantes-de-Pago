import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoutButton } from './LogoutButton';
import UserInfo from './UserInfo';
import { usePermissions } from '../hooks/useAuth';
import logo from '../logo_dile.webp';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();

  // Contenido específico para usuarios básicos
  const BasicUserContent = () => (
    <div className="mt-12 max-w-4xl mx-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ¡Bienvenido a la Plataforma!
        </h2>
        <p className="text-gray-600">
          Actualmente tienes acceso básico al sistema. Para obtener acceso a más funcionalidades,
          por favor contacta al administrador del sistema.
        </p>
      </motion.div>
    </div>
  );

  // Contenido para usuarios con permisos adicionales
  const PrivilegedUserContent = () => (
    <div className="mt-12 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Botón de Pagos - Solo visible si tiene permiso */}
        {permissions.canAccessPayments() && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => navigate('/payments')}
              className="w-full h-48 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col items-center justify-center space-y-4"
            >
              <svg className="w-16 h-16 text-cyan-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xl font-semibold text-gray-800">Ver Pagos</span>
              <p className="text-gray-600 text-center">Gestiona y supervisa todos los pagos realizados</p>
            </button>
          </motion.div>
        )}

        {/* Botón de Créditos - Solo visible si tiene permiso */}
        {permissions.canAccessCredits() && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button
              onClick={() => navigate('/credit-requests')}
              className="w-full h-48 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col items-center justify-center space-y-4"
            >
              <svg className="w-16 h-16 text-cyan-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xl font-semibold text-gray-800">Consultar Solicitudes de Crédito</span>
              <p className="text-gray-600 text-center">Revisa las solicitudes de crédito pendientes</p>
            </button>
          </motion.div>
        )}

        {/* Botón de Interacciones del Bot - Visible para usuarios no básicos */}
        {!permissions.isBasicUser() && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              onClick={() => navigate('/bot-interactions')}
              className="w-full h-48 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col items-center justify-center space-y-4"
            >
              <svg className="w-16 h-16 text-cyan-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xl font-semibold text-gray-800">Interacciones del Bot</span>
              <p className="text-gray-600 text-center">Consulta todas las interacciones con el bot de WhatsApp</p>
            </button>
          </motion.div>
        )}

        {/* Botón de Gestión de Usuarios - Solo visible si tiene permiso */}
        {permissions.canManageUsers() && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              onClick={() => navigate('/user-management')}
              className="w-full h-48 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col items-center justify-center space-y-4"
            >
              <svg className="w-16 h-16 text-cyan-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xl font-semibold text-gray-800">Gestión de Usuarios</span>
              <p className="text-gray-600 text-center">Administra usuarios y roles del sistema</p>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-customLightBlue to-white">
      <div className="w-full px-6 pb-8">
        {/* Encabezado común para todos los usuarios */}
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
                Bienvenido a la Plataforma
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

        {/* Renderiza el contenido según el tipo de usuario */}
        {permissions.isBasicUser() ? <BasicUserContent /> : <PrivilegedUserContent />}
      </div>
    </div>
  );
};

export default Welcome;