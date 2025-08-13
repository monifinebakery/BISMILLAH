// src/components/profitAnalysis/types/index.ts
// ✅ COMPLETE UPDATED TYPES - Material Usage Integration

import { FinancialTransaction } from '@/components/financial/types/financial';
import { OperationalCost } from '@/components/operational-costs/types/operationalCost.types';
import { BahanBakuFrontend } from '@/components/warehouse/types';
import { Recipe } from '@/components/recipe/types';

// ===========================================
// ✅ NEW MATERIAL USAGE TYPES
// ===========================================

export interface MaterialUsageLog {
  id: string;
  user_id: string;
  material_id: string;
  usage_type: 'production' | 'sale' | 'adjustment' | 'waste';
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  usage_date: Date;
  reference_type?: 'sale' | 'production' | 'adjustment';
  reference_id?: string;
  notes?: string;
  batch_number?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductionRecord {
  id: string;
  user_id: string;
  product_name: string;
  quantity_produced: number;
  production_date: Date;
  total_material_cost: number;
  total_labor_cost: number;
  total_overhead_cost: number;
  unit_cost: number;
  batch_number?: string;
  quality_grade?: 'A' | 'B' | 'C' | 'reject';
  notes?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// ===========================================
// ✅ CORE PROFIT MARGIN TYPES
// ===========================================

export interface ProfitMarginData {
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  calculatedAt: Date;
  period: DatePeriod;
}

export interface DatePeriod {
  from: Date;
  to: Date;
  label: string;
}

// ===========================================
// ✅ UPDATED COGS BREAKDOWN
// ===========================================

export interface COGSBreakdown {
  materialCosts: MaterialCostDetail[];
  totalMaterialCost: number;
  directLaborCosts: LaborCostDetail[];
  totalDirectLaborCost: number;
  manufacturingOverhead: number;
  overheadAllocationMethod: string;
  totalCOGS: number;
  
  // ✅ NEW FIELDS for actual data tracking
  actualMaterialUsage?: MaterialUsageLog[];
  productionData?: ProductionRecord[];
  dataSource: 'actual' | 'estimated' | 'mixed';
}

export interface MaterialCostDetail {
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  category: string;
  
  // ✅ NEW FIELDS for actual usage tracking
  usageType?: 'production' | 'sale' | 'adjustment' | 'waste';
  isEstimate?: boolean;
  referenceInfo?: {
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  };
  
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
  allocatedAmount: number;
  allocationBasis: string;
}

// ===========================================
// ✅ OPEX BREAKDOWN
// ===========================================

export interface OPEXBreakdown {
  administrativeExpenses: OperationalExpenseDetail[];
  totalAdministrative: number;
  sellingExpenses: OperationalExpenseDetail[];
  totalSelling: number;
  generalExpenses: OperationalExpenseDetail[];
  totalGeneral: number;
  totalOPEX: number;
}

export interface OperationalExpenseDetail {
  costId: string;
  costName: string;
  costType: 'tetap' | 'variabel';
  monthlyAmount: number;
  category: 'administrative' | 'selling' | 'general';
  percentage: number;
}

// ===========================================
// ✅ UPDATED PROFIT ANALYSIS INPUT
// ===========================================

export interface ProfitAnalysisInput {
  transactions: FinancialTransaction[];
  operationalCosts: OperationalCost[];
  materials: BahanBakuFrontend[];
  recipes: Recipe[];
  materialUsage: MaterialUsageLog[]; // ✅ NEW
  productionRecords: ProductionRecord[]; // ✅ NEW
  period: DatePeriod;
}

// ===========================================
// ✅ CATEGORIZATION & ANALYSIS
// ===========================================

export interface CategoryMapping {
  cogsCategories: string[];
  opexCategories: string[];
  directLaborCategories: string[];
  operationalExpenseCategories: string[];
}

export const DEFAULT_CATEGORY_MAPPING: CategoryMapping = {
  cogsCategories: ["Pembelian Bahan Baku", "Biaya Produksi", "Upah Langsung"],
  opexCategories: ["Marketing", "Transportasi", "Biaya Administrasi"],
  directLaborCategories: ["Gaji Karyawan Produksi", "Upah Buruh"],
  operationalExpenseCategories: ["Gaji Administrasi", "Biaya Pemasaran"]
};

export interface ProfitInsight {
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'margin' | 'cogs' | 'opex' | 'efficiency' | 'trend';
  title: string;
  message: string;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
  value?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface ProfitAnalysisResult {
  profitMarginData: ProfitMarginData;
  cogsBreakdown: COGSBreakdown;
  opexBreakdown: OPEXBreakdown;
  insights: ProfitInsight[];
  rawData: {
    transactions: FinancialTransaction[];
    operationalCosts: OperationalCost[];
    materials: BahanBakuFrontend[];
    recipes: Recipe[];
    materialUsage?: MaterialUsageLog[]; // ✅ NEW
    productionRecords?: ProductionRecord[]; // ✅ NEW
  };
}

export interface ProfitAnalysisApiResponse<T> {
  data: T | null;
  error?: string;
  success: boolean;
  message?: string;
  calculationTime?: number;
}

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

// ===========================================
// ✅ CONTEXT TYPES
// ===========================================

export interface ProfitAnalysisContextType {
  // State
  currentAnalysis: ProfitAnalysisResult | null;
  isLoading: boolean;
  isCalculating: boolean;
  error?: string;

  // Actions
  calculateProfitMargin: (input: {
    period: DatePeriod;
    categoryMapping?: Partial<CategoryMapping>;
  }) => Promise<ProfitAnalysisResult>;
  refreshAnalysis: () => Promise<void>;

  // Configuration
  categoryMapping: CategoryMapping;
  updateCategoryMapping: (mapping: Partial<CategoryMapping>) => void;

  // Utilities
  exportAnalysis: (format: 'pdf' | 'excel' | 'csv') => Promise<boolean>;
  getInsightsByCategory: (category: string) => ProfitInsight[];
  
  // Enhanced utilities
  getProfitTrend: (months?: number) => Array<{ period: string; margin: number }>;
  getMarginStatus: (margin: number, type: 'gross' | 'net') => { status: string; color: string };
  getCostAnalysis: () => any;
  keyMetrics?: any;
  dashboardSummary?: any;
}

// ===========================================
// ✅ CHART & UI TYPES
// ===========================================

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
// ✅ VALIDATION TYPES
// ===========================================

export interface ProfitAnalysisValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ===========================================
// ✅ TYPE GUARDS
// ===========================================

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