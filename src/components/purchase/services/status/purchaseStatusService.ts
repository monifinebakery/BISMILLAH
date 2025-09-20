// src/components/purchase/services/status/purchaseStatusService.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Purchase } from '../../types/purchase.types';
import {
  transformPurchaseFromDB
} from '../../utils/purchaseTransformers';
import { applyPurchaseToWarehouse, reversePurchaseFromWarehouse } from '@/components/warehouse/services/warehouseSyncService';

/**
 * Status Management Service for Purchases
 * Handles status changes and related warehouse synchronization
 */

// Custom error class for sync operations
class SyncError extends Error {
  constructor(message: string, public originalError?: Error, public context?: any) {
    super(message);
    this.name = 'SyncError';
  }
}

// Interface for atomic sync options
interface AtomicSyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  forceSync?: boolean;
}

/**
 * Atomic transaction wrapper for purchase-warehouse sync
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: AtomicSyncOptions = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`🔄 Retry attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw new SyncError(
    `Operation failed after ${maxRetries} attempts`,
    lastError,
    { maxRetries, retryDelay }
  );
}

/**
 * Atomic purchase completion with warehouse sync
 */
async function atomicPurchaseCompletion(
  purchaseId: string,
  userId: string,
  options: AtomicSyncOptions = {}
): Promise<{ purchase: Purchase; syncApplied: boolean }> {
  return executeWithRetry(async () => {
    // Step 1: Update purchase status to completed
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', purchaseId)
      .eq('user_id', userId);

    if (updateError) {
      throw new SyncError('Failed to update purchase status', updateError);
    }

    // Step 2: Fetch updated purchase
    const { data: purchaseData, error: fetchError } = await supabase
      .from('purchases')
      .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
      .eq('id', purchaseId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !purchaseData) {
      throw new SyncError('Failed to fetch updated purchase', fetchError);
    }

    const purchase = transformPurchaseFromDB(purchaseData);

    // Step 3: Apply warehouse sync if needed
    let syncApplied = false;
    if (!shouldSkipWarehouseSync(purchase, options.forceSync)) {
      try {
        await applyPurchaseToWarehouse(purchase);
        syncApplied = true;
        logger.info('✅ Atomic purchase completion: warehouse sync applied', purchaseId);
      } catch (syncError) {
        // Rollback purchase status if warehouse sync fails
        await supabase
          .from('purchases')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', purchaseId)
          .eq('user_id', userId);
        
        throw new SyncError('Warehouse sync failed, purchase rolled back', syncError as Error);
      }
    }

    return { purchase, syncApplied };
  }, options);
}

/**
 * Atomic purchase reversal with warehouse sync
 */
async function atomicPurchaseReversal(
  purchase: Purchase,
  options: AtomicSyncOptions = {}
): Promise<boolean> {
  return executeWithRetry(async () => {
    if (!shouldSkipWarehouseSync(purchase, options.forceSync)) {
      await reversePurchaseFromWarehouse(purchase);
      logger.info('✅ Atomic purchase reversal: warehouse sync applied', purchase.id);
      return true;
    }
    return false;
  }, options);
}

/**
 * Determine if warehouse sync should be skipped
 */
function shouldSkipWarehouseSync(purchase: Purchase | null | undefined, forceSync: boolean = false): boolean {
  logger.debug('🔄 [PURCHASE STATUS] shouldSkipWarehouseSync called with:', { purchase: purchase?.id, forceSync });
  
  // If forceSync is true, don't skip (allow manual sync for any items)
  if (forceSync) {
    logger.debug('⏭️ [PURCHASE STATUS] shouldSkipWarehouseSync: false (forceSync enabled)');
    return false;
  }
  
  if (!purchase || !Array.isArray(purchase.items)) {
    logger.debug('⏭️ [PURCHASE STATUS] shouldSkipWarehouseSync: false (no purchase or items)');
    return false;
  }
  
  // ✅ SAMA UNTUK SEMUA: Import dan manual entry diperlakukan sama
  // Tidak skip warehouse sync untuk item apapun - semua harus update warehouse
  logger.debug('⏭️ [PURCHASE STATUS] shouldSkipWarehouseSync: false (treating all items equally)');
  return false;
}

/**
 * Helper function to get supplier name by ID from database
 */
