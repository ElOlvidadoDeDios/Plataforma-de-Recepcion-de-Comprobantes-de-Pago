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
  const INACTIVITY_TIME = 3 * 60 * 1000; // 3 minutos

  const performLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    SessionManager.removeItem('token');
    SessionManager.removeItem('user');
    window.location.href = '/login';
  }, [setIsAuthenticated, setUser]);

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
    if (!isMobileDevice() || !user) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIME);
  }, [handleLogout, user]);

  const activityEvents = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove', 'click', 'focus', 'keydown', 'mouseup', 'touchend'
  ];

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') resetInactivityTimer();
  };

  useEffect(() => {
    if (!isMobileDevice() || !user) return;

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
  }, [user, resetInactivityTimer]);

  const resetTimer = useCallback(() => {
    if (isMobileDevice() && user) resetInactivityTimer();
  }, [resetInactivityTimer, user]);

  return { resetTimer, isMobile: isMobileDevice(), isActive: !!timeoutRef.current };
};

export default useAutoLogout;
