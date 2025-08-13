// src/components/orders/utils.ts - Optimized Dependencies & Performance
/**
 * Orders Utilities - Essential Functions Only
 * 
 * Core utilities optimized for performance and maintainability
 */

import { Order, NewOrder } from './types';
import { logger } from '@/utils/logger';
import { VALIDATION_LIMITS } from './constants'; // ✅ Added: Import validation limits from constants

// ✅ DATE UTILITIES: Optimized with better error handling
export const isValidDate = (date: any): boolean => {
  try {
    return date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0;
  } catch {
    return false;
  }
};

export const safeParseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  
  try {
    // Direct Date instance check
    if (dateInput instanceof Date) {
      return isValidDate(dateInput) ? dateInput : null;
    }
    
    // String/number parsing with validation
    const parsed = new Date(dateInput);
    return isValidDate(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const toSafeISOString = (date: Date): string => {
  try {
    return isValidDate(date) ? date.toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export const formatDateForDisplay = (date: Date | string | null): string => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '-';
  
  try {
    return parsedDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return parsedDate.toLocaleDateString(); // Fallback
  }
};

// ✅ DATA TRANSFORMERS: Optimized with better fallbacks
export const transformOrderFromDB = (dbItem: any): Order => {
  if (!dbItem || typeof dbItem !== 'object') {
    logger.error('Invalid order data from database:', dbItem);
    return createFallbackOrder(dbItem?.id);
  }

  try {
    return {
      id: dbItem.id || 'unknown',
      nomorPesanan: dbItem.nomor_pesanan || generateOrderNumber(),
      namaPelanggan: dbItem.nama_pelanggan || 'Unknown Customer',
      teleponPelanggan: dbItem.telepon_pelanggan || '',
      emailPelanggan: dbItem.email_pelanggan || '',
      alamatPengiriman: dbItem.alamat_pengiriman || '',
      tanggal: safeParseDate(dbItem.tanggal) || new Date(),
      items: Array.isArray(dbItem.items) ? dbItem.items : [],
      totalPesanan: Number(dbItem.total_pesanan) || 0,
      status: dbItem.status || 'pending',
      catatan: dbItem.catatan || '',
      subtotal: Number(dbItem.subtotal) || 0,
      pajak: Number(dbItem.pajak) || 0,
      userId: dbItem.user_id || '',
      createdAt: safeParseDate(dbItem.created_at) || new Date(),
      updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
    };
  } catch (error) {
    logger.error('Error transforming order from DB:', error, dbItem);
    return createFallbackOrder(dbItem?.id);
  }
};

export const transformOrderToDB = (data: Partial<Order>): Record<string, any> => {
  const dbData: Record<string, any> = {};
  
  try {
    // ✅ OPTIMIZED: Direct property mapping with validation
    const propertyMap = [
      ['namaPelanggan', 'nama_pelanggan'],
      ['teleponPelanggan', 'telepon_pelanggan'],
      ['emailPelanggan', 'email_pelanggan'],
      ['alamatPengiriman', 'alamat_pengiriman'],
      ['status', 'status'],
      ['items', 'items'],
      ['totalPesanan', 'total_pesanan'],
      ['catatan', 'catatan'],
      ['subtotal', 'subtotal'],
      ['pajak', 'pajak']
    ] as const;

    propertyMap.forEach(([source, target]) => {
      if (data[source] !== undefined) {
        dbData[target] = data[source];
      }
    });

    // ✅ ENHANCED: Date handling
    if (data.tanggal !== undefined) {
      const parsedDate = safeParseDate(data.tanggal);
      dbData.tanggal = toSafeISOString(parsedDate || new Date());
    }
    
    return dbData;
  } catch (error) {
    logger.error('Error transforming order to DB:', error, data);
    
    // ✅ SAFE FALLBACK: Minimal valid data
    return {
      nama_pelanggan: String(data.namaPelanggan || 'Error'),
      status: data.status || 'pending',
      total_pesanan: Number(data.totalPesanan) || 0,
      tanggal: toSafeISOString(new Date())
    };
  }
};

// ✅ VALIDATION: Enhanced with specific error messages and integrated limits
export const validateOrderData = (data: Partial<NewOrder>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required field validations with limits
  if (!data.namaPelanggan?.trim()) {
    errors.push('Nama pelanggan harus diisi');
  } else {
    const nameLength = data.namaPelanggan.trim().length;
    if (nameLength < VALIDATION_LIMITS.customerName.min) {
      errors.push(`Nama pelanggan minimal ${VALIDATION_LIMITS.customerName.min} karakter`);
    }
    if (nameLength > VALIDATION_LIMITS.customerName.max) {
      errors.push(`Nama pelanggan maksimal ${VALIDATION_LIMITS.customerName.max} karakter`);
    }
  }
  
  // Order value validation with limits
  if (!data.totalPesanan || data.totalPesanan <= VALIDATION_LIMITS.orderValue.min) {
    errors.push(`Total pesanan harus lebih dari ${VALIDATION_LIMITS.orderValue.min}`);
  } else if (data.totalPesanan > VALIDATION_LIMITS.orderValue.max) {
    errors.push('Total pesanan terlalu besar');
  }
  
  // Items validation with limits
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Minimal harus ada 1 item pesanan');
  } else if (data.items.length > VALIDATION_LIMITS.itemsPerOrder.max) {
    errors.push(`Maksimal ${VALIDATION_LIMITS.itemsPerOrder.max} item per pesanan`);
  }
  
  // Optional field validations with limits and improved regex
  if (data.teleponPelanggan && data.teleponPelanggan.length > 0) {
    const phone = data.teleponPelanggan;
    const phoneLength = phone.length;
    if (phoneLength < VALIDATION_LIMITS.phone.min || phoneLength > VALIDATION_LIMITS.phone.max) {
      errors.push(`Nomor telepon harus antara ${VALIDATION_LIMITS.phone.min} dan ${VALIDATION_LIMITS.phone.max} karakter`);
    } else {
      // ✅ IMPROVED: Stricter regex for Indonesian phone numbers (local/internasional)
      const phoneRegex = /^(?:\+62|0)[1-9]\d{8,13}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Format nomor telepon tidak valid (contoh: +628123456789 atau 08123456789)');
      }
    }
  }
  
  if (data.emailPelanggan && data.emailPelanggan.length > 0) {
    const email = data.emailPelanggan;
    if (email.length > VALIDATION_LIMITS.email.max) {
      errors.push(`Email maksimal ${VALIDATION_LIMITS.email.max} karakter`);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Format email tidak valid');
      }
    }
  }
  
  // Additional optional fields (address, notes)
  if (data.alamatPengiriman && data.alamatPengiriman.length > VALIDATION_LIMITS.address.max) {
    errors.push(`Alamat pengiriman maksimal ${VALIDATION_LIMITS.address.max} karakter`);
  }
  
  if (data.catatan && data.catatan.length > VALIDATION_LIMITS.notes.max) {
    errors.push(`Catatan maksimal ${VALIDATION_LIMITS.notes.max} karakter`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ✅ ANALYTICS: Optimized statistics calculation
export const calculateOrderStats = (orders: Order[]) => {
  if (!orders.length) {
    return {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }

  // ✅ SINGLE PASS: Calculate all stats in one iteration
  const stats = orders.reduce((acc, order) => {
    acc.total++;
    
    // Status counting
    switch (order.status) {
      case 'pending':
        acc.pending++;
        break;
      case 'completed':
        acc.completed++;
        acc.totalRevenue += order.totalPesanan;
        break;
      case 'cancelled':
        acc.cancelled++;
        break;
    }
    
    return acc;
  }, {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });

  // Calculate average
  stats.averageOrderValue = stats.completed > 0 ? stats.totalRevenue / stats.completed : 0;
  
  return stats;
};

export const groupOrdersByStatus = (orders: Order[]) => {
  return orders.reduce((groups, order) => {
    const status = order.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(order);
    return groups;
  }, {} as Record<string, Order[]>);
};

// ✅ HELPER FUNCTIONS: Utility functions
const createFallbackOrder = (id?: string): Order => ({
  id: id || 'error-' + Date.now(),
  nomorPesanan: 'ERROR-' + Date.now().toString().slice(-6),
  namaPelanggan: 'Data Error',
  teleponPelanggan: '',
  emailPelanggan: '',
  alamatPengiriman: '',
  tanggal: new Date(),
  items: [],
  totalPesanan: 0,
  status: 'pending',
  catatan: 'Error loading order data',
  subtotal: 0,
  pajak: 0,
  userId: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ✅ Made private since only used internally; export if needed elsewhere
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// ✅ SEARCH & FILTER: Optimized search functions
export const searchOrders = (orders: Order[], searchTerm: string): Order[] => {
  if (!searchTerm.trim()) return orders;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return orders.filter(order => 
    order.namaPelanggan.toLowerCase().includes(lowerSearchTerm) ||
    order.nomorPesanan.toLowerCase().includes(lowerSearchTerm) ||
    order.teleponPelanggan?.toLowerCase().includes(lowerSearchTerm) ||
    order.emailPelanggan?.toLowerCase().includes(lowerSearchTerm)
  );
};

export const filterOrdersByStatus = (orders: Order[], status: string): Order[] => {
  if (status === 'all') return orders;
  return orders.filter(order => order.status === status);
};

// ✅ EXPORT: All utilities
export const OrderUtils = {
  // Date utilities
  isValidDate,
  safeParseDate,
  toSafeISOString,
  formatDateForDisplay,
  
  // Data transformers
  transformOrderFromDB,
  transformOrderToDB,
  
  // Validation
  validateOrderData,
  
  // Analytics
  calculateOrderStats,
  groupOrdersByStatus,
  
  // Search & filter
  searchOrders,
  filterOrdersByStatus,
  
  // Helpers
  generateOrderNumber
} as const;