// src/components/operational-costs/utils/enhancedHppCalculations.ts
// 🔗 Enhanced HPP Calculations with Dual-Mode Integration (Revision 4)
// WAC per item bahan + TKL per pcs + Overhead per pcs

import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatUtils';
import type { 
  AppSettings, 
  DualModeCalculationResult 
} from '../types/operationalCost.types';

// ====================================
// TYPES
// ====================================

export interface BahanResepWithWAC {
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number; // This will be WAC from warehouse
  totalHarga: number;
  warehouseId?: string; // Link to bahan_baku table
  wacPrice?: number; // Actual WAC price
}

export interface EnhancedHPPCalculationResult {
  // Cost breakdown per pcs
  bahanPerPcs: number;      // Total bahan cost per pcs (WAC × quantity)
  tklPerPcs: number;        // Tenaga kerja langsung per pcs
  overheadPerPcs: number;   // Overhead pabrik per pcs (from app settings)
  
  // Total HPP
  hppPerPcs: number;        // bahanPerPcs + tklPerPcs + overheadPerPcs
  hppPerPorsi: number;      // hppPerPcs × jumlahPcsPerPorsi
  totalHPP: number;         // hppPerPorsi × jumlahPorsi
  
  // Pricing calculations
  hargaJualPerPcs: number;  // Based on markup/margin mode
  hargaJualPerPorsi: number;
  
  // Metadata
  calculationMethod: 'enhanced_dual_mode' | 'legacy';
  timestamp: string;
  breakdown: {
    ingredients: BahanResepWithWAC[];
    laborDetails: {
      jamKerjaPerBatch: number;
      tarifPerJam: number;
      totalJamForPorsi: number;
    };
    overheadSource: 'app_settings' | 'manual_input';
  };
}

export interface PricingMode {
  mode: 'markup' | 'margin';
  percentage: number;
}

// ====================================
// WAC INTEGRATION
// ====================================

/**
 * Get WAC (Weighted Average Cost) for ingredients from warehouse
 */
export const getIngredientsWAC = async (
  ingredients: Array<{ nama: string; warehouseId?: string }>
): Promise<Map<string, number>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get WAC prices from bahan_baku table
    const warehouseIds = ingredients
      .map(ing => ing.warehouseId)
      .filter(Boolean) as string[];
    
    if (warehouseIds.length === 0) {
      // No warehouse links, use current harga_satuan as fallback
      return new Map();
    }

    const { data: bahanBaku, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, harga_rata_rata, harga_satuan')
      .eq('user_id', user.id)
      .in('id', warehouseIds);

    if (error) {
      console.warn('Error fetching WAC prices:', error);
      return new Map();
    }

    const wacMap = new Map<string, number>();
    bahanBaku?.forEach(bahan => {
      // Use WAC (harga_rata_rata) if available, fallback to current price
      const wacPrice = bahan.harga_rata_rata || bahan.harga_satuan;
      wacMap.set(bahan.id, wacPrice);
    });

    return wacMap;

  } catch (error) {
    console.error('Error getting ingredients WAC:', error);
    return new Map();
  }
};

/**
 * Update ingredient prices with WAC
 */
