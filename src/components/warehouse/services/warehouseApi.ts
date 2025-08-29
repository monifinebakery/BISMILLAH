// src/components/warehouse/services/warehouseApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
// ✅ UPDATED: Import unified date utilities for consistency
import { UnifiedDateHandler, WarehouseDateUtils } from '@/utils/unifiedDateHandler';
import { enhancedDateUtils } from '@/utils/enhancedDateUtils';
import type { BahanBaku, BahanBakuFrontend } from '../types';

export interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

// Transform DB -> FE (tetap boleh membaca field kemasan lama untuk kompatibilitas tampilan,
// tapi TIDAK dipakai untuk menghitung/menulis apa pun di warehouse)
const transformToFrontend = (dbItem: any): BahanBakuFrontend => {
  const wac = dbItem.harga_rata_rata != null ? Number(dbItem.harga_rata_rata) : undefined;

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
    supplier: dbItem.supplier || '',
    expiry: dbItem.tanggal_kadaluwarsa ? enhancedDateUtils.parseAndValidateTimestamp(dbItem.tanggal_kadaluwarsa).date : undefined,
    createdAt: enhancedDateUtils.parseAndValidateTimestamp(dbItem.created_at).date,
    updatedAt: enhancedDateUtils.parseAndValidateTimestamp(dbItem.updated_at).date,
  };
};

// Transform FE -> DB (❗️tanpa field kemasan)
const transformToDatabase = (frontendItem: Partial<BahanBakuFrontend>, userId?: string): any => {
  const dbItem: any = {
    id: frontendItem.id,
    nama: frontendItem.nama,
    kategori: frontendItem.kategori,
    stok: frontendItem.stok,
    minimum: frontendItem.minimum,
    satuan: frontendItem.satuan,
    harga_satuan: frontendItem.harga,
    harga_rata_rata: frontendItem.hargaRataRata,
    supplier: frontendItem.supplier || '',
    tanggal_kadaluwarsa: frontendItem.expiry ? enhancedDateUtils.toDatabaseTimestamp(frontendItem.expiry) : null,
  };
  if (userId) dbItem.user_id = userId;

  return Object.fromEntries(
    Object.entries(dbItem).filter(([, v]) => v !== undefined)
  );
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

      return (data || []).map((item: any) => transformToFrontend(item));
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  // 🎯 NEW: Fetch materials with pagination
  async fetchBahanBakuPaginated(page: number = 1, limit: number = 10): Promise<{
    data: BahanBakuFrontend[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      let countQuery = supabase.from('bahan_baku').select('*', { count: 'exact', head: true });
      if (this.config.userId) countQuery = countQuery.eq('user_id', this.config.userId);
      
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      // Get paginated data
      let query = supabase.from('bahan_baku').select(`
        id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier,
        tanggal_kadaluwarsa, created_at, updated_at,
        harga_rata_rata
      `);
      
      if (this.config.userId) query = query.eq('user_id', this.config.userId);
      
      const { data, error } = await query
        .order('nama', { ascending: true })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      
      const transformedData = (data || []).map((item: any) => transformToFrontend(item));
      
      return {
        data: transformedData,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error: any) {
      this.handleError('Paginated fetch failed', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  // 🎯 NEW: Fetch materials by date range for profit analysis
  async fetchBahanBakuByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<BahanBakuFrontend[]> {
    try {
      const startYMD = enhancedDateUtils.toDatabaseTimestamp(startDate);
      const endYMD = enhancedDateUtils.toDatabaseTimestamp(endDate);

      console.log('🔍 Fetching warehouse materials by date range (IMPROVED):', {
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

      const materials = (data || []).map((item: any) => transformToFrontend(item));

      console.log('🔍 Filtered warehouse materials result (IMPROVED):', {
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
      const { error } = await supabase.from('bahan_baku').insert(dbData as any);
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
      let query = supabase.from('bahan_baku').select('id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at').eq('id', id);
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
      // First, get the bahan info for logging
      const { data: existingBahan, error: fetchError } = await supabase
        .from('bahan_baku')
        .select('id, nama')
        .eq('id', id)
        .eq('user_id', this.config.userId || '')
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch material for deletion: ${fetchError.message}`);
      }
      
      if (!existingBahan) {
        console.log('🗑️ Material already deleted or not found');
        return true;
      }
      
      // 🧹 CLEANUP: Delete related pemakaian_bahan records 
      // (though these should cascade delete automatically via FK)
      const { error: usageCleanupError } = await supabase
        .from('pemakaian_bahan')
        .delete()
        .eq('bahan_baku_id', id)
        .eq('user_id', this.config.userId || '');
        
      if (usageCleanupError) {
        console.warn('Warning: Failed to clean up pemakaian_bahan records:', usageCleanupError.message);
        // Continue with deletion since FK should handle this
      }
      
      // Note: We cannot easily clean up JSONB references in recipes.bahan_resep
      // This would require a more complex query or app-level cleanup
      // Consider adding a cleanup job or handling this in recipe context
      
      // Delete the main bahan_baku record
      let query = supabase.from('bahan_baku').delete().eq('id', id);
      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { error } = await query;
      if (error) throw error;
      
      console.log(`✅ Material "${existingBahan.nama}" and related data deleted successfully`);
      return true;
    } catch (error: any) {
      this.handleError('Delete failed', error);
      return false;
    }
  }

  async bulkDeleteBahanBaku(ids: string[]): Promise<boolean> {
    try {
      // First, get names for logging
      const { data: existingBahan } = await supabase
        .from('bahan_baku')
        .select('id, nama')
        .in('id', ids)
        .eq('user_id', this.config.userId || '');
        
      const bahanNames = existingBahan?.map(b => b.nama) || [];
      
      // 🧹 CLEANUP: Delete related pemakaian_bahan records for all materials
      const { error: usageCleanupError } = await supabase
        .from('pemakaian_bahan')
        .delete()
        .in('bahan_baku_id', ids)
        .eq('user_id', this.config.userId || '');
        
      if (usageCleanupError) {
        console.warn('Warning: Failed to clean up pemakaian_bahan records:', usageCleanupError.message);
        // Continue with deletion since FK should handle this
      }
      
      // Delete the main bahan_baku records
      let query = supabase.from('bahan_baku').delete().in('id', ids);
      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      const { error } = await query;
      if (error) throw error;
      
      console.log(`✅ Bulk deleted ${ids.length} materials and related data:`, bahanNames.join(', '));
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
