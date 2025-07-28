import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { BahanBaku } from '../types';

/**
 * Warehouse API Service
 * Simplified and lightweight API layer (~10KB)
 */

interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

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
 * CRUD Service - Core database operations
 */
class CrudService {
  constructor(private config: ServiceConfig) {}

  async fetchBahanBaku(): Promise<BahanBaku[]> {
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('userId', this.config.userId)
        .order('nama', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  async addBahanBaku(bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bahan_baku')
        .insert({
          ...bahan,
          userId: this.config.userId,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Add failed', error);
      return false;
    }
  }

  async updateBahanBaku(id: string, updates: Partial<BahanBaku>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bahan_baku')
        .update(updates)
        .eq('id', id)
        .eq('userId', this.config.userId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Update failed', error);
      return false;
    }
  }

  async deleteBahanBaku(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .eq('id', id)
        .eq('userId', this.config.userId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Delete failed', error);
      return false;
    }
  }

  async bulkDeleteBahanBaku(ids: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .in('id', ids)
        .eq('userId', this.config.userId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Bulk delete failed', error);
      return false;
    }
  }

  async reduceStok(nama: string, jumlah: number, currentItems: BahanBaku[]): Promise<boolean> {
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
 * Subscription Service - Real-time updates (lightweight)
 */
class SubscriptionService {
  private subscription: any = null;

  constructor(private config: ServiceConfig) {}

  setupSubscription() {
    if (!this.config.userId) return;

    this.subscription = supabase
      .channel('bahan_baku_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bahan_baku',
        filter: `userId=eq.${this.config.userId}`
      }, (payload) => {
        if (this.config.enableDebugLogs) {
          logger.debug('Subscription update:', payload);
        }
        // Handle real-time updates here
      })
      .subscribe();
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
 * Alert Service - Notifications (lightweight)
 */
class AlertService {
  constructor(private config: ServiceConfig) {}

  processLowStockAlert(items: BahanBaku[]) {
    const lowStockItems = items.filter(item => item.stok <= item.minimum);
    if (lowStockItems.length > 0 && this.config.enableDebugLogs) {
      logger.warn(`Low stock alert: ${lowStockItems.length} items`);
    }
  }

  processExpiryAlert(items: BahanBaku[]) {
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