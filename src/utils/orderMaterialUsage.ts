import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Recipe } from '@/components/recipe/types';

async function fetchRecipes(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('recipes')
    .select('id, user_id, bahan_resep')
    .in('id', ids);
  if (error) {
    logger.error('orderMaterialUsage: fetchRecipes error', error);
    return [];
  }
  return (data || []) as unknown as Recipe[];
}

async function fetchBahanHarga(ids: string[]): Promise<Record<string, { harga_rata_rata?: number | null; harga_satuan?: number | null }>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from('bahan_baku')
    .select('id, harga_rata_rata, harga_satuan')
    .in('id', ids);
  if (error) {
    logger.error('orderMaterialUsage: fetchBahanHarga error', error);
    return {};
  }
  const map: Record<string, { harga_rata_rata?: number | null; harga_satuan?: number | null }> = {};
  (data || []).forEach((row: any) => {
    map[row.id] = { harga_rata_rata: row.harga_rata_rata, harga_satuan: row.harga_satuan };
  });
  return map;
}

async function hasOrderUsage(userId: string, orderId: string): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .from('pemakaian_bahan')
    .select('id')
    .eq('user_id', userId)
    .eq('source_type', 'order')
    .eq('source_id', orderId)
    .limit(1);
  if (error) {
    logger.warn('orderMaterialUsage: hasOrderUsage error', error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

export async function syncOrderMaterialUsage(order: any, userId: string): Promise<boolean> {
  try {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) return true;
    const already = await hasOrderUsage(userId, order.id);
    if (already) {
      logger.info('orderMaterialUsage: usage already recorded for order', order.id);
      return true;
    }

    const recipeItemEntries = order.items
      .filter((it: any) => it.is_from_recipe || it.isFromRecipe)
      .map((it: any) => ({ recipe_id: it.recipe_id || it.recipeId, quantity: Number(it.quantity || 0) }))
      .filter((x: any) => x.recipe_id && x.quantity > 0);

    if (recipeItemEntries.length === 0) return true;

    const recipeIds = Array.from(new Set(recipeItemEntries.map((r: any) => r.recipe_id))) as string[];
    const recipes = await fetchRecipes(recipeIds);
    if (!recipes || recipes.length === 0) return true;

    const bahanRows: Array<{ bahan_baku_id: string; qty_base: number }> = [];
    const quantityByRecipe: Record<string, number> = {};
    recipeItemEntries.forEach((r: any) => { quantityByRecipe[r.recipe_id] = (quantityByRecipe[r.recipe_id] || 0) + r.quantity; });

    recipes.forEach((r: any) => {
      const q = quantityByRecipe[r.id] || 0;
      const bahanList = r.bahan_resep || [];
      bahanList.forEach((b: any) => {
        const bbId = b.warehouse_id || b.warehouseId || b.id;
        const jumlah = Number(b.jumlah || 0);
        if (bbId && jumlah > 0 && q > 0) {
          bahanRows.push({ bahan_baku_id: bbId, qty_base: jumlah * q });
        }
      });
    });

    if (bahanRows.length === 0) return true;

    const bahanIds = Array.from(new Set(bahanRows.map(b => b.bahan_baku_id))) as string[];
    const hargaMap = await fetchBahanHarga(bahanIds);

    const tanggal = (order.tanggal_selesai || order.tanggal || new Date()).toString().slice(0, 10);

    const insertRows = bahanRows.map(row => {
      const h = hargaMap[row.bahan_baku_id] || {};
      const wac = Number(h.harga_rata_rata ?? 0);
      const base = Number(h.harga_satuan ?? 0);
      const harga_efektif = wac > 0 ? wac : base;
      const hpp_value = harga_efektif > 0 ? (row.qty_base * harga_efektif) : null;
      return {
        user_id: userId,
        bahan_baku_id: row.bahan_baku_id,
        qty_base: row.qty_base,
        tanggal,
        harga_efektif: harga_efektif || null,
        hpp_value,
        source_type: 'order',
        source_id: order.id,
      };
    });

    const { error: insertErr } = await (supabase as any)
      .from('pemakaian_bahan')
      .insert(insertRows);
    if (insertErr) {
      logger.error('orderMaterialUsage: insert error', insertErr);
      return false;
    }

    // ✅ BARU: Kurangi stok bahan baku setelah mencatat pemakaian
    const stockUpdates = bahanRows.map(row => ({
      bahan_baku_id: row.bahan_baku_id,
      qty_to_deduct: row.qty_base
    }));

    for (const update of stockUpdates) {
      // First get current stock to ensure we have enough
      const { data: bahanData, error: fetchError } = await supabase
        .from('bahan_baku')
        .select('stok')
        .eq('id', update.bahan_baku_id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !bahanData) {
        logger.error('orderMaterialUsage: failed to fetch current stock for bahan_baku_id', update.bahan_baku_id, fetchError);
        continue;
      }

      const currentStock = Number(bahanData.stok || 0);
      if (currentStock < update.qty_to_deduct) {
        logger.warn('orderMaterialUsage: insufficient stock for bahan_baku_id', {
          bahan_baku_id: update.bahan_baku_id,
          current_stock: currentStock,
          required: update.qty_to_deduct
        });
        // Still deduct what we can, but log warning
      }

      const newStock = Math.max(0, currentStock - update.qty_to_deduct);

      const { error: stockError } = await supabase
        .from('bahan_baku')
        .update({
          stok: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.bahan_baku_id)
        .eq('user_id', userId);

      if (stockError) {
        logger.error('orderMaterialUsage: failed to deduct stock for bahan_baku_id', update.bahan_baku_id, stockError);
        // Note: We don't return false here because usage was already recorded
        // Stock deduction failure should be logged but not block order completion
      } else {
        logger.info('orderMaterialUsage: deducted stock', {
          bahan_baku_id: update.bahan_baku_id,
          previous_stock: currentStock,
          deducted: update.qty_to_deduct,
          new_stock: newStock
        });
      }
    }

    logger.success('orderMaterialUsage: usage recorded and stock deducted for order', order.id);
    return true;
  } catch (e) {
    logger.error('orderMaterialUsage: unexpected error', e);
    return false;
  }
}

