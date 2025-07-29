// 🛠️ utils/promoUtils.js - Promo calculation utilities (JavaScript version)

/**
 * 📊 Calculate promo result based on type and parameters
 * @param {Object} params - Calculation parameters
 * @param {string} params.promoType - Type of promo
 * @param {number} params.discountValue - Discount value
 * @param {number} params.bogoBuy - BOGO buy quantity
 * @param {number} params.bogoGet - BOGO get quantity
 * @param {number} params.originalPrice - Original price
 * @param {number} params.originalHpp - Original HPP
 * @returns {Object|null} Calculation result
 */
export const calculatePromoResult = (params) => {
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
 * @param {Array} items - Array of items to paginate
 * @param {number} currentPage - Current page number
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination result
 */
export const calculatePagination = (items, currentPage, itemsPerPage) => {
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
 * @param {string} promoType - Type of promo
 * @returns {Object} Display information
 */
export const getPromoTypeInfo = (promoType) => {
  const promoTypes = {
    'discount_percent': {
      label: 'Diskon Persentase (%)',
      icon: 'Percent',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    'discount_rp': {
      label: 'Diskon Nominal (Rp)',
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
 * @param {string} promoName - Name of the promo
 * @param {Object} selectedRecipe - Selected recipe object
 * @param {Object|null} promoResult - Calculation result
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePromoForm = (promoName, selectedRecipe, promoResult) => {
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
 * @param {string} promoType - Type of promo
 * @param {Object} details - Promo details
 * @returns {string} Formatted string
 */
export const formatPromoDetails = (promoType, details) => {
  try {
    switch (promoType) {
      case 'discount_percent':
        return `${details.value}% diskon`;
      case 'discount_rp':
        return `Rp ${details.value.toLocaleString('id-ID')} potongan`;
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