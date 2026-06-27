/**
 * Validación de fechas para contratos digitales
 * REGLA: Solo se puede generar o validar contrato si OTORGA = HOY
 */

/**
 * Convierte fecha de formato DD/MM/YYYY a YYYY-MM-DD
 * @param dateStr - Fecha en formato DD/MM/YYYY
 * @returns Fecha en formato YYYY-MM-DD o null si no es válido
 */
const convertDDMMYYYYtoYYYYMMDD = (dateStr: string): string | null => {
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Compara si la fecha OTORGA es igual a hoy
 * @param otorgaDate - Fecha de otorga (formato: "2025-01-15", "2025-01-15 00:00:00", o "15/01/2025")
 * @returns true si OTORGA = HOY, false si no
 */
export const isOtorgaToday = (otorgaDate: string | null | undefined): boolean => {
  if (!otorgaDate) {
    return false;
  }

  try {
    let otorgaString: string;

    // Verificar si es formato DD/MM/YYYY
    if (otorgaDate.includes('/')) {
      const converted = convertDDMMYYYYtoYYYYMMDD(otorgaDate);
      if (!converted) {
        return false;
      }
      otorgaString = converted;
    } else {
      // Es formato YYYY-MM-DD o YYYY-MM-DD HH:mm:ss
      otorgaString = otorgaDate.substring(0, 10);
    }

    // Obtener fecha de hoy en formato YYYY-MM-DD USANDO FECHA LOCAL, NO UTC
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    // 🔍 DEBUG: Ver las fechas que se están comparando
    console.log('🔍 isOtorgaToday DEBUG:', {
      otorgaDate_original: otorgaDate,
      otorgaString: otorgaString,
      todayString: todayString,
      isEqual: otorgaString === todayString
    });

    // Comparar
    const isToday = otorgaString === todayString;
    return isToday;
  } catch (error) {
    console.error('❌ Error en isOtorgaToday:', error);
    return false;
  }
};

/**
 * Obtiene un mensaje de error legible para mostrar al usuario
 * @param otorgaDate - Fecha de otorga (formato: "2025-01-15", "2025-01-15 00:00:00", o "15/01/2025")
 * @returns Mensaje de error
 */
export const getOtorgaErrorMessage = (otorgaDate: string | null | undefined): string => {
  if (!otorgaDate) {
    return 'No se puede procesar sin fecha de otorga';
  }

  try {
    let year: number, month: number, day: number;

    // Verificar si es formato DD/MM/YYYY
    if (otorgaDate.includes('/')) {
      const match = otorgaDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      } else {
        return 'La fecha de otorga no coincide con hoy. Solo se puede procesar el contrato el día de otorga.';
      }
    } else {
      // Es formato YYYY-MM-DD o YYYY-MM-DD HH:mm:ss
      const dateString = otorgaDate.substring(0, 10);
      const parts = dateString.split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    }

    // ✅ CREAR FECHA EN HORA LOCAL (sin conversión UTC)
    const otorgaDate_obj = new Date(year, month - 1, day);
    const today = new Date();

    // 🔍 DEBUG: Ver las fechas en el mensaje de error
    console.log('🔍 getOtorgaErrorMessage DEBUG:', {
      otorgaDate_original: otorgaDate,
      otorga_parsed: { year, month, day },
      otorgaDate_obj: otorgaDate_obj.toISOString(),
      today: today.toISOString()
    });

    const otorgaFormatted = otorgaDate_obj.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const todayFormatted = today.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `La fecha de otorga es ${otorgaFormatted}, pero hoy es ${todayFormatted}. Solo se puede procesar el contrato el día de otorga.`;
  } catch (error) {
    console.error('❌ Error en getOtorgaErrorMessage:', error);
    return 'La fecha de otorga no coincide con hoy. Solo se puede procesar el contrato el día de otorga.';
  }
};
