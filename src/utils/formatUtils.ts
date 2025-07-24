// src/components/orders/utils/formatUtils.ts
// COMBINED: Currency utils + Format utils + Order-specific utilities

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
 * Memformat angka besar menjadi string ringkas (misal: "100 rb", "1,2 jt", "5 M") dengan awalan "Rp".
 * Berguna untuk label grafik atau tampilan ringkas.
 * @param num Angka yang akan diformat.
 * @param digits Jumlah desimal untuk angka ringkas. Defaultnya 1.
 * @returns String yang diformat (misal: "Rp 100 rb", "Rp 1,2 jt").
 */
export const formatLargeNumber = (num: number | null | undefined, digits: number = 1): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return 'Rp 0'; // Menangani input yang tidak valid
  }
  const si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: " rb" }, // Ribu
    { value: 1E6, symbol: " jt" }, // Juta
    { value: 1E9, symbol: " M" },  // Miliar
    { value: 1E12, symbol: " T" }  // Triliun
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  // Untuk angka di bawah 1000, gunakan format biasa
  if (i === 0) {
      return formatCurrency(num);
  }
  const abbreviatedNum = (num / si[i].value).toFixed(digits).replace(rx, "$1");
  return `Rp ${abbreviatedNum}${si[i].symbol}`;
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

// ==================== GENERAL FORMATTING ====================

export const formatNumber = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(value);
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

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Text formatting utilities
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim();
};

// Validation helpers
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

// Formatting for display
export const formatCompactNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
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

// Alternative order number generators
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
  
  // Extract sequence from last order number if available
  let sequence = 1;
  if (lastOrderNumber) {
    const match = lastOrderNumber.match(/ORD\d{6}(\d{3})$/);
    if (match) {
      const lastSequence = parseInt(match[1]);
      const lastDate = lastOrderNumber.substring(3, 9); // YYMMDD
      const currentDate = `${year}${month}${day}`;
      
      // If same date, increment sequence, otherwise reset to 1
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
  
  return statusMap[status] || capitalizeWords(status);
};

// Order item utilities
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

// Order validation utilities
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
  telefonPelanggan?: string;
  emailPelanggan?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!customer.namaPelanggan?.trim()) {
    errors.push('Nama pelanggan wajib diisi');
  }
  
  if (!customer.telefonPelanggan?.trim()) {
    errors.push('Nomor telepon wajib diisi');
  } else if (!isValidPhoneNumber(customer.telefonPelanggan)) {
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
  formatPhoneNumber,
  truncateText,
  capitalizeWords,
  sanitizeInput,
  sanitizePhoneNumber,
  formatCompactNumber
};

export const ValidationUtils = {
  isValidEmail,
  isValidPhoneNumber,
  validateOrderItems,
  validateCustomerInfo
};