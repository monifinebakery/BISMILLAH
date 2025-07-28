// src/components/warehouse/utils/formatters.ts

/**
 * Format currency to Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to Indonesian format
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format datetime to Indonesian format with time
 */
export const formatDateTime = (date: Date | string | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Format stock display with unit
 */
export const formatStock = (amount: number, unit: string): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${unit}`;
  }

  return `${formatNumber(amount)} ${unit}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format days until expiry
 */
export const formatDaysUntilExpiry = (expiryDate: Date | null): {
  text: string;
  variant: 'default' | 'warning' | 'destructive';
  days: number;
} => {
  if (!expiryDate) {
    return { text: 'Tidak ada', variant: 'default', days: Infinity };
  }

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { 
      text: `Expired ${Math.abs(diffDays)} hari lalu`, 
      variant: 'destructive', 
      days: diffDays 
    };
  } else if (diffDays === 0) {
    return { text: 'Expired hari ini', variant: 'destructive', days: 0 };
  } else if (diffDays <= 3) {
    return { 
      text: `${diffDays} hari lagi`, 
      variant: 'destructive', 
      days: diffDays 
    };
  } else if (diffDays <= 7) {
    return { 
      text: `${diffDays} hari lagi`, 
      variant: 'warning', 
      days: diffDays 
    };
  } else if (diffDays <= 30) {
    return { 
      text: `${diffDays} hari lagi`, 
      variant: 'default', 
      days: diffDays 
    };
  } else {
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (months === 1 && remainingDays === 0) {
      return { text: '1 bulan lagi', variant: 'default', days: diffDays };
    } else if (remainingDays === 0) {
      return { text: `${months} bulan lagi`, variant: 'default', days: diffDays };
    } else {
      return { text: `${months}b ${remainingDays}h lagi`, variant: 'default', days: diffDays };
    }
  }
};

/**
 * Format stock status
 */
export const formatStockStatus = (current: number, minimum: number): {
  text: string;
  variant: 'default' | 'warning' | 'destructive';
  icon: string;
} => {
  if (current === 0) {
    return {
      text: 'Habis',
      variant: 'destructive',
      icon: 'alert-circle'
    };
  } else if (current <= minimum) {
    return {
      text: 'Rendah',
      variant: 'warning',
      icon: 'alert-triangle'
    };
  } else if (current <= minimum * 1.5) {
    return {
      text: 'Cukup',
      variant: 'default',
      icon: 'check-circle'
    };
  } else {
    return {
      text: 'Aman',
      variant: 'default',
      icon: 'check-circle-2'
    };
  }
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format search highlight
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
    return `${Math.floor(diffDays / 365)} tahun lalu`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
};