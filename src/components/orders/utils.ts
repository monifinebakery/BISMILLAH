// 🎯 150 lines - All utilities
import { Order, NewOrder } from './types';

// Date Utilities (dari kode asli)
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const safeParseDate = (dateInput: any): Date | null => {
  try {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
      return isValidDate(dateInput) ? dateInput : null;
    }
    
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isValidDate(parsed) ? parsed : null;
    }
    
    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput);
      return isValidDate(parsed) ? parsed : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error, dateInput);
    return null;
  }
};

export const toSafeISOString = (date: Date): string => {
  try {
    if (!isValidDate(date)) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error converting date to ISO:', error, date);
    return new Date().toISOString();
  }
};

export const formatDateForDisplay = (date: Date | string | null): string => {
  try {
    if (!date) return '-';
    
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '-';
    
    return parsedDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '-';
  }
};

// Data Transformers (dari kode asli)
export const transformOrderFromDB = (dbItem: any): Order => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      throw new Error('Invalid order data from database');
    }

    // Safe date parsing dengan fallbacks
    const parsedTanggal = safeParseDate(dbItem.tanggal);
    const parsedCreatedAt = safeParseDate(dbItem.created_at);
    const parsedUpdatedAt = safeParseDate(dbItem.updated_at);

    return {
      id: dbItem.id,
      nomorPesanan: dbItem.nomor_pesanan || '',
      namaPelanggan: dbItem.nama_pelanggan || '',
      teleponPelanggan: dbItem.telepon_pelanggan || '',
      emailPelanggan: dbItem.email_pelanggan || '',
      alamatPengiriman: dbItem.alamat_pengiriman || '',
      tanggal: parsedTanggal || new Date(),
      items: Array.isArray(dbItem.items) ? dbItem.items : [],
      totalPesanan: Number(dbItem.total_pesanan) || 0,
      status: dbItem.status || 'pending',
      catatan: dbItem.catatan || '',
      subtotal: Number(dbItem.subtotal) || 0,
      pajak: Number(dbItem.pajak) || 0,
      userId: dbItem.user_id,
      createdAt: parsedCreatedAt || new Date(),
      updatedAt: parsedUpdatedAt || new Date(),
    };
  } catch (error) {
    console.error('Error transforming order from DB:', error, dbItem);
    
    // Return safe fallback order
    return {
      id: dbItem?.id || 'error',
      nomorPesanan: 'ERROR',
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
      userId: dbItem?.user_id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

export const transformOrderToDB = (data: Partial<Order>): { [key: string]: any } => {
  try {
    const dbData: { [key: string]: any } = {};
    
    // Safe property mapping dengan validasi
    if (data.namaPelanggan !== undefined) dbData.nama_pelanggan = data.namaPelanggan;
    if (data.teleponPelanggan !== undefined) dbData.telepon_pelanggan = data.teleponPelanggan;
    if (data.emailPelanggan !== undefined) dbData.email_pelanggan = data.emailPelanggan;
    if (data.alamatPengiriman !== undefined) dbData.alamat_pengiriman = data.alamatPengiriman;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.items !== undefined) dbData.items = data.items;
    if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
    if (data.catatan !== undefined) dbData.catatan = data.catatan;
    if (data.subtotal !== undefined) dbData.subtotal = data.subtotal;
    if (data.pajak !== undefined) dbData.pajak = data.pajak;
    
    // Enhanced date handling
    if (data.tanggal !== undefined) {
      if (data.tanggal instanceof Date && isValidDate(data.tanggal)) {
        dbData.tanggal = toSafeISOString(data.tanggal);
      } else if (typeof data.tanggal === 'string') {
        const parsedDate = safeParseDate(data.tanggal);
        dbData.tanggal = parsedDate ? toSafeISOString(parsedDate) : toSafeISOString(new Date());
      } else {
        dbData.tanggal = toSafeISOString(new Date());
      }
    }
    
    return dbData;
  } catch (error) {
    console.error('Error transforming order to DB:', error, data);
    
    // Return safe minimal data
    return {
      nama_pelanggan: data.namaPelanggan || 'Error',
      status: data.status || 'pending',
      total_pesanan: data.totalPesanan || 0,
      tanggal: toSafeISOString(new Date())
    };
  }
};

// Validation Utilities
export const validateOrderData = (data: Partial<NewOrder>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.namaPelanggan || data.namaPelanggan.trim() === '') {
    errors.push('Nama pelanggan harus diisi');
  }
  
  if (!data.totalPesanan || data.totalPesanan <= 0) {
    errors.push('Total pesanan harus lebih dari 0');
  }
  
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Minimal harus ada 1 item pesanan');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Array & Object Helpers
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

export const calculateOrderStats = (orders: Order[]) => {
  const stats = {
    total: orders.length,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };
  
  orders.forEach(order => {
    if (order.status === 'pending') stats.pending++;
    if (order.status === 'completed') stats.completed++;
    if (order.status === 'cancelled') stats.cancelled++;
    if (order.status === 'completed') stats.totalRevenue += order.totalPesanan;
  });
  
  stats.averageOrderValue = stats.completed > 0 ? stats.totalRevenue / stats.completed : 0;
  
  return stats;
};