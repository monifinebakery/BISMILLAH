// src/components/purchase/utils/financialSync.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Purchase } from '../types/purchase.types';
import { purchaseQueryKeys } from '../query/purchase.queryKeys';

interface AddTxnFn {
  (payload: { type: 'expense' | 'income'; amount: number; description: string; category: string; date: Date; relatedId: string }): void;
}
interface DeleteTxnFn {
  (id: string): Promise<boolean> | boolean;
}

export async function onCompletedFinancialSync(
  purchase: Purchase,
  getSupplierName: (idOrName: string) => string,
  addFinancialTransaction: AddTxnFn,
  queryClient: any,
  userId?: string
) {
  try {
    addFinancialTransaction({
      type: 'expense',
      amount: (((purchase as any).totalNilai ?? (purchase as any).total_nilai) as number),
      description: `Pembelian dari ${getSupplierName(purchase.supplier)}`,
      category: 'Pembelian Bahan Baku',
      date: new Date(),
      relatedId: purchase.id,
    });

    queryClient.invalidateQueries({ queryKey: ['financial'] });
    queryClient.invalidateQueries({ queryKey: ['profit-analysis'] });
    if (userId) queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(userId) });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('purchase:completed', {
        detail: {
          purchaseId: purchase.id,
          supplier: purchase.supplier,
          total_nilai: (((purchase as any).totalNilai ?? (purchase as any).total_nilai) as number)
        }
      }));
    }
  } catch (e) {
    logger.warn('onCompletedFinancialSync failed', e);
  }
}

export async function onRevertedFinancialCleanup(
  purchaseId: string,
  userId: string,
  deleteFinancialTransaction: DeleteTxnFn,
  queryClient: any
) {
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('related_id', purchaseId)
      .eq('type', 'expense');
    if (error) throw error;

    const ids = (data || []).map((r: any) => r.id);
    for (const id of ids) {
      await deleteFinancialTransaction(id);
    }

    queryClient.invalidateQueries({ queryKey: ['financial'] });
    queryClient.invalidateQueries({ queryKey: ['profit-analysis'] });
    queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.stats(userId) });
  } catch (e) {
    logger.warn('onRevertedFinancialCleanup failed', e);
  }
}

export async function cleanupFinancialForDeleted(
  purchaseId: string,
  userId: string,
  deleteFinancialTransaction: DeleteTxnFn,
  queryClient: any
) {
  return onRevertedFinancialCleanup(purchaseId, userId, deleteFinancialTransaction, queryClient);
}

