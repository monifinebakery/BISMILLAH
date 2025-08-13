// src/components/profitAnalysis/types/index.ts
// ✅ PROFIT ANALYSIS TYPES - Real Profit Margin Integration & Component Types

import { FinancialTransaction } from '@/components/financial/types/financial';
import { OperationalCost } from '@/components/operational-costs/types/operationalCost.types';
import { BahanBakuFrontend } from '@/components/warehouse/types';

// ===========================================
// ✅ LOCAL UI TYPES - Types for profit analysis components
// ===========================================

export interface ProfitAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { from: Date; to: Date };
  initialTab?: string;
  onExport?: (format: string, data: any) => void;
}

export interface TabComponentProps {
  profitData: any;
  isLoading?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
  trend?: number;
  status?: string;
  onClick?: () => void;
}

export interface CostBreakdownItem {
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface ExportData {
  ringkasan: Record<string, any>;
  rincian_hpp: Record<string, any>;
  rincian_opex: Record<string, any>;
  insights: Array<Record<string, any>>;
  analisis_rasio: Record<string, any>;
  patokan_industri: Record<string, any>;
}

// ===========================================
// ✅ CORE PROFIT MARGIN TYPES
// ===========================================

export interface ProfitMarginData {
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number; // Revenue - COGS
  netProfit: number; // Gross Profit - OPEX
  grossMargin: number; // (Gross Profit / Revenue) * 100
  netMargin: number; // (Net Profit / Revenue) * 100
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
  materialCosts: MaterialCostDetail[];
  totalMaterialCost: number;
  directLaborCosts: LaborCostDetail[];
  totalDirectLaborCost: number;
  manufacturingOverhead: number;
  overheadAllocationMethod: 'per_unit' | 'persentase';
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
  allocationBasis: string; // e.g., "per unit", "percentage"
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
// ✅ PROFIT ANALYSIS INTEGRATION
// ===========================================

export interface ProfitAnalysisInput {
  transactions: FinancialTransaction[];
  operationalCosts: OperationalCost[];
  materials: BahanBakuFrontend[];
  period: DatePeriod;
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
  cogsCategories: string[];
  opexCategories: string[];
  directLaborCategories: string[];
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
  profitMarginData: ProfitMarginData;
  cogsBreakdown: COGSBreakdown;
  opexBreakdown: OPEXBreakdown;
  insights: ProfitInsight[];
  comparison?: ProfitComparison;
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
  currentAnalysis: ProfitAnalysisResult | null;
  isLoading: boolean;
  isCalculating: boolean;
  calculateProfitMargin: (input: ProfitAnalysisInput) => Promise<ProfitAnalysisResult>;
  refreshAnalysis: () => Promise<void>;
  categoryMapping: CategoryMapping;
  updateCategoryMapping: (mapping: Partial<CategoryMapping>) => void;
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
  materialCost: 'fifo' as const,
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