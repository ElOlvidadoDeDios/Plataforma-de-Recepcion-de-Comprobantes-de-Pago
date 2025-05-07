import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDateTime = (date: string, time: string): string => {
  return format(new Date(`${date} ${time}`), 'PPpp', { locale: es });
};

export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};