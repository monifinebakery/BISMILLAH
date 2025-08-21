// src/components/purchase/services/purchaseApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Purchase, PurchaseItem } from '../types/purchase.types';
import {
  transformPurchasesFromDB,
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB
} from '../utils/purchaseTransformers';
import { applyPurchaseToWarehouse, reversePurchaseFromWarehouse } from '@/components/warehouse/services/warehouseSyncService';

export class PurchaseApiService {
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

      // Jika langsung dibuat dengan status 'completed', sinkronkan stok & WAC
      if (purchaseData.status === 'completed' && data?.id) {
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
   * Update purchase (BOLEH meski sudah completed).
   * Perubahan items/total/status akan otomatis disinkronkan ke stok & WAC oleh trigger di DB.
   */
  static async updatePurchase(
    id: string,
    updatedData: Partial<Purchase>,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Ambil data pembelian lama untuk bandingkan status & item
      const { data: oldPurchase, error: fetchError } = await this.fetchPurchaseById(id, userId);
      if (fetchError) throw new Error(fetchError);
      if (!oldPurchase) throw new Error('Pembelian tidak ditemukan');

      const previousStatus = oldPurchase.status;
      const newStatus = updatedData.status ?? previousStatus;
      const newItems = updatedData.items ?? oldPurchase.items;

      // Update data di Supabase
      const payload = transformPurchaseUpdateForDB(updatedData);
      const { error } = await supabase
        .from('purchases')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);

      // Sinkronisasi stok gudang sesuai perubahan status & item
      const newPurchase = {
        ...oldPurchase,
        ...updatedData,
        status: newStatus,
        items: newItems
      } as Purchase;

      if (previousStatus === 'completed' && newStatus === 'completed') {
        // Hitung selisih kuantitas per item
        const oldMap = new Map(
          oldPurchase.items.map((i) => [i.bahanBakuId, i])
        );
        const newMap = new Map(
          newItems.map((i) => [i.bahanBakuId, i])
        );
        const allIds = new Set([
          ...Array.from(oldMap.keys()),
          ...Array.from(newMap.keys())
        ]);

        const toApply: PurchaseItem[] = [];
        const toReverse: PurchaseItem[] = [];

        allIds.forEach((id) => {
          const oldItem = oldMap.get(id);
          const newItem = newMap.get(id);
          const oldQty = oldItem?.kuantitas ?? 0;
          const newQty = newItem?.kuantitas ?? 0;
          const diff = newQty - oldQty;

          if (diff > 0 && newItem) {
            toApply.push({ ...newItem, kuantitas: diff });
          } else if (diff < 0 && oldItem) {
            toReverse.push({ ...oldItem, kuantitas: Math.abs(diff) });
          }
        });

        if (toReverse.length) {
          await reversePurchaseFromWarehouse({ ...newPurchase, items: toReverse });
        }
        if (toApply.length) {
          await applyPurchaseToWarehouse({ ...newPurchase, items: toApply });
        }
      } else if (previousStatus === 'completed' && newStatus !== 'completed') {
        // Dulu completed, sekarang tidak -> kembalikan stok lama
        await reversePurchaseFromWarehouse(oldPurchase);
      } else if (previousStatus !== 'completed' && newStatus === 'completed') {
        // Dulu bukan completed, sekarang completed -> terapkan stok baru
        await applyPurchaseToWarehouse(newPurchase);
      }

      return { success: true, error: null };
    } catch (err: any) {
      logger.error('Error updating purchase:', err);
      return { success: false, error: err.message || 'Gagal memperbarui pembelian' };
    }
  }

  /**
   * Set status (pending/completed/cancelled).
   * Saat set ke 'completed', trigger DB akan:
   * - menambah stok,
  * - hitung WAC (harga_rata_rata),
  * - tandai applied_at,
  * - dan pada edit/delete berikutnya, stok akan dikoreksi otomatis.
  */
  static async setPurchaseStatus(
    id: string,
    userId: string,
    newStatus: Purchase['status']
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Ambil data pembelian saat ini untuk mengetahui status sebelumnya dan itemnya
      const { data: existing, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const purchase = existing ? transformPurchaseFromDB(existing) : null;
      const previousStatus = purchase?.status;

      // Update status di database
      const { error } = await supabase
        .from('purchases')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);

      // Sinkronisasi manual stok dan WAC jika status berubah
      if (purchase && previousStatus !== newStatus) {
        if (newStatus === 'completed') {
          await applyPurchaseToWarehouse(purchase);
        } else if (previousStatus === 'completed') {
          await reversePurchaseFromWarehouse(purchase);
        }
      }

      return { success: true, error: null };
    } catch (err: any) {
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
  * Jika purchase sudah pernah diaplikasikan (applied_at IS NOT NULL),
  * trigger DB akan otomatis mengembalikan stok/WAC (reversal).
  */
  static async deletePurchase(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
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

  /** Stats via RPC (optional, kalau sudah ada function-nya) */
  static async getPurchaseStats(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_purchase_stats', { p_user_id: userId });
      if (error) throw new Error(error.message);
      return { data: data?.[0] || null, error: null as string | null };
    } catch (err: any) {
      logger.error('Error getting purchase stats:', err);
      return { data: null, error: err.message || 'Gagal memuat statistik pembelian' };
    }
  }

  /** Date range via RPC (optional, kalau sudah ada function-nya) */
  static async getPurchasesByDateRange(userId: string, startDate: Date, endDate: Date) {
    try {
      const { data, error } = await supabase.rpc('get_purchases_by_date_range', {
        p_user_id: userId,
        p_start_date: startDate.toISOString().slice(0, 10),
        p_end_date: endDate.toISOString().slice(0, 10)
      });
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

// Aliases
export const purchaseApi = PurchaseApiService;
export const purchaseRealtime = PurchaseRealtimeService;
