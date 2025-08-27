// src/components/warehouse/services/warehouseSyncService.ts
// Manual warehouse synchronization and WAC recalculation service

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BahanBakuFrontend } from '../types';
import type { Purchase } from '@/components/purchase/types/purchase.types';

// ✅ IMPROVED: Enhanced WAC calculation with edge case handling
export interface WACCalculationResult {
  newWac: number;
  newStock: number;
  preservedPrice?: number; // Last known price when stock hits zero
  validationWarnings: string[];
}

/**
 * Enhanced Weighted Average Cost (WAC) calculation
 * Handles edge cases: negative values, zero stock scenarios, price preservation
 */
export const calculateNewWac = (
  oldWac: number = 0,
  oldStock: number = 0,
  qty: number = 0,
  unitPrice: number = 0
): number => {
  // ✅ ENHANCED: Input validation and normalization
  const safeOldWac = Math.max(0, Number(oldWac) || 0);
  const safeOldStock = Math.max(0, Number(oldStock) || 0);
  const safeQty = Number(qty) || 0;
  const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
  
  // Calculate new stock first
  const newStock = safeOldStock + safeQty;
  
  // ✅ EDGE CASE: Negative or zero stock handling
  if (newStock <= 0) {
    // Preserve the last known price if we had valid pricing before
    return safeOldWac > 0 ? safeOldWac : safeUnitPrice;
  }
  
  // ✅ EDGE CASE: Initial stock with no previous WAC
  if (safeOldStock <= 0) {
    return safeUnitPrice;
  }
  
  // ✅ EDGE CASE: Adding stock with zero unit price
  if (safeQty > 0 && safeUnitPrice <= 0) {
    // Don't change WAC if adding stock with no valid price
    return safeOldWac;
  }
  
  // ✅ STANDARD WAC CALCULATION
  const previousValue = safeOldStock * safeOldWac;
  const deltaValue = safeQty * safeUnitPrice;
  const newWac = (previousValue + deltaValue) / newStock;
  
  // ✅ VALIDATION: Ensure result is reasonable
  if (!isFinite(newWac) || newWac < 0) {
    logger.warn('⚠️ WAC calculation resulted in invalid value:', {
      oldWac: safeOldWac,
      oldStock: safeOldStock,
      qty: safeQty,
      unitPrice: safeUnitPrice,
      result: newWac
    });
    return safeOldWac > 0 ? safeOldWac : safeUnitPrice;
  }
  
  return newWac;
};

/**
 * ✅ NEW: Enhanced WAC calculation with detailed results
 */
