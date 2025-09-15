// src/components/operational-costs/utils/enhancedHppCalculations.ts
// 🔗 Enhanced HPP Calculations with Dual-Mode Integration (Revision 4)
// WAC per item bahan + Overhead per pcs

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
  tklPerPcs: number;        // Legacy field, always 0 (TKL included in overhead)
  overheadPerPcs: number;   // Overhead cost per pcs from operational costs
  
  // Total HPP
  hppPerPcs: number;        // bahanPerPcs + overheadPerPcs (TKL included in overhead)
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
    overheadSource: 'app_settings' | 'manual_input';
    // ✅ NEW: Detailed overhead breakdown for transparency
    overheadBreakdown?: {
      overheadOnly: number;     // Just overhead_per_pcs from app settings
      operasionalOnly: number;  // Just operasional_per_pcs from app settings  
      combined: number;         // Total: overheadOnly + operasionalOnly
      note: string;             // Explanation of calculation method
    };
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
      console.error('❌ [WAC] User not authenticated');
      return new Map();
    }

    // Get WAC prices from bahan_baku table
    const warehouseIds = ingredients
      .map(ing => ing.warehouseId)
      .filter(Boolean) as string[];
    
    console.log('🔍 [WAC] Fetching WAC for warehouse IDs:', warehouseIds);
    
    if (warehouseIds.length === 0) {
      console.log('ℹ️ [WAC] No warehouse IDs provided, returning empty WAC map');
      return new Map();
    }

    const { data: bahanBaku, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, harga_rata_rata, harga_satuan')
      .eq('user_id', user.id)
      .in('id', warehouseIds);

    if (error) {
      console.warn('⚠️ [WAC] Error fetching WAC prices from database:', error);
      return new Map();
    }
    
    if (!bahanBaku || bahanBaku.length === 0) {
      console.warn('⚠️ [WAC] No materials found in database for provided warehouse IDs');
      return new Map();
    }

    console.log('📊 [WAC] Raw data from database:', bahanBaku.map(b => ({
      id: b.id,
      nama: b.nama,
      harga_rata_rata: b.harga_rata_rata,
      harga_satuan: b.harga_satuan
    })));

    const wacMap = new Map<string, number>();
    bahanBaku.forEach(bahan => {
      // ✅ IMPROVED: Better WAC selection logic
      let effectivePrice = 0;
      
      // Priority 1: Use WAC if it exists and is positive
      if (bahan.harga_rata_rata && Number(bahan.harga_rata_rata) > 0) {
        effectivePrice = Number(bahan.harga_rata_rata);
        console.log(`✅ [WAC] Using WAC for ${bahan.nama}: Rp ${effectivePrice}`);
      } 
      // Priority 2: Fallback to current price if WAC is not available
      else if (bahan.harga_satuan && Number(bahan.harga_satuan) > 0) {
        effectivePrice = Number(bahan.harga_satuan);
        console.log(`🔄 [WAC] Using current price for ${bahan.nama}: Rp ${effectivePrice} (WAC not available)`);
      } 
      // Priority 3: Skip if no valid price
      else {
        console.warn(`⚠️ [WAC] No valid price found for ${bahan.nama}, skipping`);
        return;
      }
      
      wacMap.set(bahan.id, effectivePrice);
    });
    
    console.log('📋 [WAC] Final WAC map created:', {
      totalItems: wacMap.size,
      items: Object.fromEntries(wacMap)
    });

    return wacMap;

  } catch (error) {
    console.error('❌ [WAC] Critical error getting ingredients WAC:', error);
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
  console.log('🔥 [WAC DEBUG] WAC map from database:', Object.fromEntries(wacMap));
  
  return ingredients.map(ingredient => {
    console.log(`🔥 [WAC DEBUG] Processing ingredient: ${ingredient.nama}`, {
      warehouseId: ingredient.warehouseId,
      currentHargaSatuan: ingredient.hargaSatuan,
      currentTotalHarga: ingredient.totalHarga,
      jumlah: ingredient.jumlah,
      hasWAC: ingredient.warehouseId && wacMap.has(ingredient.warehouseId),
      wacFromDb: ingredient.warehouseId ? wacMap.get(ingredient.warehouseId) : 'N/A'
    });
    
    if (ingredient.warehouseId && wacMap.has(ingredient.warehouseId)) {
      let wacPrice = wacMap.get(ingredient.warehouseId)!;
      
      // ✅ IMPROVED: Better WAC validation without aggressive correction
      const originalPrice = ingredient.hargaSatuan;
      
      // Only use WAC if it's a positive number and reasonable
      if (wacPrice <= 0) {
        console.warn(`⚠️ [WAC] WAC price is zero or negative for ${ingredient.nama}, using original price`);
        console.log(`🔄 [WAC DEBUG] Fallback: using original price ${originalPrice} for ${ingredient.nama}`);
        return ingredient; // Keep original data
      }
      
      // Sanity check: WAC shouldn't be ridiculously different from original price
      if (originalPrice > 0) {
        const ratio = wacPrice / originalPrice;
        // More reasonable ratio check - WAC shouldn't be more than 10x or less than 0.1x the original price
        if (ratio > 10 || ratio < 0.1) {
          console.warn(`⚠️ [WAC] WAC price seems unrealistic for ${ingredient.nama}:`, {
            wacPrice,
            originalPrice,
            ratio,
            message: 'Using original price as fallback for safety'
          });
          return ingredient; // Keep original data
        }
      }
      
      // Additional sanity check: WAC price shouldn't be more than 1 million per unit
      if (wacPrice > 1000000) {
        console.warn(`⚠️ [WAC] WAC price too high for ${ingredient.nama}: Rp ${wacPrice.toLocaleString()}, using original price`);
        return ingredient;
      }
      
      const newTotalHarga = ingredient.jumlah * wacPrice;
      
      console.log(`✅ [WAC DEBUG] Using validated WAC for ${ingredient.nama}:`, {
        originalPrice: ingredient.hargaSatuan,
        validatedWacPrice: wacPrice,
        jumlah: ingredient.jumlah,
        originalTotalHarga: ingredient.totalHarga,
        newTotalHarga,
        calculation: `${ingredient.jumlah} * ${wacPrice} = ${newTotalHarga}`,
        improvement: newTotalHarga !== ingredient.totalHarga ? 'WAC applied' : 'No change'
      });
      
      return {
        ...ingredient,
        wacPrice,
        hargaSatuan: wacPrice, // Use WAC as the price
        totalHarga: newTotalHarga
      };
    }
    
    console.log(`ℹ️ [WAC DEBUG] No WAC available for ${ingredient.nama}, using original:`, {
      hargaSatuan: ingredient.hargaSatuan,
      totalHarga: ingredient.totalHarga,
      reason: !ingredient.warehouseId ? 'No warehouse ID' : 'WAC not found in database'
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
    
    // TKL is now handled entirely through overhead from operational costs
    let tklPerPcs = 0;
    
    // TKL costs are included in overhead from operational costs
    
    // 4. ✅ UMKM MODE: Get combined overhead per pcs from app settings (Overhead Produksi + Operasional, TKL sudah termasuk)
    let overheadPerPcs = 0;
    let operasionalPerPcs = 0;
    let totalOverheadForHPP = 0;
    let overheadSource: 'app_settings' | 'manual_input' = 'manual_input';
    
    if (useAppSettingsOverhead) {
      try {
        const settings = await getCurrentAppSettings();
        const hasOverheadData = (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0);
        const hasOperasionalData = (settings?.operasional_per_pcs && settings.operasional_per_pcs > 0);
        
        if (hasOverheadData || hasOperasionalData) {
          overheadPerPcs = settings?.overhead_per_pcs || 0; // Already includes HPP + TKL from triple-mode calc
          operasionalPerPcs = settings?.operasional_per_pcs || 0;
          
          // ✅ Update: Recipe HPP now uses COMBINED costs
          // Overhead per pcs (sudah termasuk TKL) + Operasional per pcs
          // Ini membuat biaya operasional tersinkron ke resep secara otomatis
          totalOverheadForHPP = overheadPerPcs + operasionalPerPcs;
          overheadSource = 'app_settings';
          
          console.log('💡 Using app settings (combined overhead + operasional):', {
            overheadPerPcs,
            operasionalPerPcs,
            totalOverheadForHPP,
            note: 'HPP resep = bahan + (overhead + operasional). TKL sudah termasuk di overhead.'
          });
        } else {
          console.log('⚠️ App settings found but no overhead/operasional costs calculated yet. Please configure operational costs.');
        }
      } catch (error) {
        console.warn('Could not load overhead from app settings:', error);
      }
    }
    
    // 5. ✅ UMKM MODE: Calculate HPP per pcs (Bahan + Overhead Produksi + Operasional)
    // Note: TKL sudah termasuk di Overhead Produksi
    console.log('🔥 [BEFORE ROUNDING] UMKM-mode values before final calculation:', {
      bahanPerPcs,
      tklPerPcsManual: tklPerPcs, // Manual TKL input (if any)
      overheadPerPcsFromSettings: overheadPerPcs,
      totalOverheadForHPP: totalOverheadForHPP,
      operasionalPerPcs: operasionalPerPcs,
      finalHppSum: bahanPerPcs + tklPerPcs + totalOverheadForHPP,
      note: 'UMKM mode: HPP memakai overhead + operasional. TKL sudah termasuk di overhead.'
    });
    
    const hppPerPcs = Math.round(bahanPerPcs + tklPerPcs + totalOverheadForHPP);
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
    
    // TKL and Overhead calculation completed
    
    // Final HPP calculation completed
    
    // Additional validation check before creating result
    if (bahanPerPcs > 100000) { // If bahan cost per pcs is more than Rp 100k, something is wrong
      console.error('🚨 [VALIDATION ERROR] BahanPerPcs is too high:', {
        bahanPerPcs,
        totalBahanCost,
        totalPcs,
        ingredientsBreakdown: ingredientsWithWAC.map(ing => ({
          nama: ing.nama,
          jumlah: ing.jumlah,
          hargaSatuan: ing.hargaSatuan,
          totalHarga: ing.totalHarga,
          wacPrice: ing.wacPrice
        }))
      });
      
      // Fall back to safer calculation without extreme WAC prices
      const saferIngredients = bahanResep.map(ingredient => ({
        ...ingredient,
        // Ensure reasonable price limits
        hargaSatuan: Math.min(ingredient.hargaSatuan, 50000), // Max 50k per unit
        totalHarga: Math.min(ingredient.totalHarga, ingredient.jumlah * 50000)
      }));
      
      const saferTotalBahanCost = saferIngredients.reduce((sum, bahan) => sum + bahan.totalHarga, 0);
      const saferBahanPerPcs = totalPcs > 0 ? saferTotalBahanCost / totalPcs : 0;
      
      console.log('🔧 [FALLBACK] Using safer calculation:', {
        originalBahanPerPcs: bahanPerPcs,
        saferBahanPerPcs,
        saferTotalBahanCost
      });
      
      const saferHppPerPcs = Math.round(saferBahanPerPcs + tklPerPcs + totalOverheadForHPP);
      const saferHppPerPorsi = saferHppPerPcs * jumlahPcsPerPorsi;
      const saferTotalHPP = saferHppPerPorsi * jumlahPorsi;
      
      return {
        bahanPerPcs: Math.round(saferBahanPerPcs),
        tklPerPcs: Math.round(tklPerPcs),
        overheadPerPcs: Math.round(totalOverheadForHPP), // Combined overhead + operasional
        hppPerPcs: saferHppPerPcs,
        hppPerPorsi: saferHppPerPorsi,
        totalHPP: saferTotalHPP,
        hargaJualPerPcs: Math.round(saferHppPerPcs * (1 + (pricingMode.percentage || 25) / 100)),
        hargaJualPerPorsi: Math.round(saferHppPerPcs * (1 + (pricingMode.percentage || 25) / 100)) * jumlahPcsPerPorsi,
        calculationMethod: 'enhanced_dual_mode',
        timestamp: new Date().toISOString(),
        breakdown: {
          ingredients: saferIngredients as BahanResepWithWAC[],
          overheadSource,
          overheadBreakdown: overheadSource === 'app_settings' ? {
            overheadOnly: overheadPerPcs, // Termasuk TKL
            operasionalOnly: operasionalPerPcs,
            combined: totalOverheadForHPP,
            note: 'HPP memakai overhead + operasional (TKL termasuk di overhead).'
          } : undefined
        }
      };
    }

    const result: EnhancedHPPCalculationResult = {
      bahanPerPcs: Math.round(bahanPerPcs),
      tklPerPcs: Math.round(tklPerPcs),
      overheadPerPcs: Math.round(totalOverheadForHPP), // ✅ Combined overhead + operasional (TKL termasuk di overhead)
      hppPerPcs,
      hppPerPorsi,
      totalHPP,
      hargaJualPerPcs,
      hargaJualPerPorsi,
      calculationMethod: 'enhanced_dual_mode',
      timestamp: new Date().toISOString(),
      breakdown: {
        ingredients: ingredientsWithWAC,
        overheadSource,
        // ✅ Combined breakdown for transparency
        overheadBreakdown: overheadSource === 'app_settings' ? {
          overheadOnly: overheadPerPcs, // Termasuk TKL
          operasionalOnly: operasionalPerPcs,
          combined: totalOverheadForHPP, // Digunakan dalam perhitungan HPP
          note: 'HPP memakai overhead + operasional (TKL termasuk di overhead).'
        } : undefined
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
      .select(`
        id,
        user_id,
        target_output_monthly,
        overhead_per_pcs,
        operasional_per_pcs,
        created_at,
        updated_at
      `)
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
  jumlahPcsPerPorsi: number
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
