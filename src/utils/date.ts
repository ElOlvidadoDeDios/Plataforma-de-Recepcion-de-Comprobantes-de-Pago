import { format } from 'date-fns';

export const formatDateTime = (date: string, time: string): string => {
  return format(new Date(`${date} ${time}`), 'PPpp');
};

export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};