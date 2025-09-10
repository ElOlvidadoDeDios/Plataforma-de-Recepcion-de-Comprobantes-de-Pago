import toast from 'react-hot-toast';

// Hook personalizado para notificaciones profesionales
export const useNotifications = () => {
  // Notificación de éxito
  const success = (message: string, options?: {
    duration?: number;
    icon?: string;
  }) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      icon: options?.icon || '✅',
      style: {
        background: '#10B981',
        color: 'white',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  // Notificación de error
  const error = (message: string, options?: {
    duration?: number;
    icon?: string;
  }) => {
    return toast.error(message, {
      duration: options?.duration || 6000,
      icon: options?.icon || '❌',
      style: {
        background: '#EF4444',
        color: 'white',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  // Notificación de advertencia
  const warning = (message: string, options?: {
    duration?: number;
    icon?: string;
  }) => {
    return toast(message, {
      duration: options?.duration || 5000,
      icon: options?.icon || '⚠️',
      style: {
        background: '#F59E0B',
        color: 'white',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  // Notificación informativa
  const info = (message: string, options?: {
    duration?: number;
    icon?: string;
  }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      icon: options?.icon || 'ℹ️',
      style: {
        background: '#3B82F6',
        color: 'white',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  // Notificación de carga
  const loading = (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#6B7280',
        color: 'white',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  // Promesa con toast automático
  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      success: {
        style: {
          background: '#10B981',
          color: 'white',
        },
        icon: '✅',
      },
      error: {
        style: {
          background: '#EF4444',
          color: 'white',
        },
        icon: '❌',
      },
      loading: {
        style: {
          background: '#6B7280',
          color: 'white',
        },
      },
    });
  };

  // Notificación personalizada para validaciones
  const validation = (title: string, errors: string[]) => {
    const message = `${title}\n\n• ${errors.join('\n• ')}`;
    return toast.error(message, {
      duration: 8000,
      icon: '📋',
      style: {
        background: '#EF4444',
        color: 'white',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        whiteSpace: 'pre-line',
        maxWidth: '400px',
      },
    });
  };

  // Descartar toast específico
  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  // Descartar todos los toasts
  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    validation,
    dismiss,
    dismissAll,
  };
};