import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDateForDisplay = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }
  return format(date, 'dd MMM yyyy', { locale: id });
};

export const formatDateTimeForDisplay = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }
  return format(date, 'dd MMM yyyy, HH:mm', { locale: id });
};
