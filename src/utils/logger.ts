// Utilidad para controlar los logs en la aplicación
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Los errores siempre se muestran, incluso en producción
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  // Función para logs que queremos ver siempre (errores críticos)
  critical: (...args: any[]) => {
    console.error('🚨 CRITICAL:', ...args);
  },
  // Función silenciosa para desarrollo que no hace nada en producción
  dev: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🔧 DEV:', ...args);
    }
  }
};

export default logger;