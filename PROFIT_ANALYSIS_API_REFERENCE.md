# API Reference - Sistem Analisis Profit F&B

## Daftar Isi
1. [Interfaces & Types](#interfaces--types)
2. [Utility Functions](#utility-functions)
3. [Component Props](#component-props)
4. [Configuration](#configuration)
5. [Error Handling](#error-handling)

## Interfaces & Types

### Core Data Types

```typescript
// Data profit utama
interface RealTimeProfitCalculation {
  calculated_at: string;
  revenue_data: {
    total: number;
    breakdown: any;
  };
  cogs_data: {
    total: number;
    breakdown: any;
  };
  opex_data: {
    total: number;
    breakdown: any;
  };
}

// Jenis bisnis F&B
enum BusinessType {
  FNB_RESTAURANT = 'fnb_restaurant',
  FNB_CAFE = 'fnb_cafe',
  FNB_CATERING = 'fnb_catering',
  FNB_BAKERY = 'fnb_bakery',
  FNB_FAST_FOOD = 'fnb_fast_food',
  FNB_STREET_FOOD = 'fnb_street_food',
  DEFAULT = 'default'
}
```

### Efficiency Metrics

```typescript
interface EfficiencyMetrics {
  revenuePerWorkingDay: number;
  costPerPortion: number;
  ingredientProductivity: number;
  inventoryTurnover: number;
  operationalEfficiency: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface BusinessBenchmark {
  healthyMarginMin: number;
  healthyMarginMax: number;
  optimalCogsRatio: number;
  averageRevenuePerDay: number;
  averageCostPerPortion: number;
  targetInventoryTurnover: number;
}
```

### Recommendation System

```typescript
interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedSavings: number;
  timeframe: string;
  priority: number;
  category: string;
}

enum RecommendationType {
  PRICE_OPTIMIZATION = 'price_optimization',
  INGREDIENT_EFFICIENCY = 'ingredient_efficiency',
  REVENUE_STRATEGY = 'revenue_strategy',
  COST_REDUCTION = 'cost_reduction'
}
```

### Cash Flow Analysis

```typescript
interface CashFlowAnalysisResult {
  currentCashPosition: number;
  projectedCashFlow: CashFlowProjection[];
  workingCapitalRequirement: number;
  liquidityRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
  insights: string[];
}

interface CashFlowProjection {
  period: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}
```

### Seasonal Analysis

```typescript
interface SeasonalAnalysisResult {
  trends: SeasonalTrend[];
  patterns: SeasonalPattern[];
  stockRecommendations: StockPlanningRecommendation[];
  insights: string[];
  nextPeakPrediction: {
    month: number;
    type: string;
    impact: number;
  };
}

interface SeasonalTrend {
  period: string;
  revenue: number;
  growth: number;
  pattern: string;
}

interface SeasonalPattern {
  name: string;
  months: number[];
  impact: number;
  type: 'increase' | 'decrease';
  description: string;
}
```

### Cost Optimization

```typescript
interface CostOptimizationResult {
  wasteAnalysis: WasteAnalysis[];
  optimizationOpportunities: CostOptimizationOpportunity[];
  supplierComparisons: SupplierComparison[];
  totalPotentialSavings: number;
  insights: string[];
}

interface IngredientCost {
  name: string;
  cost: number;
  usage: number;
  waste: number;
  supplier: string;
  lastUpdated: string;
}

interface WasteAnalysis {
  ingredient: string;
  wastePercentage: number;
  wasteValue: number;
  benchmarkWaste: number;
  status: 'good' | 'warning' | 'critical';
  recommendation: string;
}
```

### Profitability Alerts

```typescript
interface ProfitabilityAlert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  value: number;
  threshold: number;
  changePercentage: number;
  timestamp: string;
  actionRequired: boolean;
}

enum AlertType {
  MARGIN_DROP = 'margin_drop',
  COGS_INCREASE = 'cogs_increase',
  REVENUE_DROP = 'revenue_drop',
  EFFICIENCY_DECLINE = 'efficiency_decline',
  CASH_FLOW_WARNING = 'cash_flow_warning'
}

interface AlertThresholds {
  marginDropCritical: number;
  marginDropWarning: number;
  cogsIncreaseCritical: number;
  cogsIncreaseWarning: number;
  revenueDropCritical: number;
  revenueDropWarning: number;
}
```

## Utility Functions

### Efficiency Metrics

```typescript
/**
 * Menghitung metrik efisiensi operasional
 * @param data - Data profit real-time
 * @param businessType - Jenis bisnis F&B
 * @param workingDaysPerMonth - Jumlah hari kerja per bulan (default: 26)
 * @returns Metrik efisiensi lengkap
 */
function calculateEfficiencyMetrics(
  data: RealTimeProfitCalculation,
  businessType: BusinessType,
  workingDaysPerMonth: number = 26
): EfficiencyMetrics

/**
 * Mendapatkan benchmark untuk jenis bisnis tertentu
 * @param businessType - Jenis bisnis F&B
 * @returns Benchmark industri
 */
function getBenchmarkForBusinessType(
  businessType: BusinessType
): BusinessBenchmark

/**
 * Menghitung grade efisiensi berdasarkan skor
 * @param score - Skor efisiensi (0-100)
 * @returns Grade A-F
 */
function calculateEfficiencyGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F'
```

### Recommendation Engine

```typescript
/**
 * Generate rekomendasi berdasarkan data profit
 * @param currentData - Data profit saat ini
 * @param businessType - Jenis bisnis
 * @param historicalData - Data historis (opsional)
 * @returns Array rekomendasi
 */
function generateRecommendations(
  currentData: RealTimeProfitCalculation,
  businessType: BusinessType,
  historicalData?: RealTimeProfitCalculation[]
): Recommendation[]

/**
 * Mengurutkan rekomendasi berdasarkan prioritas
 * @param recommendations - Array rekomendasi
 * @returns Rekomendasi yang sudah diurutkan
 */
function prioritizeRecommendations(
  recommendations: Recommendation[]
): Recommendation[]

/**
 * Menghitung estimasi penghematan dari rekomendasi
 * @param recommendation - Rekomendasi
 * @param currentData - Data profit saat ini
 * @returns Estimasi penghematan dalam rupiah
 */
function calculateEstimatedSavings(
  recommendation: Recommendation,
  currentData: RealTimeProfitCalculation
): number
```

### Cash Flow Analysis

```typescript
/**
 * Menganalisis cash flow dan prediksi modal kerja
 * @param currentData - Data profit saat ini
 * @param historicalData - Data historis
 * @param businessType - Jenis bisnis
 * @returns Hasil analisis cash flow
 */
function analyzeCashFlow(
  currentData: RealTimeProfitCalculation,
  historicalData: RealTimeProfitCalculation[],
  businessType: BusinessType
): CashFlowAnalysisResult

/**
 * Membuat proyeksi cash flow untuk beberapa bulan ke depan
 * @param baseData - Data dasar untuk proyeksi
 * @param months - Jumlah bulan proyeksi
 * @param growthRate - Tingkat pertumbuhan (opsional)
 * @returns Array proyeksi cash flow
 */
function projectCashFlow(
  baseData: RealTimeProfitCalculation,
  months: number,
  growthRate?: number
): CashFlowProjection[]

/**
 * Menghitung kebutuhan modal kerja
 * @param data - Data profit
 * @param businessType - Jenis bisnis
 * @returns Kebutuhan modal kerja dalam rupiah
 */
function calculateWorkingCapitalRequirement(
  data: RealTimeProfitCalculation,
  businessType: BusinessType
): number
```

### Seasonal Analysis

```typescript
/**
 * Menganalisis tren musiman dari data historis
 * @param historicalData - Data historis minimal 12 bulan
 * @param businessType - Jenis bisnis
 * @param currentMonth - Bulan saat ini (1-12)
 * @returns Hasil analisis musiman
 */
function analyzeSeasonalTrends(
  historicalData: RealTimeProfitCalculation[],
  businessType: BusinessType,
  currentMonth: number
): SeasonalAnalysisResult

/**
 * Mendapatkan pola musiman untuk jenis bisnis
 * @param businessType - Jenis bisnis
 * @returns Array pola musiman
 */
function getSeasonalPatterns(businessType: BusinessType): SeasonalPattern[]

/**
 * Memprediksi periode peak berikutnya
 * @param patterns - Pola musiman
 * @param currentMonth - Bulan saat ini
 * @returns Prediksi periode peak
 */
function predictNextPeakPeriod(
  patterns: SeasonalPattern[],
  currentMonth: number
): { month: number; type: string; impact: number }
```

### Cost Optimization

```typescript
/**
 * Menganalisis optimasi biaya dan identifikasi waste
 * @param ingredients - Data bahan baku
 * @param businessType - Jenis bisnis
 * @param totalRevenue - Total revenue
 * @returns Hasil analisis optimasi biaya
 */
function analyzeCostOptimization(
  ingredients: IngredientCost[],
  businessType: BusinessType,
  totalRevenue: number
): CostOptimizationResult

/**
 * Menganalisis waste bahan baku
 * @param ingredients - Data bahan baku
 * @param businessType - Jenis bisnis
 * @returns Analisis waste per bahan
 */
function analyzeWaste(
  ingredients: IngredientCost[],
  businessType: BusinessType
): WasteAnalysis[]

/**
 * Mengidentifikasi peluang optimasi biaya
 * @param wasteAnalysis - Hasil analisis waste
 * @param totalRevenue - Total revenue
 * @returns Peluang optimasi
 */
function identifyOptimizationOpportunities(
  wasteAnalysis: WasteAnalysis[],
  totalRevenue: number
): CostOptimizationOpportunity[]
```

### Profitability Alerts

```typescript
/**
 * Kelas untuk sistem alert profitabilitas
 */
class ProfitabilityAlertsSystem {
  constructor(thresholds?: Partial<AlertThresholds>)
  
  /**
   * Menganalisis dan menghasilkan alert
   * @param currentData - Data profit saat ini
   * @param historicalData - Data historis
   * @param businessType - Jenis bisnis
   * @returns Array alert
   */
  analyzeAlerts(
    currentData: RealTimeProfitCalculation,
    historicalData: RealTimeProfitCalculation[],
    businessType: BusinessType
  ): ProfitabilityAlert[]
  
  /**
   * Update konfigurasi threshold
   * @param newThresholds - Threshold baru
   */
  updateThresholds(newThresholds: Partial<AlertThresholds>): void
  
  /**
   * Mendapatkan konfigurasi threshold saat ini
   * @returns Threshold configuration
   */
  getThresholds(): AlertThresholds
}

/**
 * Utility functions untuk alert
 */
function getAlertIcon(type: AlertType): string
function getAlertColor(severity: 'critical' | 'warning' | 'info'): string
function formatAlertMessage(alert: ProfitabilityAlert): string
```

## Component Props

### ProfitDashboard

```typescript
interface ProfitDashboardProps {
  className?: string;
  defaultPeriod?: string;
  showAdvancedMetrics?: boolean;
}
```

### EfficiencyMetricsCard

```typescript
interface EfficiencyMetricsCardProps {
  data: RealTimeProfitCalculation;
  businessType: BusinessType;
  workingDaysPerMonth?: number;
  className?: string;
}
```

### RecommendationSystemCard

```typescript
interface RecommendationSystemCardProps {
  currentData: RealTimeProfitCalculation;
  historicalData?: RealTimeProfitCalculation[];
  businessType: BusinessType;
  onRecommendationClick?: (recommendation: Recommendation) => void;
  className?: string;
}
```

### CashFlowAnalysisCard

```typescript
interface CashFlowAnalysisCardProps {
  currentData: RealTimeProfitCalculation;
  historicalData: RealTimeProfitCalculation[];
  businessType: BusinessType;
  projectionMonths?: number;
  className?: string;
}
```

### SeasonalAnalysisCard

```typescript
interface SeasonalAnalysisCardProps {
  historicalData: RealTimeProfitCalculation[];
  businessType: BusinessType;
  currentMonth: number;
  className?: string;
}
```

### CostOptimizationCard

```typescript
interface CostOptimizationCardProps {
  ingredients: IngredientCost[];
  businessType: BusinessType;
  totalRevenue: number;
  className?: string;
}
```

### ProfitabilityAlertsCard

```typescript
interface ProfitabilityAlertsCardProps {
  currentData: RealTimeProfitCalculation;
  historicalData: RealTimeProfitCalculation[];
  businessType: BusinessType;
  configuration?: Partial<AlertThresholds>;
  onConfigChange?: (config: AlertThresholds) => void;
  className?: string;
}
```

## Configuration

### Business Benchmarks

```typescript
const BUSINESS_BENCHMARKS: Record<BusinessType, BusinessBenchmark> = {
  [BusinessType.FNB_RESTAURANT]: {
    healthyMarginMin: 15,
    healthyMarginMax: 25,
    optimalCogsRatio: 35,
    averageRevenuePerDay: 5000000,
    averageCostPerPortion: 15000,
    targetInventoryTurnover: 12
  },
  [BusinessType.FNB_CAFE]: {
    healthyMarginMin: 10,
    healthyMarginMax: 20,
    optimalCogsRatio: 30,
    averageRevenuePerDay: 2000000,
    averageCostPerPortion: 8000,
    targetInventoryTurnover: 15
  },
  // ... konfigurasi lainnya
};
```

### Alert Thresholds

```typescript
const DEFAULT_ALERT_THRESHOLDS: Record<BusinessType, AlertThresholds> = {
  [BusinessType.FNB_RESTAURANT]: {
    marginDropCritical: 20,
    marginDropWarning: 10,
    cogsIncreaseCritical: 20,
    cogsIncreaseWarning: 15,
    revenueDropCritical: 25,
    revenueDropWarning: 15
  },
  // ... konfigurasi lainnya
};
```

### Seasonal Patterns

```typescript
const SEASONAL_PATTERNS: Record<BusinessType, SeasonalPattern[]> = {
  [BusinessType.FNB_RESTAURANT]: [
    {
      name: 'Ramadan Boost',
      months: [3, 4], // Maret-April (tergantung tahun)
      impact: 0.4, // 40% increase
      type: 'increase',
      description: 'Peningkatan signifikan selama bulan Ramadan'
    },
    // ... pola lainnya
  ]
};
```

## Error Handling

### Error Types

```typescript
class ProfitAnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ProfitAnalysisError';
  }
}

enum ErrorCodes {
  INVALID_DATA = 'INVALID_DATA',
  INSUFFICIENT_HISTORICAL_DATA = 'INSUFFICIENT_HISTORICAL_DATA',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}
```

### Error Handling Utilities

```typescript
/**
 * Validasi data profit
 * @param data - Data yang akan divalidasi
 * @throws ProfitAnalysisError jika data tidak valid
 */
function validateProfitData(data: any): asserts data is RealTimeProfitCalculation {
  if (!data) {
    throw new ProfitAnalysisError(
      'Data profit tidak boleh null atau undefined',
      ErrorCodes.INVALID_DATA
    );
  }
  
  if (!data.revenue_data?.total || typeof data.revenue_data.total !== 'number') {
    throw new ProfitAnalysisError(
      'Revenue data tidak valid',
      ErrorCodes.INVALID_DATA,
      { data }
    );
  }
  
  // ... validasi lainnya
}

/**
 * Safe wrapper untuk perhitungan yang mungkin error
 * @param calculation - Fungsi perhitungan
 * @param fallback - Nilai fallback jika error
 * @returns Hasil perhitungan atau fallback
 */
function safeCalculate<T>(
  calculation: () => T,
  fallback: T
): T {
  try {
    return calculation();
  } catch (error) {
    console.error('Calculation error:', error);
    return fallback;
  }
}
```

### Usage Examples

```typescript
// Contoh penggunaan dengan error handling
try {
  validateProfitData(profitData);
  
  const metrics = calculateEfficiencyMetrics(
    profitData,
    BusinessType.FNB_RESTAURANT
  );
  
  const recommendations = generateRecommendations(
    profitData,
    BusinessType.FNB_RESTAURANT,
    historicalData
  );
  
} catch (error) {
  if (error instanceof ProfitAnalysisError) {
    console.error(`Profit analysis error [${error.code}]:`, error.message);
    // Handle specific error
  } else {
    console.error('Unexpected error:', error);
    // Handle unexpected error
  }
}

// Contoh safe calculation
const safeMetrics = safeCalculate(
  () => calculateEfficiencyMetrics(data, businessType),
  {
    revenuePerWorkingDay: 0,
    costPerPortion: 0,
    ingredientProductivity: 0,
    inventoryTurnover: 0,
    operationalEfficiency: 0,
    grade: 'F' as const
  }
);
```

---

**Catatan**: API ini dirancang untuk fleksibilitas dan kemudahan penggunaan. Semua fungsi memiliki parameter opsional dengan nilai default yang masuk akal, dan error handling yang komprehensif.