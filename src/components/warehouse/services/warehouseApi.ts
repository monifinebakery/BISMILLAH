import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BahanBaku } from '../types';

/**
 * Warehouse API Service (Fixed for user_id column)
 * Handles database operations with proper column naming
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
 * CRUD Service - Core database operations (Fixed for user_id)
 */
class CrudService {
  constructor(private config: ServiceConfig) {}

  async fetchBahanBaku(): Promise<BahanBaku[]> {
    try {
      let query = supabase.from('bahan_baku').select('*');
      
      // Use user_id (with underscore) for filtering
      if (this.config.userId) {
        const { data, error } = await query.eq('user_id', this.config.userId).order('nama', { ascending: true });
        
        if (error) {
          // If user_id column doesn't exist, fall back to fetching all data
          if (error.message.includes('user_id') || error.message.includes('column')) {
            logger.warn('user_id column not found, fetching all data');
            const { data: allData, error: fallbackError } = await supabase
              .from('bahan_baku')
              .select('*')
              .order('nama', { ascending: true });
            
            if (fallbackError) throw fallbackError;
            return allData || [];
          }
          throw error;
        }
        
        return data || [];
      } else {
        // No userId provided, fetch all data
        const { data, error } = await query.order('nama', { ascending: true });
        if (error) throw error;
        return data || [];
      }
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  async addBahanBaku(bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> {
    try {
      const insertData: any = { ...bahan };
      
      // Add user_id (with underscore) if available
      if (this.config.userId) {
        insertData.user_id = this.config.userId;
      }

      const { error } = await supabase
        .from('bahan_baku')
        .insert(insertData);

      if (error) {
        // If user_id column doesn't exist, try without it
        if (error.message.includes('user_id') || error.message.includes('column')) {
          logger.warn('user_id column not found, inserting without user_id');
          const { user_id, ...dataWithoutUserId } = insertData;
          const { error: fallbackError } = await supabase
            .from('bahan_baku')
            .insert(dataWithoutUserId);
          
          if (fallbackError) throw fallbackError;
          return true;
        }
        throw error;
      }
      
      return true;
    } catch (error: any) {
      this.handleError('Add failed', error);
      return false;
    }
  }

  async updateBahanBaku(id: string, updates: Partial<BahanBaku>): Promise<boolean> {
    try {
      // Remove userId from updates to avoid issues (it should be user_id in DB anyway)
      const { userId, ...safeUpdates } = updates as any;
      
      let query = supabase
        .from('bahan_baku')
        .update(safeUpdates)
        .eq('id', id);

      // Add user_id filter if available
      if (this.config.userId) {
        const { error } = await query.eq('user_id', this.config.userId);
        
        if (error && (error.message.includes('user_id') || error.message.includes('column'))) {
          // Fallback: update without user_id filter
          const { error: fallbackError } = await supabase
            .from('bahan_baku')
            .update(safeUpdates)
            .eq('id', id);
          
          if (fallbackError) throw fallbackError;
          return true;
        }
        if (error) throw error;
        return true;
      } else {
        const { error } = await query;
        if (error) throw error;
        return true;
      }
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
        const { error } = await query.eq('user_id', this.config.userId);
        
        if (error && (error.message.includes('user_id') || error.message.includes('column'))) {
          // Fallback: delete without user_id filter
          const { error: fallbackError } = await supabase
            .from('bahan_baku')
            .delete()
            .eq('id', id);
          
          if (fallbackError) throw fallbackError;
          return true;
        }
        if (error) throw error;
        return true;
      } else {
        const { error } = await query;
        if (error) throw error;
        return true;
      }
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
        const { error } = await query.eq('user_id', this.config.userId);
        
        if (error && (error.message.includes('user_id') || error.message.includes('column'))) {
          // Fallback: delete without user_id filter
          const { error: fallbackError } = await supabase
            .from('bahan_baku')
            .delete()
            .in('id', ids);
          
          if (fallbackError) throw fallbackError;
          return true;
        }
        if (error) throw error;
        return true;
      } else {
        const { error } = await query;
        if (error) throw error;
        return true;
      }
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
 * Subscription Service - Real-time updates (Fixed for user_id)
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
          // Use user_id (with underscore) for filtering
          filter: this.config.userId ? `user_id=eq.${this.config.userId}` : undefined
        }, (payload) => {
          if (this.config.enableDebugLogs) {
            logger.debug('Subscription update:', payload);
          }
          // Handle real-time updates here
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
 * Alert Service - Notifications
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