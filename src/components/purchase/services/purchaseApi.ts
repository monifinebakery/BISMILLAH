// src/components/purchase/services/purchaseApi.ts

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Purchase, CreatePurchaseRequest, PurchaseApiResponse } from '../types/purchase.types';
import { 
  transformPurchasesFromDB, 
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB 
} from '../utils/purchaseTransformers';

/**
 * API service class for purchase operations
 */
export class PurchaseApiService {
  /**
   * Fetch all purchases for a user
   */
  static async fetchPurchases(userId: string): Promise<PurchaseApiResponse> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const transformedData = data ? transformPurchasesFromDB(data) : [];

      return {
        data: transformedData,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error fetching purchases:', error);
      return {
        data: null,
        error: error.message || 'Gagal memuat data pembelian',
      };
    }
  }

  /**
   * Fetch single purchase by ID
   */
  static async fetchPurchaseById(id: string, userId: string): Promise<{ data: Purchase | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const transformedData = data ? transformPurchaseFromDB(data) : null;

      return {
        data: transformedData,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error fetching purchase:', error);
      return {
        data: null,
        error: error.message || 'Gagal memuat data pembelian',
      };
    }
  }

  /**
   * Create new purchase using RPC function
   */
  static async createPurchase(
    purchaseData: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<{ success: boolean; error: string | null; purchaseId?: string }> {
    try {
      const transformedData = transformPurchaseForDB(purchaseData, userId);

      // Use RPC function for complex purchase creation with stock update
      const { data, error } = await supabase.rpc('add_purchase_and_update_stock', {
        purchase_data: transformedData,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        error: null,
        purchaseId: data,
      };
    } catch (error: any) {
      logger.error('Error creating purchase:', error);
      return {
        success: false,
        error: error.message || 'Gagal membuat pembelian',
      };
    }
  }

  /**
   * Update existing purchase
   */
  static async updatePurchase(
    id: string,
    updatedData: Partial<Purchase>,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const transformedData = transformPurchaseUpdateForDB(updatedData);

      const { error } = await supabase
        .from('purchases')
        .update(transformedData)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error updating purchase:', error);
      return {
        success: false,
        error: error.message || 'Gagal memperbarui pembelian',
      };
    }
  }

  /**
   * Delete purchase
   */
  static async deletePurchase(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error deleting purchase:', error);
      return {
        success: false,
        error: error.message || 'Gagal menghapus pembelian',
      };
    }
  }

  /**
   * Bulk delete purchases
   */
  static async bulkDeletePurchases(ids: string[], userId: string): Promise<{ 
    success: boolean; 
    error: string | null; 
    results?: { successful: number; failed: number } 
  }> {
    try {
      const deletePromises = ids.map(id => this.deletePurchase(id, userId));
      const results = await Promise.allSettled(deletePromises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      return {
        success: successful > 0,
        error: failed > 0 ? `${failed} dari ${results.length} gagal dihapus` : null,
        results: { successful, failed },
      };
    } catch (error: any) {
      logger.error('Error bulk deleting purchases:', error);
      return {
        success: false,
        error: error.message || 'Gagal menghapus pembelian',
      };
    }
  }

  /**
   * Get purchase statistics using RPC function
   */
  static async getPurchaseStats(userId: string): Promise<{
    data: {
      total_purchases: number;
      total_value: number;
      pending_count: number;
      completed_count: number;
      cancelled_count: number;
    } | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_purchase_stats', {
        p_user_id: userId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data?.[0] || null,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error getting purchase stats:', error);
      return {
        data: null,
        error: error.message || 'Gagal memuat statistik pembelian',
      };
    }
  }

  /**
   * Get purchases by date range using RPC function
   */
  static async getPurchasesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PurchaseApiResponse> {
    try {
      const { data, error } = await supabase.rpc('get_purchases_by_date_range', {
        p_user_id: userId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      });

      if (error) {
        throw new Error(error.message);
      }

      const transformedData = data ? transformPurchasesFromDB(data) : [];

      return {
        data: transformedData,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error fetching purchases by date range:', error);
      return {
        data: null,
        error: error.message || 'Gagal memuat data pembelian',
      };
    }
  }

  /**
   * Search purchases by query
   */
  static async searchPurchases(
    userId: string,
    query: string,
    limit: number = 50
  ): Promise<PurchaseApiResponse> {
    try {
      // Simple text search in supplier and items
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .or(`supplier.ilike.%${query}%,items.cs.{"nama":"${query}"}`)
        .order('tanggal', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      const transformedData = data ? transformPurchasesFromDB(data) : [];

      return {
        data: transformedData,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error searching purchases:', error);
      return {
        data: null,
        error: error.message || 'Gagal mencari data pembelian',
      };
    }
  }
}

/**
 * Real-time subscription manager for purchases
 */
export class PurchaseRealtimeService {
  private static channels: Map<string, any> = new Map();

  /**
   * Subscribe to real-time purchase changes
   */
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
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(userId);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        try {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPurchase = transformPurchaseFromDB(payload.new);
            callbacks.onInsert?.(newPurchase);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPurchase = transformPurchaseFromDB(payload.new);
            callbacks.onUpdate?.(updatedPurchase);
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            callbacks.onDelete?.(payload.old.id);
          }
        } catch (error) {
          logger.error('Real-time update error:', error);
          callbacks.onError?.(error);
        }
      })
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(userId);
  }

  /**
   * Unsubscribe from real-time changes
   */
  static unsubscribe(userId: string): void {
    const channelName = `purchases-${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

// Export convenience functions
export const purchaseApi = PurchaseApiService;
export const purchaseRealtime = PurchaseRealtimeService;