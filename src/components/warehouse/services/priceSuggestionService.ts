// src/components/warehouse/services/priceSuggestionService.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PriceSuggestion {
  price: number;
  tanggal: string; // YYYY-MM-DD from DB
  purchaseId: string | null;
}

// Derive unit price from packaging metadata if explicit unit price missing
const deriveUnitPriceFromPackaging = (row: any): number | null => {
  // Function removed as packaging fields are no longer used
  return null;
};

/**
 * Fetch latest completed purchase unit price for a given warehouse item
 * - Filters purchases by user and status 'completed'
 * - Uses text search to find purchases with the given bahan_baku_id in items
 * - Returns first valid price found (harga_per_satuan or derived from packaging)
 */
export const fetchLatestUnitPriceForItem = async (
  userId: string,
  itemId: string
): Promise<PriceSuggestion | null> => {
  try {
    if (!userId || !itemId) return null;

    // Get all completed purchases and filter in JavaScript
    // This avoids JSON query syntax issues with varying item structures
    const { data, error } = await supabase
      .from('purchases')
      .select('id, tanggal, items')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('tanggal', { ascending: false })
      .limit(50); // Get more records since we're filtering in JS

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Filter purchases that contain the target item
    const relevantPurchases = data.filter(row => {
      const items = Array.isArray(row.items) ? (row.items as any[]) : [];
      return items.some((item) => {
        const bahan_baku_id = item?.bahan_baku_id ?? item?.bahanBakuId ?? item?.id;
        return bahan_baku_id === itemId;
      });
    });

    for (const row of relevantPurchases) {
      const items = Array.isArray(row.items) ? (row.items as any[]) : [];
      // Find exact item in this purchase row
      const found = items.find((it) => {
        const bahan_baku_id = it?.bahan_baku_id ?? it?.bahanBakuId ?? it?.id;
        return bahan_baku_id === itemId;
      });
      if (!found) continue;

      const explicit = Number(found.harga_per_satuan ?? found.hargaSatuan ?? 0);
      const price = explicit > 0 ? explicit : 0;
      if (price > 0) {
        return { price, tanggal: row.tanggal, purchaseId: row.id };
      }
    }

    return null;
  } catch (err: any) {
    logger.error('Failed to fetch latest unit price for item:', err);
    return null;
  }
};

// No default export to avoid any bundler interop edge-cases
