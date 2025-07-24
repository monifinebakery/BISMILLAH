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
  from: Date;
  to?: Date;
}

/**
 * Memeriksa apakah nilai yang diberikan adalah objek Date yang valid.
 * @param value Nilai yang akan diperiksa.
 * @returns `true` jika valid, `false` jika tidak.
 */
export const isValidDate = (value: any): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Mengonversi nilai tanggal menjadi string YYYY-MM-DD yang aman untuk database.
 * Mengabaikan waktu dan zona waktu untuk konsistensi.
 * @param dateValue Nilai tanggal yang akan dikonversi.
 * @returns String 'YYYY-MM-DD' atau null jika tidak valid.
 */
export const toSafeISOString = (dateValue: Date | string | null | undefined): string | null => {
  if (!dateValue) return null;
  const dateObj = dateValue instanceof Date ? dateValue : parseISO(dateValue);
  return isValid(dateObj) ? format(dateObj, 'yyyy-MM-dd') : null;
};

/**
 * Mem-parsing nilai tanggal (string atau Date) menjadi objek Date yang valid atau null.
 * Menginterpretasikan string sebagai tanggal lokal di awal hari.
 * @param dateValue Nilai tanggal yang akan di-parse.
 * @returns Objek Date (awal hari) atau null jika tidak valid.
 */
export const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  const dateObj = dateValue instanceof Date ? dateValue : parseISO(dateValue);
  return isValid(dateObj) ? startOfDay(dateObj) : null;
};

/**
 * Memformat objek Date menjadi string yang mudah dibaca untuk tampilan UI.
 * @param date Objek Date yang akan diformat.
 * @returns String tanggal yang diformat (misal: "24 Jul 2025") atau 'N/A' jika tidak valid.
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const dateObj = safeParseDate(date);
  if (!dateObj) return 'N/A';
  return format(dateObj, 'dd MMM yyyy', { locale: id });
};

/**
 * Memformat objek Date menjadi string "yyyy-MM-dd" untuk nilai input tanggal HTML.
 * @param date Objek Date atau string yang akan diformat.
 * @returns String format "yyyy-MM-dd" atau string kosong jika tidak valid.
 */
export const formatDateToYYYYMMDD = (date: Date | string | null | undefined): string => {
  if (!date) return '';
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
  if (!dateRange?.from || !isValid(dateRange.from)) return "Pilih rentang tanggal";
  
  const fromFormatted = format(dateRange.from, "d MMM yyyy", { locale: id });

  if (dateRange.to && isValid(dateRange.to) && format(dateRange.from, 'yyyy-MM-dd') !== format(dateRange.to, 'yyyy-MM-dd')) {
    const toFormatted = format(dateRange.to, "d MMM yyyy", { locale: id });
    return `${fromFormatted} - ${toFormatted}`;
  }
  
  return format(dateRange.from, "d MMMM yyyy", { locale: id });
};

/**
 * Menghasilkan objek DateRange berdasarkan preset yang dipilih (misal: 'hari ini', 'bulan lalu').
 * @param key Kunci preset ('today', 'yesterday', 'last7days', dll.).
 * @returns Objek DateRange yang sesuai.
 */
export const getDateRangePreset = (key: string): DateRange => {
  const today = new Date();
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
      // Default ke 30 hari terakhir jika key tidak dikenal
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
  }
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
