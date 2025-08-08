// src/components/orders/utils.ts - Optimized Dependencies & Performance
/**
 * Orders Utilities - Essential Functions Only
 * 
 * Core utilities optimized for performance and maintainability
 */

import { Order, NewOrder } from './types';
import { logger } from '@/utils/logger';

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

// ✅ VALIDATION: Enhanced with specific error messages  
export const validateOrderData = (data: Partial<NewOrder>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required field validations
  if (!data.namaPelanggan?.trim()) {
    errors.push('Nama pelanggan harus diisi');
  } else if (data.namaPelanggan.trim().length < 2) {
    errors.push('Nama pelanggan minimal 2 karakter');
  }
  
  // Order value validation
  if (!data.totalPesanan || data.totalPesanan <= 0) {
    errors.push('Total pesanan harus lebih dari 0');
  } else if (data.totalPesanan > 1000000000) { // 1 billion limit
    errors.push('Total pesanan terlalu besar');
  }
  
  // Items validation
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Minimal harus ada 1 item pesanan');
  } else if (data.items.length > 100) { // Reasonable limit
    errors.push('Maksimal 100 item per pesanan');
  }
  
  // Optional field validations
  if (data.teleponPelanggan && data.teleponPelanggan.length > 0) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(data.teleponPelanggan)) {
      errors.push('Format nomor telepon tidak valid');
    }
  }
  
  if (data.emailPelanggan && data.emailPelanggan.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.emailPelanggan)) {
      errors.push('Format email tidak valid');
    }
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
  generateOrderNumber: () => generateOrderNumber()
} as const;