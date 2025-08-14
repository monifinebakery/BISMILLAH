import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { PROFIT_CONSTANTS } from '../constants';

// Interfaces matching the actual schema
interface FinancialTransactionActual {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string | null;
  amount: number | null;
  description: string | null;
  date: string | null; // TIMESTAMPTZ as string
  created_at: string;
  updated_at: string;
  notes: string | null;
  related_id: string | null;
}

interface BahanBakuActual {
  id: string;
  user_id: string;
  nama: string | null;
  kategori: string | null;
  stok: number | null;
  satuan: string | null;
  minimum: number | null;
  harga_satuan: number | null;
  supplier: string | null;
  tanggal_kadaluwarsa: string | null;
  created_at: string;
  updated_at: string;
  jumlah_beli_kemasan: number | null;
  satuan_kemasan: string | null;
  harga_total_beli_kemasan: number | null;
  isi_per_kemasan: number | null;
}

interface OperationalCostActual {
  id: string;
  user_id: string;
  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: 'tetap' | 'variabel';
  status: 'aktif' | 'nonaktif';
  created_at: string;
  updated_at: string;
  cost_category: string | null;
}

/**
 * Calculate real-time profit analysis with actual schema
 */
export const calculateRealTimeProfit = (
  period: string,
  transactions: FinancialTransactionActual[],
  materials: BahanBakuActual[],
  operationalCosts: OperationalCostActual[]
): RealTimeProfitCalculation => {
  const periodTransactions = filterTransactionsByPeriod(transactions, period);
  
  const revenueTransactions = periodTransactions.filter(t => t.type === 'income');
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const cogsTransactions = periodTransactions.filter(t => 
    t.type === 'expense' && (
      (t.category && (
        t.category.toLowerCase().includes('bahan baku') ||
        t.category.toLowerCase().includes('material') ||
        t.category.toLowerCase().includes('pembelian')
      )) ||
      (t.description && (
        t.description.toLowerCase().includes('bahan baku') ||
        t.description.toLowerCase().includes('material')
      ))
    )
  );
  const totalCOGS = cogsTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  const totalOpEx = activeCosts.reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
  
  const enhancedRevenueTransactions = revenueTransactions.map(t => ({
    category: t.category || 'Uncategorized',
    amount: Number(t.amount) || 0,
    description: t.description || '',
    date: t.date,
    id: t.id
  }));

  const enhancedCOGSTransactions = cogsTransactions.map(t => ({
    name: extractMaterialName(t.description || t.category || 'Material Cost'),
    cost: Number(t.amount) || 0,
    category: t.category || 'Direct Material',
    date: t.date,
    id: t.id
  }));

  const enhancedOpExCosts = activeCosts.map(c => ({
    nama_biaya: c.nama_biaya,
    jumlah_per_bulan: Number(c.jumlah_per_bulan),
    jenis: c.jenis,
    cost_category: c.cost_category || 'general',
    id: c.id
  }));
  
  return {
    period,
    revenue_data: {
      total: totalRevenue,
      transactions: enhancedRevenueTransactions
    },
    cogs_data: {
      total: totalCOGS,
      materials: enhancedCOGSTransactions
    },
    opex_data: {
      total: totalOpEx,
      costs: enhancedOpExCosts
    },
    calculated_at: new Date().toISOString()
  };
};

/**
 * Calculate profit margins with validation
 */
export const calculateMargins = (revenue: number, cogs: number, opex: number) => {
  const validRevenue = Math.max(0, Number(revenue) || 0);
  const validCOGS = Math.max(0, Number(cogs) || 0);
  const validOpEx = Math.max(0, Number(opex) || 0);
  
  const grossProfit = validRevenue - validCOGS;
  const netProfit = grossProfit - validOpEx;
  
  const grossMargin = validRevenue > 0 ? (grossProfit / validRevenue) * 100 : 0;
  const netMargin = validRevenue > 0 ? (netProfit / validRevenue) * 100 : 0;
  
  return {
    grossProfit,
    netProfit,
    grossMargin,
    netMargin,
    cogsPercentage: validRevenue > 0 ? (validCOGS / validRevenue) * 100 : 0,
    opexPercentage: validRevenue > 0 ? (validOpEx / validRevenue) * 100 : 0,
    totalCostPercentage: validRevenue > 0 ? ((validCOGS + validOpEx) / validRevenue) * 100 : 0
  };
};