export const calculateEnhancedWac = (
  oldWac: number = 0,
  oldStock: number = 0,
  qty: number = 0,
  unitPrice: number = 0
): WACCalculationResult => {
  const warnings: string[] = [];
  
  // Input validation
  const safeOldWac = Math.max(0, Number(oldWac) || 0);
  const safeOldStock = Math.max(0, Number(oldStock) || 0);
  const safeQty = Number(qty) || 0;
  const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
  
  if (oldWac < 0 || oldStock < 0 || unitPrice < 0) {
    warnings.push('Negative values detected and normalized');
  }
  
  const newStock = safeOldStock + safeQty;
  let newWac: number;
  let preservedPrice: number | undefined;
  
  if (newStock <= 0) {
    preservedPrice = safeOldWac > 0 ? safeOldWac : safeUnitPrice;
    newWac = preservedPrice;
    warnings.push('Stock reached zero or negative, price preserved');
  } else if (safeOldStock <= 0) {
    newWac = safeUnitPrice;
    warnings.push('Initial stock entry');
  } else if (safeQty > 0 && safeUnitPrice <= 0) {
    newWac = safeOldWac;
    warnings.push('Stock added with zero price, WAC unchanged');
  } else {
    const previousValue = safeOldStock * safeOldWac;
    const deltaValue = safeQty * safeUnitPrice;
    newWac = (previousValue + deltaValue) / newStock;
    
    if (!isFinite(newWac) || newWac < 0) {
      newWac = safeOldWac > 0 ? safeOldWac : safeUnitPrice;
      warnings.push('Invalid calculation result, fallback applied');
    }
  }
  
  return {
    newWac,
    newStock,
    preservedPrice,
    validationWarnings: warnings
  };
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

  // Helper: derive unit price from any available fields
  const deriveUnitPrice = (it: any, qty: number): number => {
    const toNum = (v: any) => (v == null || v === '' ? 0 : Number(v));
    const explicit = toNum(it.hargaSatuan ?? it.harga_per_satuan ?? it.harga_satuan);
    if (explicit > 0) return explicit;
    // Fallback: subtotal / qty (no packaging fields)
    const subtotal = toNum(it.subtotal);
    if (qty > 0 && subtotal > 0) return subtotal / qty;
    return 0;
  };

  for (const item of purchase.items) {
    const itemId =
      (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const qty = Number((item as any).kuantitas ?? (item as any).jumlah ?? 0);
    const unitPrice = deriveUnitPrice(item as any, qty);

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
      .maybeSingle();

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
          harga_satuan: unitPrice,
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
 * ✅ IMPROVED: Reverse a purchase from warehouse stock and WAC
 * Uses enhanced WAC calculation with better edge case handling
 */
export const reversePurchaseFromWarehouse = async (purchase: Purchase) => {
  if (!purchase || !Array.isArray(purchase.items)) {
    logger.warn('⚠️ [WAREHOUSE SYNC] Invalid purchase data for reversal:', purchase?.id);
    return;
  }

  logger.info('🔄 [WAREHOUSE SYNC] Starting reversePurchaseFromWarehouse for purchase:', purchase.id);

  // Helper: derive unit price from any available fields  
  const deriveUnitPrice = (it: any, qty: number): number => {
    const toNum = (v: any) => (v == null || v === '' ? 0 : Number(v));
    const explicit = toNum(it.hargaSatuan ?? it.harga_per_satuan ?? it.harga_satuan);
    if (explicit > 0) return explicit;
    const subtotal = toNum(it.subtotal);
    if (qty > 0 && subtotal > 0) return subtotal / qty;
    return 0;
  };

  for (const item of purchase.items) {
    const itemId =
      (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const qty = Number((item as any).kuantitas ?? (item as any).jumlah ?? 0);
    const unitPrice = deriveUnitPrice(item as any, qty);

    if (!itemId || qty <= 0) {
      logger.warn('⚠️ [WAREHOUSE SYNC] Skipping invalid item in reversal:', { itemId, qty });
      continue;
    }

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('bahan_baku')
        .select('id, stok, harga_rata_rata, harga_satuan')
        .eq('id', itemId)
        .eq('user_id', purchase.userId)
        .maybeSingle();

      if (fetchError) {
        logger.error('❌ [WAREHOUSE SYNC] Error fetching item for reversal:', fetchError);
        continue;
      }

      if (!existing) {
        logger.warn('⚠️ [WAREHOUSE SYNC] Item not found for reversal, skipping:', itemId);
        continue;
      }

      const oldStock = existing.stok ?? 0;
      const oldWac = existing.harga_rata_rata ?? existing.harga_satuan ?? 0;
      
      // ✅ IMPROVED: Use enhanced WAC calculation for reversal
      const wacResult = calculateEnhancedWac(oldWac, oldStock, -qty, unitPrice);
      
      logger.debug('🔄 [WAREHOUSE SYNC] Reversal calculation:', {
        itemId,
        oldStock,
        qty: -qty,
        newStock: wacResult.newStock,
        oldWac,
        newWac: wacResult.newWac,
        warnings: wacResult.validationWarnings
      });

      // Log warnings if any
      if (wacResult.validationWarnings.length > 0) {
        logger.warn('⚠️ [WAREHOUSE SYNC] WAC reversal warnings for item ' + itemId + ':', wacResult.validationWarnings);
      }

      const updateData: any = {
        stok: wacResult.newStock,
        harga_rata_rata: wacResult.newWac,
        updated_at: new Date().toISOString()
      };

      // ✅ ENHANCED: Preserve price information when stock hits zero
      if (wacResult.preservedPrice !== undefined) {
        logger.info('🔄 [WAREHOUSE SYNC] Preserving price for zero stock item:', {
          itemId,
          preservedPrice: wacResult.preservedPrice
        });
        // Keep the preserved price in WAC even when stock is zero
        updateData.harga_rata_rata = wacResult.preservedPrice;
      }

      const { error: updateError } = await supabase
        .from('bahan_baku')
        .update(updateData)
        .eq('id', itemId)
        .eq('user_id', purchase.userId);
      
      if (updateError) {
        logger.error('❌ [WAREHOUSE SYNC] Error updating item during reversal:', updateError);
      } else {
        logger.info('✅ [WAREHOUSE SYNC] Successfully reversed item:', itemId);
      }
    } catch (error) {
      logger.error('❌ [WAREHOUSE SYNC] Unexpected error during item reversal:', error);
    }
  }
  
  logger.info('✅ [WAREHOUSE SYNC] Completed reversePurchaseFromWarehouse for purchase:', purchase.id);
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
        .select('id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at')
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
                  const price = Number(purchaseItem.harga_per_satuan || 0);
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
   */
  async checkWarehouseConsistency(): Promise<WarehouseConsistencyCheck[]> {
    const issues: WarehouseConsistencyCheck[] = [];

    try {
      // Get all warehouse items
      const { data: warehouseItems, error: warehouseError } = await supabase
        .from('bahan_baku')
        .select('id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at')
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
        .select('id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at')
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
              const price = Number(item.harga_per_satuan || 0);
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
        .select('id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at')
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
    integrityReport: Awaited<ReturnType<typeof this.validateWarehouseIntegrity>>;
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
