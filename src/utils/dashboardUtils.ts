// utils/dashboardUtils.ts
import { format, subDays, startOfMonth, endOfMonth, subMonths, isValid, parseISO } from "date-fns";
import { id } from 'date-fns/locale';

// 📅 Safe date formatter with fallback
export const formatDateTime = (date: any): string => {
  if (!date) return 'Waktu tidak valid';
  
  try {
    const dateObj = parseDate(date); // Gunakan helper parseDate yang sudah ada
    
    if (!dateObj) return 'Waktu tidak valid';
    
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

// 🔄 Safe date conversion to ISO string
export const toISOString = (date: any): string | null => {
  try {
    const dateObj = parseDate(date);
    return dateObj ? dateObj.toISOString() : null;
  } catch (error) {
    console.warn('Date conversion error:', error);
    return null;
  }
};

// 📝 Safe date parsing (no changes needed here, it's already good)
export const parseDate = (dateValue: any): Date | null => {
  try {
    if (!dateValue) return null;
    // parseISO is robust for ISO strings, new Date() is a fallback
    const parsed = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

// 📊 Format date range for display (FIXED)
// Dibuat lebih kuat untuk menangani input string atau objek Date yang tidak valid
export const formatDateRange = (from: Date | string | null, to: Date | string | null): string => {
  try {
    const fromDate = parseDate(from);
    if (!fromDate) return "Pilih rentang tanggal";

    const toDate = parseDate(to);
    
    // Jika tidak ada tanggal 'to' atau jika 'from' dan 'to' adalah hari yang sama
    if (!toDate || fromDate.toDateString() === toDate.toDateString()) {
      return format(fromDate, "dd MMM yyyy", { locale: id });
    }
    
    return `${format(fromDate, "dd MMM", { locale: id })} - ${format(toDate, "dd MMM yyyy", { locale: id })}`;
  } catch (error) {
    // Catch ini sekarang menjadi jaring pengaman sekunder
    console.warn('Date range formatting error:', error);
    return "Tanggal tidak valid";
  }
};

// 🗓️ Date presets configuration (FIXED)
// Sekarang mengembalikan objek Date, bukan string, untuk konsistensi
export const getDatePresets = () => {
  const today = new Date();
  
  return [
    { 
      label: "Hari Ini", 
      range: { from: today, to: today } 
    },
    { 
      label: "Kemarin", 
      range: { from: subDays(today, 1), to: subDays(today, 1) } 
    },
    { 
      label: "7 Hari Terakhir", 
      range: { from: subDays(today, 6), to: today } 
    },
    { 
      label: "30 Hari Terakhir", 
      range: { from: subDays(today, 29), to: today } 
    },
    { 
      label: "Bulan Ini", 
      range: { from: startOfMonth(today), to: endOfMonth(today) } 
    },
    { 
      label: "Bulan Lalu", 
      range: { 
        from: startOfMonth(subMonths(today, 1)), 
        to: endOfMonth(subMonths(today, 1)) 
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
  const styles: Record<string, { icon: string, color: string }> = {
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
