// profitTransformers.ts - Data transformation utilities with centralized logic
// ==============================================

import { 
  ProfitAnalysis, 
  RealTimeProfitCalculation, 
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  ProfitChartData,
  FNBCOGSBreakdown,
  WACBreakdown 
} from '../types/profitAnalysis.types';

// 🍽️ Import F&B constants for categorization
import { FNB_COGS_CATEGORIES, FNB_REVENUE_CATEGORIES, FNB_OPEX_CATEGORIES } from '../constants/profitConstants';
// ✅ Import centralized utilities
import { getEffectiveCogs, calculateHistoricalCOGS } from '@/utils/cogsCalculation';
import { validateFinancialData, safeCalculateMargins } from '@/utils/profitValidation';
import { formatPeriodForDisplay, safeSortPeriods } from '@/utils/periodUtils';

/**
 * 🍽️ Transform financial transactions to F&B revenue breakdown
 */
export const transformToRevenueBreakdown = (
  transactions: any[]
): RevenueBreakdown[] => {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const totalRevenue = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Group by F&B category with mapping
  const categoryGroups = incomeTransactions.reduce((groups, transaction) => {
    let category = transaction.category || 'Lainnya';
    
    // 🍽️ Map generic categories to F&B specific categories
    const categoryMapping: Record<string, string> = {
      'Penjualan': 'Penjualan Makanan',
      'Sales': 'Penjualan Makanan', 
      'Food Sales': 'Penjualan Makanan',
      'Beverage Sales': 'Penjualan Minuman',
      'Minuman': 'Penjualan Minuman',
      'Catering': 'Paket Catering',
      'Delivery': 'Delivery/Ojol',
      'Event': 'Event & Acara'
    };
    
    category = categoryMapping[category] || category;
    
    if (!groups[category]) {
      groups[category] = {
        transactions: [],
        total: 0
      };
    }
    groups[category].transactions.push(transaction);
    groups[category].total += transaction.amount || 0;
    return groups;
  }, {} as Record<string, { transactions: any[]; total: number }>);

  // Transform to breakdown format
  return Object.entries(categoryGroups).map(([category, data]) => {
    const groupData = data as { transactions: any[]; total: number };
    return {
      category,
      amount: groupData.total,
      percentage: totalRevenue > 0 ? (groupData.total / totalRevenue) * 100 : 0,
      transaction_count: groupData.transactions.length
    };
  });
};

/**
 * 🍽️ Transform WAC breakdown to F&B COGS breakdown
 */
export const transformToFNBCOGSBreakdown = (
  wacBreakdown: WACBreakdown[],
  totalCogs?: number
): FNBCOGSBreakdown[] => {
  const effectiveTotal = totalCogs || wacBreakdown.reduce((sum, item) => sum + item.total_value, 0);
  
  return wacBreakdown.map(item => {
    // 🍽️ Categorize based on item name with F&B context
    const category = categorizeFNBItem(item.item_name);
    const isExpensive = item.total_value > 500000; // > 500k considered expensive
    
    return {
      item_id: item.item_id,
      item_name: item.item_name,
      category,
      quantity_used: item.current_stock, // Using current stock as proxy
      unit: 'unit', // Could be enhanced with actual unit data
      unit_price: item.wac_price,
      total_cost: item.total_value,
      percentage: effectiveTotal > 0 ? (item.total_value / effectiveTotal) * 100 : 0,
      wac_price: item.wac_price,
      is_expensive: isExpensive
    };
  });
};

/**
 * 🍽️ Categorize F&B items based on name patterns
 */
