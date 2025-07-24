// utils/formatUtils.ts - Currency & Formatting Utilities

// 💰 Currency Formatting
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// 📊 Percentage Formatting
export const formatPercentage = (decimal: number, decimals: number = 1): string => {
  if (isNaN(decimal) || decimal === null || decimal === undefined) {
    return '0%';
  }

  const percentage = decimal * 100;
  return `${percentage.toFixed(decimals)}%`;
};

// 🔢 Number Formatting
export const formatNumber = (num: number, decimals: number = 0): string => {
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// 📅 Date Formatting
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    time: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };

  return new Intl.DateTimeFormat('id-ID', options[format]).format(dateObj);
};

// 📝 Text Formatting
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const toTitleCase = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// 🎯 Promo Specific Formatting
export const formatPromoType = (type: string): string => {
  const promoTypes: Record<string, string> = {
    'discount_percent': 'Diskon Persentase',
    'discount_rp': 'Diskon Rupiah',
    'bogo': 'Beli 1 Gratis 1'
  };
  
  return promoTypes[type] || toTitleCase(type.replace('_', ' '));
};

export const formatPromoDetails = (type: string, details: any): string => {
  switch (type) {
    case 'discount_percent':
      return `${details.value}% diskon`;
    case 'discount_rp':
      return `Potongan ${formatCurrency(details.value)}`;
    case 'bogo':
      return `Beli ${details.buy} Gratis ${details.get}`;
    default:
      return 'Promo tidak dikenal';
  }
};

// 📏 Size Formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ⏱️ Duration Formatting
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

// 🔤 Input Formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  
  if (cleaned.length <= 4) {
    return cleaned;
  } else if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  } else {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  }
};

export const formatDecimal = (value: string, decimals: number = 2): string => {
  const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
  
  if (isNaN(numValue)) return '';
  
  return numValue.toFixed(decimals);
};

// 🎨 Color Formatting
export const formatMarginColor = (marginPercent: number): string => {
  if (marginPercent < 0) return 'text-red-600';
  if (marginPercent < 0.1) return 'text-orange-600';
  if (marginPercent < 0.2) return 'text-yellow-600';
  return 'text-green-600';
};

export const formatStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'active': 'text-green-600 bg-green-100',
    'inactive': 'text-gray-600 bg-gray-100',
    'pending': 'text-yellow-600 bg-yellow-100',
    'error': 'text-red-600 bg-red-100'
  };
  
  return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-100';
};

// 🔄 Parsing Utilities (reverse formatting)
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const parsePercentage = (percentageString: string): number => {
  const cleaned = percentageString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
};

// 🧮 Calculation Formatting
export const formatCalculationSummary = (
  originalPrice: number,
  effectivePrice: number,
  marginPercent: number
): string => {
  const savings = originalPrice - effectivePrice;
  const savingsPercent = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;
  
  return `Hemat ${formatCurrency(savings)} (${savingsPercent.toFixed(1)}%), margin ${formatPercentage(marginPercent)}`;
};

// 📊 Chart Data Formatting
export const formatChartValue = (value: number, type: 'currency' | 'percentage' | 'number'): string => {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return formatNumber(value);
    default:
      return value.toString();
  }
};

// 🔍 Search Highlighting
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// 📱 Responsive Text
export const getResponsiveText = (
  fullText: string,
  shortText: string,
  isMobile: boolean
): string => {
  return isMobile ? shortText : fullText;
};

// 🎯 Validation Formatting
export const formatValidationMessage = (field: string, rule: string, value?: any): string => {
  const messages: Record<string, string> = {
    required: `${field} wajib diisi`,
    minLength: `${field} minimal ${value} karakter`,
    maxLength: `${field} maksimal ${value} karakter`,
    min: `${field} minimal ${value}`,
    max: `${field} maksimal ${value}`,
    email: `${field} haru berupa email yang valid`,
    numeric: `${field} harus berupa angka`
  };
  
  return messages[rule] || `${field} tidak valid`;
};