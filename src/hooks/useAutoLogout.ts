import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';
import { SessionManager } from '../utils/sessionManager';

const isMobileDevice = (): boolean => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches)
  );
};

export const useAutoLogout = () => {
  const { user, setIsAuthenticated, setUser } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleCheckRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIME = 3 * 60 * 1000; // 3 minutos (solo móvil)
  const LOGOUT_HOUR = 20; // 8 PM (solo desktop)
  const LOGOUT_MINUTE = 0; // A las 8:00 PM exacto

  const performLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    SessionManager.removeItem('token');
    SessionManager.removeItem('user');
    SessionManager.removeItem('endpoint');
    window.location.href = '/login';
  }, [setIsAuthenticated, setUser]);

  // Calcular milisegundos hasta las 8 PM
  const getMillisecondsUntilLogout = useCallback((): number => {
    const now = new Date();
    const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    const logoutTime = new Date(peruTime);
    logoutTime.setHours(LOGOUT_HOUR, LOGOUT_MINUTE, 0, 0);

    // Si ya pasó las 8 PM hoy, programar para mañana
    if (peruTime >= logoutTime) {
      logoutTime.setDate(logoutTime.getDate() + 1);
    }

    return logoutTime.getTime() - peruTime.getTime();
  }, []);

  // Verificar si ya pasó la hora de cierre (solo desktop)
  const checkScheduledLogout = useCallback((): boolean => {
    if (!user || isMobileDevice()) return false;

    const now = new Date();
    const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const currentHour = peruTime.getHours();

    // Si ya pasó las 8 PM, cerrar inmediatamente
    if (currentHour >= LOGOUT_HOUR) {
      toast.error('🕐 La aplicación se cierra a las 8 PM', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#dc2626',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '350px',
          textAlign: 'center',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#dc2626',
        },
      });
      setTimeout(performLogout, 2000);
      return true;
    }
    return false;
  }, [performLogout, user]);

  // Programar cierre exacto (solo desktop)
  const scheduleExactLogout = useCallback(() => {
    if (!user || isMobileDevice()) return;

    // Si ya pasó las 8 PM, cerrar ahora
    if (checkScheduledLogout()) return;

    // Calcular tiempo exacto hasta las 8 PM
    const msUntilLogout = getMillisecondsUntilLogout();

    // Programar un solo timeout hasta las 8 PM exacto
    if (scheduleCheckRef.current) clearTimeout(scheduleCheckRef.current);
    
    scheduleCheckRef.current = setTimeout(() => {
      toast.error('🕐 La aplicación se cierra a las 8 PM', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#dc2626',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '350px',
          textAlign: 'center',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#dc2626',
        },
      });
      setTimeout(performLogout, 2000);
    }, msUntilLogout);
  }, [user, checkScheduledLogout, getMillisecondsUntilLogout, performLogout]);

  const handleLogout = useCallback(() => {
    toast.error('⏰ Sesión expirada por inactividad', {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '300px',
        textAlign: 'center',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
    setTimeout(performLogout, 2500);
  }, [performLogout]);

  const resetInactivityTimer = useCallback(() => {
    if (!isMobileDevice() || !user) {
      const token = SessionManager.getItem('token');
      if (!token) {
        performLogout();
        return;
      }
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIME);
  }, [handleLogout, user, performLogout]);

  const activityEvents = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove', 'click', 'focus', 'keydown', 'mouseup', 'touchend'
  ];

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (!isMobileDevice()) {
        // Verificar si ya pasó las 8 PM cuando vuelve a la pestaña
        checkScheduledLogout();
      } else {
        resetInactivityTimer();
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    // DESKTOP: Programar cierre exacto a las 8 PM
    if (!isMobileDevice()) {
      scheduleExactLogout();
      document.addEventListener('visibilitychange', handleVisibilityChange, true);

      return () => {
        if (scheduleCheckRef.current) clearTimeout(scheduleCheckRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      };
    }

    // MÓVIL: Timer de inactividad de 3 minutos
    resetInactivityTimer();
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange, true);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
    };
  }, [user, resetInactivityTimer, scheduleExactLogout]);

  const resetTimer = useCallback(() => {
    if (isMobileDevice() && user) resetInactivityTimer();
  }, [resetInactivityTimer, user]);

  return { resetTimer, isMobile: isMobileDevice(), isActive: !!timeoutRef.current };
};

export default useAutoLogout;