import { 
    parseISO, 
    format, 
    isValid, 
    startOfDay, 
    endOfDay,
    subDays,
    startOfMonth,
    endOfMonth,
    subMonths
} from 'date-fns';
import { id } from 'date-fns/locale';

// Definisikan tipe DateRange di sini agar bisa digunakan di seluruh aplikasi
export interface DateRange {
  from: Date | string;
  to?: Date | string;
}

/**
 * Mem-parsing nilai tanggal (string, Date, number) menjadi objek Date yang valid atau null.
 * Ini adalah fungsi dasar yang digunakan oleh helper lain.
 * @param date Nilai tanggal yang akan di-parse.
 * @returns Objek Date atau null jika tidak valid.
 */
export const safeParseDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    if (date instanceof Date && isValid(date)) {
      return date;
    }
    if (typeof date === 'string' || typeof date === 'number') {
      // parseISO lebih baik untuk string ISO, new Date() untuk format lain
      const parsed = (typeof date === 'string' && date.includes('T')) ? parseISO(date) : new Date(date);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  } catch (error) {
    console.warn('Date parsing error:', error, 'for date:', date);
    return null;
  }
};

/**
 * Memeriksa apakah nilai yang diberikan adalah objek Date yang valid.
 * @param value Nilai yang akan diperiksa.
 * @returns `true` jika valid, `false` jika tidak.
 */
export const isValidDate = (value: any): value is Date => {
  const date = safeParseDate(value);
  return date !== null && isValid(date);
};

/**
 * Mengonversi nilai tanggal menjadi string YYYY-MM-DD yang aman untuk database.
 * @param dateValue Nilai tanggal yang akan dikonversi.
 * @returns String 'YYYY-MM-DD' atau null jika tidak valid.
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  const dateObj = safeParseDate(dateValue);
  return dateObj ? format(dateObj, 'yyyy-MM-dd') : null;
};

/**
 * Memformat objek Date menjadi string yang mudah dibaca untuk tampilan UI.
 * @param date Objek Date yang akan diformat.
 * @returns String tanggal yang diformat (misal: "24 Jul 2025") atau '-' jika tidak valid.
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '-';
  return format(dateObj, 'd MMM yyyy', { locale: id });
};

/**
 * Memformat objek Date menjadi string "yyyy-MM-dd" untuk nilai input tanggal HTML.
 * @param date Objek Date atau string yang akan diformat.
 * @returns String format "yyyy-MM-dd" atau string kosong jika tidak valid.
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '';
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Memformat rentang tanggal menjadi string yang mudah dibaca.
 * @param dateRange Objek DateRange.
 * @returns String rentang tanggal yang diformat.
 */
export const formatDateRange = (dateRange: DateRange | undefined): string => {
  if (!dateRange?.from) return "Pilih rentang tanggal";
  
  const fromDate = safeParseDate(dateRange.from);
  if (!fromDate) return "Tanggal mulai tidak valid";
  
  const toDate = safeParseDate(dateRange.to);

  if (toDate && format(fromDate, 'yyyy-MM-dd') !== format(toDate, 'yyyy-MM-dd')) {
    return `${format(fromDate, "d MMM", { locale: id })} - ${format(toDate, "d MMM yyyy", { locale: id })}`;
  }
  
  return format(fromDate, "d MMMM yyyy", { locale: id });
};

/**
 * Mendapatkan deskripsi waktu relatif (misal: "Hari ini", "Kemarin").
 * @param date Tanggal untuk dibandingkan.
 * @returns String deskripsi waktu relatif.
 */
export const getRelativeTimeDescription = (date: Date | string | null | undefined): string => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return 'Tanggal tidak valid';
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (format(now, 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Hari ini';
  if (format(subDays(now, 1), 'yyyy-MM-dd') === format(parsedDate, 'yyyy-MM-dd')) return 'Kemarin';

  if (diffDays > 1 && diffDays <= 30) return `${diffDays} hari yang lalu`;
  
  return formatDateForDisplay(parsedDate);
};


/**
 * Menghasilkan objek DateRange berdasarkan preset yang dipilih.
 * @param key Kunci preset ('today', 'yesterday', 'last7days', dll.).
 * @returns Objek DateRange yang sesuai.
 */
export const getDateRangePreset = (key: string): { from: Date, to: Date } => {
  const today = new Date();
  try {
    switch (key) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'last7days':
        return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
      case 'last30days':
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      default:
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    }
  } catch (error) {
    console.error('Error creating date range preset:', error, 'for key:', key);
    return { from: startOfDay(today), to: endOfDay(today) }; // Fallback
  }
};

/**
 * Memeriksa apakah sebuah tanggal berada dalam rentang tertentu.
 * @param date Tanggal target.
 * @param startDate Tanggal mulai rentang.
 * @param endDate Tanggal akhir rentang.
 * @returns `true` jika tanggal berada dalam rentang.
 */
export const isDateInRange = (
  date: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  const targetDate = safeParseDate(date);
  const rangeStart = safeParseDate(startDate);
  const rangeEnd = safeParseDate(endDate);
  
  if (!targetDate || !rangeStart || !rangeEnd) return false;
  
  return targetDate >= rangeStart && targetDate <= rangeEnd;
};

/**
 * Menghitung jumlah hari antara dua tanggal.
 * @param startDate Tanggal mulai.
 * @param endDate Tanggal akhir.
 * @returns Jumlah hari.
 */
export const getDaysBetween = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number => {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Mendapatkan awal hari dari objek Date.
 * @param dateObj Objek Date.
 * @returns Objek Date di awal hari (00:00:00) atau null jika tidak valid.
 */
export const getStartOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  const parsed = safeParseDate(dateObj);
  return parsed ? startOfDay(parsed) : null;
};

/**
 * Mendapatkan akhir hari dari objek Date.
 * @param dateObj Objek Date.
 * @returns Objek Date di akhir hari (23:59:59.999) atau null jika tidak valid.
 */
export const getEndOfDay = (dateObj: Date | string | null | undefined): Date | null => {
  const parsed = safeParseDate(dateObj);
  return parsed ? endOfDay(parsed) : null;
};
