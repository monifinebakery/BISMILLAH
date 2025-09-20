// src/components/purchase/services/purchaseApi.ts
import { logger } from '@/utils/logger';
import type { Purchase } from '../types/purchase.types';
import { transformPurchaseFromDB } from '../utils/purchaseTransformers';
import { reversePurchaseFromWarehouse } from '@/components/warehouse/services/warehouseSyncService';

// Import the new modular services
import {
  fetchPurchases,
  fetchPaginatedPurchases,
  fetchPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  bulkDeletePurchases
} from './crud/purchaseCrudService';

import {
  setPurchaseStatus,
  completePurchase
} from './status/purchaseStatusService';

import {
  getPurchaseStats,
  getPurchasesByDateRange,
  searchPurchases,
  cleanupFinancialTransactions
} from './validation/purchaseValidationService';

/**
 * Main Purchase API Service
 * This is a simplified facade that delegates to specialized services
 */

// Re-export all the individual services
export {
  // CRUD operations
  fetchPurchases,
  fetchPaginatedPurchases,
  fetchPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  bulkDeletePurchases,
  
  // Status operations
  setPurchaseStatus,
  completePurchase,
  
  // Validation operations
  getPurchaseStats,
  getPurchasesByDateRange,
  searchPurchases,
  cleanupFinancialTransactions
};

/**
 * Create then fetch created purchase
 */
export async function createPurchaseAndFetch(
  purchaseData: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<{ data: Purchase | null; error: string | null }> {
  const res = await createPurchase(purchaseData, userId);
  if (!res.success || !res.purchaseId) {
    return { data: null, error: res.error || 'Gagal membuat pembelian' };
  }
  return fetchPurchaseById(res.purchaseId, userId);
}

/**
 * Update then fetch updated purchase
 */
export async function updatePurchaseAndFetch(
  id: string,
  updatedData: Partial<Purchase>,
  userId: string
): Promise<{ data: Purchase | null; error: string | null }> {
  const res = await updatePurchase(id, updatedData, userId);
  if (!res.success) {
    return { data: null, error: res.error || 'Gagal memperbarui pembelian' };
  }
  return fetchPurchaseById(id, userId);
}

/**
 * Set status then fetch updated purchase
 */
export async function setStatusAndFetch(
  id: string,
  userId: string,
  newStatus: Purchase['status']
): Promise<{ data: Purchase | null; error: string | null }> {
  const res = await setPurchaseStatus(id, userId, newStatus);
  if (!res.success) {
    return { data: null, error: res.error || 'Gagal update status' };
  }
  return fetchPurchaseById(id, userId);
}

/**
 * Delete purchase with cleanup
 */
export async function deletePurchaseWithCleanup(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Fetch existing to reverse if needed
    const { data: existingRow, error: fetchErr } = await fetchPurchaseById(id, userId);
    
    // If record doesn't exist, that's fine for deletion
    if (fetchErr) {
      logger.warn('⚠️ deletePurchaseWithCleanup fetchErr:', { error: fetchErr, id, userId });
    }
    
    const existing = existingRow;

    // ✅ FIXED: Clean up related financial transactions BEFORE deleting purchase
    await cleanupFinancialTransactions(id, userId);

    // Reverse warehouse changes if needed
    if (existing && existing.status === 'completed') {
      await reversePurchaseFromWarehouse(existing);
    }

    // Delete the purchase
    const deleteResult = await deletePurchase(id, userId);
    
    if (deleteResult.success) {
      logger.info('✅ [PURCHASE API] Purchase and related data deleted successfully:', id);
    }
    
    return deleteResult;
  } catch (err: any) {
    logger.error('Error deleting purchase:', err);
    return { success: false, error: err.message || 'Gagal menghapus pembelian' };
  }
}

/**
 * Realtime service for purchases
 */
export class PurchaseRealtimeService {
  private static channels: Map<string, any> = new Map();

  static subscribe(
    userId: string,
    callbacks: {
      onInsert?: (purchase: Purchase) => void;
      onUpdate?: (purchase: Purchase) => void;
      onDelete?: (purchaseId: string) => void;
      onError?: (error: any) => void;
    }
  ): () => void {
    // This would need to be implemented with the actual Supabase client
    // For now, we'll just return a dummy unsubscribe function
    return () => {};
  }

  static unsubscribe(userId: string) {
    // Implementation would go here
  }

  static unsubscribeAll() {
    // Implementation would go here
  }
}

// Default export for backward compatibility
export default {
  fetchPurchases,
  fetchPaginatedPurchases,
  fetchPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  bulkDeletePurchases,
  setPurchaseStatus,
  completePurchase,
  getPurchaseStats,
  getPurchasesByDateRange,
  searchPurchases,
  createPurchaseAndFetch,
  updatePurchaseAndFetch,
  setStatusAndFetch,
  deletePurchaseWithCleanup
};