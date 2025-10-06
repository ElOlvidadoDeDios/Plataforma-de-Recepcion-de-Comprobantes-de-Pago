import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificacionGestionDiaria } from '../api/notificacionesApi';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificacionGestionDiaria[];
  loading: boolean;
  onRefresh: () => void;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};


const getEstadoBadgeColor = (estado: string): string => {
  switch (estado.toUpperCase()) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getEstadoText = (estado: string): string => {
  switch (estado.toUpperCase()) {
    case 'PENDING':
      return 'Pendiente';
    case 'COMPLETED':
      return 'Completado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return estado;
  }
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  loading,
  onRefresh
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Notificaciones de Gestión</h2>
                      <p className="text-white/80 text-sm">
                        {notifications.length > 0 
                          ? `${notifications.length} notificación${notifications.length > 1 ? 'es' : ''} pendiente${notifications.length > 1 ? 's' : ''}`
                          : 'No hay notificaciones pendientes'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Botón de actualizar */}
                    <motion.button
                      onClick={onRefresh}
                      disabled={loading}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Actualizar notificaciones"
                    >
                      <svg 
                        className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </motion.button>

                    {/* Botón de cerrar */}
                    <motion.button
                      onClick={onClose}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
                {loading ? (
                  /* Loading state */
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-gray-600">Cargando notificaciones...</p>
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay notificaciones</h3>
                    <p className="text-gray-600 text-center">
                      No tienes notificaciones de gestión pendientes en este momento.
                    </p>
                  </div>
                ) : (
                  /* Notifications list */
                  <div className="p-6 space-y-4">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={`${notification.PAGARE}-${notification.DETALLE_GESTION.ID_DETALLE}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Información del préstamo */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                Pagaré: {notification.PAGARE}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoBadgeColor(notification.DETALLE_GESTION.ESTADO)}`}>
                                {getEstadoText(notification.DETALLE_GESTION.ESTADO)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Cuenta:</span>
                                <p className="text-gray-900">{notification.CUENTA}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Periodo:</span>
                                <p className="text-gray-900">{notification.PERIODO}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Otorgado:</span>
                                <p className="text-gray-900">{formatDate(notification.OTORGA)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Agencia:</span>
                                <p className="text-gray-900">{notification.DETALLE_GESTION.AGENCIA}</p>
                              </div>
                            </div>
                          </div>

                          {/* Detalles de gestión */}
                          <div className="space-y-3">
                            <h5 className="font-semibold text-gray-900">Detalles de Gestión</h5>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Responsable:</span>
                                <p className="text-gray-900">{notification.DETALLE_GESTION.RESPONSABLE}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-600">Motivo del retraso:</span>
                                <p className="text-gray-900 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                                  {notification.DETALLE_GESTION.MOTIVO_RETRASO}
                                </p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-600">Compromiso:</span>
                                <p className="text-gray-900 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                  {notification.DETALLE_GESTION.COMPROMISO}
                                </p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-600">Fecha de compromiso:</span>
                                <p className="text-gray-900 font-medium">
                                  {formatDate(notification.DETALLE_GESTION.FECHA_COMPROMISO)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};