// src/components/warehouse/services/warehouseApi.ts
// ✅ FIXED: Minor updates for type consistency and error handling
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BahanBaku, BahanBakuFrontend, PackageCalculation } from '../types';

/**
 * Warehouse API Service - Updated for Package Content Support
 * Handles transformation between database snake_case and frontend camelCase
 * Includes proper unit price calculation with package content
 */

interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

// ✅ ENHANCED: Data transformation helpers with package content support
// ✅ UPDATE: Tambahkan support untuk harga_rata_rata dan harga_rata2
const transformToFrontend = (dbItem: any): BahanBakuFrontend => {
  const frontendItem: BahanBakuFrontend = {
    id: dbItem.id,
    userId: dbItem.user_id,
    nama: dbItem.nama,
    kategori: dbItem.kategori,
    stok: Number(dbItem.stok) || 0, // ✅ FIXED: Ensure numeric conversion
    minimum: Number(dbItem.minimum) || 0,
    satuan: dbItem.satuan,
    // ⬇⬇⬇ penting: ambil WAC dari dua kemungkinan kolom
    hargaRataRata: dbItem.harga_rata_rata ?? dbItem.harga_rata2 ?? null,
    // fallback harga input satuan
    harga: Number(dbItem.harga_satuan) || 0,
    supplier: dbItem.supplier,
    expiry: dbItem.tanggal_kadaluwarsa,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
    jumlahBeliKemasan: Number(dbItem.jumlah_beli_kemasan) || 0,
    isiPerKemasan: Number(dbItem.isi_per_kemasan) || 1, // ✅ Default to 1
    satuanKemasan: dbItem.satuan_kemasan,
    hargaTotalBeliKemasan: Number(dbItem.harga_total_beli_kemasan) || 0,
  };

  return frontendItem;
};

