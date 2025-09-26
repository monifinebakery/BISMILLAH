// src/components/purchase/services/status/purchaseAutoSync.ts
// Auto-sync service untuk purchase ke warehouse tanpa menunggu status completed

import { logger } from '@/utils/logger';
import type { Purchase } from '../../types/purchase.types';
import { applyPurchaseToWarehouse } from '@/components/warehouse/services/warehouseSyncService';

/**
 * Auto-sync purchase to warehouse immediately when created
 * This ensures inventory is updated even if user forgets to set status to "completed"
 */
export const autoSyncPurchaseToWarehouse = async (purchase: Purchase): Promise<boolean> => {
  try {
    logger.info('🔄 [AUTO-SYNC] Starting auto-sync for purchase:', purchase.id);
    
    // Validate purchase data
    if (!purchase || !Array.isArray(purchase.items) || purchase.items.length === 0) {
      logger.warn('⚠️ [AUTO-SYNC] Invalid purchase data, skipping sync:', purchase.id);
      return false;
    }

    // Check if purchase has valid items with required fields
    const validItems = purchase.items.filter(item => 
      item.nama && 
      item.quantity > 0 && 
      item.unitPrice >= 0 && 
      item.satuan
    );

    if (validItems.length === 0) {
      logger.warn('⚠️ [AUTO-SYNC] No valid items found, skipping sync:', purchase.id);
      return false;
    }

    // Apply to warehouse
    await applyPurchaseToWarehouse(purchase);
    
    logger.info('✅ [AUTO-SYNC] Auto-sync completed for purchase:', purchase.id);
    return true;
  } catch (error) {
    logger.error('❌ [AUTO-SYNC] Auto-sync failed for purchase:', purchase.id, error);
    // Don't throw error - auto-sync is optional, shouldn't break purchase creation
    return false;
  }
};

/**
 * Check if purchase should be auto-synced based on business rules
 */
export const shouldAutoSync = (purchase: Purchase): boolean => {
  // Auto-sync for all purchases by default
  // User can still manually complete later if needed
  return true;
};

/**
 * Auto-sync with user notification
 */
export const autoSyncWithNotification = async (
  purchase: Purchase, 
  addNotification?: (notification: any) => void
): Promise<boolean> => {
  if (!shouldAutoSync(purchase)) {
    return false;
  }

  const success = await autoSyncPurchaseToWarehouse(purchase);
  
  if (success && addNotification) {
    addNotification({
      title: '✅ Stok Gudang Terupdate',
      message: `Pembelian dari ${purchase.supplier} telah ditambahkan ke gudang secara otomatis`,
      type: 'success',
      icon: 'package',
      priority: 1,
      related_type: 'purchase',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    });
  } else if (!success && addNotification) {
    addNotification({
      title: '⚠️ Perlu Perhatian',
      message: `Pembelian dari ${purchase.supplier} berhasil disimpan, tapi stok gudang perlu disinkronkan manual`,
      type: 'warning',
      icon: 'alert-triangle',
      priority: 2,
      related_type: 'purchase',
      action_url: '/purchase',
      is_read: false,
      is_archived: false
    });
  }

  return success;
};