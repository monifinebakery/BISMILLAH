// src/components/warehouse/services/warehouseApi.ts (Updated for exact Supabase schema)
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { BahanBaku, BahanBakuFrontend } from '../types';

/**
 * Warehouse API Service (Updated for exact Supabase column names)
 * Handles transformation between database snake_case and frontend camelCase
 */

interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

// Data transformation helpers
const transformToFrontend = (dbItem: BahanBaku): BahanBakuFrontend => ({
  id: dbItem.id,
  userId: dbItem.user_id,
  nama: dbItem.nama,
  kategori: dbItem.kategori,
  stok: dbItem.stok,
  minimum: dbItem.minimum,
  satuan: dbItem.satuan,
  harga: dbItem.harga_satuan,
  supplier: dbItem.supplier,
  expiry: dbItem.tanggal_kadaluwarsa,
  createdAt: dbItem.created_at,
  updatedAt: dbItem.updated_at,
  jumlahBeliKemasan: dbItem.jumlah_beli_kemasan,
  satuanKemasan: dbItem.satuan_kemasan,
  hargaTotalBeliKemasan: dbItem.harga_total_beli_kemasan,
});

const transformToDatabase = (frontendItem: Partial<BahanBakuFrontend>, userId?: string): Partial<BahanBaku> => {
  const dbItem: Partial<BahanBaku> = {
    nama: frontendItem.nama,
    kategori: frontendItem.kategori,
    stok: frontendItem.stok,
    minimum: frontendItem.minimum,
    satuan: frontendItem.satuan,
    harga_satuan: frontendItem.harga,
    supplier: frontendItem.supplier,
    tanggal_kadaluwarsa: frontendItem.expiry,
    jumlah_beli_kemasan: frontendItem.jumlahBeliKemasan,
    satuan_kemasan: frontendItem.satuanKemasan,
    harga_total_beli_kemasan: frontendItem.hargaTotalBeliKemasan,
  };

  // Add user_id if provided
  if (userId) {
    dbItem.user_id = userId;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(dbItem).filter(([_, value]) => value !== undefined)
  ) as Partial<BahanBaku>;
};

// Service Factory
export const warehouseApi = {
  createService: async (serviceName: string, config: ServiceConfig) => {
    switch (serviceName) {
      case 'crud':
        return new CrudService(config);
      case 'subscription':
        return new SubscriptionService(config);
      case 'cache':
        return new CacheService(config);
      case 'alert':
        return new AlertService(config);
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }
};

/**
 * CRUD Service - Core database operations (Updated for exact schema)
 */
class CrudService {
  constructor(private config: ServiceConfig) {}

  async fetchBahanBaku(): Promise<BahanBakuFrontend[]> {
    try {
      let query = supabase.from('bahan_baku').select('*');
      
      // Filter by user_id if provided
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { data, error } = await query.order('nama', { ascending: true });
      
      if (error) throw error;
      
      // Transform database format to frontend format
      return (data || []).map(transformToFrontend);
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  async addBahanBaku(bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> {
    try {
      // Transform frontend data to database format
      const dbData = transformToDatabase(bahan, this.config.userId);

      const { error } = await supabase
        .from('bahan_baku')
        .insert(dbData);

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Add failed', error);
      return false;
    }
  }

  async updateBahanBaku(id: string, updates: Partial<BahanBakuFrontend>): Promise<boolean> {
    try {
      // Transform frontend updates to database format
      const dbUpdates = transformToDatabase(updates);
      
      // Remove user_id from updates to avoid changing ownership
      delete dbUpdates.user_id;

      let query = supabase
        .from('bahan_baku')
        .update(dbUpdates)
        .eq('id', id);

      // Add user_id filter if available
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Update failed', error);
      return false;
    }
  }

  async deleteBahanBaku(id: string): Promise<boolean> {
    try {
      let query = supabase
        .from('bahan_baku')
        .delete()
        .eq('id', id);

      // Add user_id filter if available
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Delete failed', error);
      return false;
    }
  }

  async bulkDeleteBahanBaku(ids: string[]): Promise<boolean> {
    try {
      let query = supabase
        .from('bahan_baku')
        .delete()
        .in('id', ids);

      // Add user_id filter if available
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Bulk delete failed', error);
      return false;
    }
  }

  async reduceStok(nama: string, jumlah: number, currentItems: BahanBakuFrontend[]): Promise<boolean> {
    const item = currentItems.find(b => b.nama.toLowerCase() === nama.toLowerCase());
    if (!item) return false;

    const newStok = Math.max(0, item.stok - jumlah);
    return this.updateBahanBaku(item.id, { stok: newStok });
  }

  private handleError(message: string, error: any) {
    const errorMsg = `${message}: ${error.message || error}`;
    if (this.config.enableDebugLogs) {
      logger.error('CrudService:', errorMsg);
    }
    this.config.onError?.(errorMsg);
  }
}

/**
 * Subscription Service - Real-time updates (Updated for exact schema)
 */
class SubscriptionService {
  private subscription: any = null;

  constructor(private config: ServiceConfig) {}

  setupSubscription() {
    if (!this.config.userId) return;

    try {
      this.subscription = supabase
        .channel('bahan_baku_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bahan_baku',
          filter: this.config.userId ? `user_id=eq.${this.config.userId}` : undefined
        }, (payload) => {
          if (this.config.enableDebugLogs) {
            logger.debug('Subscription update:', payload);
          }
          // Transform and handle real-time updates here
          if (payload.new) {
            const transformedData = transformToFrontend(payload.new as BahanBaku);
            // Handle the transformed data
          }
        })
        .subscribe((status) => {
          if (this.config.enableDebugLogs) {
            logger.debug('Subscription status:', status);
          }
        });
    } catch (error) {
      logger.warn('Subscription setup failed, continuing without real-time updates:', error);
    }
  }

  cleanupSubscription() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }
}

/**
 * Cache Service - Simple in-memory caching
 */
class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(private config: ServiceConfig) {}

  set(key: string, data: any, ttlMinutes: number = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Alert Service - Notifications (Updated for frontend types)
 */
class AlertService {
  constructor(private config: ServiceConfig) {}

  processLowStockAlert(items: BahanBakuFrontend[]) {
    const lowStockItems = items.filter(item => item.stok <= item.minimum);
    if (lowStockItems.length > 0 && this.config.enableDebugLogs) {
      logger.warn(`Low stock alert: ${lowStockItems.length} items`);
    }
  }

  processExpiryAlert(items: BahanBakuFrontend[]) {
    const expiringItems = items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 7); // 7 days warning
      return expiryDate <= threshold && expiryDate > new Date();
    });

    if (expiringItems.length > 0 && this.config.enableDebugLogs) {
      logger.warn(`Expiry alert: ${expiringItems.length} items expiring soon`);
    }
  }
}

// Export transformation helpers for use in other parts of the app
export { transformToFrontend, transformToDatabase };