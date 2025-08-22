// src/components/warehouse/services/warehouseSyncService.ts
// Manual warehouse synchronization and WAC recalculation service

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BahanBakuFrontend } from '../types';
import type { Purchase } from '@/components/purchase/types/purchase.types';

/**
 * Calculate new Weighted Average Cost (WAC)
 * Handles both addition and subtraction of stock (qty can be negative)
 */
export const calculateNewWac = (
  oldWac: number = 0,
  oldStock: number = 0,
  qty: number = 0,
  unitPrice: number = 0
): number => {
  const previousValue = (Number(oldStock) || 0) * (Number(oldWac) || 0);
  const deltaValue = (Number(qty) || 0) * (Number(unitPrice) || 0);
  const newStock = (Number(oldStock) || 0) + (Number(qty) || 0);

  if (newStock <= 0) return 0;
  return (previousValue + deltaValue) / newStock;
};

/**
 * Apply a completed purchase to warehouse stock and WAC
 */
export const applyPurchaseToWarehouse = async (purchase: Purchase) => {
  console.log('🔄 [WAREHOUSE SYNC] Starting applyPurchaseToWarehouse for purchase:', purchase.id);
  console.log('🔄 [WAREHOUSE SYNC] Purchase items:', purchase.items);
  
  if (!purchase || !Array.isArray(purchase.items)) {
    console.warn('⚠️ [WAREHOUSE SYNC] Invalid purchase data:', { purchase, items: purchase?.items });
    return;
  }

  for (const item of purchase.items) {
    const itemId =
      (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const qty = Number((item as any).kuantitas ?? (item as any).jumlah ?? 0);
    
    // Calculate unit price from subtotal and quantity if unit price is not available
    let unitPrice = Number(
      (item as any).hargaSatuan ??
      (item as any).harga_per_satuan ??
      (item as any).harga_satuan ??
      0
    );
    
    // If unit price is 0 or not available, try to calculate it from subtotal and quantity
    if (unitPrice <= 0 && qty > 0) {
      const subtotal = Number((item as any).subtotal ?? 0);
      if (subtotal > 0) {
        unitPrice = subtotal / qty;
      }
    }

    console.log('🔄 [WAREHOUSE SYNC] Processing item:', { itemId, qty, unitPrice, rawItem: item });

    if (!itemId || qty <= 0) {
      console.warn('⚠️ [WAREHOUSE SYNC] Skipping invalid item:', { itemId, qty, unitPrice });
      continue;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('bahan_baku')
      .select('id, stok, harga_rata_rata, harga_satuan')
      .eq('id', itemId)
      .eq('user_id', purchase.userId)
      .single();

    if (fetchError) {
      console.error('❌ [WAREHOUSE SYNC] Error fetching existing item:', fetchError);
    }

    const oldStock = existing?.stok ?? 0;
    const oldWac = existing?.harga_rata_rata ?? existing?.harga_satuan ?? 0;
    const newStock = oldStock + qty;
    const newWac = calculateNewWac(oldWac, oldStock, qty, unitPrice);

    console.log('🔄 [WAREHOUSE SYNC] Stock calculation:', {
      itemId,
      oldStock,
      qty,
      newStock,
      oldWac,
      unitPrice,
      newWac,
      existing
    });

    if (existing) {
      console.log('🔄 [WAREHOUSE SYNC] Updating existing item:', itemId);
      const { error: updateError } = await supabase
        .from('bahan_baku')
        .update({
          stok: newStock,
          harga_rata_rata: newWac,
          harga_satuan: newWac, // Set unit price to match WAC for consistency
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', purchase.userId);
      
      if (updateError) {
        console.error('❌ [WAREHOUSE SYNC] Error updating item:', updateError);
      } else {
        console.log('✅ [WAREHOUSE SYNC] Successfully updated item:', itemId);
      }
    } else {
      console.log('🔄 [WAREHOUSE SYNC] Creating new item:', itemId);
      const { error: insertError } = await supabase.from('bahan_baku').insert({
        id: itemId,
        user_id: purchase.userId,
        nama: (item as any).nama ?? (item as any).namaBarang ?? '',
        kategori: (item as any).kategori ?? '',
        stok: qty,
        satuan: (item as any).satuan ?? '',
        minimum: 0,
        harga_satuan: unitPrice,
        harga_rata_rata: unitPrice,
        supplier: (purchase as any).supplier ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (insertError) {
        console.error('❌ [WAREHOUSE SYNC] Error creating item:', insertError);
      } else {
        console.log('✅ [WAREHOUSE SYNC] Successfully created item:', itemId);
      }
    }
  }
  
  console.log('✅ [WAREHOUSE SYNC] Completed applyPurchaseToWarehouse for purchase:', purchase.id);
};

/**
 * Reverse a purchase from warehouse stock and WAC
 * Used when a purchase is cancelled or deleted
 */
export const reversePurchaseFromWarehouse = async (purchase: Purchase) => {
  if (!purchase || !Array.isArray(purchase.items)) return;

  for (const item of purchase.items) {
    const itemId =
      (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const qty = Number((item as any).kuantitas ?? (item as any).jumlah ?? 0);
    const unitPrice = Number(
      (item as any).hargaSatuan ??
      (item as any).harga_satuan ??
      0
    );

    if (!itemId || qty <= 0) continue;

    const { data: existing, error } = await supabase
      .from('bahan_baku')
      .select('id, stok, harga_rata_rata, harga_satuan')
      .eq('id', itemId)
      .eq('user_id', purchase.userId)
      .single();

    if (error || !existing) continue;

    const oldStock = existing.stok ?? 0;
    const oldWac = existing.harga_rata_rata ?? existing.harga_satuan ?? 0;
    const newStock = Math.max(0, oldStock - qty);
    const newWac = newStock > 0 ? calculateNewWac(oldWac, oldStock, -qty, unitPrice) : 0;

    await supabase
      .from('bahan_baku')
      .update({
        stok: newStock,
        harga_rata_rata: newWac,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', purchase.userId);
  }
};

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

export interface SyncSummary {
  totalItems: number;
  successful: number;
  failed: number;
  skipped: number;
  results: SyncResult[];
  duration: number;
}

export interface WarehouseConsistencyCheck {
  itemId: string;
  itemName: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export class WarehouseSyncService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Manually recalculate WAC for all warehouse items
   * This manually calculates warehouse consistency
   */
  async recalculateAllWAC(): Promise<SyncSummary> {
    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      logger.info('Starting manual WAC recalculation for user:', this.userId);

      // Get all warehouse items
      const { data: warehouseItems, error: warehouseError } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', this.userId);

      if (warehouseError) throw warehouseError;

      // Get all completed purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('items')
        .eq('user_id', this.userId)
        .eq('status', 'completed');

      if (purchaseError) throw purchaseError;

      // Process each warehouse item
      for (const item of warehouseItems || []) {
        try {
          const oldWac = item.harga_rata_rata || 0;
          
          // Calculate new WAC from purchase history
          let totalQuantity = 0;
          let totalValue = 0;

          purchases?.forEach(purchase => {
            if (purchase.items && Array.isArray(purchase.items)) {
              purchase.items.forEach((purchaseItem: any) => {
                if (purchaseItem.bahan_baku_id === item.id) {
                  const qty = Number(purchaseItem.jumlah || 0);
                  
                  // Calculate unit price from subtotal and quantity if unit price is not available
                  let price = Number(purchaseItem.harga_satuan || 0);
                  
                  // If unit price is 0 or not available, try to calculate it from subtotal and quantity
                  if (price <= 0 && qty > 0) {
                    const subtotal = Number(purchaseItem.subtotal || 0);
                    if (subtotal > 0) {
                      price = subtotal / qty;
                    }
                  }
                  
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
                harga_satuan: newWac, // Also update unit price to match WAC
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
   */
  async checkWarehouseConsistency(): Promise<WarehouseConsistencyCheck[]> {
    const issues: WarehouseConsistencyCheck[] = [];

    try {
      // Get all warehouse items
      const { data: warehouseItems, error: warehouseError } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', this.userId);

      if (warehouseError) throw warehouseError;

      // Get all completed purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id, items, total_nilai, status')
        .eq('user_id', this.userId)
        .eq('status', 'completed');

      if (purchaseError) throw purchaseError;

      // Check each warehouse item for consistency issues
      for (const item of warehouseItems || []) {
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
        const itemPurchases = purchases?.filter(p => 
          p.items && Array.isArray(p.items) && 
          p.items.some((i: any) => i.bahan_baku_id === item.id)
        ) || [];

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
   */
  async fixWarehouseItem(itemId: string): Promise<SyncResult> {
    try {
      logger.info('Fixing warehouse item:', itemId);

      // Get current item data
      const { data: currentItem, error: itemError } = await supabase
        .from('bahan_baku')
        .select('*')
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

      // Calculate new WAC from purchase history
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('items')
        .eq('user_id', this.userId)
        .eq('status', 'completed');

      if (purchaseError) {
        throw purchaseError;
      }

      let totalQuantity = 0;
      let totalValue = 0;

      // Process all purchases to find this item
      purchases?.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((item: any) => {
            if (item.bahan_baku_id === itemId) {
              const qty = Number(item.jumlah || 0);
              
              // Calculate unit price from subtotal and quantity if unit price is not available
              let price = Number(item.harga_per_satuan || item.harga_satuan || 0);
              
              // If unit price is 0 or not available, try to calculate it from subtotal and quantity
              if (price <= 0 && qty > 0) {
                const subtotal = Number(item.subtotal || 0);
                if (subtotal > 0) {
                  price = subtotal / qty;
                }
              }
              
              totalQuantity += qty;
              totalValue += qty * price;
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
        oldWac: oldWac ?? undefined,
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
   */
  async validateWarehouseIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check for basic data integrity issues
      const { data: warehouseData, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        errors.push(`Database error: ${error.message}`);
        return { isValid: false, errors, warnings, recommendations };
      }

      if (!warehouseData || warehouseData.length === 0) {
        warnings.push('Tidak ada data warehouse');
        recommendations.push('Tambahkan bahan baku atau import data');
        return { isValid: true, errors, warnings, recommendations };
      }

      // Check for duplicate names
      const nameCount = new Map<string, number>();
      warehouseData.forEach(item => {
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
      warehouseData.forEach(item => {
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
   */
  async generateSyncReport(): Promise<{
    summary: SyncSummary;
    consistencyIssues: WarehouseConsistencyCheck[];
    integrityReport: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      recommendations: string[];
    };
    timestamp: string;
  }> {
    const startTime = Date.now();

    logger.info('Generating comprehensive warehouse sync report');

    const [summary, consistencyIssues, integrityReport] = await Promise.all([
      this.recalculateAllWAC(),
      this.checkWarehouseConsistency(),
      this.validateWarehouseIntegrity()
    ]);

    const report = {
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
 */
export const createWarehouseSyncService = (userId: string): WarehouseSyncService => {
  return new WarehouseSyncService(userId);
};

export default WarehouseSyncService;
