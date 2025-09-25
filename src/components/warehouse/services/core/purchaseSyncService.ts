// src/components/warehouse/services/core/purchaseSyncService.ts
// Purchase to warehouse synchronization service

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toNumber } from '../../utils/typeUtils';
import type { Purchase } from '@/components/purchase/types/purchase.types';
import { executeWithAuthValidation } from '@/utils/auth/refreshSession';

// Import other services
import { 
  calculateEnhancedWac, 
  validateWacCalculation 
} from './wacCalculationService';
import {
  findExistingMaterialByName,
  findMaterialById,
  normalizeMaterialName,
  normalizeUnit
} from './materialSearchService';

/**
 * Helper: derive unit price from standardized fields
 */
const deriveUnitPrice = (item: any, qty: number): number => {
  const toNum = (v: any) => (v == null || v === '' ? 0 : toNumber(v));
  // Database stores 'harga_per_satuan', frontend might use 'unitPrice'
  const explicit = toNum(item.harga_per_satuan ?? item.unitPrice ?? item.harga_satuan);
  if (explicit > 0) return explicit;
  // Fallback: subtotal / qty
  const subtotal = toNum(item.subtotal);
  if (qty > 0 && subtotal > 0) return subtotal / qty;
  return 0;
};

/**
 * Resolusi nama item dengan mempertimbangkan alias lama
 */
const resolveItemName = (item: any): { name: string; raw: string; source: string | null } => {
  const nameCandidates: Array<{ key: string; value: unknown }> = [
    { key: 'nama', value: item?.nama },
    { key: 'namaBarang', value: item?.namaBarang },
    { key: 'nama_barang', value: item?.nama_barang },
    { key: 'nama_bahan', value: item?.nama_bahan },
    { key: 'namaBahan', value: item?.namaBahan },
    { key: 'name', value: item?.name },
    { key: 'item_name', value: item?.item_name },
    { key: 'itemName', value: item?.itemName },
    { key: 'description', value: item?.description },
    { key: 'title', value: item?.title },
  ];

  for (const candidate of nameCandidates) {
    if (typeof candidate.value === 'string') {
      const normalized = normalizeMaterialName(candidate.value);
      if (normalized) {
        return { name: normalized, raw: candidate.value, source: candidate.key };
      }
    }
  }

  return { name: '', raw: '', source: null };
};

/**
 * Apply a completed purchase to warehouse stock and WAC
 * Now supports stock accumulation for same materials from different suppliers
 */
