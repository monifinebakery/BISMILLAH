// src/types/profitAnalysis.ts
// ✅ PROFIT ANALYSIS TYPES - Real Profit Margin Integration

import { FinancialTransaction } from '@/components/financial/types/financial';
import { OperationalCost } from '@/components/operational-costs/types/operationalCost.types';
import { BahanBakuFrontend } from '@/components/warehouse/types';

// ===========================================
// ✅ CORE PROFIT MARGIN TYPES
// ===========================================

export interface ProfitMarginData {
  // Revenue from Financial
  revenue: number;
  
  // Cost of Goods Sold (HPP) from Warehouse + Labor
  cogs: number;
  
  // Operating Expenses from Operational Costs
  opex: number;
  
  // Calculated margins
  grossProfit: number;    // Revenue - COGS
  netProfit: number;      // Gross Profit - OPEX
  grossMargin: number;    // (Gross Profit / Revenue) * 100
  netMargin: number;      // (Net Profit / Revenue) * 100
  
  // Metadata
  calculatedAt: Date;
  period: DatePeriod;
}

export interface DatePeriod {
  from: Date;
  to: Date;
  label: string; // "Q1 2024", "January 2024", etc.
}

// ===========================================
// ✅ HPP (COGS) BREAKDOWN
// ===========================================

export interface COGSBreakdown {
  // Material costs from warehouse
  materialCosts: MaterialCostDetail[];
  totalMaterialCost: number;
  
  // Direct labor from operational costs
  directLaborCosts: LaborCostDetail[];
  totalDirectLaborCost: number;
  
  // Manufacturing overhead allocation
  manufacturingOverhead: number;
  overheadAllocationMethod: 'per_unit' | 'persentase';
  
  // Total COGS
  totalCOGS: number;
}

export interface MaterialCostDetail {
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  category: string;
  // Package context if available
  packageInfo?: {
    fromPackageQty: number;
    packageSize: number;
    packageUnit: string;
  };
}

export interface LaborCostDetail {
  costId: string;
  costName: string;
  costType: 'tetap' | 'variabel';
  monthlyAmount: number;
  allocatedAmount: number; // Amount allocated to production
  allocationBasis: string; // e.g., "per unit", "percentage"
}

// ===========================================
// ✅ OPEX BREAKDOWN
// ===========================================

export interface OPEXBreakdown {
  // Administrative expenses
  administrativeExpenses: OperationalExpenseDetail[];
  totalAdministrative: number;
  
  // Selling expenses
  sellingExpenses: OperationalExpenseDetail[];
  totalSelling: number;
  
  // General expenses
  generalExpenses: OperationalExpenseDetail[];
  totalGeneral: number;
  
  // Total OPEX
  totalOPEX: number;
}

export interface OperationalExpenseDetail {
  costId: string;
  costName: string;
  costType: 'tetap' | 'variabel';
  monthlyAmount: number;
  category: 'administrative' | 'selling' | 'general';
  percentage: number; // Percentage of total OPEX
}

// ===========================================
// ✅ PROFIT ANALYSIS INTEGRATION
// ===========================================

export interface ProfitAnalysisInput {
  // Financial data
  transactions: FinancialTransaction[];
  
  // Operational costs
  operationalCosts: OperationalCost[];
  
  // Warehouse materials
  materials: BahanBakuFrontend[];
  
  // Analysis period
  period: DatePeriod;
  
  // Production data (if available)
  productionData?: ProductionData;
}

export interface ProductionData {
  unitsProduced: number;
  unitsSold: number;
  averageSellingPrice: number;
  productionEfficiency: number; // %
}

// ===========================================
// ✅ CATEGORIZATION LOGIC
// ===========================================

export interface CategoryMapping {
  // Financial transaction categories that map to COGS
  cogsCategories: string[];
  
  // Financial transaction categories that map to OPEX
  opexCategories: string[];
  
  // Operational cost categories for COGS (direct labor/overhead)
  directLaborCategories: string[];
  
  // Operational cost categories for OPEX
  operationalExpenseCategories: string[];
}

export const DEFAULT_CATEGORY_MAPPING: CategoryMapping = {
  cogsCategories: [
    'Pembelian Bahan Baku',
    'Biaya Produksi',
    'Upah Langsung',
    'Biaya Manufaktur'
  ],
  opexCategories: [
    'Marketing',
    'Transportasi', 
    'Biaya Administrasi',
    'Gaji Administrasi',
    'Sewa Kantor',
    'Utilitas Kantor'
  ],
  directLaborCategories: [
    'Gaji Karyawan Produksi',
    'Upah Buruh',
    'Tunjangan Produksi'
  ],
  operationalExpenseCategories: [
    'Gaji Karyawan Administrasi',
    'Biaya Pemasaran',
    'Biaya Penjualan',
    'Biaya Umum'
  ]
};

