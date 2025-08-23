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
  const toNumber = (v: any, def = 0) => (v === null || v === undefined || v === '' ? def : Number(v));
  const jumlahKemasan = toNumber(row.jumlah_kemasan ?? row.jumlahKemasan);
  const isiPerKemasan = toNumber(row.isi_per_kemasan ?? row.isiPerKemasan);
  const totalBeli = toNumber(row.harga_total_beli_kemasan ?? row.hargaTotalBeliKemasan);

  const totalIsi = jumlahKemasan * isiPerKemasan;
  if (jumlahKemasan > 0 && isiPerKemasan > 0 && totalBeli > 0 && totalIsi > 0) {
    return totalBeli / totalIsi;
  }
  return null;
};

/**
 * Fetch latest completed purchase unit price for a given warehouse item
 * - Filters purchases by user and status 'completed'
 * - Uses JSONB contains to find purchases with the given bahan_baku_id
 * - Returns first valid price found (harga_per_satuan or derived from packaging)
 */
export const fetchLatestUnitPriceForItem = async (
  userId: string,
  itemId: string
): Promise<PriceSuggestion | null> => {
  try {
    if (!userId || !itemId) return null;

    const { data, error } = await supabase
      .from('purchases')
      .select('id, tanggal, items')
      .eq('user_id', userId)
      .eq('status', 'completed')
      // JSONB contains: any element with matching bahan_baku_id
      .contains('items', [{ bahan_baku_id: itemId }])
      .order('tanggal', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    for (const row of data) {
      const items = Array.isArray(row.items) ? (row.items as any[]) : [];
      // Find exact item in this purchase row
      const found = items.find((it) => (it?.bahan_baku_id ?? it?.bahanBakuId) === itemId);
      if (!found) continue;

      const explicit = Number(found.harga_per_satuan ?? found.hargaSatuan ?? 0);
      const derived = deriveUnitPriceFromPackaging(found) ?? 0;
      const price = explicit > 0 ? explicit : derived > 0 ? derived : 0;
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
