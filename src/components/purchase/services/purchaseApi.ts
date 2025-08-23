// src/components/purchase/services/purchaseApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Purchase } from '../types/purchase.types';
import {
  transformPurchasesFromDB,
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB
} from '../utils/purchaseTransformers';
import { applyPurchaseToWarehouse, reversePurchaseFromWarehouse } from '@/components/warehouse/services/warehouseSyncService';

export class PurchaseApiService {
  private static shouldSkipWarehouseSync(purchase: Purchase | null | undefined, forceSync: boolean = false): boolean {
    console.log('🔄 [PURCHASE API] shouldSkipWarehouseSync called with:', { purchase: purchase?.id, forceSync });
    
    // If forceSync is true, don't skip (allow manual sync for any items)
    if (forceSync) {
      console.log('⏭️ [PURCHASE API] shouldSkipWarehouseSync: false (forceSync enabled)');
      return false;
    }
    
    if (!purchase || !Array.isArray(purchase.items)) {
      console.log('⏭️ [PURCHASE API] shouldSkipWarehouseSync: false (no purchase or items)');
      return false;
    }
    
    // ✅ SAMA UNTUK SEMUA: Import dan manual entry diperlakukan sama
    // Tidak skip warehouse sync untuk item apapun - semua harus update warehouse
    console.log('⏭️ [PURCHASE API] shouldSkipWarehouseSync: false (treating all items equally)');
    return false;
  }
  /** Get all purchases */
  static async fetchPurchases(userId: string): Promise<{ data: Purchase[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: transformPurchasesFromDB(data ?? []), error: null };
    } catch (err: any) {
      logger.error('Error fetching purchases:', err);
      return { data: null, error: err.message || 'Gagal memuat data pembelian' };
    }
  }

  /** Get one purchase */
  static async fetchPurchaseById(id: string, userId: string): Promise<{ data: Purchase | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw new Error(error.message);
      return { data: data ? transformPurchaseFromDB(data) : null, error: null };
    } catch (err: any) {
      logger.error('Error fetching purchase:', err);
      return { data: null, error: err.message || 'Gagal memuat data pembelian' };
    }
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
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
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
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (fetchUpdatedErr) throw new Error(fetchUpdatedErr.message);
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
   * Set status (pending/completed/cancelled).
   * Manual warehouse synchronization when status changes to 'completed':
   * - menambah stok,
   * - hitung WAC (harga_rata_rata),
   * - dan pada edit/delete berikutnya, stok akan dikoreksi otomatis.
   */
  static async setPurchaseStatus(
    id: string,
    userId: string,
    newStatus: Purchase['status']
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🔄 [PURCHASE API] setPurchaseStatus called:', { id, userId, newStatus });
      
      // Fetch current
      const { data: existingRow, error: fetchErr } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
      const prev = existingRow ? transformPurchaseFromDB(existingRow) : null;
      
      console.log('🔄 [PURCHASE API] Previous purchase data:', prev);

      // Update status

      const { error } = await supabase
        .from('purchases')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      
      console.log('✅ [PURCHASE API] Status updated in database');

      // Manual apply/reverse after status change
      if (prev && prev.status !== newStatus) {
        console.log('🔄 [PURCHASE API] Status changed from', prev.status, 'to', newStatus);
        
        if (newStatus === 'completed') {
          console.log('🔄 [PURCHASE API] Applying to warehouse...');
          // Fetch fresh row to reflect any concurrent changes
          const { data: newRow } = await supabase
            .from('purchases')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
          const fresh = newRow ? transformPurchaseFromDB(newRow) : prev;
          
          console.log('🔄 [PURCHASE API] Fresh purchase data for warehouse sync:', fresh);
          
          // Force sync for manual status changes (even for imported items)
          const forceSync = true;
          if (!this.shouldSkipWarehouseSync(fresh, forceSync)) {
            console.log('🔄 [PURCHASE API] Calling applyPurchaseToWarehouse with forceSync...');
            await applyPurchaseToWarehouse(fresh);
            console.log('✅ [PURCHASE API] Warehouse sync completed');
          } else {
            console.log('⏭️ [PURCHASE API] Skipping warehouse sync (shouldSkipWarehouseSync returned true)');
          }
        } else if (prev.status === 'completed') {
          console.log('🔄 [PURCHASE API] Reversing from warehouse...');
          // Force sync for manual status changes (even for imported items) 
          const forceSync = true;
          if (!this.shouldSkipWarehouseSync(prev, forceSync)) {
            await reversePurchaseFromWarehouse(prev);
            console.log('✅ [PURCHASE API] Warehouse reverse completed');
          } else {
            console.log('⏭️ [PURCHASE API] Skipping warehouse reverse (shouldSkipWarehouseSync returned true)');
          }
        }
      } else {
        console.log('⏭️ [PURCHASE API] No status change, skipping warehouse sync');
      }



      return { success: true, error: null };
    } catch (err: any) {
      console.error('❌ [PURCHASE API] Error in setPurchaseStatus:', err);
      logger.error('Error updating status:', err);
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
  */
  static async deletePurchase(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Fetch existing to reverse if needed
      const { data: existingRow } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      const existing = existingRow ? transformPurchaseFromDB(existingRow) : null;

      if (existing && existing.status === 'completed' && !this.shouldSkipWarehouseSync(existing, false)) {
        await reversePurchaseFromWarehouse(existing);
      }

      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
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
        .select('*')
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
        .select('*')
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
