import { 
  ProfitAnalysis, 
  RealTimeProfitCalculation, 
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  ProfitChartData 
} from '../../types/profitAnalysis.types';

/**
 * Transform financial transactions to revenue breakdown
 */
export const transformToRevenueBreakdown = (
  transactions: any[]
): RevenueBreakdown[] => {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const totalRevenue = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Group by category
  const categoryGroups = incomeTransactions.reduce((groups, transaction) => {
    const category = transaction.category || 'Lainnya';
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
  return Object.entries(categoryGroups).map(([category, data]) => ({
    category,
    amount: data.total,
    percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    transaction_count: data.transactions.length
  }));
};

/**
 * Transform expense transactions to COGS breakdown
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

  return Object.entries(materialGroups).map(([materialName, data]) => ({
    material_name: materialName,
    quantity_used: data.quantity,
    unit_price: data.quantity > 0 ? data.total / data.quantity : 0,
    total_cost: data.total,
    percentage: totalCOGS > 0 ? (data.total / totalCOGS) * 100 : 0
  }));
};

/**
 * Transform operational costs to OpEx breakdown
 */
export const transformToOpExBreakdown = (
  operationalCosts: any[]
): OpExBreakdown[] => {
  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  const totalOpEx = activeCosts.reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);

  return activeCosts.map(cost => ({
    cost_name: cost.nama_biaya,
    amount: cost.jumlah_per_bulan || 0,
    type: cost.jenis,
    percentage: totalOpEx > 0 ? ((cost.jumlah_per_bulan || 0) / totalOpEx) * 100 : 0
  }));
};

/**
 * Transform real-time calculation to profit analysis format
 */
export const transformToProfitAnalysis = (
  calculation: RealTimeProfitCalculation,
  periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): ProfitAnalysis => {
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

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
    gross_profit: grossProfit,
    net_profit: netProfit,
    
    // Margin Calculations
    gross_margin: grossMargin,
    net_margin: netMargin,
    
    // Metadata
    calculation_date: calculation.calculated_at,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * Transform profit analysis history to chart data
 */
export const transformToChartData = (
  profitHistory: RealTimeProfitCalculation[]
): ProfitChartData[] => {
  return profitHistory.map(analysis => {
    const revenue = analysis.revenue_data.total;
    const cogs = analysis.cogs_data.total;
    const opex = analysis.opex_data.total;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      period: analysis.period,
      revenue,
      cogs,
      opex,
      gross_profit: grossProfit,
      net_profit: netProfit,
      gross_margin: grossMargin,
      net_margin: netMargin
    };
  });
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
 * Format large numbers with abbreviations
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Transform period string to readable format
 */
export const formatPeriodLabel = (period: string, periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): string => {
  if (periodType === 'yearly') {
    return period; // "2024"
  }

  if (periodType === 'quarterly') {
    // "2024-Q1" format
    const [year, quarter] = period.split('-Q');
    return `Q${quarter} ${year}`;
  }

  // Monthly: "2024-01" format
  const [year, month] = period.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndex = parseInt(month) - 1;
  return `${monthNames[monthIndex]} ${year}`;
};

/**
 * Get short period label for charts
 */
export const getShortPeriodLabel = (period: string): string => {
  const [year, month] = period.split('-');
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const monthIndex = parseInt(month) - 1;
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
  endYear: number = new Date().getFullYear()
) => {
  const options = [];
  
  for (let year = endYear; year >= startYear; year--) {
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