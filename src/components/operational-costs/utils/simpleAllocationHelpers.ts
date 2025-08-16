// src/components/operational-costs/utils/simpleAllocationHelpers.ts

export interface SimpleAllocationData {
  monthlyFixedCosts: number;
  estimatedMonthlyProduction: number;
  additionalCostPerProduct: number;
}

export interface SimpleAllocationResult {
  perProduct: number;
  isValid: boolean;
  warnings: string[];
}

/**
 * Calculate the additional cost per product using simple division method
 * 
 * @param monthlyFixedCosts Total monthly operational costs
 * @param estimatedMonthlyProduction Estimated number of products produced per month
 * @returns Calculation result with per-product cost and validation
 */
export function calculateSimpleAllocation(
  monthlyFixedCosts: number,
  estimatedMonthlyProduction: number
): SimpleAllocationResult {
  const warnings: string[] = [];
  let isValid = true;

  // Validate inputs
  if (monthlyFixedCosts <= 0) {
    warnings.push('Biaya tetap bulanan harus lebih dari 0');
    isValid = false;
  }

  if (estimatedMonthlyProduction <= 0) {
    warnings.push('Estimasi produksi bulanan harus lebih dari 0');
    isValid = false;
  }

  // Calculate per product cost
  const perProduct = isValid ? monthlyFixedCosts / estimatedMonthlyProduction : 0;

  // Add business logic warnings
  if (isValid) {
    if (perProduct > 50000) {
      warnings.push('Biaya per produk sangat tinggi (>50rb). Pastikan estimasi produksi realistis.');
    }
    
    if (monthlyFixedCosts > 50000000) {
      warnings.push('Biaya tetap sangat besar (>50jt). Periksa kembali kategori biaya yang dimasukkan.');
    }
    
    if (estimatedMonthlyProduction < 100) {
      warnings.push('Produksi bulanan rendah (<100 unit). Pertimbangkan untuk meningkatkan target produksi.');
    }
  }

  return {
    perProduct,
    isValid,
    warnings
  };
}

/**
 * Get production volume suggestions based on monthly fixed costs
 * 
 * @param monthlyFixedCosts Total monthly fixed costs
 * @returns Array of suggested production volumes
 */
export function getProductionSuggestions(monthlyFixedCosts: number): number[] {
  if (monthlyFixedCosts <= 5000000) {
    // Small business (≤5 juta): suggest lower production volumes
    return [500, 1000, 1500, 2000, 3000];
  } else if (monthlyFixedCosts <= 15000000) {
    // Medium business (5-15 juta): suggest medium production volumes
    return [1000, 2000, 3000, 5000, 8000];
  } else if (monthlyFixedCosts <= 30000000) {
    // Large business (15-30 juta): suggest higher production volumes
    return [3000, 5000, 8000, 12000, 15000];
  } else {
    // Very large business (>30 juta): suggest very high production volumes
    return [10000, 15000, 20000, 30000, 50000];
  }
}

/**
 * Format monthly cost range for display
 * 
 * @param monthlyFixedCosts Total monthly fixed costs
 * @returns Formatted range description
 */
export function getBusinessSizeDescription(monthlyFixedCosts: number): {
  size: string;
  description: string;
  color: string;
} {
  if (monthlyFixedCosts <= 5000000) {
    return {
      size: 'Bisnis Kecil',
      description: '≤ 5 juta/bulan',
      color: 'blue'
    };
  } else if (monthlyFixedCosts <= 15000000) {
    return {
      size: 'Bisnis Menengah',
      description: '5-15 juta/bulan',
      color: 'green'
    };
  } else if (monthlyFixedCosts <= 30000000) {
    return {
      size: 'Bisnis Besar',
      description: '15-30 juta/bulan',
      color: 'orange'
    };
  } else {
    return {
      size: 'Bisnis Sangat Besar',
      description: '> 30 juta/bulan',
      color: 'purple'
    };
  }
}

/**
 * Calculate ideal production range for target per-product cost
 * 
 * @param monthlyFixedCosts Total monthly fixed costs
 * @param targetCostPerProduct Desired cost per product
 * @returns Object with min and max production suggestions
 */
export function calculateIdealProductionRange(
  monthlyFixedCosts: number,
  targetCostPerProduct: number
): {
  optimal: number;
  range: { min: number; max: number };
  recommendations: string[];
} {
  const optimal = Math.round(monthlyFixedCosts / targetCostPerProduct);
  const min = Math.round(optimal * 0.8); // 20% below optimal
  const max = Math.round(optimal * 1.2); // 20% above optimal
  
  const recommendations: string[] = [];
  
  if (targetCostPerProduct < 1000) {
    recommendations.push('Target biaya sangat rendah, pastikan bisa dicapai dengan volume tinggi');
  } else if (targetCostPerProduct > 10000) {
    recommendations.push('Target biaya tinggi, pertimbangkan optimasi atau produk premium');
  }
  
  if (optimal < 500) {
    recommendations.push('Produksi rendah, fokus pada margin dan kualitas');
  } else if (optimal > 20000) {
    recommendations.push('Produksi tinggi, pastikan kapasitas dan supply chain memadai');
  }

  return {
    optimal,
    range: { min, max },
    recommendations
  };
}

/**
 * Validate simple allocation data
 * 
 * @param data Simple allocation data
 * @returns Validation result
 */
export function validateSimpleAllocation(data: SimpleAllocationData): {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
} {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate monthly fixed costs
  if (!data.monthlyFixedCosts || data.monthlyFixedCosts <= 0) {
    errors.monthlyFixedCosts = 'Biaya tetap bulanan harus diisi dan lebih dari 0';
  } else if (data.monthlyFixedCosts < 1000000) {
    warnings.push('Biaya tetap sangat rendah untuk bisnis F&B (< 1 juta)');
  }

  // Validate estimated production
  if (!data.estimatedMonthlyProduction || data.estimatedMonthlyProduction <= 0) {
    errors.estimatedMonthlyProduction = 'Estimasi produksi bulanan harus diisi dan lebih dari 0';
  } else if (data.estimatedMonthlyProduction < 100) {
    warnings.push('Target produksi sangat rendah (< 100 unit/bulan)');
  }

  // Business logic validations
  if (data.monthlyFixedCosts > 0 && data.estimatedMonthlyProduction > 0) {
    const costPerProduct = data.monthlyFixedCosts / data.estimatedMonthlyProduction;
    
    if (costPerProduct > 100000) {
      warnings.push('Biaya operasional per produk sangat tinggi (> 100rb). Periksa kembali perhitungan.');
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}
