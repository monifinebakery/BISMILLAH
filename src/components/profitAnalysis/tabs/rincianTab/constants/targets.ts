// src/components/profitAnalysis/tabs/rincianTab/constants/targets.ts

export const COST_TARGETS = {
  // Percentage targets relative to revenue
  MATERIAL_RATIO_TARGET: 40,
  LABOR_RATIO_TARGET: 15,
  OVERHEAD_RATIO_TARGET: 15,
  COGS_RATIO_TARGET: 70,
  OPEX_RATIO_TARGET: 20,
  NET_MARGIN_TARGET: 10,
  
  // Efficiency targets
  MIN_REVENUE_PER_COST: 1.1,
  MIN_COGS_EFFICIENCY: 1.4,
  MIN_OPEX_EFFICIENCY: 5.0,
  
  // Thresholds for status determination
  PERCENTAGE_THRESHOLD: 2, // ±2% considered "on target"
  RATIO_THRESHOLD: 0.1,    // ±10% for ratio targets
} as const;

export const ANALYSIS_TARGETS = {
  MATERIAL: {
    target: COST_TARGETS.MATERIAL_RATIO_TARGET,
    threshold: COST_TARGETS.PERCENTAGE_THRESHOLD,
    label: 'Material vs Revenue',
    unit: '%',
    description: 'Material cost should be ≤40% of revenue'
  },
  LABOR: {
    target: COST_TARGETS.LABOR_RATIO_TARGET,
    threshold: COST_TARGETS.PERCENTAGE_THRESHOLD,
    label: 'Labor vs Revenue', 
    unit: '%',
    description: 'Labor cost should be ≤15% of revenue'
  },
  COGS: {
    target: COST_TARGETS.COGS_RATIO_TARGET,
    threshold: COST_TARGETS.PERCENTAGE_THRESHOLD,
    label: 'COGS vs Revenue',
    unit: '%',
    description: 'Total COGS should be ≤70% of revenue'
  },
  OPEX: {
    target: COST_TARGETS.OPEX_RATIO_TARGET,
    threshold: COST_TARGETS.PERCENTAGE_THRESHOLD,
    label: 'OPEX vs Revenue',
    unit: '%',
    description: 'Total OPEX should be ≤20% of revenue'
  },
  NET_MARGIN: {
    target: COST_TARGETS.NET_MARGIN_TARGET,
    threshold: COST_TARGETS.PERCENTAGE_THRESHOLD,
    label: 'Net Margin',
    unit: '%',
    description: 'Net margin should be ≥10%'
  }
} as const;

export const DATA_QUALITY_LEVELS = {
  ACTUAL: {
    label: 'Aktual',
    color: 'green',
    description: 'Data berdasarkan pencatatan aktual'
  },
  MIXED: {
    label: 'Campuran', 
    color: 'yellow',
    description: 'Kombinasi data aktual dan estimasi'
  },
  ESTIMATED: {
    label: 'Estimasi',
    color: 'orange', 
    description: 'Data berdasarkan estimasi'
  }
} as const;