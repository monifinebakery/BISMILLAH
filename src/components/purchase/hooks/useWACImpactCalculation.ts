// src/components/purchase/hooks/useWACImpactCalculation.ts
// Hook untuk menghitung dampak WAC terhadap profit

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseItem } from '../types/purchase.types';
import { logger } from '@/utils/logger';

interface WACImpactData {
  materialName: string;
  currentWAC: number;
  newWAC: number;
  currentStock: number;
  purchaseQty: number;
  purchasePrice: number;
  wacIncrease: number;
  wacIncreasePercentage: number;
  estimatedProfitImpact: number;
}

interface MaterialData {
  id: string;
  nama: string;
  stok: number;
  harga_rata_rata: number;
  harga_satuan: number;
  satuan: string;
}

interface RecipeUsage {
  materialId: string;
  avgUsagePerMonth: number;
  avgSellingPrice: number;
}

export const useWACImpactCalculation = () => {
  const calculateWACImpact = useCallback(async (items: PurchaseItem[]): Promise<WACImpactData[]> => {
    try {
      logger.info('WACImpact: Calculating WAC impact for items: ' + items.length);
      
      // Get current material data
      const materialNames = items.map(item => item.nama);
      const { data: materials, error: materialsError } = await supabase
        .from('bahan_baku')
        .select('id, nama, stok, harga_rata_rata, harga_satuan, satuan')
        .in('nama', materialNames);
      
      if (materialsError) {
        logger.error('WACImpact: Error fetching materials: ' + materialsError.message);
        throw materialsError;
      }

      if (!materials || materials.length === 0) {
        logger.warn('WACImpact: No materials found for calculation');
        return [];
      }

      const results: WACImpactData[] = [];

      for (const item of items) {
        const material = materials.find(m => m.nama === item.nama);
        if (!material) {
          logger.warn('WACImpact: Material not found: ' + item.nama);
          continue;
        }

        // Calculate new WAC using weighted average formula
        const currentStock = material.stok || 0;
        const currentWAC = material.harga_rata_rata || material.harga_satuan || 0;
        const purchaseQty = item.kuantitas;
        const purchasePrice = item.hargaSatuan;

        let newWAC: number;
        if (currentStock === 0) {
          // If no current stock, new WAC = purchase price
          newWAC = purchasePrice;
        } else {
          // WAC formula: ((current_stock * current_wac) + (purchase_qty * purchase_price)) / (current_stock + purchase_qty)
          const totalValue = (currentStock * currentWAC) + (purchaseQty * purchasePrice);
          const totalQty = currentStock + purchaseQty;
          newWAC = totalValue / totalQty;
        }

        const wacIncrease = newWAC - currentWAC;
        const wacIncreasePercentage = currentWAC > 0 ? (wacIncrease / currentWAC) * 100 : 0;

        // Estimate profit impact based on simple calculation
        // Assume moderate usage (10% of current stock per month)
        const estimatedMonthlyUsage = Math.max(currentStock * 0.1, purchaseQty * 0.5);
        const estimatedProfitImpact = wacIncrease * estimatedMonthlyUsage;

        results.push({
          materialName: material.nama,
          currentWAC,
          newWAC,
          currentStock,
          purchaseQty,
          purchasePrice,
          wacIncrease,
          wacIncreasePercentage,
          estimatedProfitImpact
        });
      }

      logger.info('WACImpact: Calculation completed: ' + results.length + ' items');
      return results;
      
    } catch (error) {
      logger.error('WACImpact: Error calculating WAC impact: ' + (error as Error).message);
      throw error;
    }
  }, []);

  return {
    calculateWACImpact
  };
};

// Helper function to get material usage statistics from pemakaian_bahan
export const getMaterialUsageStats = async (materialIds: string[]) => {
  try {
    const { data, error } = await supabase
      .from('pemakaian_bahan')
      .select('bahan_baku_id, qty_base, tanggal')
      .in('bahan_baku_id', materialIds)
      .gte('tanggal', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('tanggal', { ascending: false });

    if (error) {
      logger.error('WACImpact: Error fetching usage stats: ' + error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('WACImpact: Error in getMaterialUsageStats: ' + (error as Error).message);
    return [];
  }
};