export const updateIngredientsWithWAC = async (
  ingredients: BahanResepWithWAC[]
): Promise<BahanResepWithWAC[]> => {
  console.log('🔥 [WAC DEBUG] Input ingredients:', ingredients);
  const wacMap = await getIngredientsWAC(ingredients);
  console.log('🔥 [WAC DEBUG] WAC map:', wacMap);
  
  return ingredients.map(ingredient => {
    console.log(`🔥 [WAC DEBUG] Processing ingredient: ${ingredient.nama}`, {
      warehouseId: ingredient.warehouseId,
      currentHargaSatuan: ingredient.hargaSatuan,
      currentTotalHarga: ingredient.totalHarga,
      jumlah: ingredient.jumlah,
      hasWAC: ingredient.warehouseId && wacMap.has(ingredient.warehouseId)
    });
    
    if (ingredient.warehouseId && wacMap.has(ingredient.warehouseId)) {
      const wacPrice = wacMap.get(ingredient.warehouseId)!;
      const newTotalHarga = ingredient.jumlah * wacPrice;
      
      console.log(`🔥 [WAC DEBUG] Using WAC for ${ingredient.nama}:`, {
        originalPrice: ingredient.hargaSatuan,
        wacPrice,
        jumlah: ingredient.jumlah,
        originalTotalHarga: ingredient.totalHarga,
        newTotalHarga,
        calculation: `${ingredient.jumlah} * ${wacPrice} = ${newTotalHarga}`
      });
      
      return {
        ...ingredient,
        wacPrice,
        hargaSatuan: wacPrice, // Use WAC as the price
        totalHarga: newTotalHarga
      };
    }
    
    console.log(`🔥 [WAC DEBUG] No WAC for ${ingredient.nama}, keeping original:`, {
      hargaSatuan: ingredient.hargaSatuan,
      totalHarga: ingredient.totalHarga
    });
    
    return ingredient;
  });
};

// ====================================
// ENHANCED HPP CALCULATION
// ====================================

/**
 * Calculate HPP per pcs using dual-mode overhead from app settings
 */
