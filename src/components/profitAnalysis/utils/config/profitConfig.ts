// src/components/profitAnalysis/utils/config/profitConfig.ts
// Konfigurasi profit analysis yang dapat disesuaikan

import { logger } from '@/utils/logger';

/**
 * Interface untuk konfigurasi usage rate berdasarkan jenis bisnis F&B
 */
export interface UsageRateConfig {
  // Usage rate default untuk berbagai kategori bisnis F&B
  fnb_restaurant: number;     // Restoran/warung makan
  fnb_cafe: number;          // Kafe/coffee shop
  fnb_catering: number;      // Katering
  fnb_bakery: number;        // Toko roti/bakery
  fnb_fastfood: number;      // Fast food/quick service
  fnb_streetfood: number;    // Makanan jalanan/kaki lima
  default: number;          // Default untuk F&B lainnya
}

/**
 * Interface untuk threshold validasi berdasarkan jenis bisnis
 */
export interface BusinessValidationThresholds {
  maxCogsRatio: number;      // Maksimum COGS sebagai % dari revenue
  maxOpexRatio: number;      // Maksimum OpEx sebagai % dari revenue
  alertCogsRatio: number;    // Threshold alert untuk COGS
  alertOpexRatio: number;    // Threshold alert untuk OpEx
  minMargin: number;         // Minimum realistic margin %
  maxMargin: number;         // Maximum realistic margin %
}

/**
 * Konfigurasi usage rate default berdasarkan jenis bisnis F&B
 */
export const DEFAULT_USAGE_RATES: UsageRateConfig = {
  fnb_restaurant: 0.15,      // 15% untuk restoran (turnover tinggi)
  fnb_cafe: 0.12,           // 12% untuk kafe
  fnb_catering: 0.20,       // 20% untuk katering (batch besar)
  fnb_bakery: 0.18,         // 18% untuk bakery (produksi harian)
  fnb_fastfood: 0.22,       // 22% untuk fast food (volume tinggi)
  fnb_streetfood: 0.25,     // 25% untuk street food (turnover cepat)
  default: 0.15             // 15% default untuk F&B
};

/**
 * Threshold validasi berdasarkan jenis bisnis F&B
 */
export const BUSINESS_THRESHOLDS: Record<string, BusinessValidationThresholds> = {
  fnb_restaurant: {
    maxCogsRatio: 0.70,       // 70% untuk restoran (food cost)
    maxOpexRatio: 1.5,        // 150% untuk startup F&B
    alertCogsRatio: 0.60,     // Alert di 60%
    alertOpexRatio: 0.80,     // Alert di 80%
    minMargin: -50,           // -50% minimum
    maxMargin: 80             // 80% maximum
  },
  fnb_cafe: {
    maxCogsRatio: 0.60,       // 60% untuk kafe (margin lebih tinggi)
    maxOpexRatio: 1.2,        // 120%
    alertCogsRatio: 0.50,     // Alert di 50%
    alertOpexRatio: 0.70,     // Alert di 70%
    minMargin: -30,           // -30% minimum
    maxMargin: 85             // 85% maximum
  },
  fnb_catering: {
    maxCogsRatio: 0.65,       // 65% untuk katering
    maxOpexRatio: 1.0,        // 100%
    alertCogsRatio: 0.55,     // Alert di 55%
    alertOpexRatio: 0.60,     // Alert di 60%
    minMargin: -40,           // -40% minimum
    maxMargin: 75             // 75% maximum
  },
  fnb_bakery: {
    maxCogsRatio: 0.55,       // 55% untuk bakery (margin tinggi)
    maxOpexRatio: 1.0,        // 100%
    alertCogsRatio: 0.45,     // Alert di 45%
    alertOpexRatio: 0.60,     // Alert di 60%
    minMargin: -25,           // -25% minimum
    maxMargin: 85             // 85% maximum
  },
  fnb_fastfood: {
    maxCogsRatio: 0.75,       // 75% untuk fast food (volume tinggi)
    maxOpexRatio: 1.3,        // 130%
    alertCogsRatio: 0.65,     // Alert di 65%
    alertOpexRatio: 0.75,     // Alert di 75%
    minMargin: -35,           // -35% minimum
    maxMargin: 70             // 70% maximum
  },
  fnb_streetfood: {
    maxCogsRatio: 0.80,       // 80% untuk street food (margin tipis)
    maxOpexRatio: 0.80,       // 80% (overhead rendah)
    alertCogsRatio: 0.70,     // Alert di 70%
    alertOpexRatio: 0.50,     // Alert di 50%
    minMargin: -20,           // -20% minimum
    maxMargin: 65             // 65% maximum
  },
  default: {
    maxCogsRatio: 0.70,       // 70% default F&B
    maxOpexRatio: 1.2,        // 120% default F&B
    alertCogsRatio: 0.60,     // Alert di 60%
    alertOpexRatio: 0.70,     // Alert di 70%
    minMargin: -50,           // -50% minimum
    maxMargin: 80             // 80% maximum
  }
};

