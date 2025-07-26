import { formatters } from './formatters';
import { PROMO_TYPES, STATUS_COLORS, PROMO_TYPE_COLORS } from '../constants';

export const helpers = {
  // Generate unique ID
  generateId: (prefix = 'promo') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get status color configuration
  getStatusColor: (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.draft;
  },

  // Get promo type color configuration
  getPromoTypeColor: (type) => {
    return PROMO_TYPE_COLORS[type] || PROMO_TYPE_COLORS.discount;
  },

  // Calculate profit margin safety level
  getMarginSafetyLevel: (margin) => {
    if (margin < 0) return 'danger';
    if (margin < 10) return 'warning';
    if (margin < 20) return 'caution';
    return 'safe';
  },

  // Get margin safety color
  getMarginSafetyColor: (margin) => {
    const level = helpers.getMarginSafetyLevel(margin);
    const colors = {
      danger: 'text-red-600',
      warning: 'text-orange-600',
      caution: 'text-yellow-600',
      safe: 'text-green-600'
    };
    return colors[level];
  },

  // Format promo summary for display
  formatPromoSummary: (promo) => {
    const calculation = promo.calculationResult || promo.calculation_result;
    
    return {
      id: promo.id,
      name: promo.namaPromo || promo.nama_promo,
      type: promo.tipePromo || promo.tipe_promo,
      status: promo.status,
      normalPrice: calculation?.normalPrice || 0,
      promoPrice: calculation?.promoPrice || 0,
      normalMargin: calculation?.normalMargin || 0,
      promoMargin: calculation?.promoMargin || 0,
      savings: calculation?.savings || 0,
      createdAt: promo.createdAt || promo.created_at,
      description: promo.deskripsi
    };
  },

  // Sort promos by various criteria
  sortPromos: (promos, sortBy, sortOrder = 'desc') => {
    const sortedPromos = [...promos].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = (a.namaPromo || a.nama_promo || '').toLowerCase();
          bValue = (b.namaPromo || b.nama_promo || '').toLowerCase();
          break;
        case 'type':
          aValue = a.tipePromo || a.tipe_promo;
          bValue = b.tipePromo || b.tipe_promo;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'margin':
          aValue = a.calculationResult?.promoMargin || a.calculation_result?.promoMargin || 0;
          bValue = b.calculationResult?.promoMargin || b.calculation_result?.promoMargin || 0;
          break;
        case 'created':
        default:
          aValue = new Date(a.createdAt || a.created_at);
          bValue = new Date(b.createdAt || b.created_at);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedPromos;
  },

  // Filter promos by criteria
  filterPromos: (promos, filters) => {
    return promos.filter(promo => {
      // Filter by status
      if (filters.status && promo.status !== filters.status) {
        return false;
      }

      // Filter by type
      if (filters.type && (promo.tipePromo || promo.tipe_promo) !== filters.type) {
        return false;
      }

      // Filter by search query
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const name = (promo.namaPromo || promo.nama_promo || '').toLowerCase();
        const description = (promo.deskripsi || '').toLowerCase();
        
        if (!name.includes(searchLower) && !description.includes(searchLower)) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        const promoDate = new Date(promo.createdAt || promo.created_at);
        
        if (filters.dateFrom && promoDate < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && promoDate > new Date(filters.dateTo + 'T23:59:59')) {
          return false;
        }
      }

      return true;
    });
  },

  // Paginate array
  paginate: (array, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: array.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: array.length,
        totalPages: Math.ceil(array.length / pageSize),
        hasNextPage: endIndex < array.length,
        hasPreviousPage: page > 1
      }
    };
  },

  // Debounce function
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Deep clone object
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(helpers.deepClone);
    
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = helpers.deepClone(obj[key]);
    });
    
    return cloned;
  },

  // Check if object is empty
  isEmpty: (obj) => {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    if (typeof obj === 'string') return obj.trim().length === 0;
    return false;
  },

  // Generate analytics summary
  generateAnalyticsSummary: (promos) => {
    if (!promos || promos.length === 0) {
      return {
        totalPromos: 0,
        activePromos: 0,
        averageMargin: 0,
        totalSavings: 0,
        promosByType: {}
      };
    }

    const activePromos = promos.filter(p => p.status === 'aktif');
    const margins = promos
      .map(p => p.calculationResult?.promoMargin || p.calculation_result?.promoMargin || 0)
      .filter(m => m > 0);
    
    const totalSavings = promos.reduce((sum, p) => {
      const savings = p.calculationResult?.savings || p.calculation_result?.savings || 0;
      return sum + savings;
    }, 0);

    const promosByType = promos.reduce((acc, promo) => {
      const type = promo.tipePromo || promo.tipe_promo;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPromos: promos.length,
      activePromos: activePromos.length,
      averageMargin: margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0,
      totalSavings,
      promosByType
    };
  },

  // Format chart data for analytics
  formatChartData: (promos) => {
    return promos.map(promo => {
      const calc = promo.calculationResult || promo.calculation_result || {};
      return {
        name: helpers.truncateText(promo.namaPromo || promo.nama_promo || 'Unnamed', 15),
        hpp: calc.promoHpp || 0,
        hargaJual: calc.promoPrice || 0,
        normalMargin: calc.normalMargin || 0,
        promoMargin: calc.promoMargin || 0,
        date: formatters.date(promo.createdAt || promo.created_at)
      };
    });
  },

  // Truncate text with ellipsis
  truncateText: (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Calculate percentage change
  calculatePercentageChange: (oldValue, newValue) => {
    if (!oldValue || oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  },

  // Get trend direction
  getTrendDirection: (percentageChange) => {
    if (percentageChange > 0) return 'up';
    if (percentageChange < 0) return 'down';
    return 'stable';
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number format (Indonesian)
  isValidPhone: (phone) => {
    const phoneRegex = /^(\+62|62|0)[2-9]\d{7,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Format phone number
  formatPhone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('62')) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '+62' + cleaned.substring(1);
    }
    return '+62' + cleaned;
  }
};