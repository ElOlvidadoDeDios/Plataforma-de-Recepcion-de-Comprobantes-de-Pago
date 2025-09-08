import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { SessionManager } from '../utils/sessionManager';

// Detectar si es dispositivo móvil
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768); // También incluir pantallas pequeñas
};

// Hook para auto logout en dispositivos móviles
export const useAutoLogout = () => {
  const { user, setIsAuthenticated, setUser } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIME =  3*60 * 1000; // 3 minutos en milisegundos

  // Función para cerrar sesión manualmente
  const performLogout = useCallback(() => {
    // Limpiar sesión
    setIsAuthenticated(false);
    setUser(null);
    SessionManager.removeItem('token');
    SessionManager.removeItem('user');
    
    // Redirigir al login
    window.location.href = '/login';
  }, [setIsAuthenticated, setUser]);

  // Función para cerrar sesión
  const handleLogout = useCallback(() => {
    // Mostrar alerta informativa
    alert('⏰ SESIÓN EXPIRADA\n\nTu sesión se cerró automáticamente por inactividad de 5 minutos.\n\nPor favor, inicia sesión nuevamente.');
    
    // Realizar logout
    performLogout();
  }, [performLogout]);

  // Resetear el timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    // Solo ejecutar en dispositivos móviles y si hay usuario logueado
    if (!isMobileDevice() || !user) return;

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIME);
  }, [handleLogout, user]);

  // Eventos que indican actividad del usuario
  const activityEvents = [
    'mousedown',    // Clics
    'mousemove',    // Movimiento del mouse
    'keypress',     // Teclas
    'scroll',       // Scroll
    'touchstart',   // Touch en móvil
    'touchmove',    // Deslizar en móvil
    'click',        // Clics adicionales
    'focus',        // Cambio de foco
    'visibilitychange' // Cambio de pestaña/app
  ];

  useEffect(() => {
    // Solo activar en dispositivos móviles
    if (!isMobileDevice()) {
      return;
    }

    // Solo activar si hay usuario logueado
    if (!user) {
      return;
    }
    // Inicializar timer
    resetInactivityTimer();

    // Agregar event listeners para detectar actividad
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, resetInactivityTimer]);

  // Función manual para resetear (útil para APIs o acciones específicas)
  const resetTimer = useCallback(() => {
    if (isMobileDevice() && user) {
      resetInactivityTimer();
    }
  }, [resetInactivityTimer, user]);

  return {
    resetTimer,
    isMobile: isMobileDevice(),
    isActive: !!timeoutRef.current
  };
};

export default useAutoLogout;