export const calculateEnhancedHPP = async (
  bahanResep: BahanResepWithWAC[],
  jumlahPorsi: number,
  jumlahPcsPerPorsi: number,
  tklDetails: {
    jamKerjaPerBatch?: number;
    tarifPerJam?: number;
    totalTklAmount?: number; // Alternative: direct TKL amount
  },
  pricingMode: PricingMode,
  useAppSettingsOverhead: boolean = true
): Promise<EnhancedHPPCalculationResult> => {
  try {
    // 1. Update ingredients with WAC prices
    const ingredientsWithWAC = await updateIngredientsWithWAC(bahanResep);
    
    // 2. Calculate bahan per pcs (WAC × quantity per pcs)
    console.log('🔥 [ENHANCED DEBUG] Calculating bahan cost:', {
      ingredientsWithWAC,
      jumlahPorsi,
      jumlahPcsPerPorsi
    });
    
    const totalBahanCost = ingredientsWithWAC.reduce((sum, bahan) => {
      console.log(`🔥 Adding bahan: ${bahan.nama} = ${bahan.totalHarga}`);
      return sum + bahan.totalHarga;
    }, 0);
    
    const totalPcs = jumlahPorsi * jumlahPcsPerPorsi;
    const bahanPerPcs = totalPcs > 0 ? totalBahanCost / totalPcs : 0;
    
    console.log('🔥 [ENHANCED DEBUG] Bahan calculation result:', {
      totalBahanCost,
      totalPcs,
      bahanPerPcs,
      calculation: `${totalBahanCost} / ${totalPcs} = ${bahanPerPcs}`
    });
    
    // 3. Calculate TKL per pcs
    let tklPerPcs = 0;
    let laborDetails = {
      jamKerjaPerBatch: 0,
      tarifPerJam: 0,
      totalJamForPorsi: 0
    };
    
    if (tklDetails.totalTklAmount !== undefined) {
      // Use direct TKL amount
      tklPerPcs = totalPcs > 0 ? tklDetails.totalTklAmount / totalPcs : 0;
    } else if (tklDetails.jamKerjaPerBatch && tklDetails.tarifPerJam) {
      // Calculate from hourly rates
      const totalJamForPorsi = (tklDetails.jamKerjaPerBatch * jumlahPorsi);
      const totalTklCost = totalJamForPorsi * tklDetails.tarifPerJam;
      tklPerPcs = totalPcs > 0 ? totalTklCost / totalPcs : 0;
      
      laborDetails = {
        jamKerjaPerBatch: tklDetails.jamKerjaPerBatch,
        tarifPerJam: tklDetails.tarifPerJam,
        totalJamForPorsi
      };
    }
    
    // 4. Get overhead per pcs from app settings (dual-mode)
    let overheadPerPcs = 0;
    let overheadSource: 'app_settings' | 'manual_input' = 'manual_input';
    
    if (useAppSettingsOverhead) {
      try {
        const settings = await getCurrentAppSettings();
        if (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0) {
          overheadPerPcs = settings.overhead_per_pcs;
          overheadSource = 'app_settings';
          console.log('💡 Using overhead from app settings:', overheadPerPcs);
        } else {
          console.log('⚠️ App settings found but no overhead calculated yet. Please configure operational costs.');
        }
      } catch (error) {
        console.warn('Could not load overhead from app settings:', error);
      }
    }
    
    // 5. Calculate total HPP per pcs (Revision 4 formula)
    console.log('🔥 [BEFORE ROUNDING] Values before final calculation:', {
      bahanPerPcs,
      tklPerPcs,
      overheadPerPcs,
      sum: bahanPerPcs + tklPerPcs + overheadPerPcs
    });
    
    const hppPerPcs = Math.round(bahanPerPcs + tklPerPcs + overheadPerPcs);
    const hppPerPorsi = hppPerPcs * jumlahPcsPerPorsi;
    const totalHPP = hppPerPorsi * jumlahPorsi;
    
    console.log('🔥 [AFTER ROUNDING] Final values:', {
      hppPerPcs,
      hppPerPorsi,
      totalHPP
    });
    
    // 6. Calculate selling prices based on mode
    let hargaJualPerPcs = 0;
    if (pricingMode.mode === 'markup') {
      // Markup mode: harga = HPP × (1 + markup%)
      hargaJualPerPcs = Math.round(hppPerPcs * (1 + pricingMode.percentage / 100));
    } else {
      // Margin mode: harga = HPP ÷ (1 − margin%)
      const marginDecimal = pricingMode.percentage / 100;
      if (marginDecimal >= 1) {
        throw new Error('Margin tidak boleh >= 100%');
      }
      hargaJualPerPcs = Math.round(hppPerPcs / (1 - marginDecimal));
    }
    
    const hargaJualPerPorsi = hargaJualPerPcs * jumlahPcsPerPorsi;
    
    console.log('🔥 [ENHANCED DEBUG] TKL and Overhead calculation:', {
      tklPerPcs,
      overheadPerPcs,
      overheadSource
    });
    
    console.log('🔥 [ENHANCED DEBUG] Final HPP calculation:', {
      bahanPerPcs,
      tklPerPcs,
      overheadPerPcs,
      hppPerPcs: bahanPerPcs + tklPerPcs + overheadPerPcs,
      hppPerPorsi: (bahanPerPcs + tklPerPcs + overheadPerPcs) * jumlahPcsPerPorsi,
      totalHPP: (bahanPerPcs + tklPerPcs + overheadPerPcs) * jumlahPcsPerPorsi * jumlahPorsi
    });
    
    const result: EnhancedHPPCalculationResult = {
      bahanPerPcs: Math.round(bahanPerPcs),
      tklPerPcs: Math.round(tklPerPcs),
      overheadPerPcs: Math.round(overheadPerPcs),
      hppPerPcs,
      hppPerPorsi,
      totalHPP,
      hargaJualPerPcs,
      hargaJualPerPorsi,
      calculationMethod: 'enhanced_dual_mode',
      timestamp: new Date().toISOString(),
      breakdown: {
        ingredients: ingredientsWithWAC,
        laborDetails,
        overheadSource
      }
    };
    
    console.log('🔥 [ENHANCED DEBUG] FINAL RESULT:', result);
    
    return result;
    
  } catch (error) {
    console.error('Error in enhanced HPP calculation:', error);
    throw error;
  }
};

/**
 * Get current app settings for overhead calculation
 * Automatically creates default settings if none exist
 */
