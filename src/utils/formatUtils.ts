// src/components/orders/utils/formatUtils.ts
// COMPLETE FORMAT UTILITIES - All Required Functions

// ==================== CURRENCY FORMATTING ====================

/**
 * Memformat angka menjadi mata uang Rupiah (misal: 15000 -> "Rp 15.000").
 * @param value Angka yang akan diformat.
 * @returns String dalam format mata uang Rupiah.
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Rp 0'; // Menangani input yang tidak valid
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Memformat angka menjadi persentase (misal: 0.25 -> "25,0%")
 * @param value - Angka desimal (rasio) yang akan diformat.
 * @returns String persentase yang sudah diformat.
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0,0%'; // Nilai default jika input tidak valid
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatNumber = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Memformat tanggal untuk tampilan
 * @param date - Date object atau string
 * @returns String tanggal yang diformat
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '-';
  }
};

// ==================== TEXT FORMATTING ====================

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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

// ==================== BUSINESS-SPECIFIC FORMATTING ====================

export const formatPromoType = (type: string): string => {
  const promoTypeMap: Record<string, string> = {
    'percentage': 'Persentase',
    'fixed_amount': 'Nominal Tetap',
    'buy_x_get_y': 'Beli X Dapat Y',
    'free_shipping': 'Gratis Ongkir',
    'bundle': 'Paket Bundle'
  };
  return promoTypeMap[type] || toTitleCase(type);
};

export const formatPromoDetails = (promo: {
  type: string;
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
}): string => {
  const { type, value = 0, minPurchase, maxDiscount } = promo;
  
  let details = '';
  
  switch (type) {
    case 'percentage':
      details = `Diskon ${formatPercentage(value / 100)}`;
      if (maxDiscount) details += ` (maks ${formatCurrency(maxDiscount)})`;
      break;
    case 'fixed_amount':
      details = `Diskon ${formatCurrency(value)}`;
      break;
    case 'free_shipping':
      details = 'Gratis Ongkos Kirim';
      break;
    default:
      details = formatPromoType(type);
  }
  
  if (minPurchase) {
    details += ` - Min. pembelian ${formatCurrency(minPurchase)}`;
  }
  
  return details;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Indonesian phone number
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('08')) {
    return `+62${cleaned.substring(1)}`;
  } else if (cleaned.startsWith('8')) {
    return `+62${cleaned}`;
  }
  
  return phone;
};

export const formatDecimal = (value: number, decimals: number = 2): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toFixed(decimals);
};

// ==================== COLOR & STATUS FORMATTING ====================

export const formatMarginColor = (margin: number): string => {
  if (margin >= 30) return 'text-green-600';
  if (margin >= 15) return 'text-yellow-600';
  if (margin >= 0) return 'text-orange-600';
  return 'text-red-600';
};

export const formatStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'active': 'text-green-600 bg-green-50',
    'inactive': 'text-gray-600 bg-gray-50',
    'pending': 'text-yellow-600 bg-yellow-50',
    'confirmed': 'text-blue-600 bg-blue-50',
    'processing': 'text-purple-600 bg-purple-50',
    'completed': 'text-green-600 bg-green-50',
    'cancelled': 'text-red-600 bg-red-50',
    'delivered': 'text-green-600 bg-green-50',
    'shipped': 'text-blue-600 bg-blue-50'
  };
  return statusColorMap[status] || 'text-gray-600 bg-gray-50';
};

// ==================== PARSING FUNCTIONS ====================

export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove currency symbols and whitespace
  const cleaned = currencyString
    .replace(/[Rp\s.,]/g, '')
    .replace(/[^\d]/g, '');
  
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const parsePercentage = (percentageString: string): number => {
  if (!percentageString) return 0;
  
  // Remove percentage symbol and whitespace
  const cleaned = percentageString
    .replace(/[%\s,]/g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
};

// ==================== CALCULATION & CHART FORMATTING ====================

export const formatCalculationSummary = (calculation: {
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
}): string => {
  const { subtotal, tax = 0, discount = 0, total } = calculation;
  
  let summary = `Subtotal: ${formatCurrency(subtotal)}`;
  
  if (tax > 0) {
    summary += `, Pajak: ${formatCurrency(tax)}`;
  }
  
  if (discount > 0) {
    summary += `, Diskon: -${formatCurrency(discount)}`;
  }
  
  summary += `, Total: ${formatCurrency(total)}`;
  
  return summary;
};

export const formatChartValue = (value: number, type: 'currency' | 'percentage' | 'number' = 'number'): string => {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
    default:
      return formatNumber(value);
  }
};

// ==================== UI HELPER FUNCTIONS ====================

export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};

export const getResponsiveText = (text: string, breakpoint: 'sm' | 'md' | 'lg' = 'md'): string => {
  const maxLengths = {
    sm: 20,
    md: 40,
    lg: 60
  };
  
  return truncateText(text, maxLengths[breakpoint]);
};

export const formatValidationMessage = (field: string, rule: string, value?: any): string => {
  const messages: Record<string, string> = {
    'required': `${toTitleCase(field)} wajib diisi`,
    'email': `${toTitleCase(field)} harus berupa email yang valid`,
    'phone': `${toTitleCase(field)} harus berupa nomor telepon yang valid`,
    'min': `${toTitleCase(field)} minimal ${value} karakter`,
    'max': `${toTitleCase(field)} maksimal ${value} karakter`,
    'numeric': `${toTitleCase(field)} harus berupa angka`,
    'positive': `${toTitleCase(field)} harus berupa angka positif`,
    'currency': `${toTitleCase(field)} harus berupa nominal yang valid`
  };
  
  return messages[rule] || `${toTitleCase(field)} tidak valid`;
};

// ==================== ORDER-SPECIFIC UTILITIES ====================

export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `ORD${year}${month}${day}${random}`;
};

export const generateOrderNumberWithTime = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `ORD${year}${month}${day}${hour}${minute}${random}`;
};

export const generateOrderNumberSequential = (lastOrderNumber?: string): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  let sequence = 1;
  if (lastOrderNumber) {
    const match = lastOrderNumber.match(/ORD\d{6}(\d{3})$/);
    if (match) {
      const lastSequence = parseInt(match[1]);
      const lastDate = lastOrderNumber.substring(3, 9);
      const currentDate = `${year}${month}${day}`;
      
      if (lastDate === currentDate) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const sequenceStr = sequence.toString().padStart(3, '0');
  return `ORD${year}${month}${day}${sequenceStr}`;
};

export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Menunggu Konfirmasi',
    'confirmed': 'Dikonfirmasi', 
    'processing': 'Diproses',
    'ready': 'Siap Diantar',
    'shipped': 'Dikirim',
    'delivered': 'Diantar',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  
  return statusMap[status] || toTitleCase(status);
};

// ==================== ADDITIONAL UTILITIES ====================

export const formatLargeNumber = (num: number | null | undefined, digits: number = 1): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return 'Rp 0';
  }
  const si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: " rb" },
    { value: 1E6, symbol: " jt" },
    { value: 1E9, symbol: " M" },
    { value: 1E12, symbol: " T" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  if (i === 0) {
      return formatCurrency(num);
  }
  const abbreviatedNum = (num / si[i].value).toFixed(digits).replace(rx, "$1");
  return `Rp ${abbreviatedNum}${si[i].symbol}`;
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim();
};

export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

export const formatCompactNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
};

// Order utilities
export const calculateItemTotal = (quantity: number, price: number): number => {
  if (typeof quantity !== 'number' || typeof price !== 'number') return 0;
  return quantity * price;
};

export const calculateOrderSubtotal = (items: Array<{ quantity: number; hargaSatuan: number }>): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => {
    return total + calculateItemTotal(item.quantity || 0, item.hargaSatuan || 0);
  }, 0);
};

export const calculateOrderTotal = (subtotal: number, tax: number = 0, discount: number = 0): number => {
  if (typeof subtotal !== 'number') return 0;
  return Math.max(0, subtotal + (tax || 0) - (discount || 0));
};

export const validateOrderItems = (items: any[]): boolean => {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.every(item => 
    item.recipe_id && 
    item.quantity && 
    item.quantity > 0 && 
    item.hargaSatuan && 
    item.hargaSatuan >= 0
  );
};

export const validateCustomerInfo = (customer: {
  namaPelanggan?: string;
  teleponPelanggan: string;
  emailPelanggan?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!customer.namaPelanggan?.trim()) {
    errors.push('Nama pelanggan wajib diisi');
  }
  
  if (!customer.teleponPelanggan.trim()) {
    errors.push('Nomor telepon wajib diisi');
  } else if (!isValidPhoneNumber(customer.teleponPelanggan)) {
    errors.push('Format nomor telepon tidak valid');
  }
  
  if (customer.emailPelanggan && !isValidEmail(customer.emailPelanggan)) {
    errors.push('Format email tidak valid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export summary objects for easy importing
export const OrderUtils = {
  generateOrderNumber,
  generateOrderNumberWithTime,
  generateOrderNumberSequential,
  formatOrderStatus,
  calculateItemTotal,
  calculateOrderSubtotal,
  calculateOrderTotal,
  validateOrderItems,
  validateCustomerInfo
};

export const FormatUtils = {
  formatCurrency,
  formatLargeNumber,
  formatPercentage,
  formatNumber,
  formatDate,
  formatPhoneNumber,
  truncateText,
  capitalizeFirst,
  toTitleCase,
  sanitizeInput,
  sanitizePhoneNumber,
  formatCompactNumber,
  formatPromoType,
  formatPromoDetails,
  formatFileSize,
  formatDuration,
  formatDecimal
};

export const ValidationUtils = {
  isValidEmail,
  isValidPhoneNumber,
  validateOrderItems,
  validateCustomerInfo
};

export const UIUtils = {
  formatMarginColor,
  formatStatusColor,
  highlightSearchTerm,
  getResponsiveText,
  formatValidationMessage,
  formatCalculationSummary,
  formatChartValue
};

export const ParsingUtils = {
  parseCurrency,
  parsePercentage
};