// 1. TYPES - src/components/profitAnalysis/types/profitAnalysis.types.ts
// ==============================================

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

// Real-time Calculation Types (On-demand)
export interface RealTimeProfitCalculation {
  period: string;
  revenue_data: {
    total: number;
    transactions: any[]; // From financial_transactions
  };
  cogs_data: {
    total: number;
    materials: any[]; // From bahan_baku usage
  };
  opex_data: {
    total: number;
    costs: any[]; // From operational_costs
  };
  calculated_at: string;
}

// API Response Types
export interface ProfitApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Context Types
export interface ProfitAnalysisContextType {
  // State
  profitData: ProfitAnalysis[];
  currentAnalysis: ProfitAnalysis | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  calculateProfit: (period: string, periodType?: 'monthly' | 'quarterly' | 'yearly') => Promise<boolean>;
  loadProfitHistory: (dateRange?: DateRangeFilter) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  
  // Utilities
  getProfitByPeriod: (period: string) => ProfitAnalysis | undefined;
  calculateRealTimeProfit: (period: string) => Promise<RealTimeProfitCalculation>;
}