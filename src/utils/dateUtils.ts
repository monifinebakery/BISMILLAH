// src/utils/dateUtils.ts
import { parseISO, format, isValid, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale'; // Untuk format tanggal Indonesia jika diperlukan

/**
 * Mengonversi objek Date menjadi string YYYY-MM-DD (tanggal saja).
 * Ini mengabaikan komponen waktu dan zona waktu untuk konsistensi database.
 * @param dateValue The date value to convert.
 * @returns A 'YYYY-MM-DD' string (e.g., "2025-07-20") or null.
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  if (!dateValue) return null;

  let dateObj: Date;
  if (dateValue instanceof Date) {
    dateObj = dateValue;
  } else if (typeof dateValue === 'string') {
    dateObj = parseISO(dateValue); // Gunakan parseISO untuk string
  } else {
    return null;
  }

  if (!isValid(dateObj)) { // Gunakan isValid dari date-fns
    return null;
  }
  // Format ke YYYY-MM-DD. Ini akan menghasilkan tanggal lokal tanpa waktu.
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Parses a date value (Date object, string, or null/undefined) into a valid Date object or null.
 * Menginterpretasikan string YYYY-MM-DD menjadi objek Date lokal di awal hari.
 * @param dateValue The date value to parse.
 * @returns A Date object (start of day in local timezone) if valid, otherwise null.
 */
export const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    return isValid(dateValue) ? startOfDay(dateValue) : null; // Pastikan start of day
  } else if (typeof dateValue === 'string') {
    const parsedDate = parseISO(dateValue); // parseISO bisa mengurai YYYY-MM-DD atau ISO string lengkap
    return isValid(parsedDate) ? startOfDay(parsedDate) : null; // Pastikan start of day
  } else {
    return null;
  }
};


/**
 * Formats a Date object into a readable date string (without time) for display.
 * @param date - The Date object to format. Can be null or undefined.
 * @returns A formatted date string (e.g., "20 Jul 2025") or 'N/A' if the date is invalid.
 */
export const formatDateForDisplay = (date: Date | null | undefined): string => {
  if (!date || !isValid(date)) { // Gunakan isValid
    return 'N/A';
  }
  return format(date, 'dd MMM yyyy', { locale: id }); // Menggunakan 'MMM' untuk Jul
};

/**
 * Formats a Date object into a "yyyy-MM-dd" string required by <input type="date">.
 * @param date - The Date object or string to format. Can be null or undefined.
 * @returns A string in "yyyy-MM-dd" format (e.g., "2025-07-20") or an empty string if the date is invalid/null.
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '';
  }
  let dateObj: Date | null;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = null;
  }
  
  if (!dateObj || !isValid(dateObj)) {
    return '';
  }
  // Pastikan ini juga menghasilkan YYYY-MM-DD lokal
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Mendapatkan awal hari dari objek Date. Berguna untuk filter rentang.
 * @param dateObj Objek Date.
 * @returns Objek Date di awal hari (00:00:00) atau null jika tidak valid.
 */
export const getStartOfDay = (dateObj: Date | null | undefined): Date | null => {
  if (!dateObj || !isValid(dateObj)) {
    return null;
  }
  return startOfDay(dateObj);
};

/**
 * Mendapatkan akhir hari dari objek Date. Berguna untuk filter rentang.
 * @param dateObj Objek Date.
 * @returns Objek Date di akhir hari (23:59:59.999) atau null jika tidak valid.
 */
export const getEndOfDay = (dateObj: Date | null | undefined): Date | null => {
  if (!dateObj || !isValid(dateObj)) {
    return null;
  }
  return endOfDay(dateObj);
};