// src/components/operational-costs/utils/dualModeCalculations.ts
// 🧮 Dual-Mode Cost Calculations (Revisions 1-4)
// Separate calculations for Overhead Pabrik (HPP) vs Operasional (non-HPP)

import { OperationalCost, DualModeCalculationResult, AppSettings } from '../types/operationalCost.types';

// ====================================
// CORE CALCULATION FUNCTIONS
// ====================================

/**
 * Calculate cost per unit for a specific group (HPP or OPERASIONAL)
 * Formula: Biaya per produk = total biaya ÷ target produksi
 */
export const calculateCostPerUnit = (
  costs: OperationalCost[],
  group: 'HPP' | 'OPERASIONAL',
  targetOutputMonthly: number
): DualModeCalculationResult => {
  // Filter costs by group and active status
  const groupCosts = costs.filter(cost => 
    cost.group === group && cost.status === 'aktif'
  );
  
  // Calculate total monthly costs for the group
  const totalCosts = groupCosts.reduce((sum, cost) => 
    sum + Number(cost.jumlah_per_bulan), 0
  );
  
  // Validation
  const validationErrors: string[] = [];
  
  if (targetOutputMonthly <= 0) {
    validationErrors.push('Target produksi harus lebih dari 0');
  }
  
  if (totalCosts < 1000) {
    validationErrors.push('Total biaya harus minimal Rp 1.000');
  }
  
  // Calculate cost per unit
  const costPerUnit = targetOutputMonthly > 0 ? totalCosts / targetOutputMonthly : 0;
  
  return {
    group,
    totalCosts,
    targetOutput: targetOutputMonthly,
    costPerUnit: Math.round(costPerUnit), // Pembulatan sesuai Revision 8
    isValid: validationErrors.length === 0,
    validationErrors
  };
};

/**
 * Calculate both HPP and Operasional costs per unit
 */
export const calculateDualModeCosts = (
  costs: OperationalCost[],
  targetOutputMonthly: number
): {
  hpp: DualModeCalculationResult;
  operasional: DualModeCalculationResult;
} => {
  return {
    hpp: calculateCostPerUnit(costs, 'HPP', targetOutputMonthly),
    operasional: calculateCostPerUnit(costs, 'OPERASIONAL', targetOutputMonthly)
  };
};

// ====================================
// PRODUCTION OUTPUT ESTIMATION
// ====================================

/**
 * Get production output from last 30 days (Revision 2)
 * This integrates with actual production/sales data
 */
export const getRecentProductionOutput = async (
  userId: string,
  days: number = 30
): Promise<number> => {
  try {
    // Import the production output service
    const { productionOutputApi } = await import('../services/productionOutputApi');
    
    // Get smart production output (tries orders first, then recipes, then manual)
    const result = await productionOutputApi.getSmartProductionOutput(days);
    
    if (result.data) {
      return result.data.monthlyEstimate;
    }
    
    // Fallback to default if all methods fail
    return 3000;
  } catch (error) {
    console.error('Error fetching recent production output:', error);
    return 3000; // Safe fallback
  }
};

/**
 * Estimate monthly production based on recent data
 */
export const estimateMonthlyProduction = (dailyProduction: number): number => {
  // Simple estimation: daily * 30
  return Math.round(dailyProduction * 30);
};

// ====================================
// INTEGRATION WITH EXISTING SYSTEM
// ====================================

/**
 * Update app settings with calculated cost per unit values
 */
export const updateAppSettingsWithCalculation = (
  currentSettings: AppSettings | null,
  hppResult: DualModeCalculationResult,
  operasionalResult: DualModeCalculationResult
): Partial<AppSettings> => {
  return {
    target_output_monthly: hppResult.targetOutput,
    overhead_per_pcs: hppResult.isValid ? hppResult.costPerUnit : 0,
    operasional_per_pcs: operasionalResult.isValid ? operasionalResult.costPerUnit : 0
  };
};

/**
 * Get HPP calculation with new overhead structure (Revision 4)
 * WAC per item bahan + TKL per pcs + Overhead per pcs
 */
