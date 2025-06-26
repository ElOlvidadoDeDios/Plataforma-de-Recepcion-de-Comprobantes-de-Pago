// Funciones utilitarias separadas para evitar conflictos con HMR

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';

  // Verifica si la fecha viene en formato DD/MM/YYYY
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(dateRegex);

  if (match) {
    const [, day, month, year] = match;
    // Crear fecha con el formato correcto (mes es 0-based en JavaScript)
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    // Verificar que la fecha sea válida y que los componentes coincidan
    const isValid = date.getDate() === Number(day) &&
                   date.getMonth() === Number(month) - 1 &&
                   date.getFullYear() === Number(year);

    if (isValid) {
      // Mantener el formato original DD/MM/YYYY ya que es el estándar en Perú
      return dateString;
    }
  }

  return '-';
};

export const formatNumber = (number: string | number) => {
  if (!number) return '0.00';
  return Number(number).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};