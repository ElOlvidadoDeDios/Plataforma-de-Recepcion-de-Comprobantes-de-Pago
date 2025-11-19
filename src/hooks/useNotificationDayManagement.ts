import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotificacionesDayManagement,
  getNotificacionesCount,
  NotificacionGestionDiaria,
  NotificacionesResponse
} from '../api/notificacionesApi';
import { useAuth } from './useAuth';
import { AGENCIAS, UserResponse } from '../types';
import logger from '../utils/logger';

interface NotificationState {
  notifications: NotificacionGestionDiaria[];
  count: number;
  loading: boolean;
  error: string | null;
  hasNewNotifications: boolean;
}

interface UseNotificationDayManagementOptions {
  autoFetch?: boolean; // Fetch automáticamente al montar el componente
  interval?: number; // Intervalo para polling (en milisegundos)
  enablePolling?: boolean; // Habilitar polling periódico
}

export const useNotificationDayManagement = (options: UseNotificationDayManagementOptions = {}) => {
  const {
    autoFetch = true,
    interval = 5 * 60 * 1000, // 5 minutos por defecto
    enablePolling = false
  } = options;

  const { user } = useAuth() as { user: UserResponse | null };
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    count: 0,
    loading: false,
    error: null,
    hasNewNotifications: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const previousCountRef = useRef<number>(0);

  // Obtener datos del usuario para las notificaciones
  const getUserData = useCallback((): { responsable: string; agencia: string } => {
    if (!user) {
      return { responsable: '', agencia: '' };
    }
    
    // Obtener RESPONSABLE del campo razon (limpiar comas)
    const responsable = user.razon ? user.razon.replace(/,/g, '').trim() : '';
    
    // Convertir id_age a nombre de agencia usando el mapeo AGENCIAS
    let agencia = '';
    if (user.id_age) {
      const agenciaName = Object.keys(AGENCIAS).find(
        name => AGENCIAS[name as keyof typeof AGENCIAS] === user.id_age
      );
      agencia = agenciaName || '';
    }
    
    return { responsable, agencia };
  }, [user]);

  // Función para cargar notificaciones
  const fetchNotifications = useCallback(async (showLoading = true): Promise<NotificacionesResponse> => {
    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const { responsable, agencia } = getUserData();
      const response = await fetchNotificacionesDayManagement(responsable, agencia);
      
      const newCount = response.data ? response.data.length : 0;
      const hasNew = newCount > previousCountRef.current && previousCountRef.current > 0;
      
      setState(prev => ({
        ...prev,
        notifications: response.data || [],
        count: newCount,
        loading: false,
        error: null,
        hasNewNotifications: hasNew
      }));

      previousCountRef.current = newCount;
      lastFetchRef.current = Date.now();

      if (import.meta.env.DEV) {
        // logger.log('🔔 Notificaciones actualizadas:', {
        //   count: newCount,
        //   hasNew,
        //   timestamp: new Date().toISOString()
        // });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar notificaciones';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      logger.error('Error al cargar notificaciones:', error);
      
      // Retornar respuesta de error
      return {
        status: false,
        message: errorMessage
      };
    }
  }, [getUserData]);

  // Función para obtener solo el conteo (más eficiente)
  const fetchNotificationsCount = useCallback(async (): Promise<number> => {
    try {
      const { responsable, agencia } = getUserData();
      const count = await getNotificacionesCount(responsable, agencia);
      
      const hasNew = count > previousCountRef.current && previousCountRef.current > 0;
      
      setState(prev => ({
        ...prev,
        count,
        hasNewNotifications: hasNew,
        error: null
      }));

      previousCountRef.current = count;
      lastFetchRef.current = Date.now();

      return count;
    } catch (error) {
      logger.error('Error al obtener conteo de notificaciones:', error);
      return 0;
    }
  }, [getUserData]);

  // Función para marcar como leídas (resetear hasNewNotifications)
  const markAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewNotifications: false
    }));
  }, []);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    return fetchNotifications(true);
  }, [fetchNotifications]);

  // Inicializar polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // Solo hacer polling si el usuario está activo y la pestaña visible
      if (document.visibilityState === 'visible') {
        fetchNotificationsCount();
      }
    }, interval);
  }, [interval, fetchNotificationsCount]);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Efecto para cargar notificaciones iniciales
  useEffect(() => {
    if (autoFetch && user) {
      fetchNotifications();
    }
  }, [autoFetch, user, fetchNotifications]);

  // Efecto para manejar polling
  useEffect(() => {
    if (enablePolling && user) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enablePolling, user, startPolling, stopPolling]);

  // Efecto para manejar cambios de visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Si la página vuelve a ser visible, refrescar si han pasado más de 2 minutos
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch > 2 * 60 * 1000) { // 2 minutos
          fetchNotificationsCount();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchNotificationsCount]);

  // Función para llamar después del login
  const initializeAfterLogin = useCallback(() => {
    // Resetear estado anterior
    setState({
      notifications: [],
      count: 0,
      loading: false,
      error: null,
      hasNewNotifications: false
    });
    
    // Resetear contadores
    previousCountRef.current = 0;
    lastFetchRef.current = 0;
    
    // Cargar notificaciones
    setTimeout(() => {
      if (user) {
        fetchNotifications();
      }
    }, 1000); // Delay de 1 segundo para asegurar que el usuario esté completamente inicializado
  }, [user, fetchNotifications]);

  return {
    // Estado
    notifications: state.notifications,
    count: state.count,
    loading: state.loading,
    error: state.error,
    hasNewNotifications: state.hasNewNotifications,
    
    // Acciones
    fetchNotifications,
    fetchNotificationsCount,
    refresh,
    markAsRead,
    startPolling,
    stopPolling,
    initializeAfterLogin,
    
    // Metadata
    lastFetch: lastFetchRef.current,
    isPolling: intervalRef.current !== null
  };
};