// ===========================================
// ✅ CALCULATION RESULTS
// ===========================================

export interface ProfitAnalysisResult {
  // Basic metrics
  profitMarginData: ProfitMarginData;
  
  // Detailed breakdowns
  cogsBreakdown: COGSBreakdown;
  opexBreakdown: OPEXBreakdown;
  
  // Analysis insights
  insights: ProfitInsight[];
  
  // Comparison data (if available)
  comparison?: ProfitComparison;
  
  // Raw data references
  rawData: {
    transactions: FinancialTransaction[];
    operationalCosts: OperationalCost[];
    materials: BahanBakuFrontend[];
  };
}

export interface ProfitInsight {
  type: 'warning' | 'info' | 'success' | 'critical';
  category: 'margin' | 'cogs' | 'opex' | 'efficiency';
  title: string;
  message: string;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ProfitComparison {
  previousPeriod?: ProfitMarginData;
  budgetPlan?: ProfitMarginData;
  industryBenchmark?: ProfitMarginData;
  variance: {
    revenueGrowth: number;
    marginImprovement: number;
    costReduction: number;
  };
}

// ===========================================
// ✅ API RESPONSE TYPES
// ===========================================

export interface ProfitAnalysisApiResponse<T = any> {
  data: T;
  error?: string;
  success: boolean;
  message?: string;
  calculationTime?: number; // ms
}

// ===========================================
// ✅ CONTEXT TYPE
// ===========================================

export interface ProfitAnalysisContextType {
  // State
  currentAnalysis: ProfitAnalysisResult | null;
  isLoading: boolean;
  isCalculating: boolean;
  
  // Actions
  calculateProfitMargin: (input: ProfitAnalysisInput) => Promise<ProfitAnalysisResult>;
  refreshAnalysis: () => Promise<void>;
  
  // Configuration
  categoryMapping: CategoryMapping;
  updateCategoryMapping: (mapping: Partial<CategoryMapping>) => void;
  
  // Utilities
  exportAnalysis: (format: 'pdf' | 'excel' | 'csv') => Promise<boolean>;
  getInsightsByCategory: (category: string) => ProfitInsight[];
}

// ===========================================
// ✅ FORM & UI TYPES
// ===========================================

export interface ProfitAnalysisFormData {
  period: {
    from: string;
    to: string;
  };
  includeProjections: boolean;
  includeBenchmarks: boolean;
  categoryMappingOverrides?: Partial<CategoryMapping>;
}

export interface ProfitChartData {
  marginTrend: Array<{
    date: string;
    grossMargin: number;
    netMargin: number;
  }>;
  
  costBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    type: 'cogs' | 'opex';
  }>;
  
  profitWaterfall: Array<{
    category: string;
    value: number;
    cumulative: number;
  }>;
}

// ===========================================
// ✅ CONSTANTS
// ===========================================

export const PROFIT_MARGIN_THRESHOLDS = {
  grossMargin: {
    excellent: 40,
    good: 25,
    acceptable: 15,
    poor: 5
  },
  netMargin: {
    excellent: 15,
    good: 10,
    acceptable: 5,
    poor: 2
  }
};

export const CALCULATION_METHODS = {
  materialCost: 'fifo' as const, // First In, First Out
  laborAllocation: 'per_unit' as const,
  overheadAllocation: 'activity_based' as const
};

// ===========================================
// ✅ VALIDATION TYPES
// ===========================================

export interface ProfitAnalysisValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ===========================================
// ✅ EXPORT UTILITIES
// ===========================================

export type CreateProfitAnalysisInput = Omit<ProfitAnalysisInput, 'calculatedAt'>;
export type ProfitMarginSummary = Pick<ProfitMarginData, 'revenue' | 'grossMargin' | 'netMargin' | 'period'>;

// Type guards
export const isProfitAnalysisResult = (obj: any): obj is ProfitAnalysisResult => {
  return (
    typeof obj === 'object' &&
    obj.profitMarginData &&
    obj.cogsBreakdown &&
    obj.opexBreakdown &&
    Array.isArray(obj.insights)
  );
};

export const isValidDatePeriod = (period: any): period is DatePeriod => {
  return (
    typeof period === 'object' &&
    period.from instanceof Date &&
    period.to instanceof Date &&
    typeof period.label === 'string' &&
    period.from <= period.to
  );
};