export const getCurrentAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle() to avoid PGRST116 error

    if (error) {
      console.error('Error fetching app settings:', error);
      return null;
    }

    // If no settings found, create default settings
    if (!settings) {
      console.log('📝 No app settings found, creating default settings...');
      return await createDefaultAppSettings(user.id);
    }

    return settings;
  } catch (error) {
    console.error('Error getting current app settings:', error);
    return null;
  }
};

/**
 * Create default app settings for a user
 */
export const createDefaultAppSettings = async (userId: string): Promise<AppSettings | null> => {
  try {
    const defaultSettings = {
      user_id: userId,
      target_output_monthly: 1000, // Default 1000 pcs per month
      overhead_per_pcs: 0,          // Will be calculated later
      operasional_per_pcs: 0,       // Will be calculated later
    };

    const { data, error } = await supabase
      .from('app_settings')
      .upsert(defaultSettings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error creating default app settings:', error);
      return null;
    }

    console.log('✅ Default app settings created successfully');
    return data;
  } catch (error) {
    console.error('Error creating default app settings:', error);
    return null;
  }
};

/**
 * Compare legacy vs enhanced calculation
 */
export const compareCalculationMethods = (
  legacyResult: any,
  enhancedResult: EnhancedHPPCalculationResult
): {
  hppDifference: number;
  hargaJualDifference: number;
  overheadMethod: string;
  recommendation: string;
} => {
  const hppDifference = enhancedResult.hppPerPcs - (legacyResult.hppPerPcs || 0);
  const hargaJualDifference = enhancedResult.hargaJualPerPcs - (legacyResult.hargaJualPerPcs || 0);
  
  const overheadMethod = enhancedResult.breakdown.overheadSource === 'app_settings' 
    ? 'Menggunakan overhead dari kalkulator dual-mode'
    : 'Menggunakan input manual overhead';
  
  let recommendation = '';
  if (Math.abs(hppDifference) > 500) {
    recommendation = hppDifference > 0 
      ? 'HPP baru lebih tinggi - pastikan overhead sudah dihitung dengan benar'
      : 'HPP baru lebih rendah - periksa kembali kalkulasi overhead';
  } else {
    recommendation = 'Perbedaan HPP dalam rentang wajar';
  }

  return {
    hppDifference,
    hargaJualDifference,
    overheadMethod,
    recommendation
  };
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Format calculation summary for display
 */
export const formatCalculationSummary = (result: EnhancedHPPCalculationResult): string => {
  return `
HPP Calculation Summary:
- Bahan: ${formatCurrency(result.bahanPerPcs)}/pcs
- TKL: ${formatCurrency(result.tklPerPcs)}/pcs  
- Overhead: ${formatCurrency(result.overheadPerPcs)}/pcs (${result.breakdown.overheadSource})
- Total HPP: ${formatCurrency(result.hppPerPcs)}/pcs
- Harga Jual: ${formatCurrency(result.hargaJualPerPcs)}/pcs
Method: ${result.calculationMethod}
  `.trim();
};

/**
 * Validate enhanced calculation inputs
 */
export const validateEnhancedCalculationInputs = (
  bahanResep: BahanResepWithWAC[],
  jumlahPorsi: number,
  jumlahPcsPerPorsi: number,
  tklDetails: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!bahanResep || bahanResep.length === 0) {
    errors.push('Minimal harus ada 1 bahan resep');
  }
  
  if (jumlahPorsi <= 0) {
    errors.push('Jumlah porsi harus lebih dari 0');
  }
  
  if (jumlahPcsPerPorsi <= 0) {
    errors.push('Jumlah pcs per porsi harus lebih dari 0');
  }
  
  bahanResep.forEach((bahan, index) => {
    if (bahan.jumlah <= 0) {
      errors.push(`Bahan ${index + 1}: Jumlah harus lebih dari 0`);
    }
    if (bahan.hargaSatuan <= 0) {
      errors.push(`Bahan ${index + 1}: Harga satuan harus lebih dari 0`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};