// src/components/orders/utils.ts - Enhanced with Completion Date Support
/**
 * Orders Utilities - Essential Functions Only
 * 
 * Core utilities optimized for performance and maintainability
 * ✅ ENHANCED: Added completion date support
 */

import { Order, NewOrder } from './types';
import { logger } from '@/utils/logger';
import { generateOrderNumber } from '@/utils/formatUtils'; // ✅ FIXED: Import order number generator
import { VALIDATION_LIMITS } from './constants'; // ✅ Added: Import validation limits from constants

// ✅ DATE UTILITIES: Using UnifiedDateHandler for consistency
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';

export const isValidDate = (date: any): boolean => {
  try {
    return date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0;
  } catch {
    return false;
  }
};

export const safeParseDate = (dateInput: any): Date | null => {
  const result = UnifiedDateHandler.parseDate(dateInput);
  return result.isValid && result.date ? result.date : null;
};

export const toSafeISOString = (date: Date | null): string => {
  try {
    if (!date || !isValidDate(date)) {
      return UnifiedDateHandler.toDatabaseTimestamp(new Date());
    }
    return UnifiedDateHandler.toDatabaseTimestamp(date);
  } catch {
    return UnifiedDateHandler.toDatabaseTimestamp(new Date());
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

// ✅ ENHANCED: Data transformers with completion date support
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
      emailPelanggan: dbItem.email_pelanggan || undefined,
      alamatPengiriman: dbItem.alamat_pengiriman || '',
      tanggal: safeParseDate(dbItem.tanggal) || new Date(),
      tanggalSelesai: safeParseDate(dbItem.tanggal_selesai) || undefined, // ✅ FIXED: Use undefined instead of null
      items: (() => {
        // ✅ FIXED: Properly parse JSON string items from database
        if (Array.isArray(dbItem.items)) {
          return dbItem.items;
        }
        if (typeof dbItem.items === 'string') {
          try {
            const parsed = JSON.parse(dbItem.items);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            logger.warn(`Failed to parse items JSON from database: ${error}. Raw data: ${dbItem.items}`);
            return [];
          }
        }
        return [];
      })(),
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
    logger.error('Error transforming order from DB:', error);
    return createFallbackOrder(dbItem?.id);
  }
};

