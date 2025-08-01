// src/components/recipe/components/RecipeForm/CostCalculationStep/utils/types.ts

export interface CostCalculationData {
  bahanResep: Array<{
    namaBahan?: string;
    jumlah?: number;
    quantity?: number; // Alternative property name
    satuan?: string;
    hargaPerSatuan?: number;
    hargaSatuan?: number; // Alternative property name
    price?: number; // Alternative property name
    unitPrice?: number; // Alternative property name
    [key: string]: any; // Allow other properties
  }>;
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  biayaTenagaKerja?: number;
  biayaOverhead?: number;
  marginKeuntunganPersen?: number;
}

export interface CostBreakdown {
  ingredientCost: number;
  laborCost: number;
  overheadCost: number;
  totalProductionCost: number;
  costPerPortion: number;
  costPerPiece: number;
}

export interface ProfitAnalysis {
  marginAmount: number;
  sellingPricePerPortion: number;
  sellingPricePerPiece: number;
  profitPerPortion: number;
  profitPerPiece: number;
  profitabilityLevel: 'high' | 'medium' | 'low';
}

export interface OverheadCalculation {
  overhead_per_unit: number;
  total_costs: number;
  metode: 'per_unit' | 'percentage';
  nilai_basis: number;
  material_cost?: number;
}

export interface ValidationErrors {
  biayaTenagaKerja?: string;
  biayaOverhead?: string;
  marginKeuntunganPersen?: string;
}

export interface TooltipContent {
  title: string;
  description: string;
  includes?: string[];
  excludes?: string[];
  formula?: string;
  example?: string;
}