const transformToDatabase = (frontendItem: Partial<BahanBakuFrontend>, userId?: string): Partial<BahanBaku> => {
  const dbItem: Partial<BahanBaku> = {
    nama: frontendItem.nama,
    kategori: frontendItem.kategori,
    stok: frontendItem.stok,
    minimum: frontendItem.minimum,
    satuan: frontendItem.satuan,
    harga_satuan: frontendItem.harga,
    supplier: frontendItem.supplier,
    tanggal_kadaluwarsa: frontendItem.expiry || null, // ✅ Pastikan null jika tidak ada
    jumlah_beli_kemasan: frontendItem.jumlahBeliKemasan || null, // ✅ Gunakan null jika 0
    isi_per_kemasan: frontendItem.isiPerKemasan || null,
    satuan_kemasan: frontendItem.satuanKemasan || null,
    harga_total_beli_kemasan: frontendItem.hargaTotalBeliKemasan || null,
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

// ✅ NEW: Package calculation helpers
const calculateUnitPrice = (jumlahKemasan: number, isiPerKemasan: number, hargaTotal: number): number => {
  if (jumlahKemasan <= 0 || isiPerKemasan <= 0 || hargaTotal <= 0) return 0;
  const totalContent = jumlahKemasan * isiPerKemasan;
  return Math.round(hargaTotal / totalContent);
};

const validatePackageCalculation = (calc: PackageCalculation): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (calc.jumlahKemasan <= 0) errors.push('Jumlah kemasan harus lebih dari 0');
  if (calc.isiPerKemasan <= 0) errors.push('Isi per kemasan harus lebih dari 0');
  if (calc.hargaTotal <= 0) errors.push('Harga total harus lebih dari 0');
  
  if (errors.length === 0) {
    const expectedTotal = calc.hargaPerSatuan * calc.totalIsi;
    const tolerance = Math.max(expectedTotal * 0.05, 100); // 5% tolerance
    
    if (Math.abs(expectedTotal - calc.hargaTotal) > tolerance) {
      errors.push(`Harga tidak konsisten: ${calc.hargaPerSatuan} × ${calc.totalIsi} ≠ ${calc.hargaTotal}`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// ✅ ENHANCED: Service Factory with calculation utilities
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
      case 'calculation': // ✅ NEW: calculation service
        return new CalculationService(config);
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },
  
  // ✅ NEW: Direct access to calculation utilities
  calculateUnitPrice,
  validatePackageCalculation,
  transformToFrontend,
  transformToDatabase
};

/**
 * ✅ ENHANCED: CRUD Service with package content support
 */
class CrudService {
  constructor(private config: ServiceConfig) {}

  async fetchBahanBaku(): Promise<BahanBakuFrontend[]> {
    try {
      let query = supabase.from('bahan_baku').select(`
        id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier,
        tanggal_kadaluwarsa, created_at, updated_at, jumlah_beli_kemasan,
        isi_per_kemasan, satuan_kemasan, harga_total_beli_kemasan,
        harga_rata_rata, harga_rata2
      `);
      
      // Filter by user_id if provided
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { data, error } = await query.order('nama', { ascending: true });
      
      if (error) throw error;
      
      // Transform database format to frontend format
      const transformedData = (data || []).map(transformToFrontend);
      
      // ✅ VALIDATE: Check for inconsistent pricing and log warnings
      if (this.config.enableDebugLogs) {
        transformedData.forEach(item => {
          if (item.jumlahBeliKemasan && item.isiPerKemasan && item.hargaTotalBeliKemasan) {
            const calculatedPrice = calculateUnitPrice(
              item.jumlahBeliKemasan, 
              item.isiPerKemasan, 
              item.hargaTotalBeliKemasan
            );
            
            if (Math.abs(calculatedPrice - item.harga) > item.harga * 0.1) { // 10% tolerance
              logger.warn(`Price inconsistency for ${item.nama}: calculated ${calculatedPrice}, stored ${item.harga}`);
            }
          }
        });
      }
      
      return transformedData;
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  async addBahanBaku(bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> {
    try {
      // ✅ VALIDATE: Package calculation before saving
      if (bahan.jumlahBeliKemasan && bahan.isiPerKemasan && bahan.hargaTotalBeliKemasan) {
        const calculatedPrice = calculateUnitPrice(
          bahan.jumlahBeliKemasan,
          bahan.isiPerKemasan,
          bahan.hargaTotalBeliKemasan
        );
        
        // Auto-correct unit price if not provided or inconsistent
        if (!bahan.harga || Math.abs(bahan.harga - calculatedPrice) > calculatedPrice * 0.1) {
          (bahan as any).harga = calculatedPrice;
          
          if (this.config.enableDebugLogs) {
            logger.info(`Auto-calculated unit price for ${bahan.nama}: ${calculatedPrice}`);
          }
        }
      }

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
      logger.info('warehouseApi.updateBahanBaku called', { id, updates });
      
      // ✅ VALIDATE: Recalculate unit price if package info changed
      if (updates.jumlahBeliKemasan !== undefined || 
          updates.isiPerKemasan !== undefined || 
          updates.hargaTotalBeliKemasan !== undefined) {
        
        // Get current item to merge with updates
        const currentItem = await this.getBahanBakuById(id);
        if (currentItem) {
          const merged = { ...currentItem, ...updates };
          
          if (merged.jumlahBeliKemasan && merged.isiPerKemasan && merged.hargaTotalBeliKemasan) {
            const calculatedPrice = calculateUnitPrice(
              merged.jumlahBeliKemasan,
              merged.isiPerKemasan,
              merged.hargaTotalBeliKemasan
            );
            
            // Auto-update unit price
            updates.harga = calculatedPrice;
            
            logger.info(`Recalculated unit price for ${merged.nama}: ${calculatedPrice}`);
          }
        }
      }

      // Transform frontend updates to database format
      const dbUpdates = transformToDatabase(updates);
      
      // Remove user_id from updates to avoid changing ownership
      delete (dbUpdates as any).user_id;

      logger.debug('Updating item with data:', { id, dbUpdates });

      let query = supabase
        .from('bahan_baku')
        .update(dbUpdates)
        .eq('id', id);

      // Add user_id filter if available for security
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error, data } = await query;
      if (error) {
        logger.error('Update failed in Supabase:', { error, id, updates: dbUpdates });
        throw error;
      }
      
      logger.info('Update successful in Supabase:', { id, updates: dbUpdates, result: data });
      return true;
    } catch (error: any) {
      this.handleError('Update failed', error);
      return false;
    }
  }

  // ✅ NEW: Get single item by ID
  async getBahanBakuById(id: string): Promise<BahanBakuFrontend | null> {
    try {
      let query = supabase
        .from('bahan_baku')
        .select(`
          *, harga_rata_rata, harga_rata2  // ✅ TAMBAH: ambil kedua field WAC
        `)
        .eq('id', id);

      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { data, error } = await query.single();
      
      if (error) throw error;
      return data ? transformToFrontend(data) : null;
    } catch (error: any) {
      this.handleError('Get by ID failed', error);
      return null;
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

  // ✅ ENHANCED: Stock reduction with proper unit handling
  async reduceStok(nama: string, jumlah: number, currentItems: BahanBakuFrontend[]): Promise<boolean> {
    const item = currentItems.find(b => b.nama.toLowerCase() === nama.toLowerCase());
    if (!item) return false;

    const newStok = Math.max(0, item.stok - jumlah);
    return this.updateBahanBaku(item.id, { stok: newStok });
  }

  // ✅ NEW: Bulk price recalculation
  async recalculateAllPrices(): Promise<{ updated: number; errors: string[] }> {
    try {
      const items = await this.fetchBahanBaku();
      const errors: string[] = [];
      let updated = 0;

      for (const item of items) {
        if (item.jumlahBeliKemasan && item.isiPerKemasan && item.hargaTotalBeliKemasan) {
          const calculatedPrice = calculateUnitPrice(
            item.jumlahBeliKemasan,
            item.isiPerKemasan,
            item.hargaTotalBeliKemasan
          );

          if (Math.abs(calculatedPrice - item.harga) > 1) { // Only update if difference > 1
            const success = await this.updateBahanBaku(item.id, { harga: calculatedPrice });
            if (success) {
              updated++;
            } else {
              errors.push(`Failed to update ${item.nama}`);
            }
          }
        }
      }

      return { updated, errors };
    } catch (error: any) {
      this.handleError('Bulk recalculation failed', error);
      return { updated: 0, errors: [error.message] };
    }
  }

  private handleError(message: string, error: any) {
    const errorMsg = `${message}: ${error.message || error}`;
    logger.error('CrudService:', errorMsg);
    this.config.onError?.(errorMsg);
  }
}

/**
 * ✅ NEW: Calculation Service for package pricing
 */
class CalculationService {
  constructor(private config: ServiceConfig) {}

  calculateUnitPrice(jumlahKemasan: number, isiPerKemasan: number, hargaTotal: number): number {
    return calculateUnitPrice(jumlahKemasan, isiPerKemasan, hargaTotal);
  }

  calculateTotalContent(jumlahKemasan: number, isiPerKemasan: number): number {
    return jumlahKemasan * isiPerKemasan;
  }

  validatePackageConsistency(calculation: PackageCalculation) {
    return validatePackageCalculation(calculation);
  }

  // ✅ NEW: Smart package suggestions
  suggestPackageBreakdown(totalHarga: number, targetUnitPrice: number, satuan: string): Array<{
    jumlahKemasan: number;
    isiPerKemasan: number;
    totalIsi: number;
    actualUnitPrice: number;
    efficiency: number;
  }> {
    const suggestions = [];
    const maxContent = Math.floor(totalHarga / targetUnitPrice);

    // Try different package combinations
    for (let kemasan = 1; kemasan <= 10; kemasan++) {
      const isiPerKemasan = Math.floor(maxContent / kemasan);
      if (isiPerKemasan > 0) {
        const totalIsi = kemasan * isiPerKemasan;
        const actualUnitPrice = totalHarga / totalIsi;
        const efficiency = Math.abs(actualUnitPrice - targetUnitPrice) / targetUnitPrice;

        suggestions.push({
          jumlahKemasan: kemasan,
          isiPerKemasan,
          totalIsi,
          actualUnitPrice: Math.round(actualUnitPrice),
          efficiency
        });
      }
    }

    // Sort by efficiency (lower is better)
    return suggestions.sort((a, b) => a.efficiency - b.efficiency).slice(0, 5);
  }

  // ✅ NEW: Price comparison helpers
  compareWithMarketPrice(currentPrice: number, marketPrices: number[]): {
    isCompetitive: boolean;
    percentile: number;
    recommendation: string;
  } {
    if (marketPrices.length === 0) {
      return { isCompetitive: true, percentile: 50, recommendation: 'No market data available' };
    }

    const sorted = [...marketPrices].sort((a, b) => a - b);
    const position = sorted.findIndex(price => price >= currentPrice);
    const percentile = position === -1 ? 100 : (position / sorted.length) * 100;

    let recommendation = '';
    if (percentile <= 25) {
      recommendation = 'Harga sangat kompetitif';
    } else if (percentile <= 50) {
      recommendation = 'Harga kompetitif';
    } else if (percentile <= 75) {
      recommendation = 'Harga di atas rata-rata';
    } else {
      recommendation = 'Harga tinggi, pertimbangkan negosiasi';
    }

    return {
      isCompetitive: percentile <= 50,
      percentile,
      recommendation
    };
  }
}

/**
 * Subscription Service - Real-time updates (Enhanced for package fields)
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
          logger.debug('Subscription update:', payload);
          // Transform and handle real-time updates here
          if (payload.new) {
            const transformedData = transformToFrontend(payload.new);
            // Handle the transformed data
          }
        })
        .subscribe((status) => {
          logger.debug('Subscription status:', status);
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
 * Cache Service - Simple in-memory caching (Enhanced)
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

  // ✅ NEW: Cache statistics
  getStats() {
    const entries = Array.from(this.cache.entries());
    const valid = entries.filter(([_, item]) => Date.now() - item.timestamp <= item.ttl);
    const expired = entries.length - valid.length;

    return {
      total: entries.length,
      valid: valid.length,
      expired,
      hitRate: valid.length / Math.max(entries.length, 1)
    };
  }
}

/**
 * ✅ ENHANCED: Alert Service with package-aware notifications
 */
class AlertService {
  constructor(private config: ServiceConfig) {}

  processLowStockAlert(items: BahanBakuFrontend[]) {
    const lowStockItems = items.filter(item => item.stok <= item.minimum);
    if (lowStockItems.length > 0) {
      logger.warn(`Low stock alert: ${lowStockItems.length} items`);
    }
    return lowStockItems;
  }

  processExpiryAlert(items: BahanBakuFrontend[]) {
    const expiringItems = items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 7); // 7 days warning
      return expiryDate <= threshold && expiryDate > new Date();
    });

    if (expiringItems.length > 0) {
      logger.warn(`Expiry alert: ${expiringItems.length} items expiring soon`);
    }
    return expiringItems;
  }

  // ✅ NEW: Price inconsistency alerts
  processPriceInconsistencyAlert(items: BahanBakuFrontend[]) {
    const inconsistentItems = items.filter(item => {
      if (!item.jumlahBeliKemasan || !item.isiPerKemasan || !item.hargaTotalBeliKemasan) {
        return false;
      }

      const calculatedPrice = calculateUnitPrice(
        item.jumlahBeliKemasan,
        item.isiPerKemasan,
        item.hargaTotalBeliKemasan
      );

      return Math.abs(calculatedPrice - item.harga) > item.harga * 0.1; // 10% tolerance
    });

    if (inconsistentItems.length > 0) {
      logger.warn(`Price inconsistency alert: ${inconsistentItems.length} items`);
    }
    return inconsistentItems;
  }
}

// Export transformation helpers for use in other parts of the app
export { transformToFrontend, transformToDatabase, calculateUnitPrice, validatePackageCalculation };