// src/components/profitAnalysis/utils/calculations/basicCalculations.ts
// Basic profit calculation utilities

import { BahanBakuActual, PemakaianBahan } from '../../types/profitAnalysis.types';
import { PROFIT_CONSTANTS, FNB_THRESHOLDS, FNB_LABELS } from '../../constants/profitConstants';

/**
 * Get effective unit price using snake_case with fallback
 */
export function getEffectiveUnitPrice(item: BahanBakuActual | any): number {
  // Utamakan snake_case, fallback ke camelCase bila ada
  const wac = Number(item?.harga_rata_rata ?? item?.hargaRataRata ?? 0);
  const base = Number(item?.harga_satuan ?? item?.harga ?? 0);
  return wac > 0 ? wac : base;
}

/**
 * Calculate HPP using multiple fallback strategies
 */
export function calcHPP(
  pemakaian: PemakaianBahan[],
  bahanMap: Record<string, BahanBakuActual | any>
): {
  totalHPP: number;
  breakdown: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }>;
} {
  let total = 0;
  const breakdown: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }> = [];

  for (const row of pemakaian || []) {
    const bb = bahanMap[row.bahan_baku_id];
    if (!bb) continue;

    const qty = Number(row.qty_base || 0);

    // 1) kalau view sudah kirim nilai HPP langsung
    if (typeof row.hpp_value === 'number' && !Number.isNaN(row.hpp_value)) {
      const hpp = Math.round(Number(row.hpp_value));
      const price = qty > 0 ? hpp / qty : getEffectiveUnitPrice(bb);
      total += hpp;
      breakdown.push({
        id: row.bahan_baku_id,
        nama: bb.nama || bb.name || 'Unknown Item',
        qty,
        price,
        hpp
      });
    }
    // 2) kalau belum, hitung manual
    else {
      const price = getEffectiveUnitPrice(bb);
      const hpp = Math.round(qty * price);
      total += hpp;
      breakdown.push({
        id: row.bahan_baku_id,
        nama: bb.nama || bb.name || 'Unknown Item',
        qty,
        price,
        hpp
      });
    }
  }

  return { totalHPP: total, breakdown };
}

/**
 * Calculate profit margins with validation
 * @deprecated Use safeCalculateMargins from @/utils/profitValidation for centralized calculations
 */
export const calculateMargins = (revenue: number, cogs: number, opex: number) => {
  console.warn('[DEPRECATED] basicCalculations.calculateMargins is deprecated. Use safeCalculateMargins from @/utils/profitValidation instead.');
  
  const validRevenue = Math.max(0, Number(revenue) || 0);
  const validCOGS = Math.max(0, Number(cogs) || 0);
  const validOpEx = Math.max(0, Number(opex) || 0);
  
  const grossProfit = validRevenue - validCOGS;
  const netProfit = grossProfit - validOpEx;
  
  const grossMargin = validRevenue > 0 ? (grossProfit / validRevenue) * 100 : 0;
  const netMargin = validRevenue > 0 ? (netProfit / validRevenue) * 100 : 0;
  
  return {
    grossProfit,
    netProfit,
    grossMargin,
    netMargin,
    cogsPercentage: validRevenue > 0 ? (validCOGS / validRevenue) * 100 : 0,
    opexPercentage: validRevenue > 0 ? (validOpEx / validRevenue) * 100 : 0,
    totalCostPercentage: validRevenue > 0 ? ((validCOGS + validOpEx) / validRevenue) * 100 : 0
  };
};

/**
 * Calculate inventory-based COGS
 */
export const calculateInventoryBasedCOGS = (
  materials: BahanBakuActual[],
  usageRate: number = 0.1 // Default 10% usage rate
) => {
  const usageData = materials.map(m => ({
    material_id: m.id,
    name: m.nama || 'Unknown Material',
    current_stock: Number(m.stok) || 0,
    estimated_usage: (Number(m.stok) || 0) * usageRate,
    unit_price: getEffectiveUnitPrice(m),
    total_cost: ((Number(m.stok) || 0) * usageRate) * getEffectiveUnitPrice(m),
  }));

  const totalEstimatedCOGS = usageData.reduce((sum, item) => sum + item.total_cost, 0);
  
  return {
    usageData,
    totalEstimatedCOGS,
    usageRate
  };
};