import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationDayManagement } from '../hooks/useNotificationDayManagement';
import { NotificationModal } from './NotificationModal';

interface NotificationBellProps {
  className?: string;
  onClick?: () => void;
  showTooltip?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className = '', 
  onClick,
  showTooltip = true 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);
  
  const { 
    count, 
    loading, 
    hasNewNotifications, 
    markAsRead, 
    notifications,
    refresh 
  } = useNotificationDayManagement({
    autoFetch: true,
    enablePolling: true,
    interval: 5 * 60 * 1000 // 5 minutos
  });

  const handleBellClick = () => {
    if (onClick) {
      onClick();
    }
    
    // Marcar como leídas las notificaciones
    if (hasNewNotifications) {
      markAsRead();
    }
    
    // Abrir modal
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleRefresh = () => {
    refresh();
  };

  return (
    <>
      {/* Campanita */}
      <div className="relative">
        <motion.button
          onClick={handleBellClick}
          onMouseEnter={() => setShowTooltipState(true)}
          onMouseLeave={() => setShowTooltipState(false)}
          className={`relative p-2 rounded-full transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          {/* Icono de campanita */}
          <motion.svg
            className={`w-6 h-6 text-white ${loading ? 'opacity-50' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={hasNewNotifications ? { 
              rotate: [0, 10, -10, 10, -10, 0],
              transition: { duration: 0.6, repeat: Infinity, repeatDelay: 3 }
            } : {}}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </motion.svg>

          {/* Spinner de carga */}
          {loading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <svg
                className="w-4 h-4 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </motion.div>
          )}

          {/* Contador de notificaciones */}
          <AnimatePresence>
            {count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                  hasNewNotifications 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-orange-500'
                }`}
              >
                <motion.span
                  key={count}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="px-1"
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Punto de nueva notificación */}
          <AnimatePresence>
            {hasNewNotifications && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, opacity: [1, 0.5, 1] }}
                exit={{ scale: 0 }}
                transition={{ 
                  scale: { duration: 0.2 },
                  opacity: { duration: 1, repeat: Infinity }
                }}
                className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full border-2 border-white"
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && showTooltipState && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
            >
              <div className="flex flex-col items-center">
                <span className="font-medium">
                  {count > 0 ? `${count} notificación${count > 1 ? 'es' : ''}` : 'Sin notificaciones'}
                </span>
                {hasNewNotifications && (
                  <span className="text-red-300 text-xs">¡Nuevas!</span>
                )}
                {count > 0 && (
                  <span className="text-gray-300 text-xs mt-1">Click para ver detalles</span>
                )}
              </div>
              {/* Flecha del tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de notificaciones */}
      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        notifications={notifications}
        loading={loading}
        onRefresh={handleRefresh}
      />
    </>
  );
};