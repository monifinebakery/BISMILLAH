// 🛠️ utils/promoUtils.ts - Promo calculation utilities (TypeScript version)
import { formatCurrency } from '@/lib/shared/formatters';

interface CalculatePromoParams {
  promoType: string;
  discountValue?: number;
  bogoBuy?: number;
  bogoGet?: number;
  originalPrice: number;
  originalHpp: number;
}

interface PromoResult {
  price: number;
  marginRp: number;
  marginPercent: number;
  details: any;
  isNegativeMargin: boolean;
}

interface PromoTypeInfo {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 📊 Calculate promo result based on type and parameters
 */
export const calculatePromoResult = (params: CalculatePromoParams): PromoResult | null => {
  const { promoType, discountValue, bogoBuy, bogoGet, originalPrice, originalHpp } = params;
  
  if (originalPrice <= 0) return null;

  let price = 0;
  let details = {};
  
  try {
    switch (promoType) {
      case 'discount_percent': {
        const discPercent = Math.min(100, Math.max(0, discountValue || 0));
        price = originalPrice * (1 - (discPercent / 100));
        details = { type: '%', value: discPercent };
        break;
      }
      case 'discount_rp': {
        const discRp = Math.max(0, discountValue || 0);
        price = Math.max(0, originalPrice - discRp);
        details = { type: 'Rp', value: discRp };
        break;
      }
      case 'bogo': {
        const buy = Math.max(1, bogoBuy || 1);
        const get = Math.max(0, bogoGet || 0);
        price = buy === 0 ? 0 : (originalPrice * buy) / (buy + get);
        details = { buy, get };
        break;
      }
      default:
        return null;
    }

    const marginRp = price - originalHpp;
    const marginPercent = price > 0 ? (marginRp / price) : 0;

    return { 
      price: Math.max(0, price), 
      marginRp, 
      marginPercent, 
      details,
      isNegativeMargin: marginPercent < 0
    };
  } catch (error) {
    console.error('Error calculating promo result:', error);
    return null;
  }
};

/**
 * 📄 Calculate pagination data
 */
export const calculatePagination = (items: any[], currentPage: number, itemsPerPage: number) => {
  const safeItems = Array.isArray(items) ? items : [];
  const totalPages = Math.ceil(safeItems.length / itemsPerPage);
  const start = Math.max(0, (currentPage - 1) * itemsPerPage);
  const paginatedPromos = safeItems.slice(start, start + itemsPerPage);
  
  return { 
    totalPages: Math.max(1, totalPages), 
    paginatedPromos, 
    total: safeItems.length,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * 🎨 Get promo type display info
 */
export const getPromoTypeInfo = (promoType: string, currencySymbol?: string): PromoTypeInfo => {
  const promoTypes = {
    'discount_percent': {
      label: 'Diskon Persentase (%)',
      icon: 'Percent',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    'discount_rp': {
      label: `Diskon Nominal (${currencySymbol || 'Rp'})`,
      icon: 'TrendingDown',
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    },
    'bogo': {
      label: 'Beli X Gratis Y (BOGO)',
      icon: 'Gift',
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    }
  };
  
  return promoTypes[promoType] || promoTypes['discount_percent'];
};

/**
 * ✅ Validate promo form data
 */
export const validatePromoForm = (promoName: string, selectedRecipe: any, promoResult: PromoResult | null): ValidationResult => {
  const errors = [];

  if (!promoName || !promoName.trim()) {
    errors.push('Nama promo wajib diisi');
  }

  if (!selectedRecipe) {
    errors.push('Pilih produk terlebih dahulu');
  }

  if (!promoResult) {
    errors.push('Kalkulasi promo tidak valid');
  }

  if (promoResult && promoResult.isNegativeMargin) {
    errors.push('Margin negatif - promo akan menyebabkan kerugian');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 📊 Format promo details for display
 */
export const formatPromoDetails = (promoType: string, details: any): string => {
  try {
    switch (promoType) {
      case 'discount_percent':
        return `${details.value}% diskon`;
      case 'discount_rp':
        return `${formatCurrency(details.value)} potongan`;
      case 'bogo':
        return `Beli ${details.buy} Gratis ${details.get}`;
      default:
        return 'Promo tidak dikenal';
    }
  } catch (error) {
    return 'Format tidak valid';
  }
};

/**
 * 🎯 Generate unique key for React lists
 * @param {string} prefix - Key prefix
 * @param {string} id - Item ID
 * @param {number} index - Item index
 * @returns {string} Unique key
 */
export const generatePromoKey = (prefix, id, index) => {
  return `${prefix}_${id || index}_${Date.now()}`;
};

/**
 * 📈 Calculate savings amount
 * @param {number} originalPrice - Original price
 * @param {number} promoPrice - Promo price
 * @returns {number} Savings amount
 */
export const calculateSavings = (originalPrice, promoPrice) => {
  return Math.max(0, originalPrice - promoPrice);
};

/**
 * 📊 Calculate savings percentage
 * @param {number} originalPrice - Original price
 * @param {number} promoPrice - Promo price
 * @returns {number} Savings percentage
 */
export const calculateSavingsPercent = (originalPrice, promoPrice) => {
  if (originalPrice <= 0) return 0;
  return ((originalPrice - promoPrice) / originalPrice) * 100;
};

// Export all functions as default object for convenience
export default {
  calculatePromoResult,
  calculatePagination,
  getPromoTypeInfo,
  validatePromoForm,
  formatPromoDetails,
  generatePromoKey,
  calculateSavings,
  calculateSavingsPercent
};