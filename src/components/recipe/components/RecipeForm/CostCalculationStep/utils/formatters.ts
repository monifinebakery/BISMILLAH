// src/components/recipe/components/RecipeForm/CostCalculationStep/utils/formatters.ts

/**
 * Format currency to Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }

  return `${value.toLocaleString('id-ID', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 1 
  })}%`;
};

/**
 * Format number with Indonesian locale
 */
export const formatNumber = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }

  return value.toLocaleString('id-ID');
};

/**
 * Get profitability color classes
 */
export const getProfitabilityColors = (level: 'high' | 'medium' | 'low') => {
  const colorMap = {
    high: {
      text: 'text-green-700',
      bg: 'bg-green-100', 
      border: 'border-green-300',
      badge: 'bg-green-100 text-green-900 border-green-300'
    },
    medium: {
      text: 'text-yellow-700',
      bg: 'bg-yellow-100',
      border: 'border-yellow-300', 
      badge: 'bg-yellow-100 text-yellow-900 border-yellow-300'
    },
    low: {
      text: 'text-red-700',
      bg: 'bg-red-100',
      border: 'border-red-300',
      badge: 'bg-red-100 text-red-900 border-red-300'
    }
  };

  return colorMap[level];
};

/**
 * Get profitability label
 */
export const getProfitabilityLabel = (level: 'high' | 'medium' | 'low'): string => {
  const labelMap = {
    high: 'Sangat Menguntungkan',
    medium: 'Cukup Menguntungkan', 
    low: 'Perlu Peningkatan'
  };

  return labelMap[level];
};

/**
 * Get profitability recommendations
 */
export const getProfitabilityRecommendations = (level: 'high' | 'medium' | 'low'): string[] => {
  const recommendationMap = {
    high: [
      'Margin sangat baik untuk sustainability',
      'Pertimbangkan untuk ekspansi produksi',
      'Monitor kompetitor untuk positioning'
    ],
    medium: [
      'Cari cara untuk efisiensi biaya bahan',
      'Pertimbangkan optimasi proses produksi', 
      'Evaluasi harga jual di pasar'
    ],
    low: [
      'Tingkatkan margin minimal ke 15%',
      'Review harga supplier dan bahan alternatif',
      'Pertimbangkan menaikkan harga jual'
    ]
  };

  return recommendationMap[level];
};

/**
 * Format time greeting
 */
export const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 4 && hour < 11) return 'pagi';
  if (hour >= 11 && hour < 15) return 'siang'; 
  if (hour >= 15 && hour < 19) return 'sore';
  return 'malam';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate random ID for components
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};