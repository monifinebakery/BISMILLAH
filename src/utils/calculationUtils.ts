// utils/calculationUtils.ts - Core Calculation Logic

import { CalculationInput, CalculationResult, PromoDetails } from '../types';
import { PROMO_TYPES, CALCULATION_CONSTANTS } from './constants';

// 🎯 Main Calculation Function
export const calculatePromoResult = (input: CalculationInput): CalculationResult | null => {
  const { originalPrice, originalHpp, promoType, discountValue, bogoBuy, bogoGet } = input;

  // Validation
  if (originalPrice <= 0 || originalHpp < 0) {
    console.warn('Invalid calculation input:', input);
    return null;
  }

  try {
    let effectivePrice = 0;
    let details: PromoDetails;

    switch (promoType) {
      case PROMO_TYPES.DISCOUNT_PERCENT:
        const discountPercent = Math.min(CALCULATION_CONSTANTS.MAX_DISCOUNT_PERCENT, Math.max(0, discountValue));
        effectivePrice = originalPrice * (1 - (discountPercent / 100));
        details = { type: 'discount_percent', value: discountPercent };
        break;

      case PROMO_TYPES.DISCOUNT_RP:
        const discountRp = Math.max(0, discountValue);
        effectivePrice = Math.max(CALCULATION_CONSTANTS.MINIMUM_PRICE, originalPrice - discountRp);
        details = { type: 'discount_rp', value: discountRp };
        break;

      case PROMO_TYPES.BOGO:
        const buy = Math.max(1, bogoBuy);
        const get = Math.max(0, bogoGet);
        effectivePrice = buy === 0 ? 0 : (originalPrice * buy) / (buy + get);
        details = { type: 'bogo', buy, get };
        break;

      default:
        console.warn('Unknown promo type:', promoType);
        return null;
    }

    // Calculate margins
    const marginRp = effectivePrice - originalHpp;
    const marginPercent = effectivePrice > 0 ? marginRp / effectivePrice : 0;
    const isNegativeMargin = marginPercent < 0;

    // Calculate discount amounts
    const discountAmount = originalPrice - effectivePrice;
    const discountPercent = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

    return {
      price: Math.max(0, effectivePrice),
      marginRp,
      marginPercent,
      details,
      isNegativeMargin,
      discountAmount,
      discountPercent
    };
  } catch (error) {
    console.error('Error in calculatePromoResult:', error);
    return null;
  }
};

// 📊 Margin Analysis
export const analyzeMargin = (marginPercent: number) => {
  if (marginPercent < 0) {
    return {
      level: 'negative',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'Rugi',
      recommendation: 'Kurangi diskon atau evaluasi HPP'
    };
  } else if (marginPercent < 0.1) {
    return {
      level: 'low',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      label: 'Rendah',
      recommendation: 'Pertimbangkan mengurangi diskon'
    };
  } else if (marginPercent < 0.2) {
    return {
      level: 'medium',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      label: 'Sedang',
      recommendation: 'Margin cukup untuk operasional'
    };
  } else if (marginPercent < 0.3) {
    return {
      level: 'good',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'Baik',
      recommendation: 'Margin sehat untuk pertumbuhan'
    };
  } else {
    return {
      level: 'excellent',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Sangat Baik',
      recommendation: 'Margin optimal untuk ekspansi'
    };
  }
};

// 🎯 Discount Optimization
export const findOptimalDiscount = (
  originalPrice: number,
  originalHpp: number,
  targetMarginPercent: number = 0.2
): { discountPercent: number; effectivePrice: number; marginPercent: number } => {
  // Calculate the price needed for target margin
  const targetPrice = originalHpp / (1 - targetMarginPercent);
  
  // If target price is higher than original, no discount needed
  if (targetPrice >= originalPrice) {
    return {
      discountPercent: 0,
      effectivePrice: originalPrice,
      marginPercent: (originalPrice - originalHpp) / originalPrice
    };
  }
  
  // Calculate discount percentage needed
  const discountPercent = ((originalPrice - targetPrice) / originalPrice) * 100;
  
  return {
    discountPercent: Math.round(discountPercent * 10) / 10, // Round to 1 decimal
    effectivePrice: targetPrice,
    marginPercent: targetMarginPercent
  };
};

// 📈 Break-even Analysis
export const calculateBreakEven = (
  originalPrice: number,
  originalHpp: number,
  fixedCosts: number = 0
): {
  breakEvenPrice: number;
  maxDiscountPercent: number;
  maxDiscountRp: number;
} => {
  const breakEvenPrice = originalHpp + fixedCosts;
  const maxDiscountRp = Math.max(0, originalPrice - breakEvenPrice);
  const maxDiscountPercent = originalPrice > 0 ? (maxDiscountRp / originalPrice) * 100 : 0;

  return {
    breakEvenPrice,
    maxDiscountPercent,
    maxDiscountRp
  };
};

