// src/utils/queryOptimization.ts
// ✅ PERFORMANCE UTILITY: Optimized query selectors untuk menghindari select('*')

// ===========================================
// ✅ COMMON SELECT FIELDS
// ===========================================

export const SELECT_FIELDS = {
  // Device fields - hanya kolom yang diperlukan untuk UI/logic
  devices: {
    minimal: 'id, device_id, device_name, last_active',
    full: 'id, device_id, device_type, os, browser, device_name, ip_address, last_active, is_current, created_at',
    cleanup: 'id, last_active' // Untuk cleanup operations
  },

  // Purchase fields - exclude metadata yang tidak perlu untuk performa
  purchases: {
    full: 'id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at',
    list: 'id, user_id, supplier, tanggal, total_nilai, status, created_at', // Untuk list view yang tidak butuh items
    minimal: 'id, supplier, tanggal, total_nilai, status' // Untuk dropdown/reference
  },

  // Notification fields - exclude metadata/complex fields
  notifications: {
    full: 'id, user_id, title, message, type, icon, priority, related_type, related_id, action_url, is_read, is_archived, expires_at, created_at, updated_at',
    list: 'id, title, message, type, icon, is_read, created_at', // Untuk notification bell
    minimal: 'id, title, type, is_read' // Untuk count/status check
  },

  // Notification Settings - hanya field yang dipakai
  notificationSettings: {
    core: 'user_id, push_notifications, inventory_alerts, order_alerts, financial_alerts, created_at, updated_at',
    minimal: 'user_id, push_notifications, inventory_alerts, order_alerts, financial_alerts'
  },

  // Bahan Baku fields - untuk warehouse operations
  bahanBaku: {
    full: 'id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at',
    list: 'id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier',
    minimal: 'id, nama, stok, satuan, harga_satuan' // Untuk calculations
  },

  // Financial Transactions
  financialTransactions: {
    full: 'id, user_id, type, amount, category, description, date, related_id, created_at, updated_at',
    list: 'id, type, amount, category, description, date, created_at',
    minimal: 'id, type, amount, date' // Untuk quick calculations
  },

  // Suppliers
  suppliers: {
    full: 'id, user_id, nama, kontak, email, telepon, alamat, catatan, created_at, updated_at',
    list: 'id, nama, kontak, email, telepon',
    minimal: 'id, nama' // Untuk dropdown/reference
  },

  // Orders
  orders: {
    full: 'id, user_id, nomor_pesanan, tanggal, status, nama_pelanggan, telepon_pelanggan, email_pelanggan, alamat_pengiriman, items, total_pesanan, catatan, created_at, updated_at',
    list: 'id, nomor_pesanan, tanggal, status, nama_pelanggan, total_pesanan, created_at',
    minimal: 'id, nomor_pesanan, status, total_pesanan'
  },

  // Recipes
  recipes: {
    full: 'id, user_id, nama_resep, jumlah_porsi, kategori_resep, deskripsi, foto_url, bahan_resep, biaya_tenaga_kerja, biaya_overhead, margin_keuntungan_persen, total_hpp, hpp_per_porsi, harga_jual_porsi, jumlah_pcs_per_porsi, hpp_per_pcs, harga_jual_per_pcs, created_at, updated_at',
    list: 'id, nama_resep, kategori_resep, jumlah_porsi, total_hpp, hpp_per_porsi, harga_jual_porsi, created_at',
    minimal: 'id, nama_resep, total_hpp, hpp_per_porsi'
  }
} as const;

// ===========================================
// ✅ QUERY BUILDER HELPERS
// ===========================================

type QueryOptions = {
  userId?: string;
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Record<string, any>;
};

export class OptimizedQueryBuilder {
  
  /**
   * Buat query yang optimized untuk list operations
   */
  static buildListQuery(
    table: string, 
    selectFields: string, 
    options: QueryOptions = {}
  ) {
    const { userId, limit, orderBy, filters } = options;
    
    let query = `${selectFields}`;
    const conditions: string[] = [];
    
    if (userId) {
      conditions.push(`user_id=eq.${userId}`);
    }
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        conditions.push(`${key}=eq.${value}`);
      });
    }
    
    const conditionString = conditions.length > 0 ? conditions.join('&') : '';
    
    return {
      select: selectFields,
      filter: conditionString,
      limit: limit || undefined,
      orderBy: orderBy || undefined
    };
  }
  
  /**
   * Get minimal fields untuk count operations
   */
  static getCountFields(table: keyof typeof SELECT_FIELDS): string {
    const fields = SELECT_FIELDS[table];
    if ('minimal' in fields) {
      return fields.minimal;
    }
    return 'id'; // fallback
  }
  
  /**
   * Get list fields untuk table operations
   */
  static getListFields(table: keyof typeof SELECT_FIELDS): string {
    const fields = SELECT_FIELDS[table];
    if ('list' in fields) {
      return fields.list;
    }
    return fields.full || 'id';
  }
  
  /**
   * Get full fields untuk detail operations
   */
  static getFullFields(table: keyof typeof SELECT_FIELDS): string {
    const fields = SELECT_FIELDS[table];
    return fields.full || 'id';
  }
}

