// utils/dashboardUtils.ts
import { format, subDays, startOfMonth, endOfMonth, subMonths, isValid, parseISO } from "date-fns";
import { id } from 'date-fns/locale';

// 📅 Safe date formatter with fallback
export const formatDateTime = (date: any): string => {
  if (!date) return 'Waktu tidak valid';
  
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = new Date(date);
    }
    
    if (!isValid(dateObj)) return 'Waktu tidak valid';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Waktu tidak valid';
  }
};

// 🔄 Safe date conversion
export const toISOString = (date: any): string | null => {
  try {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString();
  } catch (error) {
    console.warn('Date conversion error:', error);
    return null;
  }
};

// 📝 Safe date parsing
export const parseDate = (dateString: any): Date | null => {
  try {
    if (!dateString) return null;
    const parsed = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

// 📊 Format date range for display
export const formatDateRange = (from: Date | null, to: Date | null): string => {
  try {
    if (!from) return "Pilih rentang tanggal";
    
    if (!to || from.toDateString() === to.toDateString()) {
      return format(from, "dd MMM yyyy", { locale: id });
    }
    
    return `${format(from, "dd MMM", { locale: id })} - ${format(to, "dd MMM yyyy", { locale: id })}`;
  } catch (error) {
    console.warn('Date range formatting error:', error);
    return "Tanggal tidak valid";
  }
};

// 🗓️ Date presets configuration
export const getDatePresets = () => {
  const today = new Date();
  
  return [
    { 
      label: "Hari Ini", 
      range: { 
        from: today.toISOString(), 
        to: today.toISOString() 
      } 
    },
    { 
      label: "Kemarin", 
      range: { 
        from: subDays(today, 1).toISOString(), 
        to: subDays(today, 1).toISOString() 
      } 
    },
    { 
      label: "7 Hari Terakhir", 
      range: { 
        from: subDays(today, 6).toISOString(), 
        to: today.toISOString() 
      } 
    },
    { 
      label: "30 Hari Terakhir", 
      range: { 
        from: subDays(today, 29).toISOString(), 
        to: today.toISOString() 
      } 
    },
    { 
      label: "Bulan Ini", 
      range: { 
        from: startOfMonth(today).toISOString(), 
        to: endOfMonth(today).toISOString() 
      } 
    },
    { 
      label: "Bulan Lalu", 
      range: { 
        from: startOfMonth(subMonths(today, 1)).toISOString(), 
        to: endOfMonth(subMonths(today, 1)).toISOString() 
      } 
    },
  ];
};

// 🔢 Safe pagination calculation
export const calculatePagination = (
  currentPage: number, 
  totalItems: number, 
  itemsPerPage: number = 5
) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = Math.max(0, (safePage - 1) * itemsPerPage);
  const endIndex = startIndex + itemsPerPage;
  
  return {
    currentPage: safePage,
    totalPages,
    startIndex,
    endIndex,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1
  };
};

// 🎨 Get icon and color for activity type
export const getActivityTypeStyle = (type: string) => {
  const styles = {
    'keuangan': { icon: 'CircleDollarSign', color: 'text-green-600' },
    'resep': { icon: 'ChefHat', color: 'text-blue-600' },
    'stok': { icon: 'Package', color: 'text-orange-600' },
    'order': { icon: 'ShoppingCart', color: 'text-purple-600' },
    'supplier': { icon: 'Building', color: 'text-gray-600' },
    'aset': { icon: 'Home', color: 'text-indigo-600' },
    'default': { icon: 'Activity', color: 'text-gray-500' }
  };
  
  return styles[type] || styles.default;
};

// 📊 Generate unique key for React lists
export const generateListKey = (prefix: string, id: any, index: number, suffix?: string): string => {
  const safeSuffix = suffix ? `_${suffix}` : '';
  return `${prefix}_${id || index}${safeSuffix}`;
};