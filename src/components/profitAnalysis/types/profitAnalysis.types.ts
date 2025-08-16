// src/components/profitAnalysis/types/profitAnalysis.types.ts
// ==============================================
// Fixed Types with Compatibility

export interface ProfitAnalysis {
  id: string;
  user_id: string;
  period: string; // "2024-01" format (YYYY-MM)
  period_type: 'monthly' | 'quarterly' | 'yearly';
  
  // Revenue Data
  total_revenue: number;
  revenue_breakdown: RevenueBreakdown[];
  
  // Cost Data  
  total_cogs: number; // Cost of Goods Sold
  cogs_breakdown: COGSBreakdown[];
  total_opex: number; // Operational Expenses
  opex_breakdown: OpExBreakdown[];
  
  // Profit Calculations
  gross_profit: number; // Revenue - COGS
  net_profit: number;   // Gross Profit - OpEx
  
  // Margin Calculations
  gross_margin: number; // (Gross Profit / Revenue) * 100
  net_margin: number;   // (Net Profit / Revenue) * 100
  
  // Metadata
  calculation_date: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface COGSBreakdown {
  material_name: string;
  quantity_used: number;
  unit_price: number;
  total_cost: number;
  percentage: number;
}

// 🍽️ F&B specific breakdown dengan kategori yang ramah
export interface FNBCOGSBreakdown {
  item_id: string;
  item_name: string;          // Nama bahan (ex: "Beras Premium")
  category: string;           // Kategori F&B (ex: "Bahan Makanan Utama")
  quantity_used: number;
  unit: string;              // "kg", "liter", "pcs"
  unit_price: number;        // Harga per unit
  total_cost: number;        // Total biaya
  percentage: number;        // % dari total COGS
  wac_price?: number;        // WAC price jika tersedia
  is_expensive?: boolean;    // Flag untuk bahan mahal
}

// 💰 WAC (Weighted Average Cost) breakdown
export interface WACBreakdown {
  item_id: string;
  item_name: string;
  current_stock: number;
  purchases: {
    date: string;
    quantity: number;
    unit_price: number;
    remaining_qty: number;
  }[];
  wac_price: number;        // Calculated WAC
  total_value: number;      // Stock value at WAC
  fifo_price?: number;      // FIFO untuk perbandingan
  last_purchase_price: number;
}

export interface OpExBreakdown {
  cost_name: string;
  amount: number;
  type: 'tetap' | 'variabel';
  percentage: number;
}

// Form Data Types
export interface ProfitAnalysisFormData {
  period: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
}

export interface DateRangeFilter {
  from: Date;
  to: Date;
  period_type: 'monthly' | 'quarterly' | 'yearly';
}

// Chart Data Types
export interface ProfitChartData {
  period: string;
  revenue: number;
  cogs: number;
  opex: number;
  gross_profit: number;
  net_profit: number;
  gross_margin: number;
  net_margin: number;
}

export interface ProfitTrendData {
  labels: string[];
  datasets: {
    revenue: number[];
    gross_profit: number[];
    net_profit: number[];
  };
}

// Real-time Calculation Types (On-demand) - Enhanced untuk F&B
export interface RealTimeProfitCalculation {
  period: string;
  revenue_data: {
    total: number;
    transactions: any[]; // From financial_transactions
    categories?: string[]; // F&B revenue categories
  };
  cogs_data: {
    total: number;
    materials: any[]; // From bahan_baku usage
    breakdown?: FNBCOGSBreakdown[]; // Enhanced breakdown
  };
  opex_data: {
    total: number;
    costs: any[]; // From operational_costs
  };
  calculated_at: string;
  
