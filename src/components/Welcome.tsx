import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from './Layout';
import { usePermissions } from '../hooks/useAuth';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();

  // Contenido para usuarios básicos
  const BasicUserContent = () => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center max-w-4xl mx-auto"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
        ¡Bienvenido a la Plataforma!
      </h2>
      <p className="text-gray-600 text-sm sm:text-base">
        Actualmente tienes acceso básico al sistema. Para obtener acceso a más funcionalidades,
        por favor contacta al administrador del sistema.
      </p>
    </motion.div>
  );

  // Componentes para los cuadros de funcionalidades
  const DashboardCard = ({ title, description, onClick, icon }: { 
    title: string; 
    description: string; 
    onClick: () => void; 
    icon: React.ReactNode; 
  }) => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      className="group bg-white rounded-lg shadow-lg p-8 text-center flex flex-col items-center justify-between cursor-pointer hover:shadow-xl transition-all"
      onClick={onClick}
    >
      <div className="text-blue-500 text-5xl mb-6 transform transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  );

  // Panel de control para usuarios con privilegios
  const PrivilegedUserContent = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-6 sm:p-8 text-center"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
          Panel de Control
        </h2>
        <p className="text-gray-600 text-sm sm:text-base mb-6">
          Selecciona una de las opciones disponibles para gestionar tu sistema.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {permissions.canAccessPayments() && (
            <DashboardCard 
              title="Ver Pagos" 
              description="Gestiona los pagos de los clientes"
              onClick={() => navigate('/payments')}
              icon="💰"
            />
          )}
          
          {permissions.canAccessCredits() && (
            <DashboardCard 
              title="Solicitudes de Crédito" 
              description="Revisa y aprueba solicitudes de crédito"
              onClick={() => navigate('/credit-requests')}
              icon="📝"
            />
          )}
          
          {!permissions.isBasicUser() && (
            <DashboardCard 
              title="Interacciones del Bot" 
              description="Analiza las interacciones con el bot"
              onClick={() => navigate('/bot-interactions')}
              icon="🤖"
            />
          )}
          
          {!permissions.isBasicUser() && (
            <DashboardCard 
              title="Consulta de Cuotas" 
              description="Revisa el estado de las cuotas"
              onClick={() => navigate('/consultas-cuotas')}
              icon="📊"
            />
          )}
          
          {!permissions.isBasicUser() && (
            <DashboardCard 
              title="Consultar socios" 
              description="Gestiona tu base de clientes"
              onClick={() => navigate('/consulta-clientes')}
              icon="👥"
            />
          )}
          
          {!permissions.isBasicUser() && (
            <DashboardCard
              title="Panel de Pagos"
              description="Gestiona los pagos y contribuciones"
              onClick={() => navigate('/pagos/panel')}
              icon="💳"
            />
          )}
          
          {permissions.canManageUsers() && (
            <DashboardCard 
              title="Gestión de Usuarios" 
              description="Administra los usuarios del sistema"
              onClick={() => navigate('/user-management')}
              icon="👤"
            />
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <Layout title="Bienvenido a la Plataforma DILE" showBackButton={false}>
      <div className="flex-1">
        {permissions.isBasicUser() ? (
          <BasicUserContent />
        ) : (
          <PrivilegedUserContent />
        )}
      </div>
    </Layout>
  );
};

export default Welcome;