// src/utils/dateUtils.ts
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDateForDisplay = (date: Date | null | undefined): string => {
  // BARU: Tambahkan pemeriksaan eksplisit instanceof Date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }
  return format(date, 'dd MMM yyyy', { locale: id });
};

export const formatDateTimeForDisplay = (date: Date | null | undefined): string => {
  // BARU: Tambahkan pemeriksaan eksplisit instanceof Date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }
  return format(date, 'dd MMM yyyy, HH:mm', { locale: id });
};