/**
 * Filter transactions by period with timezone handling
 */
export const filterTransactionsByPeriod = (
  transactions: FinancialTransactionActual[], 
  period: string
): FinancialTransactionActual[] => {
  return transactions.filter(t => {
    if (!t.date) return false;
    
    try {
      const transactionDate = new Date(t.date);
      const transactionPeriod = transactionDate.toISOString().slice(0, 7);
      return transactionPeriod === period;
    } catch (error) {
      console.warn('Invalid date format:', t.date);
      return false;
    }
  });
};

/**
 * Get margin rating based on thresholds
 */
export const getMarginRating = (margin: number, type: 'gross' | 'net'): string => {
  const thresholds = PROFIT_CONSTANTS.MARGIN_THRESHOLDS;
  
  if (margin >= thresholds.EXCELLENT[type] * 100) return 'excellent';
  if (margin >= thresholds.GOOD[type] * 100) return 'good';  
  if (margin >= thresholds.FAIR[type] * 100) return 'fair';
  return 'poor';
};

/**
 * Extract material name from transaction description
 */
export const extractMaterialName = (description: string): string => {
  if (!description) return 'Unknown Material';
  
  const patterns = [
    /(?:beli|pembelian|bahan)\s+(.+)/i,
    /(.+?)(?:\s+(?:kg|gram|liter|ml|pcs|dus|pak))/i,
    /material\s+(.+)/i,
    /(.+?)(?:\s+untuk)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return description.split(' ').slice(0, 3).join(' ') || 'Material';
};

/**
 * Calculate inventory-based COGS
 */
export const calculateInventoryBasedCOGS = (
  materials: BahanBakuActual[],
  usageData?: { materialId: string; quantityUsed: number }[]
): { totalCOGS: number; breakdown: any[] } => {
  if (!usageData || usageData.length === 0) {
    const totalInventoryValue = materials.reduce((sum, m) => {
      const stock = Number(m.stok) || 0;
      const price = Number(m.harga_satuan) || 0;
      return sum + (stock * price);
    }, 0);
    
    return {
      totalCOGS: totalInventoryValue * 0.1,
      breakdown: materials.map(m => ({
        material_name: m.nama || 'Unknown',
        estimated_usage: (Number(m.stok) || 0) * 0.1,
        unit_price: Number(m.harga_satuan) || 0,
        total_cost: ((Number(m.stok) || 0) * 0.1) * (Number(m.harga_satuan) || 0),
        percentage: 0
      }))
    };
  }
  
  const breakdown = usageData.map(usage => {
    const material = materials.find(m => m.id === usage.materialId);
    if (!material) return null;
    
    const unitPrice = Number(material.harga_satuan) || 0;
    const totalCost = usage.quantityUsed * unitPrice;
    
    return {
      material_name: material.nama || 'Unknown',
      quantity_used: usage.quantityUsed,
      unit_price: unitPrice,
      total_cost: totalCost,
      percentage: 0
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);
  
  const totalCOGS = breakdown.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  
  breakdown.forEach(item => {
    if (totalCOGS > 0) {
      item.percentage = (item.total_cost / totalCOGS) * 100;
    }
  });
  
  return { totalCOGS, breakdown };
};

/**
 * Analyze cost structure
 */
export const analyzeCostStructure = (
  operationalCosts: OperationalCostActual[]
): {
  fixedCosts: number;
  variableCosts: number;
  totalCosts: number;
  fixedCostRatio: number;
  variableCostRatio: number;
  costsByCategory: Record<string, number>;
} => {
  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  
  const fixedCosts = activeCosts
    .filter(c => c.jenis === 'tetap')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
    
  const variableCosts = activeCosts
    .filter(c => c.jenis === 'variabel')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
    
  const totalCosts = fixedCosts + variableCosts;
  
  const costsByCategory = activeCosts.reduce((acc, cost) => {
    const category = cost.cost_category || 'general';
    acc[category] = (acc[category] || 0) + Number(cost.jumlah_per_bulan);
    return acc;
  }, {} as Record<string, number>);
  
  return {
    fixedCosts,
    variableCosts,
    totalCosts,
    fixedCostRatio: totalCosts > 0 ? (fixedCosts / totalCosts) * 100 : 0,
    variableCostRatio: totalCosts > 0 ? (variableCosts / totalCosts) * 100 : 0,
    costsByCategory
  };
};

/**
 * Calculate break-even analysis
 */
export const calculateBreakEvenAnalysis = (
  fixedCosts: number,
  variableCostPercentage: number,
  averageSellingPrice?: number,
  targetUnits?: number
): {
  breakEvenRevenue: number;
  breakEvenUnits: number;
  contributionMarginPercentage: number;
  marginOfSafety: number;
} => {
  const contributionMarginPercentage = 100 - variableCostPercentage;
  const breakEvenRevenue = contributionMarginPercentage > 0 
    ? (fixedCosts / contributionMarginPercentage) * 100
    : 0;
    
  const breakEvenUnits = averageSellingPrice && averageSellingPrice > 0
    ? breakEvenRevenue / averageSellingPrice
    : 0;
    
  const marginOfSafety = targetUnits && breakEvenUnits > 0
    ? ((targetUnits - breakEvenUnits) / targetUnits) * 100
    : 0;
  
  return {
    breakEvenRevenue,
    breakEvenUnits,
    contributionMarginPercentage,
    marginOfSafety
  };
};

/**
 * Compare periods for trend analysis
 */
export const comparePeriods = (
  currentPeriod: RealTimeProfitCalculation,
  previousPeriod: RealTimeProfitCalculation | null
): {
  revenueGrowth: number;
  profitGrowth: number;
  marginChange: number;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
} => {
  if (!previousPeriod) {
    return {
      revenueGrowth: 0,
      profitGrowth: 0,
      marginChange: 0,
      trend: 'stable',
      insights: ['Tidak ada data periode sebelumnya untuk perbandingan']
    };
  }
  
  const currentRevenue = currentPeriod.revenue_data.total;
  const previousRevenue = previousPeriod.revenue_data.total;
  const revenueGrowth = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  const currentProfit = currentRevenue - currentPeriod.cogs_data.total - currentPeriod.opex_data.total;
  const previousProfit = previousRevenue - previousPeriod.cogs_data.total - previousPeriod.opex_data.total;
  const profitGrowth = previousProfit !== 0 
    ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 
    : 0;

  const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
  const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
  const marginChange = currentMargin - previousMargin;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (profitGrowth > 5) trend = 'improving';
  else if (profitGrowth < -5) trend = 'declining';

  const insights: string[] = [];
  
  if (revenueGrowth > 10) insights.push('Revenue mengalami pertumbuhan yang kuat');
  else if (revenueGrowth < -10) insights.push('Revenue mengalami penurunan signifikan');
  
  if (marginChange > 2) insights.push('Margin profit meningkat');
  else if (marginChange < -2) insights.push('Margin profit menurun');
  
  if (trend === 'improving') insights.push('Tren profit menunjukkan perbaikan');
  else if (trend === 'declining') insights.push('Tren profit memerlukan perhatian');

  return {
    revenueGrowth,
    profitGrowth,
    marginChange,
    trend,
    insights
  };
};

/**
 * Validate data quality
 */
export const validateDataQuality = (
  calculation: RealTimeProfitCalculation
): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (calculation.revenue_data.total <= 0) {
    score -= 30;
    issues.push('Tidak ada data revenue');
    recommendations.push('Tambahkan transaksi pemasukan');
  } else if (calculation.revenue_data.transactions.length === 0) {
    score -= 10;
    issues.push('Data revenue tidak memiliki breakdown detail');
    recommendations.push('Pastikan transaksi memiliki kategori yang jelas');
  }
  
  if (calculation.cogs_data.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data COGS');
    recommendations.push('Tambahkan transaksi pembelian bahan baku');
  }
  
  if (calculation.opex_data.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data biaya operasional');
    recommendations.push('Konfigurasi biaya operasional di menu operational costs');
  }
  
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  
  if (cogs > revenue) {
    score -= 15;
    issues.push('COGS lebih besar dari revenue (tidak wajar)');
    recommendations.push('Review kategorisasi transaksi expense');
  }
  
  if (opex > revenue * 0.8) {
    score -= 10;
    issues.push('Biaya operasional terlalu tinggi (>80% revenue)');
    recommendations.push('Review efisiensi biaya operasional');
  }
  
  const netProfit = revenue - cogs - opex;
  if (netProfit < 0 && Math.abs(netProfit) > revenue * 0.2) {
    score -= 10;
    issues.push('Kerugian signifikan (>20% revenue)');
    recommendations.push('Fokus pada optimasi biaya dan peningkatan revenue');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

/**
 * Generate executive insights
 */
export const generateExecutiveInsights = (
  calculation: RealTimeProfitCalculation,
  previousCalculation?: RealTimeProfitCalculation
): {
  keyHighlights: string[];
  criticalIssues: string[];
  opportunities: string[];
  recommendedActions: string[];
} => {
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  const keyHighlights: string[] = [];
  const criticalIssues: string[] = [];
  const opportunities: string[] = [];
  const recommendedActions: string[] = [];
  
  if (revenue > 0) {
    keyHighlights.push(`Revenue: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(revenue)}`);
  } else {
    criticalIssues.push('Tidak ada revenue dalam periode ini');
    recommendedActions.push('Fokus pada aktivitas penjualan dan marketing');
  }
  
  if (grossMargin >= 50) {
    keyHighlights.push(`Gross margin sangat baik: ${grossMargin.toFixed(1)}%`);
  } else if (grossMargin >= 30) {
    keyHighlights.push(`Gross margin sehat: ${grossMargin.toFixed(1)}%`);
  } else if (grossMargin >= 15) {
    opportunities.push(`Gross margin dapat ditingkatkan dari ${grossMargin.toFixed(1)}%`);
    recommendedActions.push('Review harga jual dan efisiensi produksi');
  } else {
    criticalIssues.push(`Gross margin rendah: ${grossMargin.toFixed(1)}%`);
    recommendedActions.push('Urgent: optimasi COGS dan review pricing strategy');
  }
  
  if (netMargin >= 20) {
    keyHighlights.push(`Net margin excellent: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 10) {
    keyHighlights.push(`Net margin baik: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 5) {
    opportunities.push(`Net margin dapat ditingkatkan dari ${netMargin.toFixed(1)}%`);
    recommendedActions.push('Optimasi biaya operasional');
  } else if (netMargin < 0) {
    criticalIssues.push(`Bisnis mengalami kerugian: ${netMargin.toFixed(1)}%`);
    recommendedActions.push('Action plan recovery: reduce costs, increase sales');
  } else {
    criticalIssues.push(`Net margin sangat rendah: ${netMargin.toFixed(1)}%`);
    recommendedActions.push('Review struktur biaya dan strategi pricing');
  }
  
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const opexPercentage = revenue > 0 ? (opex / revenue) * 100 : 0;
  
  if (cogsPercentage > 70) {
    criticalIssues.push(`COGS terlalu tinggi: ${cogsPercentage.toFixed(1)}% dari revenue`);
    recommendedActions.push('Review supplier dan proses produksi');
  } else if (cogsPercentage > 50) {
    opportunities.push(`COGS dapat dioptimasi: ${cogsPercentage.toFixed(1)}% dari revenue`);
  }
  
  if (opexPercentage > 40) {
    criticalIssues.push(`Biaya operasional tinggi: ${opexPercentage.toFixed(1)}% dari revenue`);
    recommendedActions.push('Audit dan streamline operasional expenses');
  } else if (opexPercentage > 25) {
    opportunities.push(`Efisiensi operasional dapat ditingkatkan: ${opexPercentage.toFixed(1)}%`);
  }
  
  if (previousCalculation) {
    const comparison = comparePeriods(calculation, previousCalculation);
    
    if (comparison.revenueGrowth > 15) {
      keyHighlights.push(`Revenue growth sangat baik: +${comparison.revenueGrowth.toFixed(1)}%`);
    } else if (comparison.revenueGrowth > 5) {
      keyHighlights.push(`Revenue growth positif: +${comparison.revenueGrowth.toFixed(1)}%`);
    } else if (comparison.revenueGrowth < -10) {
      criticalIssues.push(`Revenue menurun signifikan: ${comparison.revenueGrowth.toFixed(1)}%`);
      recommendedActions.push('Analisis penyebab penurunan dan action plan recovery');
    }
    
    if (comparison.trend === 'improving') {
      keyHighlights.push('Tren profit menunjukkan perbaikan');
    } else if (comparison.trend === 'declining') {
      criticalIssues.push('Tren profit menurun');
      recommendedActions.push('Identifikasi faktor penyebab penurunan profit');
    }
  }
  
  if (netProfit > 0 && grossMargin > 30 && netMargin > 10) {
    opportunities.push('Bisnis dalam kondisi sehat, siap untuk ekspansi');
    recommendedActions.push('Pertimbangkan investasi untuk growth');
  } else if (netProfit > 0) {
    opportunities.push('Bisnis profitable, fokus pada peningkatan efisiensi');
  }
  
  const dataQuality = validateDataQuality(calculation);
  if (dataQuality.score < 70) {
    opportunities.push('Tingkatkan kualitas data untuk analisis yang lebih akurat');
    recommendedActions.push('Lengkapi data transaksi dan kategorisasi');
  }
  
  return {
    keyHighlights,
    criticalIssues,
    opportunities,
    recommendedActions
  };
};

/**
 * Format currency for Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage with proper rounding
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate rolling averages for trend analysis
 */
export const calculateRollingAverages = (
  history: RealTimeProfitCalculation[],
  periods: number = 3
): {
  revenueAverage: number;
  profitAverage: number;
  marginAverage: number;
  volatility: number;
} => {
  if (history.length < periods) {
    return {
      revenueAverage: 0,
      profitAverage: 0,
      marginAverage: 0,
      volatility: 0
    };
  }
  
  const recentHistory = history.slice(-periods);
  
  const revenues = recentHistory.map(h => h.revenue_data.total);
  const profits = recentHistory.map(h => {
    const revenue = h.revenue_data.total;
    const costs = h.cogs_data.total + h.opex_data.total;
    return revenue - costs;
  });
  const margins = recentHistory.map(h => {
    const revenue = h.revenue_data.total;
    const profit = revenue - h.cogs_data.total - h.opex_data.total;
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  });
  
  const revenueAverage = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
  const profitAverage = profits.reduce((sum, p) => sum + p, 0) / profits.length;
  const marginAverage = margins.reduce((sum, m) => sum + m, 0) / margins.length;
  
  const profitMean = profitAverage;
  const variance = profits.reduce((sum, p) => sum + Math.pow(p - profitMean, 2), 0) / profits.length;
  const volatility = Math.sqrt(variance);
  
  return {
    revenueAverage,
    profitAverage,
    marginAverage,
    volatility
  };
};

// Export semua fungsi
export {
  calculateRealTimeProfit,
  calculateMargins,
  filterTransactionsByPeriod,
  getMarginRating,
  extractMaterialName,
  calculateInventoryBasedCOGS,
  analyzeCostStructure,
  calculateBreakEvenAnalysis,
  comparePeriods,
  validateDataQuality,
  generateExecutiveInsights,
  formatCurrency,
  formatPercentage,
  calculateRollingAverages
};

// Export types
export type {
  FinancialTransactionActual,
  BahanBakuActual,
  OperationalCostActual
};