const categorizeFNBItem = (itemName: string): string => {
  const name = itemName.toLowerCase();
  
  // Main ingredients
  if (name.includes('beras') || name.includes('rice') || 
      name.includes('daging') || name.includes('meat') ||
      name.includes('ayam') || name.includes('chicken') ||
      name.includes('ikan') || name.includes('fish') ||
      name.includes('sayur') || name.includes('vegetable') ||
      name.includes('tahu') || name.includes('tempe') ||
      name.includes('mie') || name.includes('noodle')) {
    return 'Bahan Makanan Utama';
  }
  
  // Spices and seasonings
  if (name.includes('garam') || name.includes('salt') ||
      name.includes('gula') || name.includes('sugar') ||
      name.includes('bumbu') || name.includes('spice') ||
      name.includes('kecap') || name.includes('saos') ||
      name.includes('sauce') || name.includes('merica') ||
      name.includes('pepper') || name.includes('bawang') ||
      name.includes('onion') || name.includes('cabai') ||
      name.includes('chili')) {
    return 'Bumbu & Rempah';
  }
  
  // Beverages
  if (name.includes('air') || name.includes('water') ||
      name.includes('teh') || name.includes('tea') ||
      name.includes('kopi') || name.includes('coffee') ||
      name.includes('jus') || name.includes('juice') ||
      name.includes('sirup') || name.includes('syrup') ||
      name.includes('susu') || name.includes('milk')) {
    return 'Minuman & Sirup';
  }
  
  // Packaging
  if (name.includes('kemasan') || name.includes('pack') ||
      name.includes('box') || name.includes('cup') ||
      name.includes('plastik') || name.includes('plastic') ||
      name.includes('kertas') || name.includes('paper') ||
      name.includes('styrofoam') || name.includes('container')) {
    return 'Kemasan & Wadah';
  }
  
  // Gas and fuel
  if (name.includes('gas') || name.includes('lpg') ||
      name.includes('bensin') || name.includes('fuel') ||
      name.includes('bahan bakar')) {
    return 'Gas & Bahan Bakar';
  }
  
  // Default category
  return 'Lainnya';
};

/**
 * Transform expense transactions to COGS breakdown (legacy support)
 */
export const transformToCOGSBreakdown = (
  transactions: any[]
): COGSBreakdown[] => {
  const cogsTransactions = transactions.filter(t => 
    t.type === 'expense' && t.category === 'Pembelian Bahan Baku'
  );
  const totalCOGS = cogsTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // For now, group by description (in real app, this would link to materials)
  const materialGroups = cogsTransactions.reduce((groups, transaction) => {
    // Extract material name from description or use description
    const materialName = extractMaterialName(transaction.description || 'Material Unknown');
    
    if (!groups[materialName]) {
      groups[materialName] = {
        transactions: [],
        total: 0,
        quantity: 0
      };
    }
    
    groups[materialName].transactions.push(transaction);
    groups[materialName].total += transaction.amount || 0;
    groups[materialName].quantity += 1; // Simplified - in real app, extract from transaction
    
    return groups;
  }, {} as Record<string, { transactions: any[]; total: number; quantity: number }>);

  return Object.entries(materialGroups).map(([materialName, data]) => {
    const groupData = data as { transactions: any[]; total: number; quantity: number };
    return {
      material_name: materialName,
      quantity_used: groupData.quantity,
      unit_price: groupData.quantity > 0 ? groupData.total / groupData.quantity : 0,
      total_cost: groupData.total,
      percentage: totalCOGS > 0 ? (groupData.total / totalCOGS) * 100 : 0
    };
  });
};

/**
 * 🏪 Transform operational costs to F&B OpEx breakdown with friendly names
 */
export const transformToOpExBreakdown = (
  operationalCosts: any[]
): OpExBreakdown[] => {
  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  const totalOpEx = activeCosts.reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);

  return activeCosts.map(cost => {
    // 🏪 Map cost names to F&B friendly terms
    let friendlyName = cost.nama_biaya;
    const nameMapping: Record<string, string> = {
      'Gaji': 'Gaji Karyawan',
      'Salary': 'Gaji Karyawan',
      'Rent': 'Sewa Tempat', 
      'Sewa': 'Sewa Tempat',
      'Electricity': 'Listrik & Air',
      'Listrik': 'Listrik & Air',
      'Water': 'Listrik & Air',
      'Air': 'Listrik & Air',
      'Marketing': 'Promosi & Iklan',
      'Advertising': 'Promosi & Iklan',
      'Promosi': 'Promosi & Iklan',
      'Transport': 'Transportasi',
      'Internet': 'Internet & Pulsa',
      'Phone': 'Internet & Pulsa',
      'Pulsa': 'Internet & Pulsa'
    };
    
    // Try to find mapping
    const mappedName = Object.keys(nameMapping).find(key => 
      friendlyName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (mappedName) {
      friendlyName = nameMapping[mappedName];
    }
    
    return {
      cost_name: friendlyName,
      amount: cost.jumlah_per_bulan || 0,
      type: cost.jenis,
      percentage: totalOpEx > 0 ? ((cost.jumlah_per_bulan || 0) / totalOpEx) * 100 : 0
    };
  });
};

