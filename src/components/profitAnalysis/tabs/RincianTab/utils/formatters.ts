// src/components/profitAnalysis/tabs/RincianTab/utils/formatters.ts

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('id-ID').format(value);
};

export const formatRatio = (numerator: number, denominator: number): string => {
  if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return '0:1';
  }
  
  const ratio = numerator / denominator;
  return `${ratio.toFixed(2)}:1`;
};

export const formatCompactCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1e9) {
    return `Rp ${(amount / 1e9).toFixed(1)}M`;
  } else if (absAmount >= 1e6) {
    return `Rp ${(amount / 1e6).toFixed(1)}Jt`;
  } else if (absAmount >= 1e3) {
    return `Rp ${(amount / 1e3).toFixed(1)}K`;
  }
  
  return formatCurrency(amount);
};

export const formatDataSource = (dataSource: string): string => {
  const mapping = {
    'actual': 'Aktual',
    'estimated': 'Estimasi',
    'mixed': 'Campuran'
  };
  
  return mapping[dataSource as keyof typeof mapping] || dataSource;
};

export const formatAllocationMethod = (method: string): string => {
  const mapping = {
    'activity_based': 'Activity-Based',
    'direct_allocation': 'Direct Allocation',
    'percentage_based': 'Percentage-Based',
    'unit_based': 'Unit-Based'
  };
  
  return mapping[method as keyof typeof mapping] || method;
};

export const formatCostType = (type: string): string => {
  const mapping = {
    'tetap': 'Tetap',
    'variabel': 'Variabel',
    'semi_variabel': 'Semi Variabel'
  };
  
  return mapping[type as keyof typeof mapping] || type;
};

export const formatUsageType = (type: string): string => {
  const mapping = {
    'production': 'Produksi',
    'sale': 'Penjualan',
    'adjustment': 'Penyesuaian',
    'waste': 'Waste'
  };
  
  return mapping[type as keyof typeof mapping] || type;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};

export const formatMaterialId = (materialId: string): string => {
  // Format material ID for display
  if (materialId.length > 8) {
    return `${materialId.substring(0, 8)}...`;
  }
  
  return materialId;
};