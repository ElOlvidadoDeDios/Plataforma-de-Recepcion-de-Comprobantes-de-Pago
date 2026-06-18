/**
 * Validación de fechas para contratos digitales
 * REGLA: Solo se puede generar o validar contrato si OTORGA = HOY
 */

/**
 * Compara si la fecha OTORGA es igual a hoy
 * @param otorgaDate - Fecha de otorga (formato: "2025-01-15" o "2025-01-15 00:00:00")
 * @returns true si OTORGA = HOY, false si no
 */
export const isOtorgaToday = (otorgaDate: string | null | undefined): boolean => {
  if (!otorgaDate) {
    return false;
  }

  try {
    // Obtener fecha de hoy en formato YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Extraer la fecha de OTORGA (primeros 10 caracteres: YYYY-MM-DD)
    const otorgaString = otorgaDate.substring(0, 10);

    // Comparar
    const isToday = otorgaString === todayString;

    console.log('📅 Validación de fecha OTORGA:', {
      otorgaDate: otorgaDate,
      otorgaString: otorgaString,
      todayString: todayString,
      isToday: isToday,
      result: isToday ? '✅ OTORGA = HOY' : '❌ OTORGA ≠ HOY'
    });

    return isToday;
  } catch (error) {
    console.error('Error al validar fecha OTORGA:', error);
    return false;
  }
};

/**
 * Obtiene un mensaje de error legible para mostrar al usuario
 * @param otorgaDate - Fecha de otorga
 * @returns Mensaje de error
 */
export const getOtorgaErrorMessage = (otorgaDate: string | null | undefined): string => {
  if (!otorgaDate) {
    return 'No se puede procesar sin fecha de otorga';
  }

  try {
    const otorgaDate_obj = new Date(otorgaDate);
    const today = new Date();

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
    return 'La fecha de otorga no coincide con hoy. Solo se puede procesar el contrato el día de otorga.';
  }
};
