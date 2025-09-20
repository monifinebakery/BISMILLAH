// src/components/purchase/services/validation/purchaseValidationService.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Purchase } from '../../types/purchase.types';
import {
  transformPurchaseFromDB
} from '../../utils/purchaseTransformers';
import { reversePurchaseFromWarehouse } from '@/components/warehouse/services/warehouseSyncService';

/**
 * Validation Service for Purchases
 * Handles validation logic and related operations
 */

/**
 * Get basic purchase statistics manually
 */
export async function getPurchaseStats(userId: string) {
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

/**
 * Get purchases by date range manually
 */
export async function getPurchasesByDateRange(userId: string, startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at')
      .eq('user_id', userId)
      .gte('tanggal', startDate.toISOString().slice(0, 10))
      .lte('tanggal', endDate.toISOString().slice(0, 10))
      .order('tanggal', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: transformPurchaseFromDB(data ?? []), error: null };
  } catch (err: any) {
    logger.error('Error fetching purchases by date range:', err);
    return { data: null, error: err.message || 'Gagal memuat data pembelian' };
  }
}

/**
 * Simple search for purchases
 */
export async function searchPurchases(userId: string, query: string, limit = 50) {
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
    return { data: transformPurchaseFromDB(data ?? []), error: null };
  } catch (err: any) {
    logger.error('Error searching purchases:', err);
    return { data: null, error: err.message || 'Gagal mencari data pembelian' };
  }
}

/**
 * Clean up related financial transactions before deleting purchase
 */
export async function cleanupFinancialTransactions(purchaseId: string, userId: string): Promise<boolean> {
  try {
    logger.info('💰 [PURCHASE VALIDATION] Cleaning up financial transactions for purchase:', purchaseId);
    
    const { data: financialTxns, error: financialFetchErr } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('related_id', purchaseId)
      .eq('type', 'expense');
    
    if (financialFetchErr) {
      logger.warn('Warning fetching financial transactions for cleanup:', financialFetchErr.message);
      return false;
    } else if (financialTxns && financialTxns.length > 0) {
      logger.info(`🗑️ [PURCHASE VALIDATION] Found ${financialTxns.length} financial transaction(s) to delete`);
      const { error: deleteFinancialErr } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('related_id', purchaseId)
        .eq('type', 'expense');
      
      if (deleteFinancialErr) {
        logger.warn('Warning deleting financial transactions:', deleteFinancialErr.message);
        return false;
      } else {
        logger.info('✅ [PURCHASE VALIDATION] Financial transactions cleaned up successfully');
        return true;
      }
    } else {
      logger.info('ℹ️ [PURCHASE VALIDATION] No financial transactions found for cleanup');
      return true;
    }
  } catch (financialErr) {
    logger.warn('Error during financial transaction cleanup:', financialErr);
    // Continue with purchase deletion even if financial cleanup fails
    return false;
  }
}