/**
 * Enum untuk jenis bisnis F&B yang didukung
 */
export enum BusinessType {
  FNB_RESTAURANT = 'fnb_restaurant',
  FNB_CAFE = 'fnb_cafe',
  FNB_CATERING = 'fnb_catering',
  FNB_BAKERY = 'fnb_bakery',
  FNB_FASTFOOD = 'fnb_fastfood',
  FNB_STREETFOOD = 'fnb_streetfood',
  DEFAULT = 'default'
}

/**
 * Utility untuk mendapatkan usage rate berdasarkan jenis bisnis
 */
export function getUsageRateForBusiness(
  businessType: BusinessType | string = BusinessType.DEFAULT,
  customRate?: number
): number {
  // Jika ada custom rate, gunakan itu
  if (customRate !== undefined && customRate > 0 && customRate <= 1) {
    logger.debug('Using custom usage rate:', { customRate, businessType });
    return customRate;
  }

  // Gunakan rate berdasarkan jenis bisnis
  const rate = DEFAULT_USAGE_RATES[businessType as keyof UsageRateConfig] || DEFAULT_USAGE_RATES.default;
  
  logger.debug('Using business-specific usage rate:', { businessType, rate });
  return rate;
}

/**
 * Utility untuk mendapatkan threshold validasi berdasarkan jenis bisnis
 */
export function getValidationThresholds(
  businessType: BusinessType | string = BusinessType.DEFAULT
): BusinessValidationThresholds {
  // Cari threshold yang sesuai, fallback ke default
  const thresholds = BUSINESS_THRESHOLDS[businessType] || BUSINESS_THRESHOLDS.default;
  
  logger.debug('Using business-specific validation thresholds:', { businessType, thresholds });
  return thresholds;
}

/**
 * Utility untuk mendeteksi jenis bisnis F&B berdasarkan data transaksi
 */
export function detectBusinessType(
  transactions: Array<{ category?: string; description?: string }>
): BusinessType {
  const categories = transactions.map(t => 
    (t.category || t.description || '').toLowerCase()
  ).join(' ');

  // Deteksi berdasarkan keyword F&B
  if (categories.includes('makanan') || categories.includes('minuman') || 
      categories.includes('food') || categories.includes('beverage')) {
    
    // Deteksi sub-kategori F&B
    if (categories.includes('kafe') || categories.includes('cafe') || categories.includes('coffee')) {
      return BusinessType.FNB_CAFE;
    }
    
    if (categories.includes('katering') || categories.includes('catering')) {
      return BusinessType.FNB_CATERING;
    }
    
    if (categories.includes('roti') || categories.includes('bakery') || categories.includes('kue')) {
      return BusinessType.FNB_BAKERY;
    }
    
    if (categories.includes('fast') || categories.includes('cepat') || categories.includes('drive')) {
      return BusinessType.FNB_FASTFOOD;
    }
    
    if (categories.includes('kaki lima') || categories.includes('street') || categories.includes('warung')) {
      return BusinessType.FNB_STREETFOOD;
    }
    
    // Default ke restaurant jika F&B tapi tidak spesifik
    return BusinessType.FNB_RESTAURANT;
  }

  logger.debug('Could not detect F&B business type, using default');
  return BusinessType.DEFAULT;
}

/**
 * Interface untuk konfigurasi profit analysis yang lengkap
 */
export interface ProfitAnalysisConfig {
  businessType: BusinessType;
  usageRate: number;
  validationThresholds: BusinessValidationThresholds;
  autoDetectBusinessType: boolean;
  customUsageRate?: number;
}

/**
 * Factory function untuk membuat konfigurasi profit analysis
 */
export function createProfitAnalysisConfig(
  businessType?: BusinessType | string,
  customUsageRate?: number,
  autoDetect: boolean = true
): ProfitAnalysisConfig {
  const finalBusinessType = businessType as BusinessType || BusinessType.DEFAULT;
  
  return {
    businessType: finalBusinessType,
    usageRate: getUsageRateForBusiness(finalBusinessType, customUsageRate),
    validationThresholds: getValidationThresholds(finalBusinessType),
    autoDetectBusinessType: autoDetect,
    customUsageRate
  };
}