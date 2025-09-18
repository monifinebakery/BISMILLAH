// src/utils/formatters.ts

/**
 * Format angka menjadi format mata uang Rupiah
 * @param amount - Jumlah yang akan diformat
 * @param options - Opsi formatting tambahan
 * @returns String dengan format mata uang
 */
export const formatCurrency = (
  amount: number,
  options: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    locale = 'id-ID',
    currency = 'IDR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

/**
 * Format angka menjadi format mata uang sederhana (tanpa simbol)
 * @param amount - Jumlah yang akan diformat
 * @returns String dengan format angka yang dipisahkan koma
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};

/**
 * Format persentase
 * @param value - Nilai decimal (0.1 = 10%)
 * @param decimals - Jumlah desimal yang ditampilkan
 * @returns String dengan format persentase
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format angka dengan satuan yang sesuai (K, M, B)
 * @param num - Angka yang akan diformat
 * @returns String dengan format yang disingkat
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + ' miliar';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + ' jt';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + ' rb';
  }
  return num.toString();
};

/**
 * Format tanggal ke format Indonesia
 * @param date - Tanggal yang akan diformat
 * @param options - Opsi formatting
 * @returns String dengan format tanggal Indonesia
 */
export const formatDate = (
  date: Date | string,
  options: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    includeTime?: boolean;
  } = {}
): string => {
  const { dateStyle = 'medium', timeStyle = 'short', includeTime = false } = options;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle
  };
  
  if (includeTime) {
    formatOptions.timeStyle = timeStyle;
  }
  
  return new Intl.DateTimeFormat('id-ID', formatOptions).format(dateObj);
};

/**
 * Format durasi dalam milidetik ke format yang mudah dibaca
 * @param ms - Durasi dalam milidetik
 * @returns String dengan format durasi
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Format ukuran file ke format yang mudah dibaca
 * @param bytes - Ukuran dalam bytes
 * @returns String dengan format ukuran file
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text dengan ellipsis
 * @param text - Text yang akan dipotong
 * @param maxLength - Panjang maksimum
 * @returns String yang sudah dipotong
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Format nomor telepon Indonesia
 * @param phone - Nomor telepon
 * @returns String dengan format nomor telepon yang rapi
 */
export const formatPhoneNumber = (phone: string): string => {
  // Hapus semua karakter non-digit
  const cleaned = phone.replace(/\D/g, '');
  
  // Format untuk nomor Indonesia
  if (cleaned.startsWith('62')) {
    // Format: +62 xxx-xxxx-xxxx
    const match = cleaned.match(/^(62)(\d{3})(\d{4})(\d{4})$/);
    if (match) {
      return `+${match[1]} ${match[2]}-${match[3]}-${match[4]}`;
    }
  } else if (cleaned.startsWith('0')) {
    // Format: 0xxx-xxxx-xxxx
    const match = cleaned.match(/^(0\d{3})(\d{4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  
  return phone; // Return original jika tidak cocok format
};