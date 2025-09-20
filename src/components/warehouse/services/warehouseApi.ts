// src/components/warehouse/services/warehouseApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
// ✅ UPDATED: Import unified date utilities for consistency
import { UnifiedDateHandler, WarehouseDateUtils } from '@/utils/unifiedDateHandler';
// ✅ NEW: Import standardized date range filtering
import { applyStandardDateRangeFilters, STANDARD_DATE_FIELDS } from '@/utils/standardDateRangeFiltering';
// ✅ NEW: Import type utilities for consistent type conversion
import { toNumber, toDate, normalizeBahanBaku, normalizeBahanBakuFrontend } from '../utils/typeUtils';
import type { BahanBaku, BahanBakuFrontend } from '../types';

export interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

export interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

// Transform DB -> FE (tetap boleh membaca field kemasan lama untuk kompatibilitas tampilan,
// tapi TIDAK dipakai untuk menghitung/menulis apa pun di warehouse)
const transformToFrontend = (dbItem: any): BahanBakuFrontend => {
  const wac = dbItem.harga_rata_rata != null ? toNumber(dbItem.harga_rata_rata) : undefined;

  return {
    id: dbItem.id,
    userId: dbItem.user_id,
    nama: dbItem.nama,
    kategori: dbItem.kategori,
    stok: toNumber(dbItem.stok),
    minimum: toNumber(dbItem.minimum),
    satuan: dbItem.satuan,
    harga: toNumber(dbItem.harga_satuan),
    hargaRataRata: wac,
    supplier: dbItem.supplier || '',
    expiry: toDate(dbItem.tanggal_kadaluwarsa),
    createdAt: toDate(dbItem.created_at) || new Date(),
    updatedAt: toDate(dbItem.updated_at) || new Date(),
  };
};

