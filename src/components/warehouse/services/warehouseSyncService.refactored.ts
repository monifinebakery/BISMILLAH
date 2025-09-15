// src/components/warehouse/services/warehouseSyncService.ts
// Manual warehouse synchronization and WAC recalculation service

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BahanBakuFrontend } from '../types';
import type { Purchase } from '@/components/purchase/types/purchase.types';

// ==================== INTERFACES ====================

/**
 * Interface untuk item pembelian yang digunakan dalam sinkronisasi gudang
 */
export interface PurchaseItem {
  id?: string;
  bahanBakuId?: string;
  bahan_baku_id?: string;
  nama?: string;
  kategori?: string;
  quantity?: number;
  kuantitas?: number;
  jumlah?: number;
  unitPrice?: number;
  hargaSatuan?: number;
  harga_per_satuan?: number;
  harga_satuan?: number;
  satuan?: string;
}

/**
 * Interface untuk data bahan baku dari database
 */
export interface BahanBakuData {
  id: string;
  user_id: string;
  nama: string;
  kategori?: string;
  stok: number;
  satuan?: string;
  minimum: number;
  harga_satuan: number;
  harga_rata_rata: number;
  supplier?: string;
  tanggal_kadaluwarsa?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface untuk hasil sinkronisasi item
 */
export interface SyncResult {
  itemId: string;
  itemName: string;
  oldWac?: number;
  newWac?: number;
  oldStock?: number;
  newStock?: number;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

/**
 * Interface untuk ringkasan sinkronisasi
 */
export interface SyncSummary {
  totalItems: number;
  successful: number;
  failed: number;
  skipped: number;
  results: SyncResult[];
  duration: number;
}

/**
 * Interface untuk pemeriksaan konsistensi gudang
 */
export interface WarehouseConsistencyCheck {
  itemId: string;
  itemName: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

/**
 * Interface untuk hasil validasi integritas gudang
 */
export interface WarehouseIntegrityResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Interface untuk laporan sinkronisasi gudang
 */
export interface WarehouseSyncReport {
  summary: SyncSummary;
  consistencyIssues: WarehouseConsistencyCheck[];
  integrityReport: WarehouseIntegrityResult;
  timestamp: string;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Ekstrak ID item dari berbagai format item pembelian
 * @param item Item pembelian
 * @returns ID item atau undefined jika tidak ditemukan
 */
export const extractItemId = (item: PurchaseItem): string | undefined => {
  return item.bahanBakuId || item.bahan_baku_id || item.id;
};

/**
 * Ekstrak kuantitas dari berbagai format item pembelian
 * @param item Item pembelian
 * @returns Kuantitas atau 0 jika tidak ditemukan
 */
export const extractQuantity = (item: PurchaseItem): number => {
  return toNumber(item.kuantitas ?? item.jumlah ?? 0);
};

/**
 * Ekstrak harga satuan dari berbagai format item pembelian
 * @param item Item pembelian
 * @returns Harga satuan atau 0 jika tidak ditemukan
 */
export const extractUnitPrice = (item: PurchaseItem): number => {
  return toNumber(
    item.unitPrice ??
    item.hargaSatuan ?? 
    item.harga_per_satuan ?? 
    0
  );
};

/**
 * Calculate new Weighted Average Cost (WAC)
 * Handles both addition and subtraction of stock (qty can be negative)
 * @param oldWac WAC sebelumnya
 * @param oldStock Stok sebelumnya
 * @param qty Kuantitas yang ditambahkan/dikurangi
 * @param unitPrice Harga satuan
 * @returns WAC baru
 */
export const calculateNewWac = (
  oldWac: number = 0,
  oldStock: number = 0,
  qty: number = 0,
  unitPrice: number = 0
): number => {
  const previousValue = (toNumber(oldStock) || 0) * (toNumber(oldWac) || 0);
  const deltaValue = (toNumber(qty) || 0) * (toNumber(unitPrice) || 0);
  const newStock = (toNumber(oldStock) || 0) + (toNumber(qty) || 0);

  if (newStock <= 0) return 0;
  return (previousValue + deltaValue) / newStock;
};

// ==================== WAREHOUSE SYNC FUNCTIONS ====================

/**
 * Apply a completed purchase to warehouse stock and WAC
 * @param purchase Pembelian yang akan diterapkan ke gudang
 */
export const applyPurchaseToWarehouse = async (purchase: Purchase): Promise<void> => {
  logger.info('Starting applyPurchaseToWarehouse for purchase:', purchase.id);
  
  if (!purchase || !Array.isArray(purchase.items)) {
    logger.warn('Invalid purchase data:', { purchase, items: purchase?.items });
    return;
  }

  for (const item of purchase.items) {
    const itemId = extractItemId(item as PurchaseItem);
    const qty = extractQuantity(item as PurchaseItem);
    const unitPrice = extractUnitPrice(item as PurchaseItem);

    logger.debug('Processing item:', { itemId, qty, unitPrice });

    if (!itemId || qty <= 0) {
      logger.warn('Skipping invalid item:', { itemId, qty, unitPrice });
      continue;
    }

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('bahan_baku')
        .select('id, stok, harga_rata_rata, harga_satuan')
        .eq('id', itemId)
        .eq('user_id', purchase.userId)
        .single();

      if (fetchError) {
        logger.error('Error fetching existing item:', fetchError);
        continue;
      }

      const oldStock = existing?.stok ?? 0;
      const oldWac = existing?.harga_rata_rata ?? existing?.harga_satuan ?? 0;
      const newStock = oldStock + qty;
      const newWac = calculateNewWac(oldWac, oldStock, qty, unitPrice);

      logger.debug('Stock calculation:', {
        itemId,
        oldStock,
        qty,
        newStock,
        oldWac,
        unitPrice,
        newWac
      });

      if (existing) {
        logger.debug('Updating existing item:', itemId);
        const { error: updateError } = await supabase
          .from('bahan_baku')
          .update({
            stok: newStock,
            harga_rata_rata: newWac,
            harga_satuan: unitPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)
          .eq('user_id', purchase.userId);
        
        if (updateError) {
          logger.error('Error updating item:', updateError);
        } else {
          logger.debug('Successfully updated item:', itemId);
        }
      } else {
        logger.debug('Creating new item:', itemId);
        const { error: insertError } = await supabase.from('bahan_baku').insert({
          id: itemId,
          user_id: purchase.userId,
          nama: (item as PurchaseItem).nama ?? '',
          kategori: (item as PurchaseItem).kategori ?? '',
          stok: qty,
          satuan: (item as PurchaseItem).satuan ?? '',
          minimum: 0,
          harga_satuan: unitPrice,
          harga_rata_rata: unitPrice,
          supplier: (purchase as any).supplier ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (insertError) {
          logger.error('Error creating item:', insertError);
        } else {
          logger.debug('Successfully created item:', itemId);
        }
      }
    } catch (error) {
      logger.error('Error processing item:', { itemId, error });
    }
  }
  
  logger.info('Completed applyPurchaseToWarehouse for purchase:', purchase.id);
};

/**
 * Reverse a purchase from warehouse stock and WAC
 * Used when a purchase is cancelled or deleted
 * @param purchase Pembelian yang akan dibalikkan dari gudang
 */
export const reversePurchaseFromWarehouse = async (purchase: Purchase): Promise<void> => {
  logger.info('Starting reversePurchaseFromWarehouse for purchase:', purchase.id);
  
  if (!purchase || !Array.isArray(purchase.items)) {
    logger.warn('Invalid purchase data:', { purchase, items: purchase?.items });
    return;
  }

  for (const item of purchase.items) {
    const itemId = extractItemId(item as PurchaseItem);
    const qty = extractQuantity(item as PurchaseItem);
    const unitPrice = extractUnitPrice(item as PurchaseItem);

    logger.debug('Processing item for reversal:', { itemId, qty, unitPrice });

    if (!itemId || qty <= 0) {
      logger.warn('Skipping invalid item for reversal:', { itemId, qty, unitPrice });
      continue;
    }

    try {
      const { data: existing, error } = await supabase
        .from('bahan_baku')
        .select('id, stok, harga_rata_rata, harga_satuan')
        .eq('id', itemId)
        .eq('user_id', purchase.userId)
        .single();

      if (error || !existing) {
        logger.error('Error fetching existing item for reversal:', error);
        continue;
      }

      const oldStock = existing.stok ?? 0;
      const oldWac = existing.harga_rata_rata ?? existing.harga_satuan ?? 0;
      const newStock = Math.max(0, oldStock - qty);
      const newWac = newStock > 0 ? calculateNewWac(oldWac, oldStock, -qty, unitPrice) : 0;

      logger.debug('Stock reversal calculation:', {
        itemId,
        oldStock,
        qty,
        newStock,
        oldWac,
        unitPrice,
        newWac
      });

      const { error: updateError } = await supabase
        .from('bahan_baku')
        .update({
          stok: newStock,
          harga_rata_rata: newWac,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', purchase.userId);
      
      if (updateError) {
        logger.error('Error updating item during reversal:', updateError);
      } else {
        logger.debug('Successfully reversed item:', itemId);
      }
    } catch (error) {
      logger.error('Error processing item reversal:', { itemId, error });
    }
  }
  
  logger.info('Completed reversePurchaseFromWarehouse for purchase:', purchase.id);
};

// ==================== WAREHOUSE SYNC SERVICE CLASS ====================

export class WarehouseSyncService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Mengambil semua item gudang untuk pengguna saat ini
   * @returns Array item gudang atau empty array jika terjadi error
   */
  private async getWarehouseItems(): Promise<BahanBakuData[]> {
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select(`
          id,
          nama,
          stok,
          harga_satuan,
          harga_rata_rata,
          satuan,
          updated_at
        `)
        .eq('user_id', this.userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching warehouse items:', error);
      return [];
    }
  }

  /**
   * Mengambil semua pembelian yang sudah selesai untuk pengguna saat ini
   * @returns Array pembelian atau empty array jika terjadi error
   */
  private async getCompletedPurchases(): Promise<Purchase[]> {
    try {
      const { data, error } = await supabase
        .from('user_warehouse_items')
        .select(`
          id,
          user_id,
          name,
          stock,
          unit_price,
          average_cost,
          unit,
          category
        `)
        .eq('user_id', userId);
    status,
          items,
          tanggal,
          created_at
        `)
        .eq('user_id', this.userId)
        .eq('status', 'completed');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching completed purchases:', error);
      return [];
    }
  }

  /**
   * Manually recalculate WAC for all warehouse items
   * This manually calculates warehouse consistency
   * @returns Ringkasan sinkronisasi
   */
  async recalculateAllWAC(): Promise<SyncSummary> {
    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      logger.info('Starting manual WAC recalculation for user:', this.userId);

      // Get all warehouse items and completed purchases
      const [warehouseItems, purchases] = await Promise.all([
        this.getWarehouseItems(),
        this.getCompletedPurchases()
      ]);

      // Process each warehouse item
      for (const item of warehouseItems) {
        try {
          const oldWac = item.harga_rata_rata || 0;
          
          // Calculate new WAC from purchase history
          let totalQuantity = 0;
          let totalValue = 0;

          purchases.forEach(purchase => {
            if (purchase.items && Array.isArray(purchase.items)) {
              purchase.items.forEach((purchaseItem: PurchaseItem) => {
                const purchaseItemId = extractItemId(purchaseItem);
                if (purchaseItemId === item.id) {
                  const qty = extractQuantity(purchaseItem);
                  const price = extractUnitPrice(purchaseItem);
                  totalQuantity += qty;
                  totalValue += qty * price;
                }
              });
            }
          });

          const newWac = totalQuantity > 0 ? totalValue / totalQuantity : item.harga_satuan;

          // Update the item with new WAC if it changed
          if (Math.abs(newWac - oldWac) > 0.01) {
            const { error: updateError } = await supabase
              .from('bahan_baku')
              .update({
                harga_rata_rata: newWac,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
              .eq('user_id', this.userId);

            if (updateError) throw updateError;

            results.push({
              itemId: item.id,
              itemName: item.nama,
              oldWac,
              newWac,
              status: 'success',
              message: `WAC updated from ${oldWac} to ${newWac}`
            });
          } else {
            results.push({
              itemId: item.id,
              itemName: item.nama,
              oldWac,
              newWac,
              status: 'skipped',
              message: 'WAC unchanged'
            });
          }
        } catch (itemError) {
          results.push({
            itemId: item.id,
            itemName: item.nama,
            status: 'error',
            message: itemError instanceof Error ? itemError.message : 'Unknown error'
          });
        }
      }

      const duration = Date.now() - startTime;
      const summary: SyncSummary = {
        totalItems: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        results,
        duration
      };

      logger.info('Manual WAC recalculation completed', summary);
      return summary;

    } catch (error) {
      logger.error('Error during WAC recalculation:', error);
      
      const duration = Date.now() - startTime;
      return {
        totalItems: 0,
        successful: 0,
        failed: 1,
        skipped: 0,
        results: [{
          itemId: 'error',
          itemName: 'System Error',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }],
        duration
      };
    }
  }

  /**
   * Check warehouse data consistency and identify potential issues
   * @returns Array masalah konsistensi gudang
   */
  async checkWarehouseConsistency(): Promise<WarehouseConsistencyCheck[]> {
    const issues: WarehouseConsistencyCheck[] = [];

    try {
      // Get all warehouse items and completed purchases
      const [warehouseItems, purchases] = await Promise.all([
        this.getWarehouseItems(),
        this.getCompletedPurchases()
      ]);

      // Check each warehouse item for consistency issues
      for (const item of warehouseItems) {
        const itemIssues: string[] = [];
        const suggestions: string[] = [];
        let severity: 'low' | 'medium' | 'high' = 'low';

        // Check for negative stock
        if (item.stok < 0) {
          itemIssues.push('Stok negatif');
          suggestions.push('Periksa transaksi yang menyebabkan stok negatif');
          severity = 'high';
        }

        // Check for missing WAC when there should be purchase history
        const itemPurchases = purchases.filter(p => 
          p.items && Array.isArray(p.items) && 
          p.items.some((i: PurchaseItem) => extractItemId(i) === item.id)
        );

        if (itemPurchases.length > 0 && !item.harga_rata_rata) {
          itemIssues.push('Tidak memiliki harga rata-rata meski ada riwayat pembelian');
          suggestions.push('Jalankan recalculate WAC untuk item ini');
          severity = 'medium';
        }

        // Check for significant difference between WAC and unit price
        if (item.harga_rata_rata && item.harga_satuan) {
          const priceDiff = Math.abs(item.harga_rata_rata - item.harga_satuan);
          const percentDiff = priceDiff / item.harga_satuan;
          
          if (percentDiff > 1.0) { // > 100% difference
            itemIssues.push(`Harga rata-rata sangat berbeda dari harga satuan (${(percentDiff * 100).toFixed(1)}%)`);
            suggestions.push('Periksa data pembelian atau update harga satuan');
            severity = 'medium';
          }
        }

        // Check for items with stock but no minimum stock setting
        if (item.stok > 0 && item.minimum === 0) {
          itemIssues.push('Tidak memiliki minimum stock');
          suggestions.push('Set minimum stock untuk kontrol inventory');
          severity = 'low';
        }

        // Check for expired items
        if (item.tanggal_kadaluwarsa) {
          const expiryDate = new Date(item.tanggal_kadaluwarsa);
          const now = new Date();
          
          if (expiryDate < now && item.stok > 0) {
            itemIssues.push('Item sudah kadaluarsa tapi masih ada stock');
            suggestions.push('Periksa dan buang stock yang kadaluarsa');
            severity = 'high';
          }
        }

        // Check for orphaned items (no purchase history but have stock)
        if (item.stok > 0 && itemPurchases.length === 0) {
          itemIssues.push('Memiliki stok tapi tidak ada riwayat pembelian');
          suggestions.push('Periksa data manual atau buat adjustment entry');
          severity = 'low';
        }

        if (itemIssues.length > 0) {
          issues.push({
            itemId: item.id,
            itemName: item.nama,
            issues: itemIssues,
            severity,
            suggestions
          });
        }
      }

      logger.info(`Warehouse consistency check completed. Found ${issues.length} items with issues.`);

    } catch (error) {
      logger.error('Error during consistency check:', error);
      issues.push({
        itemId: 'system-error',
        itemName: 'System Error',
        issues: ['Gagal melakukan consistency check'],
        severity: 'high',
        suggestions: ['Periksa koneksi database dan coba lagi']
      });
    }

    return issues;
  }

  /**
   * Fix specific warehouse item by recalculating its WAC
   * @param itemId ID item yang akan diperbaiki
   * @returns Hasil sinkronisasi
   */
  async fixWarehouseItem(itemId: string): Promise<SyncResult> {
    try {
      logger.info('Fixing warehouse item:', itemId);

      // Get current item data
      const { data: currentItem, error: itemError } = await supabase
        .from('bahan_baku')
        .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)         id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
        .eq('id', itemId)
        .eq('user_id', this.userId)
        .single();

      if (itemError || !currentItem) {
        return {
          itemId,
          itemName: 'Unknown',
          status: 'error',
          message: 'Item tidak ditemukan'
        };
      }

      const oldWac = currentItem.harga_rata_rata;

      // Get completed purchases
      const purchases = await this.getCompletedPurchases();

      let totalQuantity = 0;
      let totalValue = 0;

      // Process all purchases to find this item
      purchases.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((item: PurchaseItem) => {
            const purchaseItemId = extractItemId(item);
            if (purchaseItemId === itemId) {
              const qty = extractQuantity(item);
              const price = extractUnitPrice(item);
              totalQuantity += qty;
              totalValue += qty * price;
            }
          });
        }
      });

      const newWac = totalQuantity > 0 ? totalValue / totalQuantity : currentItem.harga_satuan;

      // Update the item with new WAC
      const { error: updateError } = await supabase
        .from('bahan_baku')
        .update({ 
          harga_rata_rata: newWac,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', this.userId);

      if (updateError) {
        throw updateError;
      }

      return {
        itemId,
        itemName: currentItem.nama,
        oldWac,
        newWac,
        status: 'success',
        message: `WAC updated from ${oldWac || 0} to ${newWac}`
      };

    } catch (error) {
      logger.error('Error fixing warehouse item:', error);
      return {
        itemId,
        itemName: 'Unknown',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate warehouse data integrity
   * @returns Hasil validasi integritas gudang
   */
  async validateWarehouseIntegrity(): Promise<WarehouseIntegrityResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Get warehouse items
      const warehouseItems = await this.getWarehouseItems();

      if (warehouseItems.length === 0) {
        warnings.push('Tidak ada data warehouse');
        recommendations.push('Tambahkan bahan baku atau import data');
        return { isValid: true, errors, warnings, recommendations };
      }

      // Check for duplicate names
      const nameCount = new Map<string, number>();
      warehouseItems.forEach(item => {
        const name = item.nama.toLowerCase().trim();
        nameCount.set(name, (nameCount.get(name) || 0) + 1);
      });

      const duplicates = Array.from(nameCount.entries())
        .filter(([name, count]) => count > 1)
        .map(([name]) => name);

      if (duplicates.length > 0) {
        warnings.push(`Terdapat ${duplicates.length} nama bahan yang duplikat`);
        recommendations.push('Gabungkan atau rename bahan yang duplikat');
      }

      // Check for items with unusual values
      warehouseItems.forEach(item => {
        if (item.stok < 0) {
          errors.push(`${item.nama}: Stok negatif (${item.stok})`);
        }
        
        if (item.harga_satuan <= 0) {
          warnings.push(`${item.nama}: Harga satuan tidak valid`);
        }

        if (item.harga_rata_rata && item.harga_rata_rata <= 0) {
          warnings.push(`${item.nama}: WAC tidak valid`);
        }
      });

      if (errors.length === 0) {
        recommendations.push('Data warehouse dalam kondisi baik');
      } else {
        recommendations.push('Perbaiki error yang ditemukan sebelum melanjutkan');
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Generate detailed warehouse sync report
   * @returns Laporan sinkronisasi gudang
   */
  async generateSyncReport(): Promise<WarehouseSyncReport> {
    const startTime = Date.now();

    logger.info('Generating comprehensive warehouse sync report');

    const [summary, consistencyIssues, integrityReport] = await Promise.all([
      this.recalculateAllWAC(),
      this.checkWarehouseConsistency(),
      this.validateWarehouseIntegrity()
    ]);

    const report: WarehouseSyncReport = {
      summary,
      consistencyIssues,
      integrityReport,
      timestamp: new Date().toISOString()
    };

    const totalTime = Date.now() - startTime;
    logger.info(`Warehouse sync report generated in ${totalTime}ms`, {
      wacUpdates: summary.successful,
      consistencyIssues: consistencyIssues.length,
      integrityErrors: integrityReport.errors.length
    });

    return report;
  }
}

/**
 * Factory function to create WarehouseSyncService instance
 * @param userId ID pengguna
 * @returns Instance WarehouseSyncService
 */
export const createWarehouseSyncService = (userId: string): WarehouseSyncService => {
  return new WarehouseSyncService(userId);
};

export default WarehouseSyncService;