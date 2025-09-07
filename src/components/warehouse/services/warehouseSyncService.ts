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
 * Helper function to find existing material by name and satuan
 * This enables stock accumulation for the same material from different suppliers
 */
const findExistingMaterialByName = async (
  materialName: string,
  satuan: string,
  userId: string
): Promise<any | null> => {
  try {
    // Normalize name for better matching
    const normalizedName = materialName.toLowerCase().trim();
    
    console.log('🔍 [WAREHOUSE SYNC] Searching for existing material:', {
      originalName: materialName,
      normalizedName,
      satuan,
      userId
    });
    
    const { data: materials, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
      .eq('user_id', userId)
      .ilike('nama', normalizedName) // Case-insensitive search
      .eq('satuan', satuan); // Must have same unit
    
    if (error) {
      console.error('❌ [WAREHOUSE SYNC] Error searching materials by name:', error);
      return null;
    }
    
    // If multiple matches, prefer exact name match first
    if (materials && materials.length > 0) {
      // First try exact match (case insensitive)
      const exactMatch = materials.find(m => 
        m.nama.toLowerCase().trim() === normalizedName
      );
      
      if (exactMatch) {
        console.log('✅ [WAREHOUSE SYNC] Found exact name match:', exactMatch);
        return exactMatch;
      }
      
      // If no exact match, use the first similar match
      const similarMatch = materials[0];
      console.log('⚠️ [WAREHOUSE SYNC] Found similar name match:', similarMatch);
      return similarMatch;
    }
    
    console.log('ℹ️ [WAREHOUSE SYNC] No existing material found by name');
    return null;
  } catch (error) {
    console.error('❌ [WAREHOUSE SYNC] Error in findExistingMaterialByName:', error);
    return null;
  }
};

/**
 * ✅ IMPROVED: Apply a completed purchase to warehouse stock and WAC
 * Now supports stock accumulation for same materials from different suppliers
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
    const itemId = (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const itemName = (item as any).nama ?? (item as any).namaBarang ?? '';
    const itemSatuan = (item as any).satuan ?? '';
    const qty = Number((item as any).kuantitas ?? (item as any).jumlah ?? 0);
    const unitPrice = deriveUnitPrice(item as any, qty);

    console.log('🔄 [WAREHOUSE SYNC] Processing item:', {
      itemId,
      itemName,
      itemSatuan,
      qty,
      unitPrice,
      rawItem: item
    });

    if (qty <= 0 || !itemName.trim()) {
      console.warn('⚠️ [WAREHOUSE SYNC] Skipping invalid item:', {
        itemId,
        itemName,
        qty,
        unitPrice
      });
      continue;
    }

    // ✅ STEP 1: Try to find by exact ID first (for existing linked items)
    let existing = null;
    if (itemId) {
      const { data: exactMatch, error: fetchError } = await supabase
        .from('bahan_baku')
        .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
        .eq('id', itemId)
        .eq('user_id', purchase.userId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('❌ [WAREHOUSE SYNC] Error fetching by ID:', fetchError);
      } else if (exactMatch) {
        existing = exactMatch;
        console.log('✅ [WAREHOUSE SYNC] Found exact ID match:', existing);
      }
    }
    
    // ✅ STEP 2: If no ID match, try to find by name and unit (for stock accumulation)
    if (!existing) {
      existing = await findExistingMaterialByName(itemName, itemSatuan, purchase.userId);
    }

    const oldStock = existing?.stok ?? 0;
    const oldWac = existing?.harga_rata_rata ?? existing?.harga_satuan ?? 0;
    const newStock = oldStock + qty;
    const newWac = calculateNewWac(oldWac, oldStock, qty, unitPrice);

    console.log('🔄 [WAREHOUSE SYNC] Stock calculation:', {
      itemId,
      itemName,
      oldStock,
      qty,
      newStock,
      oldWac,
      unitPrice,
      newWac,
      existing: existing?.id,
      matchType: existing?.id === itemId ? 'ID_MATCH' : existing ? 'NAME_MATCH' : 'NEW_ITEM'
    });

    if (existing) {
      // ✅ UPDATE existing item (whether matched by ID or name)
      console.log('🔄 [WAREHOUSE SYNC] Updating existing item:', {
        existingId: existing.id,
        existingName: existing.nama,
        matchedBy: existing.id === itemId ? 'ID' : 'NAME'
      });
      
      const updateData: any = {
        stok: newStock,
        harga_rata_rata: newWac,
        harga_satuan: unitPrice,
        updated_at: new Date().toISOString()
      };
      
      // ✅ OPTIONAL: Update supplier info if it's more recent
      if ((purchase as any).supplier && (purchase as any).supplier.trim()) {
        // If existing has no supplier or purchase supplier is different, update it
        if (!existing.supplier || existing.supplier.trim() === '') {
          updateData.supplier = (purchase as any).supplier;
          console.log('📝 [WAREHOUSE SYNC] Adding supplier info:', (purchase as any).supplier);
        } else if (existing.supplier !== (purchase as any).supplier) {
          // Keep a combined supplier list (optional enhancement)
          const existingSuppliers = existing.supplier.split(',').map(s => s.trim());
          const newSupplier = (purchase as any).supplier.trim();
          if (!existingSuppliers.includes(newSupplier)) {
            updateData.supplier = [...existingSuppliers, newSupplier].join(', ');
            console.log('📝 [WAREHOUSE SYNC] Adding new supplier to list:', updateData.supplier);
          }
        }
      }
      
      const { error: updateError } = await supabase
        .from('bahan_baku')
        .update(updateData)
        .eq('id', existing.id)
        .eq('user_id', purchase.userId);
      
      if (updateError) {
        console.error('❌ [WAREHOUSE SYNC] Error updating item:', updateError);
      } else {
        console.log('✅ [WAREHOUSE SYNC] Successfully updated item:', {
          id: existing.id,
          name: existing.nama,
          oldStock,
          newStock,
          oldWac: oldWac.toFixed(2),
          newWac: newWac.toFixed(2)
        });
      }
    } else {
      // ✅ CREATE new item
      console.log('🔄 [WAREHOUSE SYNC] Creating new item:', itemName);
      
      const insertData = {
        id: itemId || crypto.randomUUID(), // Use provided ID or generate new one
        user_id: purchase.userId,
        nama: itemName,
        kategori: (item as any).kategori ?? '',
        stok: qty,
        satuan: itemSatuan,
        minimum: 0,
        harga_satuan: unitPrice,
        harga_rata_rata: unitPrice,
        supplier: (purchase as any).supplier ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('bahan_baku')
        .insert(insertData);
      
      if (insertError) {
        console.error('❌ [WAREHOUSE SYNC] Error creating item:', insertError);
      } else {
        console.log('✅ [WAREHOUSE SYNC] Successfully created item:', {
          id: insertData.id,
          name: itemName,
          stock: qty,
          price: unitPrice.toFixed(2)
        });
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
    const itemId = (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const itemName = (item as any).nama ?? (item as any).namaBarang ?? '';
    const itemSatuan = (item as any).satuan ?? '';
    const qty = Number((item as any).kuantitas ?? (item as any).jumlah ?? 0);
    const unitPrice = deriveUnitPrice(item as any, qty);

    if (qty <= 0) {
      logger.warn('⚠️ [WAREHOUSE SYNC] Skipping invalid item in reversal:', { itemId, itemName, qty });
      continue;
    }

    try {
      // ✅ IMPROVED: Try to find by ID first, then by name for stock accumulation compatibility
      let existing = null;
      
      if (itemId) {
        const { data: exactMatch, error: fetchError } = await supabase
          .from('bahan_baku')
          .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan')
          .eq('id', itemId)
          .eq('user_id', purchase.userId)
          .maybeSingle();
          
        if (fetchError) {
          logger.error('❌ [WAREHOUSE SYNC] Error fetching by ID for reversal:', fetchError);
        } else if (exactMatch) {
          existing = exactMatch;
          logger.debug('✅ [WAREHOUSE SYNC] Found exact ID match for reversal:', existing);
        }
      }
      
      // If no ID match, try to find by name (for previously accumulated stock)
      if (!existing && itemName.trim()) {
        existing = await findExistingMaterialByName(itemName, itemSatuan, purchase.userId);
        if (existing) {
          logger.debug('✅ [WAREHOUSE SYNC] Found name match for reversal:', existing);
        }
      }

      if (!existing) {
        logger.warn('⚠️ [WAREHOUSE SYNC] Item not found for reversal, skipping:', {
          itemId,
          itemName,
          itemSatuan
        });
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
        .eq('id', existing.id)
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
                // ✅ FLEXIBLE ID MATCHING - handle all possible ID field names
                const itemId = purchaseItem.bahanBakuId || purchaseItem.bahan_baku_id || purchaseItem.id;
                
                if (itemId === item.id) {
                  // ✅ FLEXIBLE FIELD MATCHING - handle all possible field names
                  const qty = Number(purchaseItem.kuantitas || purchaseItem.jumlah || 0);
                  const price = Number(
                    purchaseItem.hargaSatuan || 
                    purchaseItem.harga_per_satuan || 
                    purchaseItem.harga_satuan || 
                    0
                  );
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
            // ✅ FLEXIBLE ID MATCHING - handle all possible ID field names
            const purchaseItemId = item.bahanBakuId || item.bahan_baku_id || item.id;
            
            if (purchaseItemId === itemId) {
              // ✅ FLEXIBLE FIELD MATCHING - handle all possible field names
              const qty = Number(item.kuantitas || item.jumlah || 0);
              const price = Number(
                item.hargaSatuan || 
                item.harga_per_satuan || 
                item.harga_satuan || 
                0
              );
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