// 🔄 Bulk Calculation
export const calculateBulkPromos = (
  recipes: Array<{ id: string; hppPerPorsi: number; hargaJualPorsi: number }>,
  promoConfig: { type: string; value: number; bogoBuy?: number; bogoGet?: number }
): Array<{ recipeId: string; result: CalculationResult | null }> => {
  return recipes.map(recipe => ({
    recipeId: recipe.id,
    result: calculatePromoResult({
      originalPrice: recipe.hargaJualPorsi,
      originalHpp: recipe.hppPerPorsi,
      promoType: promoConfig.type as any,
      discountValue: promoConfig.value,
      bogoBuy: promoConfig.bogoBuy || 2,
      bogoGet: promoConfig.bogoGet || 1
    })
  }));
};

// 📊 Competitive Analysis
export const compareWithCompetitors = (
  ourPrice: number,
  competitorPrices: number[]
): {
  position: 'lowest' | 'competitive' | 'highest';
  priceDifference: number;
  recommendation: string;
} => {
  if (competitorPrices.length === 0) {
    return {
      position: 'competitive',
      priceDifference: 0,
      recommendation: 'Tidak ada data kompetitor untuk perbandingan'
    };
  }

  const avgCompetitorPrice = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length;
  const minCompetitorPrice = Math.min(...competitorPrices);
  const maxCompetitorPrice = Math.max(...competitorPrices);

  let position: 'lowest' | 'competitive' | 'highest';
  let recommendation: string;

  if (ourPrice < minCompetitorPrice) {
    position = 'lowest';
    recommendation = 'Harga paling rendah - pertimbangkan menaikkan harga';
  } else if (ourPrice > maxCompetitorPrice) {
    position = 'highest';
    recommendation = 'Harga paling tinggi - pertimbangkan menurunkan harga';
  } else {
    position = 'competitive';
    recommendation = 'Harga kompetitif di pasaran';
  }

  return {
    position,
    priceDifference: ourPrice - avgCompetitorPrice,
    recommendation
  };
};

// 🎯 ROI Calculation
export const calculateROI = (
  investment: number,
  revenue: number,
  costs: number = 0
): {
  roi: number;
  profit: number;
  roiPercent: number;
} => {
  const profit = revenue - costs - investment;
  const roi = investment > 0 ? profit / investment : 0;
  
  return {
    roi,
    profit,
    roiPercent: roi * 100
  };
};

// 📈 Price Elasticity
export const estimatePriceElasticity = (
  basePrice: number,
  baseDemand: number,
  newPrice: number,
  newDemand: number
): {
  elasticity: number;
  interpretation: string;
} => {
  const priceChange = (newPrice - basePrice) / basePrice;
  const demandChange = (newDemand - baseDemand) / baseDemand;
  
  const elasticity = priceChange !== 0 ? demandChange / priceChange : 0;
  
  let interpretation: string;
  if (Math.abs(elasticity) > 1) {
    interpretation = 'Elastis - perubahan harga sangat mempengaruhi permintaan';
  } else if (Math.abs(elasticity) < 1) {
    interpretation = 'Inelastis - permintaan tidak terlalu terpengaruh harga';
  } else {
    interpretation = 'Unit elastis - perubahan harga proporsional dengan permintaan';
  }

  return { elasticity, interpretation };
};

// 🔢 Financial Metrics
export const calculateFinancialMetrics = (
  revenue: number,
  costs: number,
  taxes: number = 0
): {
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  ebitda: number;
} => {
  const grossProfit = revenue - costs;
  const netProfit = grossProfit - taxes;
  const grossMargin = revenue > 0 ? grossProfit / revenue : 0;
  const netMargin = revenue > 0 ? netProfit / revenue : 0;
  const ebitda = grossProfit; // Simplified EBITDA calculation

  return {
    grossProfit,
    netProfit,
    grossMargin,
    netMargin,
    ebitda
  };
};

// 🎯 Validation Functions
export const validateCalculationInput = (input: CalculationInput): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (input.originalPrice <= 0) {
    errors.push('Harga asli harus lebih dari 0');
  }

  if (input.originalHpp < 0) {
    errors.push('HPP tidak boleh negatif');
  }

  if (input.originalHpp >= input.originalPrice) {
    errors.push('HPP tidak boleh lebih besar atau sama dengan harga jual');
  }

  if (input.promoType === PROMO_TYPES.DISCOUNT_PERCENT) {
    if (input.discountValue <= 0 || input.discountValue >= 100) {
      errors.push('Diskon persentase harus antara 0-100%');
    }
  }

  if (input.promoType === PROMO_TYPES.DISCOUNT_RP) {
    if (input.discountValue <= 0) {
      errors.push('Diskon rupiah harus lebih dari 0');
    }
    if (input.discountValue >= input.originalPrice) {
      errors.push('Diskon rupiah tidak boleh melebihi harga asli');
    }
  }

  if (input.promoType === PROMO_TYPES.BOGO) {
    if (input.bogoBuy < 1) {
      errors.push('Jumlah beli minimal 1');
    }
    if (input.bogoGet < 0) {
      errors.push('Jumlah gratis tidak boleh negatif');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 🔄 Utility Functions
export const roundToDecimal = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

export const interpolateValue = (
  min: number,
  max: number,
  percentage: number
): number => {
  return min + (max - min) * (percentage / 100);
};

// 📊 Statistical Functions
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = calculateAverage(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateAverage(squaredDifferences);
  
  return Math.sqrt(variance);
};