import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotificationDayManagement } from '../hooks/useNotificationDayManagement';

interface NotificationsContextType {
  initializeNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { initializeAfterLogin } = useNotificationDayManagement({
    autoFetch: false, // No hacer fetch automático aquí
    enablePolling: false // No habilitar polling inicialmente
  });
  
  const hasInitialized = useRef(false);
  const currentUserId = useRef<string | null>(null);

  const initializeNotifications = () => {
    if (user && isAuthenticated && user._id) {
      initializeAfterLogin();
      hasInitialized.current = true;
      currentUserId.current = user._id;
    }
  };

  // Efecto para inicializar notificaciones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      // Verificar si es un usuario diferente o si no se ha inicializado
      const isDifferentUser = currentUserId.current !== (user._id || null);
      
      if (!hasInitialized.current || isDifferentUser) {
        // Delay pequeño para asegurar que el usuario esté completamente inicializado
        const timer = setTimeout(() => {
          initializeNotifications();
        }, 1500); // 1.5 segundos para dar tiempo a que todo se configure

        return () => clearTimeout(timer);
      }
    } else {
      // Reset cuando el usuario se desautentica
      hasInitialized.current = false;
      currentUserId.current = null;
    }
  }, [isAuthenticated, user]);

  // Efecto adicional para detectar cambios en el usuario
  useEffect(() => {
    if (user && isAuthenticated && hasInitialized.current) {
      // Si el usuario cambió (diferente ID), reinicializar
      if (currentUserId.current && user._id && currentUserId.current !== user._id) {
        hasInitialized.current = false;
        initializeNotifications();
      }
    }
  }, [user?._id]);

  const contextValue: NotificationsContextType = {
    initializeNotifications
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};