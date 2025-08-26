# Dokumentasi Sistem Analisis Profit F&B

## Daftar Isi
1. [Gambaran Umum](#gambaran-umum)
2. [Fitur Utama](#fitur-utama)
3. [Struktur File](#struktur-file)
4. [Panduan Penggunaan](#panduan-penggunaan)
5. [Konfigurasi](#konfigurasi)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

## Gambaran Umum

Sistem Analisis Profit F&B adalah solusi komprehensif untuk menganalisis profitabilitas bisnis Food & Beverage. Sistem ini menyediakan berbagai metrik, analisis, dan rekomendasi untuk membantu pemilik bisnis F&B mengoptimalkan keuntungan mereka.

### Teknologi yang Digunakan
- **Frontend**: React + TypeScript
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks

## Fitur Utama

### 1. Metrik Efisiensi Operasional
**File**: `src/components/profitAnalysis/utils/efficiencyMetrics.ts`
**Komponen**: `EfficiencyMetricsCard.tsx`

**Fitur:**
- Revenue per hari kerja
- Cost per porsi
- Produktivitas bahan baku
- Turnover inventory
- Grading efisiensi (A-F)
- Benchmark industri

**Metrik yang Dihitung:**
```typescript
interface EfficiencyMetrics {
  revenuePerWorkingDay: number;
  costPerPortion: number;
  ingredientProductivity: number;
  inventoryTurnover: number;
  operationalEfficiency: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
```

### 2. Perbandingan Standar Industri
**File**: `IndustryBenchmarkCard.tsx`

**Jenis Bisnis yang Didukung:**
- Restoran (margin 15-25%)
- Kafe (margin 10-20%)
- Katering (margin 20-30%)
- Bakery (margin 25-35%)
- Fast Food (margin 8-15%)
- Street Food (margin 30-50%)

**Metrik Benchmark:**
- Margin kotor yang sehat
- Rasio COGS optimal
- Perbandingan dengan standar industri

### 3. Sistem Rekomendasi Otomatis
**File**: `src/components/profitAnalysis/utils/recommendationEngine.ts`
**Komponen**: `RecommendationSystemCard.tsx`

**Jenis Rekomendasi:**
- **Optimasi Harga**: Penyesuaian harga berdasarkan margin
- **Efisiensi Bahan**: Pengurangan waste dan optimasi porsi
- **Strategi Revenue**: Peningkatan penjualan dan upselling
- **Manajemen Biaya**: Kontrol COGS dan operational expense

**Prioritas Rekomendasi:**
- High: Dampak besar, mudah diimplementasi
- Medium: Dampak sedang atau implementasi kompleks
- Low: Dampak kecil atau jangka panjang

### 4. Analisis Cash Flow dan Prediksi Modal Kerja
**File**: `src/components/profitAnalysis/utils/cashFlowAnalysis.ts`
**Komponen**: `CashFlowAnalysisCard.tsx`

**Fitur:**
- Proyeksi cash flow 3 bulan ke depan
- Analisis working capital requirement
- Prediksi kebutuhan modal kerja
- Peringatan likuiditas
- Rekomendasi manajemen kas

**Metrik Cash Flow:**
```typescript
interface CashFlowProjection {
  period: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}
```

### 5. Analisis Tren Musiman dan Perencanaan Stok
**File**: `src/components/profitAnalysis/utils/seasonalAnalysis.ts`
**Komponen**: `SeasonalAnalysisCard.tsx`

**Fitur:**
- Identifikasi pola musiman
- Prediksi periode peak dan low season
- Rekomendasi perencanaan stok
- Strategi seasonal marketing
- Analisis tren penjualan

**Pola Musiman yang Dideteksi:**
- Ramadan/Lebaran (peningkatan 40-60%)
- Liburan sekolah (peningkatan 20-30%)
- Weekend pattern (peningkatan 15-25%)
- Cuaca ekstrem (penurunan 10-20%)

### 6. Optimasi Biaya dan Identifikasi Waste
**File**: `src/components/profitAnalysis/utils/costOptimization.ts`
**Komponen**: `CostOptimizationCard.tsx`

**Fitur:**
- Identifikasi bahan baku paling boros
- Analisis waste berdasarkan benchmark industri
- Perbandingan supplier
- Rekomendasi penghematan biaya
- Tracking efisiensi bahan

**Benchmark Waste Industri:**
- Restoran: 4-8%
- Kafe: 3-6%
- Bakery: 5-10%
- Fast Food: 2-5%

### 7. Sistem Notifikasi Otomatis
**File**: `src/components/profitAnalysis/utils/profitabilityAlerts.ts`
**Komponen**: `ProfitabilityAlertsCard.tsx`

**Jenis Peringatan:**
- **Critical**: Margin turun >20%, Cash flow negatif
- **Warning**: Margin turun 10-20%, COGS naik >15%
- **Info**: Tren positif, pencapaian target

**Threshold Default:**
```typescript
interface AlertThresholds {
  marginDropCritical: number;    // 20%
  marginDropWarning: number;     // 10%
  cogsIncreaseCritical: number;  // 20%
  cogsIncreaseWarning: number;   // 15%
  revenueDropCritical: number;   // 25%
  revenueDropWarning: number;    // 15%
}
```

## Struktur File

```
src/components/profitAnalysis/
├── components/
│   ├── ProfitDashboard.tsx           # Dashboard utama
│   ├── EfficiencyMetricsCard.tsx     # Metrik efisiensi
│   ├── IndustryBenchmarkCard.tsx     # Benchmark industri
│   ├── RecommendationSystemCard.tsx  # Sistem rekomendasi
│   ├── CashFlowAnalysisCard.tsx      # Analisis cash flow
│   ├── SeasonalAnalysisCard.tsx      # Analisis musiman
│   ├── CostOptimizationCard.tsx      # Optimasi biaya
│   └── ProfitabilityAlertsCard.tsx   # Sistem notifikasi
├── utils/
│   ├── efficiencyMetrics.ts          # Logic metrik efisiensi
│   ├── recommendationEngine.ts       # Engine rekomendasi
│   ├── cashFlowAnalysis.ts           # Logic cash flow
│   ├── seasonalAnalysis.ts           # Logic analisis musiman
│   ├── costOptimization.ts           # Logic optimasi biaya
│   ├── profitabilityAlerts.ts        # Logic sistem alert
│   └── config/
│       └── profitConfig.ts           # Konfigurasi bisnis
└── types/
    └── profitAnalysis.types.ts       # Type definitions
```

## Panduan Penggunaan

### 1. Instalasi dan Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 2. Integrasi ke Dashboard

```typescript
import ProfitDashboard from '@/components/profitAnalysis/components/ProfitDashboard';

function App() {
  return (
    <div>
      <ProfitDashboard 
        defaultPeriod="2024-01"
        showAdvancedMetrics={true}
      />
    </div>
  );
}
```

### 3. Kustomisasi Business Type

```typescript
import { BusinessType } from '@/components/profitAnalysis/utils/config/profitConfig';

// Set business type untuk analisis yang tepat
const businessType = BusinessType.FNB_RESTAURANT;
```

### 4. Konfigurasi Alert Thresholds

```typescript
import { ProfitabilityAlertsSystem } from '@/components/profitAnalysis/utils/profitabilityAlerts';

const customThresholds = {
  marginDropCritical: 25,
  marginDropWarning: 15,
  cogsIncreaseCritical: 25,
  cogsIncreaseWarning: 20,
  revenueDropCritical: 30,
  revenueDropWarning: 20
};

const alertSystem = new ProfitabilityAlertsSystem(customThresholds);
```

## Konfigurasi

### Business Types

```typescript
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

### Benchmark Configuration

Setiap jenis bisnis memiliki benchmark yang berbeda:

```typescript
const BUSINESS_BENCHMARKS = {
  [BusinessType.FNB_RESTAURANT]: {
    healthyMarginMin: 15,
    healthyMarginMax: 25,
    optimalCogsRatio: 35,
    // ...
  },
  // ...
};
```

## API Reference

### EfficiencyMetrics

```typescript
// Menghitung metrik efisiensi
function calculateEfficiencyMetrics(
  data: RealTimeProfitCalculation,
  businessType: BusinessType,
  workingDaysPerMonth: number = 26
): EfficiencyMetrics

// Mendapatkan benchmark untuk jenis bisnis
function getBenchmarkForBusinessType(
  businessType: BusinessType
): BusinessBenchmark
```

### RecommendationEngine

```typescript
// Generate rekomendasi
function generateRecommendations(
  currentData: RealTimeProfitCalculation,
  businessType: BusinessType,
  historicalData?: RealTimeProfitCalculation[]
): Recommendation[]

// Prioritas rekomendasi
function prioritizeRecommendations(
  recommendations: Recommendation[]
): Recommendation[]
```

### CashFlowAnalysis

```typescript
// Analisis cash flow
function analyzeCashFlow(
  currentData: RealTimeProfitCalculation,
  historicalData: RealTimeProfitCalculation[],
  businessType: BusinessType
): CashFlowAnalysisResult

// Proyeksi cash flow
function projectCashFlow(
  baseData: RealTimeProfitCalculation,
  months: number
): CashFlowProjection[]
```

### SeasonalAnalysis

```typescript
// Analisis tren musiman
function analyzeSeasonalTrends(
  historicalData: RealTimeProfitCalculation[],
  businessType: BusinessType,
  currentMonth: number
): SeasonalAnalysisResult

// Prediksi periode peak
function predictNextPeakPeriod(
  patterns: SeasonalPattern[],
  currentMonth: number
): { month: number; type: string; impact: number }
```

### CostOptimization

```typescript
// Analisis optimasi biaya
function analyzeCostOptimization(
  ingredients: IngredientCost[],
  businessType: BusinessType,
  totalRevenue: number
): CostOptimizationResult

// Identifikasi waste
function analyzeWaste(
  ingredients: IngredientCost[],
  businessType: BusinessType
): WasteAnalysis[]
```

### ProfitabilityAlerts

```typescript
// Sistem alert
class ProfitabilityAlertsSystem {
  constructor(thresholds?: Partial<AlertThresholds>)
  
  analyzeAlerts(
    currentData: RealTimeProfitCalculation,
    historicalData: RealTimeProfitCalculation[],
    businessType: BusinessType
  ): ProfitabilityAlert[]
}
```

## Troubleshooting

### Error Umum

1. **TypeScript Error: Property 'toFixed' does not exist on type 'never'**
   ```typescript
   // Solusi: Tambahkan optional chaining dan type checking
   value && typeof value === 'number' ? value.toFixed(2) : value || 0
   ```

2. **Data tidak muncul di dashboard**
   - Pastikan data `RealTimeProfitCalculation` tersedia
   - Check console untuk error API
   - Verifikasi business type sudah di-set dengan benar

3. **Rekomendasi tidak akurat**
   - Pastikan historical data cukup (minimal 3 bulan)
   - Verifikasi business type sesuai dengan jenis bisnis
   - Check konfigurasi threshold

### Performance Tips

1. **Optimasi Rendering**
   ```typescript
   // Gunakan useMemo untuk perhitungan berat
   const metrics = useMemo(() => 
     calculateEfficiencyMetrics(data, businessType), 
     [data, businessType]
   );
   ```

2. **Data Loading**
   ```typescript
   // Implementasi loading state
   if (loading) return <LoadingSpinner />;
   if (!data) return <EmptyState />;
   ```

3. **Error Handling**
   ```typescript
   try {
     const result = analyzeData(data);
     return result;
   } catch (error) {
     console.error('Analysis failed:', error);
     return defaultResult;
   }
   ```

## Kontribusi

Untuk berkontribusi pada sistem ini:

1. Fork repository
2. Buat feature branch
3. Implementasi fitur baru
4. Tambahkan unit tests
5. Update dokumentasi
6. Submit pull request

### Coding Standards

- Gunakan TypeScript untuk type safety
- Follow ESLint configuration
- Tambahkan JSDoc untuk fungsi public
- Implementasi error handling yang proper
- Tulis unit tests untuk logic bisnis

## Lisensi

Sistem ini dikembangkan untuk internal use. Semua hak cipta dilindungi.

---

**Versi**: 1.0.0  
**Terakhir diupdate**: Januari 2024  
**Maintainer**: Development Team