// src/components/warehouse/services/warehouseApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { normalizeDateForDatabase } from '@/utils/dateNormalization';
import type { BahanBaku, BahanBakuFrontend } from '../types';

export interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

// Transform DB -> FE (tetap boleh membaca field kemasan lama untuk kompatibilitas tampilan,
// tapi TIDAK dipakai untuk menghitung/menulis apa pun di warehouse)
const transformToFrontend = (dbItem: BahanBaku): BahanBakuFrontend => {
  const wac = dbItem.harga_rata_rata != null ? Number(dbItem.harga_rata_rata) : null;

  return {
    id: dbItem.id,
    userId: dbItem.user_id,
    nama: dbItem.nama,
    kategori: dbItem.kategori,
    stok: Number(dbItem.stok) || 0,
    minimum: Number(dbItem.minimum) || 0,
    satuan: dbItem.satuan,
    harga: Number(dbItem.harga_satuan) || 0,
    hargaRataRata: wac,
    supplier: dbItem.supplier,
    expiry: dbItem.tanggal_kadaluwarsa,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  };
};

// Transform FE -> DB (❗️tanpa field kemasan)
const transformToDatabase = (frontendItem: Partial<BahanBakuFrontend>, userId?: string): Partial<BahanBaku> => {
  const dbItem: Partial<BahanBaku> = {
    id: frontendItem.id,
    nama: frontendItem.nama,
    kategori: frontendItem.kategori,
    stok: frontendItem.stok,
    minimum: frontendItem.minimum,
    satuan: frontendItem.satuan,
    harga_satuan: frontendItem.harga,
    harga_rata_rata: frontendItem.hargaRataRata,
    supplier: frontendItem.supplier,
    tanggal_kadaluwarsa: frontendItem.expiry || null,
  };
  if (userId) dbItem.user_id = userId;

  return Object.fromEntries(
    Object.entries(dbItem).filter(([, v]) => v !== undefined)
  ) as Partial<BahanBaku>;
};

class CrudService {
  constructor(private config: ServiceConfig) {}

  async fetchBahanBaku(): Promise<BahanBakuFrontend[]> {
    try {
      // Boleh keep select legacy cols untuk tampilan, tapi tidak dipakai kalkulasi
      let query = supabase.from('bahan_baku').select(`
        id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier,
        tanggal_kadaluwarsa, created_at, updated_at,
        harga_rata_rata
      `);

      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { data, error } = await query.order('nama', { ascending: true });
      if (error) throw error;

      return (data || []).map(transformToFrontend);
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  // 🎯 NEW: Fetch materials by date range for profit analysis
  async fetchBahanBakuByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<BahanBakuFrontend[]> {
    try {
      const startYMD = normalizeDateForDatabase(startDate);
      const endYMD = normalizeDateForDatabase(endDate);

      console.log('🔍 Fetching warehouse materials by date range:', {
        startDate: startYMD,
        endDate: endYMD,
        userId: this.config.userId
      });

      // Get materials that existed during the period (created before or during the period)
      let query = supabase.from('bahan_baku').select(`
        id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier,
        tanggal_kadaluwarsa, created_at, updated_at,
        harga_rata_rata
      `)
      .lte('created_at', endYMD + 'T23:59:59.999Z') // Created before or during the period
      .order('nama', { ascending: true });

      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { data, error } = await query;
      if (error) throw error;

      const materials = (data || []).map(transformToFrontend);

      console.log('🔍 Filtered warehouse materials result:', {
        totalMaterials: materials.length,
        dateRange: { startYMD, endYMD },
        materials: materials.slice(0, 3).map(m => ({
          nama: m.nama,
          stok: m.stok,
          harga: m.harga,
          created_at: m.createdAt
        }))
      });

      return materials;
    } catch (error: any) {
      this.handleError('Fetch by date range failed', error);
      return [];
    }
  }

  async addBahanBaku(
    bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { id?: string }
  ): Promise<boolean> {
    try {
      const dbData = transformToDatabase(bahan, this.config.userId);
      const { error } = await supabase.from('bahan_baku').insert(dbData);
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Add failed', error);
      return false;
    }
  }

  async updateBahanBaku(id: string, updates: Partial<BahanBakuFrontend>): Promise<boolean> {
    try {
      const dbUpdates = transformToDatabase(updates);
      delete (dbUpdates as any).user_id;

      let query = supabase.from('bahan_baku').update(dbUpdates).eq('id', id);
      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { error } = await query;
      if (error) throw error;

      return true;
    } catch (error: any) {
      this.handleError('Update failed', error);
      return false;
    }
  }

  async getBahanBakuById(id: string): Promise<BahanBakuFrontend | null> {
    try {
      let query = supabase.from('bahan_baku').select('*').eq('id', id);
      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? transformToFrontend(data as any) : null;
    } catch (error: any) {
      this.handleError('Get by ID failed', error);
      return null;
    }
  }

  async deleteBahanBaku(id: string): Promise<boolean> {
    try {
      let query = supabase.from('bahan_baku').delete().eq('id', id);
      if (this.config.userId) query = query.eq('user_id', this.config.userId);

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
      let query = supabase.from('bahan_baku').delete().in('id', ids);
      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Bulk delete failed', error);
      return false;
    }
  }

  // Utility
  private handleError(message: string, error: any) {
    const errorMsg = `${message}: ${error.message || error}`;
    logger.error('CrudService:', errorMsg);
    this.config.onError?.(errorMsg);
  }
}

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
          filter: `user_id=eq.${this.config.userId}`
        }, (payload) => {
          logger.debug('Subscription update:', payload);
        })
        .subscribe((status) => logger.debug('Subscription status:', status));
    } catch (error) {
      logger.warn('Subscription setup failed:', error);
    }
  }

  cleanupSubscription() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }
}

class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  constructor(private _config: ServiceConfig) {}
  set(key: string, data: any, ttlMinutes = 5) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMinutes * 60 * 1000 });
  }
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) { this.cache.delete(key); return null; }
    return item.data;
  }
  clear() { this.cache.clear(); }
  getStats() {
    const entries = Array.from(this.cache.values());
    const valid = entries.filter(it => Date.now() - it.timestamp <= it.ttl);
    const expired = entries.length - valid.length;
    return { total: entries.length, valid: valid.length, expired, hitRate: entries.length ? valid.length / entries.length : 1 };
  }
}

class AlertService {
  constructor(private _config: ServiceConfig) {}
  processLowStockAlert(items: BahanBakuFrontend[]) {
    return items.filter(i => i.stok <= i.minimum);
  }
  processExpiryAlert(items: BahanBakuFrontend[]) {
    const threshold = new Date(); threshold.setDate(threshold.getDate() + 7);
    return items.filter(i => i.expiry && new Date(i.expiry) <= threshold && new Date(i.expiry) > new Date());
  }
}

export const warehouseApi = {
  createService: async (serviceName: string, config: ServiceConfig) => {
    switch (serviceName) {
      case 'crud': return new CrudService(config);
      case 'subscription': return new SubscriptionService(config);
      case 'cache': return new CacheService(config);
      case 'alert': return new AlertService(config);
      default: throw new Error(`Unknown service: ${serviceName}`);
    }
  },
  // expose transformers (read-only)
  transformToFrontend,
  transformToDatabase,
};

// 🎯 Direct export for profit analysis date filtering
export const getWarehouseDataByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<BahanBakuFrontend[]> => {
  const crudService = new CrudService({ userId });
  return await crudService.fetchBahanBakuByDateRange(startDate, endDate);
};

export { transformToFrontend, transformToDatabase };