  // 🆕 WAC integration
  wac_data?: {
    total_wac_cogs: number;
    wac_breakdown: WACBreakdown[];
    calculation_method: 'api' | 'wac';
  };
}

// Advanced metrics types
export interface AdvancedProfitMetrics {
  grossProfitMargin: number;
  netProfitMargin: number;
  monthlyGrowthRate: number;
  marginOfSafety: number;
  cogsPercentage: number;
  opexPercentage: number;
  confidenceScore: number;
  operatingLeverage: number;
}

export interface ProfitForecast {
  nextMonth: {
    profit: number;
    margin: number;
    confidence: number;
  };
  nextQuarter: {
    profit: number;
    margin: number;
    confidence: number;
  };
  nextYear: {
    profit: number;
    margin: number;
    confidence: number;
  };
}

export interface CostOptimizationRecommendations {
  category: string;
  currentCost: number;
  recommendedCost: number;
  potentialSavings: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// 🍽️ F&B Specific Insights dan Recommendations
export interface FNBInsight {
  id: string;
  type: 'alert' | 'suggestion' | 'opportunity' | 'seasonal';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'cost_control' | 'revenue_boost' | 'efficiency' | 'seasonal';
  actionable: boolean;
  action?: {
    label: string;
    type: 'internal' | 'external' | 'calculation';
    data?: any;
  };
  value?: number; // Estimated impact value
  icon?: string;
}

export interface FNBAnalysisResult {
  period: string;
  insights: FNBInsight[];
  alerts: FNBInsight[];
  opportunities: FNBInsight[];
  seasonal_tips: FNBInsight[];
  summary: {
    total_insights: number;
    high_priority_count: number;
    potential_savings: number;
    potential_revenue_boost: number;
  };
}

// 🏷️ User-friendly labels untuk terminologi
export interface FNBLabels {
  // Basic financial terms
  revenueLabel: string;     // "Omset" instead of "Revenue"
  revenueHint: string;
  cogsLabel: string;        // "Modal Bahan Baku" instead of "COGS"
  cogsHint: string;
  opexLabel: string;        // "Biaya Bulanan Tetap" instead of "OpEx"
  opexHint: string;
  
  // Profit terms
  grossProfitLabel: string; // "Untung Kotor"
  grossProfitHint: string;
  netProfitLabel: string;   // "Untung Bersih"
  netProfitHint: string;
  
  // WAC specific
  hppLabel?: string;        // "Modal Rata-rata Tertimbang"
  hppHint?: string;
  wacActiveLabel?: string;
}

export interface ProfitBenchmark {
  industry: {
    averageNetMargin: number;
    topQuartileMargin: number;
  };
  competitive: {
    percentile: number;
    position: string;
    gapToLeader: number;
  };
}

// API Response Types
export interface ProfitApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
  success: boolean;
}

// ✅ ENHANCED: Context Types dengan F&B support dan WAC
export interface ProfitAnalysisContextType {
  // State - Enhanced dengan F&B support
  profitData: RealTimeProfitCalculation[];
  currentAnalysis: RealTimeProfitCalculation | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // 🆕 F&B specific state
  profitMetrics?: {
    revenue: number;
    cogs: number;           // WAC calculated COGS
    opex: number;
    grossProfit: number;
    netProfit: number;
    hppBreakdown: FNBCOGSBreakdown[];
  };
  labels?: FNBLabels;       // User-friendly labels
  
  // Actions
  calculateProfit: (period: string, periodType?: 'monthly' | 'quarterly' | 'yearly') => Promise<boolean>;
  loadProfitHistory: (dateRange?: DateRangeFilter) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
  
  // 🆕 F&B specific actions
  refreshWACData?: () => Promise<void>;
  generateFNBInsights?: (period: string) => Promise<FNBAnalysisResult>;
  
  // Utilities
  getProfitByPeriod: (period: string) => RealTimeProfitCalculation | undefined;
  calculateRealTimeProfit: (period: string) => Promise<RealTimeProfitCalculation>;
  
  // Query status
  isRefreshing: boolean;
  isCalculating: boolean;
  
  // 🆕 WAC status
  isWACEnabled?: boolean;
  wacLastUpdated?: Date | null;
}