// ===========================================
// ✅ COMMON QUERY PATTERNS
// ===========================================

export const COMMON_QUERIES = {
  
  /**
   * Count total records untuk user
   */
  getCountQuery: (table: string, userId: string) => ({
    select: 'id',
    count: 'exact',
    head: true,
    filter: `user_id=eq.${userId}`
  }),
  
  /**
   * Get latest N records untuk user
   */
  getLatestQuery: (table: string, selectFields: string, userId: string, limit: number = 10) => ({
    select: selectFields,
    filter: `user_id=eq.${userId}`,
    orderBy: { column: 'created_at', ascending: false },
    limit
  }),
  
  /**
   * Get records by status
   */
  getByStatusQuery: (table: string, selectFields: string, userId: string, status: string) => ({
    select: selectFields,
    filter: `user_id=eq.${userId}&status=eq.${status}`
  }),
  
  /**
   * Get active/non-archived records
   */
  getActiveQuery: (table: string, selectFields: string, userId: string) => ({
    select: selectFields,
    filter: `user_id=eq.${userId}&is_archived=eq.false`
  })
  
} as const;

// ===========================================
// ✅ PERFORMANCE METRICS
// ===========================================

export class QueryPerformanceTracker {
  private static metrics: Record<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    lastExecuted: Date;
  }> = {};
  
  static trackQuery(queryName: string, executionTime: number) {
    if (!this.metrics[queryName]) {
      this.metrics[queryName] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        lastExecuted: new Date()
      };
    }
    
    const metric = this.metrics[queryName];
    metric.count++;
    metric.totalTime += executionTime;
    metric.avgTime = metric.totalTime / metric.count;
    metric.lastExecuted = new Date();
  }
  
  static getMetrics() {
    return { ...this.metrics };
  }
  
  static resetMetrics() {
    this.metrics = {};
  }
  
  /**
   * Log slow queries (> 1000ms)
   */
  static logSlowQueries() {
    const slowQueries = Object.entries(this.metrics)
      .filter(([_, metric]) => metric.avgTime > 1000)
      .sort(([_, a], [__, b]) => b.avgTime - a.avgTime);
    
    if (slowQueries.length > 0) {
      console.warn('🐌 Slow queries detected:', slowQueries);
    }
    
    return slowQueries;
  }
}

// ===========================================
// ✅ USAGE EXAMPLES
// ===========================================

/*
// Example usage:

// 1. Use optimized select fields
import { SELECT_FIELDS } from '@/utils/queryOptimization';

const { data } = await supabase
  .from('purchases')
  .select(SELECT_FIELDS.purchases.list) // Instead of select('*')
  .eq('user_id', userId);

// 2. Use query builder
import { OptimizedQueryBuilder } from '@/utils/queryOptimization';

const listFields = OptimizedQueryBuilder.getListFields('purchases');
const { data } = await supabase
  .from('purchases')
  .select(listFields)
  .eq('user_id', userId);

// 3. Track query performance
import { QueryPerformanceTracker } from '@/utils/queryOptimization';

const start = performance.now();
const { data } = await supabase.from('purchases').select(`\n          id,\n          nomor_pesanan,\n          tanggal,\n          nama_pelanggan,\n          telepon_pelanggan,\n          email_pelanggan,\n          alamat_pengiriman,\n          status,\n          total_pesanan,\n          catatan,\n          items,\n          created_at,\n          updated_at\n        `)         id,\n          nomor_pesanan,\n          tanggal,\n          nama_pelanggan,\n          telepon_pelanggan,\n          email_pelanggan,\n          alamat_pengiriman,\n          status,\n          total_pesanan,\n          catatan,\n          items,\n          created_at,\n          updated_at\n        `);
const end = performance.now();
QueryPerformanceTracker.trackQuery('purchases:fetchAll', end - start);

*/

export default {
  SELECT_FIELDS,
  OptimizedQueryBuilder,
  COMMON_QUERIES,
  QueryPerformanceTracker
};