// Transform FE -> DB (❗️tanpa field kemasan)
const transformToDatabase = (frontendItem: Partial<BahanBakuFrontend>, userId?: string): any => {
  const dbItem: Record<string, any> = {};

  if (frontendItem.id !== undefined) dbItem.id = frontendItem.id;
  if (frontendItem.nama !== undefined) dbItem.nama = frontendItem.nama;
  if (frontendItem.kategori !== undefined) dbItem.kategori = frontendItem.kategori;

  if ('stok' in frontendItem && frontendItem.stok !== undefined) {
    dbItem.stok = toNumber(frontendItem.stok);
  }

  if ('minimum' in frontendItem && frontendItem.minimum !== undefined) {
    dbItem.minimum = toNumber(frontendItem.minimum);
  }

  if (frontendItem.satuan !== undefined) {
    dbItem.satuan = frontendItem.satuan;
  }

  if ('harga' in frontendItem && frontendItem.harga !== undefined) {
    dbItem.harga_satuan = toNumber(frontendItem.harga);
  }

  if ('hargaRataRata' in frontendItem) {
    const value = (frontendItem as any).hargaRataRata;
    if (value === null) {
      dbItem.harga_rata_rata = null;
    } else if (value !== undefined) {
      dbItem.harga_rata_rata = toNumber(value);
    }
  }

  if (frontendItem.supplier !== undefined) {
    dbItem.supplier = frontendItem.supplier || '';
  }

  if ('expiry' in frontendItem) {
    const expiryValue = (frontendItem as any).expiry;

    if (expiryValue === null) {
      dbItem.tanggal_kadaluwarsa = null;
    } else if (expiryValue instanceof Date) {
      dbItem.tanggal_kadaluwarsa = isNaN(expiryValue.getTime()) ? null : expiryValue.toISOString();
    } else if (typeof expiryValue === 'string') {
      const parsedDate = new Date(expiryValue);
      dbItem.tanggal_kadaluwarsa = isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
    } else if (expiryValue !== undefined) {
      const parsedDate = new Date(expiryValue);
      dbItem.tanggal_kadaluwarsa = isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
    }
  }

  if (userId) {
    dbItem.user_id = userId;
  }

  return dbItem;
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

      return (data || []).map((item: any) => {
        // Normalize the data before transforming
        const normalizedItem = normalizeBahanBaku(item);
        return transformToFrontend(normalizedItem);
      });
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
      
      const transformedData = (data || []).map((item: any) => {
        // Normalize the data before transforming
        const normalizedItem = normalizeBahanBaku(item);
        return transformToFrontend(normalizedItem);
      });
      
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
      console.log('🔍 Fetching warehouse materials by date range (FIXED):', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId: this.config.userId
      });

      // ✅ FIXED: Use standardized date range filtering with both start and end dates
      let query = supabase.from('bahan_baku').select(`
        id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier,
        tanggal_kadaluwarsa, created_at, updated_at,
        harga_rata_rata
      `);

      if (this.config.userId) query = query.eq('user_id', this.config.userId);

      // Apply proper date range filtering (both start and end dates)
      query = applyStandardDateRangeFilters(query, {
        startDate,
        endDate,
        dateField: STANDARD_DATE_FIELDS.CREATED_AT
      });

      const { data, error } = await query.order('nama', { ascending: true });
      if (error) throw error;

      const materials = (data || []).map((item: any) => {
        // Normalize the data before transforming
        const normalizedItem = normalizeBahanBaku(item);
        return transformToFrontend(normalizedItem);
      });

      console.log('🔍 FIXED warehouse materials result:', {
        totalMaterials: materials.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
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
      // Normalize the input data
      const normalizedBahan = normalizeBahanBakuFrontend(bahan as BahanBakuFrontend);
      const dbData = transformToDatabase(normalizedBahan, this.config.userId);

      // Regular insert first
      const { error } = await supabase
        .from('bahan_baku')
        .insert(dbData as any);

      if (error) {
        // Handle specific unique constraint violation
        if (error.code === '23505') {
          // Check which constraint was violated
          if (error.message.includes('bahan_baku_unique_user_nama')) {
            throw new Error(
              `Bahan baku "${bahan.nama}" sudah ada. ` +
              `Gunakan nama yang berbeda atau update yang sudah ada.`
            );
          } else if (error.message.includes('bahan_baku_unique_user_nama_satuan')) {
            throw new Error(
              `Kombinasi "${bahan.nama}" dengan satuan "${bahan.satuan}" sudah ada. ` +
              `Gunakan nama atau satuan yang berbeda.`
            );
          } else {
            throw new Error(
              `Data bahan baku "${bahan.nama}" sudah ada. ` +
              `Periksa nama, satuan, atau kombinasi field lainnya.`
            );
          }
        }
        throw error;
      }
      return true;
    } catch (error: any) {
      // Enhanced error logging and re-throw for better user experience
      logger.error('Add bahan baku failed:', {
        error: error.message,
        code: error.code,
        bahan: bahan.nama,
        satuan: bahan.satuan
      });
      throw error; // Re-throw to let context handle user notification
    }
  }

  async updateBahanBaku(id: string, updates: Partial<BahanBakuFrontend>): Promise<boolean> {
    try {
      // Hanya transform field yang benar-benar dikirim supaya nilai lain tidak ter-reset
      const dbUpdates = transformToDatabase(updates);
      delete (dbUpdates as any).user_id;

      if (Object.keys(dbUpdates).length === 0) {
        logger.warn('UpdateBahanBaku dipanggil tanpa field yang valid', { id, updates });
        return true;
      }

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
      return data ? (() => {
        // Normalize the data before transforming
        const normalizedItem = normalizeBahanBaku(data as any);
        return transformToFrontend(normalizedItem);
      })() : null;
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
      // Validate input
      if (!ids || ids.length === 0) {
        logger.warn('Bulk delete called with empty IDs');
        return true;
      }
      
      if (!this.config.userId) {
        throw new Error('User ID is required for bulk delete');
      }
      
      logger.info(`Starting bulk delete for ${ids.length} items:`, ids);
      
      // First, get names for logging
      const { data: existingBahan, error: fetchError } = await supabase
        .from('bahan_baku')
        .select('id, nama')
        .in('id', ids)
        .eq('user_id', this.config.userId);
        
      if (fetchError) {
        logger.error('Failed to fetch materials for bulk delete:', fetchError);
        throw fetchError;
      }
        
      const bahanNames = existingBahan?.map(b => b.nama) || [];
      const foundIds = existingBahan?.map(b => b.id) || [];
      
      if (foundIds.length === 0) {
        logger.warn('No materials found for bulk delete - they may already be deleted');
        return true;
      }
      
      logger.info(`Found ${foundIds.length} materials to delete:`, bahanNames);
      
      // 🧹 CLEANUP: Delete related pemakaian_bahan records for all materials
      try {
        const { error: usageCleanupError } = await supabase
          .from('pemakaian_bahan')
          .delete()
          .in('bahan_baku_id', foundIds)
          .eq('user_id', this.config.userId);
          
        if (usageCleanupError) {
          console.warn('Warning: Failed to clean up pemakaian_bahan records:', usageCleanupError.message);
          // Continue with deletion since FK should handle this
        }
      } catch (cleanupError) {
        console.warn('Warning: Cleanup error (continuing with main delete):', cleanupError);
      }
      
      // Delete the main bahan_baku records
      const { error: deleteError } = await supabase
        .from('bahan_baku')
        .delete()
        .in('id', foundIds)
        .eq('user_id', this.config.userId);

      if (deleteError) {
        logger.error('Bulk delete failed:', deleteError);
        throw deleteError;
      }
      
      logger.info(`✅ Successfully bulk deleted ${foundIds.length} materials:`, bahanNames);
      return true;
    } catch (error: any) {
      logger.error('Bulk delete operation failed:', { error: error.message, ids });
      this.handleError('Bulk delete failed', error);
      throw new Error(`Failed to bulk delete items: ${error.message}`);
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