export const applyPurchaseToWarehouse = async (purchase: Purchase) => {
  logger.info('🔄 [PURCHASE SYNC] Starting applyPurchaseToWarehouse for purchase:', purchase.id);
  logger.debug('🔄 [PURCHASE SYNC] Purchase items:', purchase.items);

  if (!purchase || !Array.isArray(purchase.items)) {
    logger.warn('⚠️ [PURCHASE SYNC] Invalid purchase data:', { purchase, items: (purchase as any)?.items });
    return;
  }

  for (const item of purchase.items) {
    // Database stores 'bahan_baku_id', frontend might use 'bahanBakuId'
    const itemId = (item as any).bahan_baku_id || (item as any).bahanBakuId || (item as any).id;
    const nameResolution = resolveItemName(item as any);
    const itemName = nameResolution.name;
    const itemSatuan = (item as any).satuan ?? '';
    const itemSatuanNorm = normalizeUnit(itemSatuan);
    // Database stores 'jumlah', but frontend might use 'quantity'
    const qty = toNumber((item as any).jumlah ?? (item as any).quantity ?? 0);
    const unitPrice = deriveUnitPrice(item as any, qty);

    logger.debug('🔄 [PURCHASE SYNC] Processing item:', {
      itemId,
      itemName,
      itemNameSource: nameResolution.source,
      rawItemName: nameResolution.raw,
      itemSatuan,
      qty,
      unitPrice,
      rawItem: item,
    });

    if (qty <= 0 || !itemName.trim()) {
      logger.warn('⚠️ [PURCHASE SYNC] Skipping invalid item:', {
        itemId,
        itemName,
        itemNameSource: nameResolution.source,
        qty,
        unitPrice,
      });
      continue;
    }

    // STEP 1: Try to find by exact ID first (for existing linked items)
    let existing: any = null;
    if (itemId) {
      existing = await findMaterialById(itemId, purchase.userId);
    }

    // STEP 2: If no ID match, try to find by name and unit (for stock accumulation)
    if (!existing) {
      existing = await findExistingMaterialByName(itemName, itemSatuanNorm, purchase.userId);
    }

    const oldStock = toNumber(existing?.stok ?? 0);
    const oldWac = toNumber(existing?.harga_rata_rata ?? existing?.harga_satuan ?? 0);
    const newStock = oldStock + qty;
    
    // Use enhanced WAC calculation with validation
    const wacResult = calculateEnhancedWac(oldWac, oldStock, qty, unitPrice);
    const newWac = wacResult.newWac;
    
    // Safety: Validate final stock calculation matches
    if (Math.abs(wacResult.newStock - newStock) > 0.01) {
      logger.warn('⚠️ [PURCHASE SYNC] Stock calculation mismatch:', {
        itemId,
        itemName,
        calculatedStock: newStock,
        wacResultStock: wacResult.newStock
      });
    }

    logger.debug('🔄 [PURCHASE SYNC] Enhanced stock calculation:', {
      itemId,
      itemName,
      oldStock,
      qty,
      newStock,
      oldWac: oldWac.toFixed(4),
      unitPrice: unitPrice.toFixed(4),
      newWac: newWac.toFixed(4),
      existing: existing?.id,
      matchType: existing?.id === itemId ? 'ID_MATCH' : existing ? 'NAME_MATCH' : 'NEW_ITEM',
      wacWarnings: wacResult.validationWarnings
    });

    if (existing) {
      // UPDATE existing item (whether matched by ID or name)
      logger.debug('🔄 [PURCHASE SYNC] Updating existing item:', {
        existingId: existing.id,
        existingName: existing.nama,
        matchedBy: existing.id === itemId ? 'ID' : 'NAME',
      });

      // Validate WAC calculation for correctness
      const wacValidation = validateWacCalculation(oldStock, oldWac, qty, unitPrice, newWac, itemName);
      
      // Log WAC warnings if any
      if (wacResult.validationWarnings.length > 0) {
        logger.warn(`⚠️ [PURCHASE SYNC] WAC calculation warnings for ${itemName}:`, wacResult.validationWarnings);
      }
      
      if (!wacValidation.isValid) {
        logger.error(`❌ [PURCHASE SYNC] WAC validation failed for ${itemName}:`, wacValidation.warnings);
      }
      
      const updateData: any = {
        stok: newStock,
        harga_rata_rata: newWac,
        harga_satuan: unitPrice,
        updated_at: new Date().toISOString()
      };

      // Enhanced: Update supplier info if provided
      if (purchase.supplier && purchase.supplier.trim()) {
        // Use supplier from purchase header, not individual items
        const currentSupplier = existing.supplier || '';
        const newSupplier = purchase.supplier.trim();
        if (!currentSupplier) {
          updateData.supplier = newSupplier;
        } else if (!currentSupplier.toLowerCase().includes(newSupplier.toLowerCase())) {
          updateData.supplier = `${currentSupplier}, ${newSupplier}`;
        }
      }

      // Use atomic update with row-level locking to prevent race conditions
      const result = await executeWithAuthValidation(async () => {
        return await supabase
          .from('bahan_baku')
          .update(updateData)
          .eq('id', existing.id)
          .eq('user_id', purchase.userId)
          .select()
          .single();
      });
      
      const { data: updatedItem, error: updateError } = result;
      
      if (updateError) {
        logger.error('❌ [PURCHASE SYNC] Error updating existing item:', updateError);
      } else {
        logger.info('✅ [PURCHASE SYNC] Successfully updated existing item:', existing.id);
      }
    } else {
      // CREATE new item
      logger.debug('🔄 [PURCHASE SYNC] Creating new warehouse item:', {
        itemName,
        itemSatuan,
        qty,
        unitPrice,
      });

      const newItemData = {
        user_id: purchase.userId,
        nama: itemName,
        kategori: (item as any).kategori || 'Umum',
        satuan: itemSatuanNorm,
        stok: qty,
        harga_satuan: unitPrice,
        harga_rata_rata: unitPrice, // For new items, WAC = unit price
        supplier: purchase.supplier || '', // Use supplier from purchase header
        minimum: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await executeWithAuthValidation(async () => {
        return await supabase
          .from('bahan_baku')
          .insert(newItemData)
          .select('id')
          .single();
      });
      
      const { data: createdItem, error: insertError } = result;
      
      if (insertError) {
        logger.error('❌ [PURCHASE SYNC] Error creating new item:', insertError);
      } else {
        logger.info('✅ [PURCHASE SYNC] Successfully created new item:', createdItem?.id);
      }
    }
  }
  
  logger.info('✅ [PURCHASE SYNC] Completed applyPurchaseToWarehouse for purchase:', purchase.id);
};

/**
 * Reverse a purchase from warehouse (for purchase cancellation/deletion)
 */
export const reversePurchaseFromWarehouse = async (purchase: Purchase) => {
  logger.info('🔄 [PURCHASE SYNC] Starting reversePurchaseFromWarehouse for purchase:', purchase.id);

  if (!purchase || !Array.isArray(purchase.items)) {
    logger.warn('⚠️ [PURCHASE SYNC] Invalid purchase data for reversal:', purchase);
    return;
  }

  for (const item of purchase.items) {
    // Database stores 'bahan_baku_id', frontend might use 'bahanBakuId'
    const itemId = (item as any).bahan_baku_id || (item as any).bahanBakuId || (item as any).id;
    const itemName = (item as any).nama ?? '';
    const itemSatuan = (item as any).satuan ?? '';
    const itemSatuanNorm = normalizeUnit(itemSatuan);
    // Database stores 'jumlah', but frontend might use 'quantity'
    const qty = toNumber((item as any).jumlah ?? (item as any).quantity ?? 0);
    const unitPrice = deriveUnitPrice(item as any, qty);

    if (qty <= 0) {
      logger.warn('⚠️ [PURCHASE SYNC] Skipping invalid item in reversal:', { itemId, itemName, qty });
      continue;
    }

    try {
      // Try to find by ID first, then by name for stock accumulation compatibility
      let existing = null;
      
      if (itemId) {
        existing = await findMaterialById(itemId, purchase.userId);
      }
      
      // If no ID match, try to find by name (for previously accumulated stock)
      if (!existing && itemName.trim()) {
        existing = await findExistingMaterialByName(itemName, itemSatuanNorm, purchase.userId);
      }

      if (!existing) {
        logger.warn('⚠️ [PURCHASE SYNC] Item not found for reversal, skipping:', {
          itemId,
          itemName,
          itemSatuan
        });
        continue;
      }

      const oldStock = existing.stok ?? 0;
      const oldWac = existing.harga_rata_rata ?? existing.harga_satuan ?? 0;
      
      // Use enhanced WAC calculation for reversal (negative qty)
      const wacResult = calculateEnhancedWac(oldWac, oldStock, -qty, unitPrice);
      
      logger.debug('🔄 [PURCHASE SYNC] Reversal calculation:', {
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
        logger.warn('⚠️ [PURCHASE SYNC] WAC reversal warnings for item ' + itemId + ':', wacResult.validationWarnings);
      }

      const updateData: any = {
        stok: wacResult.newStock,
        harga_rata_rata: wacResult.newWac,
        updated_at: new Date().toISOString()
      };

      // Enhanced: Preserve price information when stock hits zero
      if (wacResult.preservedPrice !== undefined) {
        logger.info('🔄 [PURCHASE SYNC] Preserving price for zero stock item:', {
          itemId,
          preservedPrice: wacResult.preservedPrice
        });
        // Keep the preserved price in WAC even when stock is zero
        updateData.harga_rata_rata = wacResult.preservedPrice;
      }

      // Use atomic update with row-level locking to prevent race conditions
      const result = await executeWithAuthValidation(async () => {
        return await supabase
          .from('bahan_baku')
          .update(updateData)
          .eq('id', existing.id)
          .eq('user_id', purchase.userId)
          .select()
          .single();
      });
      
      const { data: updatedItem, error: updateError } = result;
      
      if (updateError) {
        logger.error('❌ [PURCHASE SYNC] Error updating item during reversal:', updateError);
      } else {
        logger.info('✅ [PURCHASE SYNC] Successfully reversed item:', itemId);
      }
    } catch (error) {
      logger.error('❌ [PURCHASE SYNC] Unexpected error during item reversal:', error);
    }
  }
  
  logger.info('✅ [PURCHASE SYNC] Completed reversePurchaseFromWarehouse for purchase:', purchase.id);
};