/**
 * ✅ STANDARDIZED: Transform real-time calculation to profit analysis format with validation
 */
export const transformToProfitAnalysis = (
  calculation: RealTimeProfitCalculation,
  periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): ProfitAnalysis => {
  const revenue = calculation.revenue_data.total;
  
  // ✅ Use centralized COGS calculation
  const cogsResult = getEffectiveCogs(calculation, undefined, revenue);
  const cogs = cogsResult.value;
  
  const opex = calculation.opex_data.total;
  
  // ✅ Use centralized margin calculation with validation
  const margins = safeCalculateMargins(revenue, cogs, opex);

  return {
    id: `${calculation.period}-${Date.now()}`, // Generate temporary ID
    user_id: '', // Will be set by API
    period: calculation.period,
    period_type: periodType,
    
    // Revenue Data
    total_revenue: revenue,
    revenue_breakdown: transformToRevenueBreakdown(calculation.revenue_data.transactions || []),
    
    // Cost Data
    total_cogs: cogs,
    cogs_breakdown: transformToCOGSBreakdown([]), // Would need transaction data
    total_opex: opex,
    opex_breakdown: transformToOpExBreakdown(calculation.opex_data.costs || []),
    
    // Profit Calculations
    gross_profit: margins.grossProfit,
    net_profit: margins.netProfit,
    
    // Margin Calculations
    gross_margin: margins.grossMargin,
    net_margin: margins.netMargin,
    
    // Metadata
    calculation_date: calculation.calculated_at,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * ✅ STANDARDIZED: Transform profit analysis history to chart data with centralized utilities
 */
export const transformToChartData = (
  profitHistory: RealTimeProfitCalculation[],
  effectiveCogs?: number // WAC calculated COGS for current period
): ProfitChartData[] => {
  if (!Array.isArray(profitHistory) || profitHistory.length === 0) return [];
  
  try {
    // ✅ Get historical COGS calculations using centralized logic
    const cogsCalculations = calculateHistoricalCOGS(profitHistory, effectiveCogs);
    
    // ✅ Sort periods chronologically
    const sortedHistory = [...profitHistory].sort((a, b) => {
      const periodsToSort = [a.period, b.period];
      const sorted = safeSortPeriods(periodsToSort);
      return periodsToSort.indexOf(a.period) - periodsToSort.indexOf(b.period);
    });
    
    return sortedHistory.map((analysis) => {
      const revenue = analysis.revenue_data.total;
      const cogsResult = cogsCalculations.get(analysis.period);
      const cogs = cogsResult?.value || analysis.cogs_data.total;
      const opex = analysis.opex_data.total;
      
      // ✅ Use centralized margin calculation with validation
      const margins = safeCalculateMargins(revenue, cogs, opex);

      return {
        period: analysis.period,
        revenue,
        cogs,
        opex,
        gross_profit: margins.grossProfit,
        net_profit: margins.netProfit,
        gross_margin: margins.grossMargin,
        net_margin: margins.netMargin
      };
    });
  } catch (error) {
    console.error('Error transforming to chart data:', error);
    return [];
  }
};

/**
 * ✅ STANDARDIZED: Calculate rolling averages for trend analysis with validation
 */
export const calculateRollingAverages = (
  profitHistory: any[],
  periods: number
): {
  revenueAverage: number;
  profitAverage: number;
  marginAverage: number;
  volatility: number;
} => {
  if (!profitHistory || profitHistory.length === 0) {
    return {
      revenueAverage: 0,
      profitAverage: 0,
      marginAverage: 0,
      volatility: 0
    };
  }

  try {
    const recentData = profitHistory.slice(-periods);
    
    const revenueAverage = recentData.reduce((sum, d) => {
      const revenue = d.revenue_data?.total || d.revenue || 0;
      return sum + revenue;
    }, 0) / recentData.length;

    // ✅ Use centralized calculations for consistent logic
    const profitAverage = recentData.reduce((sum, d) => {
      const revenue = d.revenue_data?.total || d.revenue || 0;
      const cogs = d.cogs_data?.total || d.cogs || 0;
      const opex = d.opex_data?.total || d.opex || 0;
      
      const margins = safeCalculateMargins(revenue, cogs, opex);
      return sum + margins.netProfit;
    }, 0) / recentData.length;

    const marginAverage = recentData.reduce((sum, d) => {
      const revenue = d.revenue_data?.total || d.revenue || 0;
      const cogs = d.cogs_data?.total || d.cogs || 0;
      const opex = d.opex_data?.total || d.opex || 0;
      
      const margins = safeCalculateMargins(revenue, cogs, opex);
      return sum + margins.netMargin;
    }, 0) / recentData.length;

    // Calculate volatility (standard deviation of margins)
    const margins = recentData.map(d => {
      const revenue = d.revenue_data?.total || d.revenue || 0;
      const cogs = d.cogs_data?.total || d.cogs || 0;
      const opex = d.opex_data?.total || d.opex || 0;
      
      const marginCalc = safeCalculateMargins(revenue, cogs, opex);
      return marginCalc.netMargin;
    });

    const variance = margins.reduce((sum, margin) => {
      return sum + Math.pow(margin - marginAverage, 2);
    }, 0) / margins.length;

    const volatility = Math.sqrt(variance);

    return {
      revenueAverage,
      profitAverage,
      marginAverage,
      volatility
    };
  } catch (error) {
    console.error('Error calculating rolling averages:', error);
    return {
      revenueAverage: 0,
      profitAverage: 0,
      marginAverage: 0,
      volatility: 0
    };
  }
};

/**
 * Extract material name from transaction description
 * This is a simplified version - in real app, you'd have proper material tracking
 */
const extractMaterialName = (description: string): string => {
  // Simple patterns to extract material names
  const patterns = [
    /beli\s+(.+)/i,
    /pembelian\s+(.+)/i,
    /material\s+(.+)/i,
    /bahan\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback to first few words of description
  return description.split(' ').slice(0, 2).join(' ');
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
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * 💰 Format large numbers with Indonesian abbreviations (UMKM friendly)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + ' Milyar';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + ' Juta';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + ' Ribu';
  }
  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * ✅ STANDARDIZED: Format period string using centralized utility
 */
export const formatPeriodLabel = (period: string, periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): string => {
  // ✅ Use centralized period formatting for consistency
  return formatPeriodForDisplay(period);
};

/**
 * 🗺️ Get short period label for charts (Indonesian)
 */
export const getShortPeriodLabel = (period: string): string => {
  const [year, month] = period.split('-');
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  
  const monthIndex = parseInt(month) - 1;
  if (monthIndex < 0 || monthIndex >= shortMonths.length) {
    return period; // fallback
  }
  return `${shortMonths[monthIndex]} ${year.slice(-2)}`;
};

/**
 * Calculate growth percentage between two values
 */
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get growth status and color
 */
export const getGrowthStatus = (growthPercentage: number) => {
  if (growthPercentage > 5) {
    return { status: 'positive', color: 'text-green-600', bgColor: 'bg-green-50' };
  } else if (growthPercentage < -5) {
    return { status: 'negative', color: 'text-red-600', bgColor: 'bg-red-50' };
  } else {
    return { status: 'neutral', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
};

/**
 * Generate period list for dropdowns
 */
export const generatePeriodOptions = (
  startYear: number = 2023,
  endYear: number = new Date().getFullYear(),
  type: 'monthly' | 'yearly' = 'monthly'
) => {
  const options = [] as Array<{ value: string; label: string }>;

  for (let year = endYear; year >= startYear; year--) {
    if (type === 'yearly') {
      const period = `${year}`;
      const label = formatPeriodLabel(period, 'yearly');
      options.push({ value: period, label });
      continue;
    }

    for (let month = 12; month >= 1; month--) {
      // Stop at current month for current year
      if (year === endYear && month > new Date().getMonth() + 1) {
        continue;
      }

      const monthStr = month.toString().padStart(2, '0');
      const period = `${year}-${monthStr}`;
      const label = formatPeriodLabel(period);

      options.push({ value: period, label });
    }
  }

  return options;
};

/**
 * Validate period format
 */
export const isValidPeriod = (period: string, periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): boolean => {
  if (periodType === 'yearly') {
    return /^\d{4}$/.test(period);
  }
  
  if (periodType === 'quarterly') {
    return /^\d{4}-Q[1-4]$/.test(period);
  }
  
  // Monthly
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
};

/**
 * Get current period based on type
 */
export const getCurrentPeriod = (periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (periodType === 'yearly') {
    return year.toString();
  }
  
  if (periodType === 'quarterly') {
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
  }
  
  // Monthly
  return `${year}-${month.toString().padStart(2, '0')}`;
};