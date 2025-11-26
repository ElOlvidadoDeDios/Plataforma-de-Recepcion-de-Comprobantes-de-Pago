// Utilidad para capturar información del dispositivo
export interface DeviceInfo {
  action: string;
  ip_address: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  user_agent: string;
  screen_width: number;
  screen_height: number;
  timezone: string;
  created_at: string;
}

// Función para obtener la IP pública del usuario
async function getPublicIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error obteniendo IP pública:', error);
    // Fallback a otros servicios
    try {
      const response = await fetch('https://httpbin.org/ip');
      const data = await response.json();
      return data.origin.split(',')[0].trim();
    } catch (fallbackError) {
      console.error('Error en fallback de IP:', fallbackError);
      return 'IP no disponible';
    }
  }
}

// Función para detectar el tipo de dispositivo
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detectar móvil
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }
  
  // Detectar tablet
  const tabletRegex = /ipad|android(?!.*mobile)|tablet|kindle/i;
  if (tabletRegex.test(userAgent) || 
      (userAgent.includes('android') && !userAgent.includes('mobile'))) {
    return 'tablet';
  }
  
  // Por defecto es desktop
  return 'desktop';
}

// Función para detectar el sistema operativo
function getOperatingSystem(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
  if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
  if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
  if (userAgent.includes('Windows NT')) return 'Windows';
  if (userAgent.includes('Mac OS X')) {
    const version = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    return version ? `macOS ${version[1].replace(/_/g, '.')}` : 'macOS';
  }
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) {
    const version = userAgent.match(/Android (\d+(?:\.\d+)*)/);
    return version ? `Android ${version[1]}` : 'Android';
  }
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const version = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
    return version ? `iOS ${version[1].replace(/_/g, '.')}` : 'iOS';
  }
  
  return 'Sistema Operativo Desconocido';
}

// Función para detectar el navegador
function getBrowser(): string {
  const userAgent = navigator.userAgent;
  
  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR')) {
    const version = userAgent.match(/Chrome\/(\d+)/);
    return version ? `Chrome ${version[1]}` : 'Chrome';
  }
  
  // Firefox
  if (userAgent.includes('Firefox')) {
    const version = userAgent.match(/Firefox\/(\d+)/);
    return version ? `Firefox ${version[1]}` : 'Firefox';
  }
  
  // Safari
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const version = userAgent.match(/Version\/(\d+)/);
    return version ? `Safari ${version[1]}` : 'Safari';
  }
  
  // Edge
  if (userAgent.includes('Edg')) {
    const version = userAgent.match(/Edg\/(\d+)/);
    return version ? `Edge ${version[1]}` : 'Edge';
  }
  
  // Opera
  if (userAgent.includes('OPR')) {
    const version = userAgent.match(/OPR\/(\d+)/);
    return version ? `Opera ${version[1]}` : 'Opera';
  }
  
  // Internet Explorer
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    const version = userAgent.match(/(?:MSIE |rv:)(\d+)/);
    return version ? `Internet Explorer ${version[1]}` : 'Internet Explorer';
  }
  
  return 'Navegador Desconocido';
}

// Función para obtener la resolución de pantalla
function getScreenResolution(): { width: number; height: number } {
  return {
    width: screen.width,
    height: screen.height
  };
}

// Función para obtener la zona horaria del usuario
function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback para navegadores antiguos
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// Función para formatear la fecha actual
function getCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Función principal para capturar toda la información del dispositivo
export async function captureDeviceInfo(action: string = 'pago_aceptado'): Promise<DeviceInfo> {
  const screenResolution = getScreenResolution();
  
  const deviceInfo: DeviceInfo = {
    action,
    ip_address: await getPublicIP(),
    device_type: getDeviceType(),
    os: getOperatingSystem(),
    browser: getBrowser(),
    user_agent: navigator.userAgent,
    screen_width: screenResolution.width,
    screen_height: screenResolution.height,
    timezone: getTimezone(),
    created_at: getCurrentDateTime()
  };
  
  return deviceInfo;
}

// Función para capturar información del dispositivo e imprimirla en consola
export async function logDeviceInfo(action: string = 'pago_aceptado'): Promise<DeviceInfo> {
  
  const deviceInfo = await captureDeviceInfo(action);
  
  return deviceInfo;
}

// Función específica para verificación de documentos firmados
export async function logDocumentVerificationInfo(
  creditoId: string, 
  documentId: string | null = null
): Promise<DeviceInfo> {
  const action = `verificacion_documento_${creditoId}`;
  
  if (documentId) {

  }
  
  const deviceInfo = await logDeviceInfo(action);
  
  
  return deviceInfo;
}

// Función específica para generación de contratos
export async function logContractGenerationInfo(creditoId: string): Promise<DeviceInfo> {
  const action = `generacion_contrato_${creditoId}`;

  
  const deviceInfo = await logDeviceInfo(action);
  
  return deviceInfo;
}