export const transformOrderToDB = (data: Partial<Order>): Record<string, any> => {
  const dbData: Record<string, any> = {};
  
  try {
    // ✅ ENHANCED: Property mapping with completion date and order number
    const propertyMap = [
      ['nomorPesanan', 'nomor_pesanan'], // ✅ FIXED: Add order number mapping
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

    // ✅ ENHANCED: Date handling for order date using UnifiedDateHandler
    if (data.tanggal !== undefined) {
      const parsedDate = safeParseDate(data.tanggal);
      dbData.tanggal = UnifiedDateHandler.toDatabaseTimestamp(parsedDate || new Date());
    }
    
    // ✅ NEW: Date handling for completion date using UnifiedDateHandler
    if (data.tanggalSelesai !== undefined) {
      const parsedCompletionDate = safeParseDate(data.tanggalSelesai);
      dbData.tanggal_selesai = parsedCompletionDate ? UnifiedDateHandler.toDatabaseTimestamp(parsedCompletionDate) : null;
    }
    
    return dbData;
  } catch (error) {
    logger.error('Error transforming order to DB:', error);
    
    // ✅ SAFE FALLBACK: Minimal valid data with order number
    return {
      nomor_pesanan: String(data.nomorPesanan || generateOrderNumber()), // ✅ FIXED: Ensure order number exists
      nama_pelanggan: String(data.namaPelanggan || 'Error'),
      status: data.status || 'pending',
      total_pesanan: Number(data.totalPesanan) || 0,
      tanggal: UnifiedDateHandler.toDatabaseTimestamp(new Date()),
      tanggal_selesai: null, // ✅ FIXED: Use null for database compatibility
      telepon_pelanggan: '' // ✅ FIXED: Add required field with default
    };
  }
};

// ========== NEW: snake_case transformers for Orders ==========
// These helpers return/accept snake_case fields to align with the new convention

export const transform_order_from_db_snake = (dbItem: any): Order => {
  // Map DB payload (snake) to Order with snake_case keys preserved
  try {
    return {
      id: dbItem.id || 'unknown',
      nomor_pesanan: dbItem.nomor_pesanan,
      nama_pelanggan: dbItem.nama_pelanggan || 'Unknown Customer',
      telepon_pelanggan: dbItem.telepon_pelanggan || '',
      email_pelanggan: dbItem.email_pelanggan || undefined,
      alamat_pengiriman: dbItem.alamat_pengiriman || '',
      tanggal: safeParseDate(dbItem.tanggal) || new Date(),
      tanggal_selesai: safeParseDate(dbItem.tanggal_selesai) || undefined,
      items: Array.isArray(dbItem.items)
        ? dbItem.items
        : (typeof dbItem.items === 'string'
          ? (() => { try { const p = JSON.parse(dbItem.items); return Array.isArray(p) ? p : []; } catch { return []; } })()
          : []
        ),
      total_pesanan: Number(dbItem.total_pesanan) || 0,
      status: dbItem.status || 'pending',
      catatan: dbItem.catatan || '',
      subtotal: Number(dbItem.subtotal) || 0,
      pajak: Number(dbItem.pajak) || 0,
      user_id: dbItem.user_id || '',
      created_at: safeParseDate(dbItem.created_at) || new Date(),
      updated_at: safeParseDate(dbItem.updated_at) || new Date(),
    } as unknown as Order;
  } catch (error) {
    logger.error('Error transforming order from DB (snake):', error);
    return createFallbackOrder(dbItem?.id);
  }
};

export const transform_order_to_db_snake = (data: Partial<Order>): Record<string, any> => {
  const dbData: Record<string, any> = {};
  try {
    const propertyMap = [
      ['nomor_pesanan', 'nomor_pesanan'],
      ['nama_pelanggan', 'nama_pelanggan'],
      ['telepon_pelanggan', 'telepon_pelanggan'],
      ['email_pelanggan', 'email_pelanggan'],
      ['alamat_pengiriman', 'alamat_pengiriman'],
      ['status', 'status'],
      ['items', 'items'],
      ['total_pesanan', 'total_pesanan'],
      ['catatan', 'catatan'],
      ['subtotal', 'subtotal'],
      ['pajak', 'pajak']
    ] as const;

    propertyMap.forEach(([source, target]) => {
      if ((data as any)[source] !== undefined) {
        dbData[target] = (data as any)[source];
      }
    });

    if ((data as any).tanggal !== undefined) {
      const parsedDate = safeParseDate((data as any).tanggal);
      dbData.tanggal = UnifiedDateHandler.toDatabaseTimestamp(parsedDate || new Date());
    }

    if ((data as any).tanggal_selesai !== undefined) {
      const parsedCompletionDate = safeParseDate((data as any).tanggal_selesai as any);
      dbData.tanggal_selesai = parsedCompletionDate ? UnifiedDateHandler.toDatabaseTimestamp(parsedCompletionDate) : null;
    }

    return dbData;
  } catch (error) {
    logger.error('Error transforming order to DB (snake):', error);
    return {
      status: (data as any).status || 'pending',
      total_pesanan: Number((data as any).total_pesanan) || 0,
      tanggal: UnifiedDateHandler.toDatabaseTimestamp(new Date()),
      tanggal_selesai: null,
      telepon_pelanggan: ''
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
    if (nameLength < VALIDATION_LIMITS.customer_name.min) {
      errors.push(`Nama pelanggan minimal ${VALIDATION_LIMITS.customer_name.min} karakter`);
    }
    if (nameLength > VALIDATION_LIMITS.customer_name.max) {
      errors.push(`Nama pelanggan maksimal ${VALIDATION_LIMITS.customer_name.max} karakter`);
    }
  }
  
  // Order value validation with limits
  if (!data.totalPesanan || data.totalPesanan <= VALIDATION_LIMITS.order_value.min) {
    errors.push(`Total pesanan harus lebih dari ${VALIDATION_LIMITS.order_value.min}`);
  } else if (data.totalPesanan > VALIDATION_LIMITS.order_value.max) {
    errors.push('Total pesanan terlalu besar');
  }
  
  // Items validation with limits
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Minimal harus ada 1 item pesanan');
  } else if (data.items.length > VALIDATION_LIMITS.items_per_order.max) {
    errors.push(`Maksimal ${VALIDATION_LIMITS.items_per_order.max} item per pesanan`);
  }
  
  // Phone is optional: validate only if provided
  if (data.teleponPelanggan && data.teleponPelanggan.length > 0) {
    const phone = data.teleponPelanggan;
    const phoneLength = phone.length;
    if (phoneLength < VALIDATION_LIMITS.phone.min || phoneLength > VALIDATION_LIMITS.phone.max) {
      errors.push(`Nomor telepon harus antara ${VALIDATION_LIMITS.phone.min} dan ${VALIDATION_LIMITS.phone.max} karakter`);
    } else {
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

// ✅ ENHANCED: Analytics with completion date consideration
export const calculateOrderStats = (orders: Order[]) => {
  if (!orders.length) {
    return {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      completedToday: 0,
      revenueToday: 0
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // ✅ ENHANCED: Single pass calculation with completion date metrics
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
        
        // ✅ NEW: Count orders completed today
        if (order.tanggalSelesai) {
          const completionDate = new Date(order.tanggalSelesai);
          if (completionDate >= today && completionDate < tomorrow) {
            acc.completedToday++;
            acc.revenueToday += order.totalPesanan;
          }
        }
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
    averageOrderValue: 0,
    completedToday: 0,
    revenueToday: 0
  });

  // Calculate averages
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

// ✅ NEW: Group orders by completion date for revenue reporting
export const groupOrdersByCompletionDate = (orders: Order[]) => {
  return orders
    .filter(order => order.status === 'completed' && order.tanggalSelesai)
    .reduce((groups, order) => {
      const completionDate = formatDateForDisplay(order.tanggalSelesai!);
      if (!groups[completionDate]) {
        groups[completionDate] = {
          date: completionDate,
          orders: [],
          totalRevenue: 0,
          orderCount: 0
        };
      }
      groups[completionDate].orders.push(order);
      groups[completionDate].totalRevenue += order.totalPesanan;
      groups[completionDate].orderCount++;
      return groups;
    }, {} as Record<string, {
      date: string;
      orders: Order[];
      totalRevenue: number;
      orderCount: number;
    }>);
};

// ✅ NEW: Filter orders by completion date range
export const filterOrdersByCompletionDate = (
  orders: Order[], 
  startDate: Date, 
  endDate: Date
): Order[] => {
  return orders.filter(order => {
    if (!order.tanggalSelesai) return false;
    
    const completionDate = new Date(order.tanggalSelesai);
    return completionDate >= startDate && completionDate <= endDate;
  });
};

// ✅ HELPER FUNCTIONS: Utility functions
const createFallbackOrder = (id?: string): Order => ({
  id: id || 'error-' + Date.now(),
  nomorPesanan: 'ERROR-' + Date.now().toString().slice(-6),
  namaPelanggan: 'Data Error',
  teleponPelanggan: '',
  emailPelanggan: undefined,
  alamatPengiriman: '',
  tanggal: new Date(),
  tanggalSelesai: undefined, // ✅ FIXED: Use undefined instead of null
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
// Removed local generateOrderNumber - using imported one from formatUtils

// ✅ SEARCH & FILTER: Optimized search functions with improved null handling
export const searchOrders = (orders: Order[], searchTerm: string): Order[] => {
  if (!searchTerm || !searchTerm.trim()) return orders;
  
  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  
  return orders.filter(order => 
    order.namaPelanggan.toLowerCase().includes(lowerSearchTerm) ||
    order.nomorPesanan.toLowerCase().includes(lowerSearchTerm) ||
    order.teleponPelanggan.toLowerCase().includes(lowerSearchTerm) ||
    (order.emailPelanggan?.toLowerCase().includes(lowerSearchTerm))
  );
};

export const filterOrdersByStatus = (orders: Order[], status: string): Order[] => {
  if (status === 'all') return orders;
  return orders.filter(order => order.status === status);
};

// ✅ ENHANCED: Export all utilities including new completion date functions
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
  groupOrdersByCompletionDate, // ✅ NEW
  
  // Search & filter
  searchOrders,
  filterOrdersByStatus,
  filterOrdersByCompletionDate, // ✅ NEW
  
  // Helpers
  generateOrderNumber
} as const;
