// src/components/purchase/services/purchaseApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import type { Purchase } from '../types/purchase.types';
import {
  transformPurchasesFromDB,
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB
} from '../utils/purchaseTransformers';
import { applyPurchaseToWarehouse, reversePurchaseFromWarehouse } from '@/components/warehouse/services/warehouseSyncService';

// ✅ NEW: Atomic transaction utilities for sync reliability
interface AtomicSyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  forceSync?: boolean;
}

class SyncError extends Error {
  constructor(message: string, public originalError?: Error, public context?: any) {
    super(message);
    this.name = 'SyncError';
  }
}

export class PurchaseApiService {
  // ✅ NEW: Atomic transaction wrapper for purchase-warehouse sync
  private static async executeWithRetry<T>(
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

  // ✅ NEW: Atomic purchase completion with warehouse sync
  private static async atomicPurchaseCompletion(
    purchaseId: string,
    userId: string,
    options: AtomicSyncOptions = {}
  ): Promise<{ purchase: Purchase; syncApplied: boolean }> {
    return this.executeWithRetry(async () => {
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
      if (!this.shouldSkipWarehouseSync(purchase, options.forceSync)) {
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

  // ✅ NEW: Atomic purchase reversal with warehouse sync
  private static async atomicPurchaseReversal(
    purchase: Purchase,
    options: AtomicSyncOptions = {}
  ): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (!this.shouldSkipWarehouseSync(purchase, options.forceSync)) {
        await reversePurchaseFromWarehouse(purchase);
        logger.info('✅ Atomic purchase reversal: warehouse sync applied', purchase.id);
        return true;
      }
      return false;
    }, options);
  }

  private static shouldSkipWarehouseSync(purchase: Purchase | null | undefined, forceSync: boolean = false): boolean {
    logger.debug('🔄 [PURCHASE API] shouldSkipWarehouseSync called with:', { purchase: purchase?.id, forceSync });
    
    // If forceSync is true, don't skip (allow manual sync for any items)
    if (forceSync) {
      logger.debug('⏭️ [PURCHASE API] shouldSkipWarehouseSync: false (forceSync enabled)');
      return false;
    }
    
    if (!purchase || !Array.isArray(purchase.items)) {
      logger.debug('⏭️ [PURCHASE API] shouldSkipWarehouseSync: false (no purchase or items)');
      return false;
    }
    
    // ✅ SAMA UNTUK SEMUA: Import dan manual entry diperlakukan sama
    // Tidak skip warehouse sync untuk item apapun - semua harus update warehouse
    logger.debug('⏭️ [PURCHASE API] shouldSkipWarehouseSync: false (treating all items equally)');
    return false;
  }
  /** Get all purchases */
  static async fetchPurchases(userId: string): Promise<{ data: Purchase[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: transformPurchasesFromDB(data ?? []), error: null };
    } catch (err: any) {
      logger.error('Error fetching purchases:', err);
      return { data: null, error: err.message || 'Gagal memuat data pembelian' };
    }
  }

  /** Get purchases with pagination */
  static async fetchPurchasesPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Purchase[]; total: number; totalPages: number; error: string | null }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const { count, error: countError } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw new Error(countError.message);

