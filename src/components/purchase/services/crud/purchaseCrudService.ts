// src/components/purchase/services/crud/purchaseCrudService.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { withRetry, handleSupabaseError, recordError } from '@/utils/supabaseErrorHandler';
import type { Purchase } from '../../types/purchase.types';
import {
  transformPurchasesFromDB,
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB
} from '../../utils/purchaseTransformers';

/**
 * CRUD Operations Service for Purchases
 * Handles basic Create, Read, Update, Delete operations for purchases
 */

// Interface for paginated response
interface PaginatedResponse<T> {
  data: T[] | null;
  error: string | null;
  totalCount: number;
}

/**
 * Get all purchases for a user
 */
export async function fetchPurchases(userId: string): Promise<{ data: Purchase[] | null; error: string | null }> {
  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      if (error) {
        recordError(error, 'fetchPurchases');
        throw error;
      }
      return data;
    }, {
      maxRetries: 4,
      onRetry: (attempt, error) => {
        logger.warn(`🔄 Retrying fetchPurchases (${attempt}/4):`, error.message);
      }
    });
    
    return { data: transformPurchasesFromDB(data ?? []), error: null };
  } catch (err: any) {
    logger.error('Error fetching purchases:', err);
    handleSupabaseError(err, 'memuat data pembelian');
    return { data: null, error: err.message || 'Gagal memuat data pembelian' };
  }
}

/**
 * Get purchases with pagination
 */
export async function fetchPaginatedPurchases(
  userId: string,
  page: number,
  limit: number,
  searchQuery?: string
): Promise<PaginatedResponse<Purchase>> {
  try {
    let query = supabase
      .from('purchases')
      .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .range((page - 1) * limit, page * limit - 1)
      .order('tanggal', { ascending: false });

    if (searchQuery) {
      query = query.or(`supplier.ilike.%${searchQuery}%,catatan.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);
    return { data: transformPurchasesFromDB(data ?? []), error: null, totalCount: count || 0 };
  } catch (err: any) {
    logger.error('Error fetching paginated purchases:', err);
    // Check if it's a 503 error and provide a more user-friendly message
    if (err.message && err.message.includes('503')) {
      // Note: toast is not available here, should be handled by caller
    }
    return { data: null, error: err.message || 'Gagal memuat data pembelian', totalCount: 0 };
  }
}

/**
 * Get a single purchase by ID
 */
export async function fetchPurchaseById(id: string, userId: string): Promise<{ data: Purchase | null; error: string | null }> {
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
    // Check if it's a 503 error and provide a more user-friendly message
    if (err.message && err.message.includes('503')) {
      // Note: toast is not available here, should be handled by caller
    }
    return { data: null, error: err.message || 'Gagal memuat data pembelian' };
  }
}

/**
 * Create a new purchase
 */
export async function createPurchase(
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

    return { success: true, error: null, purchaseId: data?.id };
  } catch (err: any) {
    logger.error('Error creating purchase:', err);
    return { success: false, error: err.message || 'Gagal membuat pembelian' };
  }
}

/**
 * Update an existing purchase
 */
export async function updatePurchase(
  id: string,
  updatedData: Partial<Purchase>,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const payload = transformPurchaseUpdateForDB(updatedData);
    const { error } = await supabase
      .from('purchases')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return { success: true, error: null };
  } catch (err: any) {
    logger.error('Error updating purchase:', err);
    return { success: false, error: err.message || 'Gagal memperbarui pembelian' };
  }
}

/**
 * Delete a purchase
 */
export async function deletePurchase(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    logger.info('✅ [PURCHASE CRUD] Purchase deleted successfully:', id);
    return { success: true, error: null };
  } catch (err: any) {
    logger.error('Error deleting purchase:', err);
    return { success: false, error: err.message || 'Gagal menghapus pembelian' };
  }
}

/**
 * Bulk delete purchases
 */
export async function bulkDeletePurchases(
  ids: string[],
  userId: string
): Promise<{ success: boolean; error: string | null; results?: { successful: number; failed: number } }> {
  try {
    const deletePromises = ids.map((id) => deletePurchase(id, userId));
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