async function getSupplierNameById(supplierId: string | null | undefined): Promise<string> {
  if (!supplierId || typeof supplierId !== 'string' || supplierId.trim() === '') {
    return 'Supplier tidak diketahui';
  }

  try {
    // First try to parse as number (supplier ID)
    const supplierIdNum = parseInt(supplierId.trim());
    if (!isNaN(supplierIdNum)) {
      const { data, error } = await supabase
        .from('suppliers')
        .select('nama')
        .eq('id', supplierIdNum)
        .single();

      if (!error && data?.nama) {
        return data.nama.trim();
      }
    }
    
    // If not a number or not found, return as is (could be a name already)
    return supplierId.trim();
  } catch (error) {
    logger.warn('Error fetching supplier name:', error);
    return supplierId.trim();
  }
}

/**
 * Set purchase status with atomic warehouse sync
 */
export async function setPurchaseStatus(
  id: string,
  userId: string,
  newStatus: Purchase['status']
): Promise<{ success: boolean; error: string | null }> {
  try {
    logger.debug('🔄 [PURCHASE STATUS] setPurchaseStatus called:', { id, userId, newStatus });
    
    // Fetch current purchase
    const { data: existingRow, error: fetchErr } = await supabase
      .from('purchases')
      .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchErr) {
      logger.warn('⚠️ setPurchaseStatus fetchErr:', { code: fetchErr.code, message: fetchErr.message, id, userId });
      if (fetchErr.code === 'PGRST116') {
        return { success: false, error: 'Pembelian tidak ditemukan' };
      }
      throw new Error(fetchErr.message);
    }
    
    const prev = existingRow ? transformPurchaseFromDB(existingRow) : null;
    if (!prev) {
      return { success: false, error: 'Data pembelian tidak valid' };
    }
    
    logger.debug('🔄 [PURCHASE STATUS] Previous purchase data:', prev);
    
    // Skip if no status change
    if (prev.status === newStatus) {
      logger.info('⏭️ [PURCHASE STATUS] No status change, skipping');
      return { success: true, error: null };
    }
    
    // Handle different status transitions atomically
    if (newStatus === 'completed') {
      // Use atomic completion with retry logic
      try {
        const result = await atomicPurchaseCompletion(id, userId, { forceSync: true });
        
        // Dispatch status change event for WAC refresh
        logger.info('🔄 [PURCHASE STATUS] Dispatching purchase status change event');
        if (typeof window !== 'undefined') {
          // Get supplier name from database to avoid showing supplier ID in notifications
          const supplierName = await getSupplierNameById(result.purchase.supplier);
          
          window.dispatchEvent(new CustomEvent('purchase:status:changed', {
            detail: { 
              purchaseId: result.purchase.id, 
              supplier: supplierName, // Now using resolved supplier name instead of ID
              total_nilai: result.purchase.total_nilai,
              oldStatus: prev.status,
              newStatus: newStatus,
              syncApplied: result.syncApplied
            }
          }));
        }
        
        logger.info('✅ [PURCHASE STATUS] Atomic purchase completion successful:', {
          purchaseId: id,
          syncApplied: result.syncApplied
        });
        
        return { success: true, error: null };
      } catch (error) {
        if (error instanceof SyncError) {
          logger.error('❌ [PURCHASE STATUS] Atomic completion failed:', error.message);
          return { success: false, error: `Gagal menyelesaikan pembelian: ${error.message}` };
        }
        throw error;
      }
    } else if (prev.status === 'completed') {
      // Reverse warehouse changes before changing from completed
      try {
        await atomicPurchaseReversal(prev, { forceSync: true });
        
        // Then update the status
        const { error } = await supabase
          .from('purchases')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId);
        
        if (error) throw new Error(error.message);
        
        logger.info('✅ [PURCHASE STATUS] Purchase status reversed and updated:', {
          purchaseId: id,
          from: prev.status,
          to: newStatus
        });
        
        return { success: true, error: null };
      } catch (error) {
        if (error instanceof SyncError) {
          logger.error('❌ [PURCHASE STATUS] Atomic reversal failed:', error.message);
          return { success: false, error: `Gagal mengubah status: ${error.message}` };
        }
        throw error;
      }
    } else {
      // Simple status change (no warehouse sync needed)
      const { error } = await supabase
        .from('purchases')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw new Error(error.message);
      
      logger.info('✅ [PURCHASE STATUS] Simple status update completed:', {
        purchaseId: id,
        from: prev.status,
        to: newStatus
      });
      
      return { success: true, error: null };
    }
  } catch (err: any) {
    logger.error('❌ [PURCHASE STATUS] Error updating status:', err);
    return { success: false, error: err.message || 'Gagal update status' };
  }
}

/**
 * Helper to complete a purchase (set status to 'completed')
 */
export async function completePurchase(id: string, userId: string) {
  return setPurchaseStatus(id, userId, 'completed');
}