      // Get paginated data
      const { data, error } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('user_id', userId)
        .order('tanggal', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new Error(error.message);

      const total = count || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        data: transformPurchasesFromDB(data ?? []),
        total,
        totalPages,
        error: null,
      };
    } catch (err: any) {
      logger.error('Error fetching paginated purchases:', err);
      return { data: [], total: 0, totalPages: 0, error: err.message || 'Gagal memuat data pembelian' };
    }
  }

  /** Get one purchase */
  static async fetchPurchaseById(id: string, userId: string): Promise<{ data: Purchase | null; error: string | null }> {
    try {
      logger.debug('🔍 fetchPurchaseById called with:', { id, userId });
      const { data, error } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      // Handle PGRST116 error (no rows found) gracefully
      if (error) {
        logger.warn('⚠️ fetchPurchaseById error:', { code: error.code, message: error.message, id, userId });
        if (error.code === 'PGRST116') {
          logger.info('ℹ️ PGRST116 handled gracefully in fetchPurchaseById');
          return { data: null, error: null }; // No data found, but not an error
        }
        throw new Error(error.message);
      }
      logger.info('✅ fetchPurchaseById success:', { hasData: !!data, id });
      return { data: data ? transformPurchaseFromDB(data) : null, error: null };
    } catch (err: any) {
      logger.error('❌ fetchPurchaseById catch:', { err, id, userId });
      logger.error('Error fetching purchase:', err);
      return { data: null, error: err.message || 'Gagal memuat data pembelian' };
    }
  }

  /** Create then fetch created purchase */
  static async createPurchaseAndFetch(
    purchaseData: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<{ data: Purchase | null; error: string | null }> {
    const res = await this.createPurchase(purchaseData, userId);
    if (!res.success || !res.purchaseId) {
      return { data: null, error: res.error || 'Gagal membuat pembelian' };
    }
    return this.fetchPurchaseById(res.purchaseId, userId);
  }

  /** Update then fetch updated purchase */
  static async updatePurchaseAndFetch(
    id: string,
    updatedData: Partial<Purchase>,
    userId: string
  ): Promise<{ data: Purchase | null; error: string | null }> {
    const res = await this.updatePurchase(id, updatedData, userId);
    if (!res.success) {
      return { data: null, error: res.error || 'Gagal memperbarui pembelian' };
    }
    return this.fetchPurchaseById(id, userId);
  }

  /** Set status then fetch updated purchase */
  static async setStatusAndFetch(
    id: string,
    userId: string,
    newStatus: Purchase['status']
  ): Promise<{ data: Purchase | null; error: string | null }> {
    const res = await this.setPurchaseStatus(id, userId, newStatus);
    if (!res.success) {
      return { data: null, error: res.error || 'Gagal update status' };
    }
    return this.fetchPurchaseById(id, userId);
  }

  /** Create purchase (status biasanya 'pending' dulu) */
  static async createPurchase(
    purchaseData: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<{ success: boolean; error: string | null; purchaseId?: string }> {
    try {
      const payload = transformPurchaseForDB(purchaseData, userId);
      const { data, error } = await supabase
        .from('purchases')
        .insert(payload)
        .select('id') // return id
        .single();

      if (error) throw new Error(error.message);

      // Manual sync: apply to warehouse if created as completed
      // Don't force sync during creation (respect IMPORTED flag)
      if (purchaseData.status === 'completed' && data?.id && !this.shouldSkipWarehouseSync(purchaseData as Purchase, false)) {

        await applyPurchaseToWarehouse({
          ...purchaseData,
          id: data.id,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Purchase);
      }
      return { success: true, error: null, purchaseId: data?.id };
    } catch (err: any) {
      logger.error('Error creating purchase:', err);
      return { success: false, error: err.message || 'Gagal membuat pembelian' };
    }
  }

  /**
   * Update purchase (allowed even after completed).
   * Manual warehouse synchronization: changes to items/total/status
   * will be manually synchronized to warehouse stock and WAC.
   */
  static async updatePurchase(
    id: string,
    updatedData: Partial<Purchase>,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Fetch existing to know previous status/items
      const { data: existingRow, error: fetchErr } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (fetchErr) {
        logger.warn('⚠️ updatePurchase fetchErr:', { code: fetchErr.code, message: fetchErr.message, id, userId });
        if (fetchErr.code === 'PGRST116') {
          return { success: false, error: 'Pembelian tidak ditemukan' };
        }
        throw new Error(fetchErr.message);
      }
      const existing = existingRow ? transformPurchaseFromDB(existingRow) : null;

      // If existing was completed, reverse its effects first
      if (existing && existing.status === 'completed' && !this.shouldSkipWarehouseSync(existing, false)) {
        await reversePurchaseFromWarehouse(existing);
      }

      const payload = transformPurchaseUpdateForDB(updatedData);
      const { error } = await supabase
        .from('purchases')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);

      // Fetch updated row to apply new effects if still completed
      const { data: updatedRow, error: fetchUpdatedErr } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (fetchUpdatedErr) {
        logger.warn('⚠️ updatePurchase fetchUpdatedErr:', { code: fetchUpdatedErr.code, message: fetchUpdatedErr.message, id, userId });
        if (fetchUpdatedErr.code !== 'PGRST116') {
          throw new Error(fetchUpdatedErr.message);
        }
        // PGRST116 means row not found after update, which shouldn't happen but we'll handle it gracefully
        logger.info('ℹ️ PGRST116 after purchase update - purchase may have been deleted by another process');
      }
      const updated = updatedRow ? transformPurchaseFromDB(updatedRow) : null;

      if (updated && updated.status === 'completed' && !this.shouldSkipWarehouseSync(updated, false)) {
        await applyPurchaseToWarehouse(updated);
      }
      return { success: true, error: null };
    } catch (err: any) {
      logger.error('Error updating purchase:', err);
      return { success: false, error: err.message || 'Gagal memperbarui pembelian' };
    }
  }

  /**
   * Helper function to get supplier name by ID from database
   * Used for displaying proper names in notifications instead of IDs
   */
  private static async getSupplierNameById(supplierId: string | null | undefined): Promise<string> {
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
   * ✅ NEW: Atomic purchase status update with robust sync handling
   * Set status (pending/completed/cancelled) with atomic warehouse sync
   */
  static async setPurchaseStatus(
    id: string,
    userId: string,
    newStatus: Purchase['status']
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      logger.debug('🔄 [PURCHASE API] setPurchaseStatus called:', { id, userId, newStatus });
      
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
      
      logger.debug('🔄 [PURCHASE API] Previous purchase data:', prev);
      
      // Skip if no status change
      if (prev.status === newStatus) {
        logger.info('⏭️ [PURCHASE API] No status change, skipping');
        return { success: true, error: null };
      }
      
      // Handle different status transitions atomically
      if (newStatus === 'completed') {
        // Use atomic completion with retry logic
        try {
          const result = await this.atomicPurchaseCompletion(id, userId, { forceSync: true });
          
          // Dispatch status change event for WAC refresh
          logger.info('🔄 [PURCHASE API] Dispatching purchase status change event');
          if (typeof window !== 'undefined') {
            // Get supplier name from database to avoid showing supplier ID in notifications
            const supplierName = await this.getSupplierNameById(result.purchase.supplier);
            
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
          
          logger.info('✅ [PURCHASE API] Atomic purchase completion successful:', {
            purchaseId: id,
            syncApplied: result.syncApplied
          });
          
          return { success: true, error: null };
        } catch (error) {
          if (error instanceof SyncError) {
            logger.error('❌ [PURCHASE API] Atomic completion failed:', error.message);
            return { success: false, error: `Gagal menyelesaikan pembelian: ${error.message}` };
          }
          throw error;
        }
      } else if (prev.status === 'completed') {
        // Reverse warehouse changes before changing from completed
        try {
          await this.atomicPurchaseReversal(prev, { forceSync: true });
          
          // Then update the status
          const { error } = await supabase
            .from('purchases')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
          
          if (error) throw new Error(error.message);
          
          logger.info('✅ [PURCHASE API] Purchase status reversed and updated:', {
            purchaseId: id,
            from: prev.status,
            to: newStatus
          });
          
          return { success: true, error: null };
        } catch (error) {
          if (error instanceof SyncError) {
            logger.error('❌ [PURCHASE API] Atomic reversal failed:', error.message);
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
        
        logger.info('✅ [PURCHASE API] Simple status update completed:', {
          purchaseId: id,
          from: prev.status,
          to: newStatus
        });
        
        return { success: true, error: null };
      }
    } catch (err: any) {
      logger.error('❌ [PURCHASE API] Error updating status:', err);
      return { success: false, error: err.message || 'Gagal update status' };
    }
  }

  // NEW: Helper biar jelas dipakai tombol "Selesai"
  static async completePurchase(id: string, userId: string) {
    return this.setPurchaseStatus(id, userId, 'completed' as Purchase['status']);
  }

  /**
  * Delete purchase.
  * Manual warehouse synchronization: if purchase was completed,
  * manually reverse stock and WAC changes before deletion.
  * Also cleans up related financial transactions.
  */
  static async deletePurchase(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Fetch existing to reverse if needed
      const { data: existingRow, error: fetchErr } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      // If record doesn't exist, that's fine for deletion
      if (fetchErr) {
        logger.warn('⚠️ deletePurchase fetchErr:', { code: fetchErr.code, message: fetchErr.message, id, userId });
        if (fetchErr.code !== 'PGRST116') {
          logger.warn('Warning fetching purchase for deletion:', fetchErr.message);
        } else {
          logger.info('ℹ️ PGRST116 when fetching purchase for deletion - purchase already deleted or not found');
        }
      }
      const existing = existingRow ? transformPurchaseFromDB(existingRow) : null;

      // ✅ FIXED: Clean up related financial transactions BEFORE deleting purchase
      logger.info('💰 [PURCHASE API] Cleaning up financial transactions for purchase:', id);
      try {
        const { data: financialTxns, error: financialFetchErr } = await supabase
          .from('financial_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('related_id', id)
          .eq('type', 'expense');
        
        if (financialFetchErr) {
          logger.warn('Warning fetching financial transactions for cleanup:', financialFetchErr.message);
        } else if (financialTxns && financialTxns.length > 0) {
          logger.info(`🗑️ [PURCHASE API] Found ${financialTxns.length} financial transaction(s) to delete`);
          const { error: deleteFinancialErr } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('user_id', userId)
            .eq('related_id', id)
            .eq('type', 'expense');
          
          if (deleteFinancialErr) {
            logger.warn('Warning deleting financial transactions:', deleteFinancialErr.message);
          } else {
            logger.info('✅ [PURCHASE API] Financial transactions cleaned up successfully');
          }
        } else {
          logger.info('ℹ️ [PURCHASE API] No financial transactions found for cleanup');
        }
      } catch (financialErr) {
        logger.warn('Error during financial transaction cleanup:', financialErr);
        // Continue with purchase deletion even if financial cleanup fails
      }

      // Reverse warehouse changes if needed
      if (existing && existing.status === 'completed' && !this.shouldSkipWarehouseSync(existing, false)) {
        await reversePurchaseFromWarehouse(existing);
      }

      // Delete the purchase
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      logger.info('✅ [PURCHASE API] Purchase and related data deleted successfully:', id);
      return { success: true, error: null };
    } catch (err: any) {
      logger.error('Error deleting purchase:', err);
      return { success: false, error: err.message || 'Gagal menghapus pembelian' };
    }
  }

  /** Bulk delete */
  static async bulkDeletePurchases(
    ids: string[],
    userId: string
  ): Promise<{ success: boolean; error: string | null; results?: { successful: number; failed: number } }> {
    try {
      const deletePromises = ids.map((id) => this.deletePurchase(id, userId));
      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter((r) => r.status === 'fulfilled' && (r as any).value.success).length;
      const failed = results.length - successful;

      return {
        success: successful > 0,
        error: failed > 0 ? `${failed} dari ${results.length} gagal dihapus` : null,
        results: { successful, failed }
      };
    } catch (err: any) {
      logger.error('Error bulk deleting purchases:', err);
      return { success: false, error: err.message || 'Gagal menghapus pembelian' };
    }
  }

  /** Get basic purchase statistics manually */
  static async getPurchaseStats(userId: string) {
    try {
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('status, total_nilai')
        .eq('user_id', userId);

      if (error) throw new Error(error.message);

      const stats = {
        total: purchases?.length || 0,
        pending: purchases?.filter(p => p.status === 'pending').length || 0,
        completed: purchases?.filter(p => p.status === 'completed').length || 0,
        cancelled: purchases?.filter(p => p.status === 'cancelled').length || 0,
        total_value: purchases?.reduce((sum, p) => sum + (p.total_nilai || 0), 0) || 0
      };

      return { data: stats, error: null as string | null };
    } catch (err: any) {
      logger.error('Error getting purchase stats:', err);
      return { data: null, error: err.message || 'Gagal memuat statistik pembelian' };
    }
  }

  /** Get purchases by date range manually */
  static async getPurchasesByDateRange(userId: string, startDate: Date, endDate: Date) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('user_id', userId)
        .gte('tanggal', startDate.toISOString().slice(0, 10))
        .lte('tanggal', endDate.toISOString().slice(0, 10))
        .order('tanggal', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: transformPurchasesFromDB(data ?? []), error: null };
    } catch (err: any) {
      logger.error('Error fetching purchases by date range:', err);
      return { data: null, error: err.message || 'Gagal memuat data pembelian' };
    }
  }

  /** Simple search */
  static async searchPurchases(userId: string, query: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('user_id', userId)
        // NB: jika kolom "supplier" kamu bukan text, sesuaikan or() ini
        .or(`supplier.ilike.%${query}%,items.cs.{"nama":"${query}"}`)
        .order('tanggal', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return { data: transformPurchasesFromDB(data ?? []), error: null };
    } catch (err: any) {
      logger.error('Error searching purchases:', err);
      return { data: null, error: err.message || 'Gagal mencari data pembelian' };
    }
  }
}

/** Realtime (purchases). Tambahkan realtime bahan_baku di Warehouse context agar stok auto-refresh */
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
    const channelName = `purchases-${userId}`;
    if (this.channels.has(channelName)) this.unsubscribe(userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchases', filter: `user_id=eq.${userId}` },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              callbacks.onInsert?.(transformPurchaseFromDB(payload.new));
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              callbacks.onUpdate?.(transformPurchaseFromDB(payload.new));
            } else if (payload.eventType === 'DELETE' && (payload.old as any)?.id) {
              callbacks.onDelete?.((payload.old as any).id);
            }
          } catch (e) {
            logger.error('Realtime update error:', e);
            callbacks.onError?.(e);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(userId);
  }

  static unsubscribe(userId: string) {
    const channelName = `purchases-${userId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  static unsubscribeAll() {
    this.channels.forEach((ch) => supabase.removeChannel(ch));
    this.channels.clear();
  }
}

// ✅ FIXED: Proper export structure to avoid temporal dead zone issues
export const purchaseApi = PurchaseApiService;
export const purchaseRealtime = PurchaseRealtimeService;

// ✅ Additional instance exports for immediate use
export const purchaseApiInstance = new (class extends PurchaseApiService {})();
export const purchaseRealtimeInstance = new (class extends PurchaseRealtimeService {})();

// ✅ Default export for easy importing
export default purchaseApi;
