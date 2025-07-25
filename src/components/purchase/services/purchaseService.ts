import { supabase } from '@/integrations/supabase/client';
import { Purchase } from '@/types/supplier';
import { toSafeISOString } from '@/utils/unifiedDateUtils';

export interface PurchaseServiceConfig {
  userId: string;
}

export interface CreatePurchaseData {
  supplier: string;
  totalNilai: number;
  tanggal: Date | string;
  items: any[];
  status: string;
  metodePerhitungan?: string;
}

export interface UpdatePurchaseData {
  supplier?: string;
  totalNilai?: number;
  tanggal?: Date | string;
  items?: any[];
  status?: string;
  metodePerhitungan?: string;
}

export class PurchaseService {
  private config: PurchaseServiceConfig;

  constructor(config: PurchaseServiceConfig) {
    this.config = config;
  }

  /**
   * Fetch all purchases for the user
   */
  async fetchPurchases(): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', this.config.userId)
        .order('tanggal', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create a new purchase with stock update
   */
  async createPurchase(purchaseData: CreatePurchaseData): Promise<{ error: any }> {
    try {
      const purchaseDataForRPC = {
        user_id: this.config.userId,
        supplier: purchaseData.supplier,
        total_nilai: purchaseData.totalNilai,
        tanggal: toSafeISOString(purchaseData.tanggal),
        items: purchaseData.items,
        status: purchaseData.status,
        metode_perhitungan: purchaseData.metodePerhitungan || 'FIFO',
      };

      const { error } = await supabase.rpc('add_purchase_and_update_stock', { 
        purchase_data: purchaseDataForRPC 
      });

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Update an existing purchase
   */
  async updatePurchase(id: string, updatedData: UpdatePurchaseData): Promise<{ error: any }> {
    try {
      const purchaseToUpdate: { [key: string]: any } = { 
        updated_at: new Date().toISOString() 
      };

      if (updatedData.supplier !== undefined) purchaseToUpdate.supplier = updatedData.supplier;
      if (updatedData.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedData.totalNilai;
      if (updatedData.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
      if (updatedData.items !== undefined) purchaseToUpdate.items = updatedData.items;
      if (updatedData.status !== undefined) purchaseToUpdate.status = updatedData.status;
      if (updatedData.metodePerhitungan !== undefined) purchaseToUpdate.metode_perhitungan = updatedData.metodePerhitungan;

      const { error } = await supabase
        .from('purchases')
        .update(purchaseToUpdate)
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Delete a purchase
   */
  async deletePurchase(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Set up real-time subscription for purchases
   */
  setupRealtimeSubscription(
    onInsert: (data: any) => void,
    onUpdate: (data: any) => void,
    onDelete: (data: any) => void
  ) {
    const channel = supabase
      .channel(`realtime-purchases-${this.config.userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'purchases', 
        filter: `user_id=eq.${this.config.userId}` 
      }, (payload) => {
        try {
          if (payload.eventType === 'INSERT') {
            onInsert(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            onUpdate(payload.new);
          } else if (payload.eventType === 'DELETE') {
            onDelete(payload.old);
          }
        } catch (error) {
          console.error('Real-time update error:', error);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  /**
   * Bulk delete purchases
   */
  async bulkDeletePurchases(ids: string[]): Promise<{ errors: any[] }> {
    const errors: any[] = [];
    
    for (const id of ids) {
      const { error } = await this.deletePurchase(id);
      if (error) {
        errors.push({ id, error });
      }
    }

    return { errors };
  }
}