export const calculateHPPWithDualMode = (
  bahanPerPcs: number,      // Bahan per pcs (from BOM × WAC)
  tklPerPcs: number,        // TKL per pcs (from recipe)
  overheadPerPcs: number    // From app settings (HPP group calculation)
): number => {
  return Math.round(bahanPerPcs + tklPerPcs + overheadPerPcs);
};

/**
 * Calculate selling price with markup or margin (Revision 4)
 */
export const calculateSellingPrice = (
  hppPerPcs: number,
  priceMode: 'markup' | 'margin',
  percentage: number
): number => {
  if (priceMode === 'markup') {
    // Markup mode: harga = HPP × (1 + markup%)
    return Math.round(hppPerPcs * (1 + percentage / 100));
  } else {
    // Margin mode: harga = HPP ÷ (1 − margin%)
    const marginDecimal = percentage / 100;
    if (marginDecimal >= 1) {
      throw new Error('Margin tidak boleh >= 100%');
    }
    return Math.round(hppPerPcs / (1 - marginDecimal));
  }
};

// ====================================
// VALIDATION & GUARDRAILS (Revision 8)
// ====================================

/**
 * Validate dual-mode calculation inputs
 */
export const validateDualModeInputs = (
  targetOutput: number,
  monthlyAmount: number,
  costName: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Target output validation
  if (!targetOutput || targetOutput <= 0) {
    errors.push('Target produksi harus lebih dari 0 pcs');
  }
  
  // Monthly amount validation  
  if (!monthlyAmount || monthlyAmount < 1000) {
    errors.push('Jumlah biaya bulanan harus minimal Rp 1.000');
  }
  
  // Cost name validation
  if (!costName || costName.trim().length < 3) {
    errors.push('Nama biaya harus minimal 3 karakter');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Round currency values consistently (Revision 8)
 */
export const roundCurrency = (amount: number, roundTo: number = 1): number => {
  // Default: round to nearest rupiah
  // Optional: round to nearest 50 or 100
  if (roundTo === 50) {
    return Math.round(amount / 50) * 50;
  } else if (roundTo === 100) {
    return Math.round(amount / 100) * 100;
  } else {
    return Math.round(amount);
  }
};

// ====================================
// EXAMPLE VERIFICATION (Revision 9)
// ====================================

/**
 * Verify calculations with the provided example
 */
export const verifyExampleCalculations = (): {
  overhead: DualModeCalculationResult;
  operasional: DualModeCalculationResult;
  expectedResults: any;
} => {
  // Example from Revision 9:
  // Overhead (HPP) = 690.000 (gas) + 1.500.000 (sewa dapur) = 2.190.000
  // Target 3.000 pcs → 730/pcs (masuk HPP)
  
  const mockOverheadCosts: OperationalCost[] = [
    {
      id: '1',
      user_id: 'test',
      nama_biaya: 'Gas Oven',
      jumlah_per_bulan: 690000,
      jenis: 'tetap',
      status: 'aktif',
      group: 'HPP',
      cost_category: 'fixed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2', 
      user_id: 'test',
      nama_biaya: 'Sewa Dapur',
      jumlah_per_bulan: 1500000,
      jenis: 'tetap',
      status: 'aktif',
      group: 'HPP',
      cost_category: 'fixed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  const mockOperasionalCosts: OperationalCost[] = [
    {
      id: '3',
      user_id: 'test', 
      nama_biaya: 'Marketing',
      jumlah_per_bulan: 4000000,
      jenis: 'variabel',
      status: 'aktif',
      group: 'OPERASIONAL',
      cost_category: 'variable',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  const targetOutput = 3000;
  
  const overhead = calculateCostPerUnit([...mockOverheadCosts], 'HPP', targetOutput);
  const operasional = calculateCostPerUnit([...mockOperasionalCosts], 'OPERASIONAL', targetOutput);
  
  return {
    overhead,
    operasional,
    expectedResults: {
      overheadPerPcs: 730,  // 2.190.000 / 3.000
      operasionalPerPcs: 1333, // 4.000.000 / 3.000
      hppExample: {
        bahan: 4200,
        tkl: 3000,
        overhead: 730,
        totalHPP: 7930, // 4200 + 3000 + 730
        markup35: 10706, // 7930 × 1.35
        margin35: 12200  // 7930 ÷ 0.65
      }
    }
  };
};