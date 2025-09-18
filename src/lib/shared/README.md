# 📚 Shared Formatters & Components Documentation

## 🎯 Overview

Koleksi lengkap **shared utilities** dan **reusable components** untuk formatting dan display data di seluruh aplikasi. Menggantikan duplikasi functions di berbagai file dengan single source of truth.

## 🚀 Quick Start

```typescript
// Import formatters
import { formatCurrency, formatCompactCurrency } from '@/lib/shared';

// Import components
import { CurrencyDisplay, StatCard } from '@/lib/shared';

// Atau import grup
import { CurrencyFormatter, FormattedDisplayComponents } from '@/lib/shared';
```

## 💰 Currency Formatters

### `formatCurrency(value, options?)`
Format angka menjadi mata uang Rupiah.

```typescript
formatCurrency(15000)                    // "Rp 15.000"
formatCurrency(15000.50, { 
  minimumFractionDigits: 2 
})                                       // "Rp 15.000,50"
```

### `formatCompactCurrency(value, options?)`
Format mata uang dengan singkatan Indonesia.

```typescript
formatCompactCurrency(1500000)          // "Rp 1,5 jt"
formatCompactCurrency(2500000000)       // "Rp 2,5 miliar"
formatCompactCurrency(750)              // "Rp 750" (di bawah threshold)

// Options
formatCompactCurrency(1500000, {
  digits: 2,                            // "Rp 1,50 jt"
  withCurrency: false,                  // "1,5 jt"
  threshold: 10000                      // Custom threshold
})
```

## 📊 Number & Percentage Formatters

### `formatNumber(value)`
Format angka dengan pemisah ribuan Indonesia.

```typescript
formatNumber(1234567)                   // "1.234.567"
```

### `formatPercentage(value, decimals?)`
Format persentase dengan Intl Indonesia.

```typescript
formatPercentage(0.25)                  // "25,0%"
formatPercentage(0.1234, 2)             // "12,34%"
```

## 📅 Date Formatters

### `formatDate(date, style?)`
Format tanggal dengan style Indonesia.

```typescript
const date = new Date('2024-12-25');

formatDate(date)                        // "25 Des 2024"
formatDate(date, 'short')               // "25/12/24"
formatDate(date, 'long')                // "25 Desember 2024"
```

### `formatRelativeTime(date)`
Format waktu relatif dalam bahasa Indonesia.

```typescript
formatRelativeTime(new Date(Date.now() - 3600000))  // "1 jam yang lalu"
formatRelativeTime(new Date(Date.now() - 60000))    // "1 menit yang lalu"
```

## 🎨 UI Components

### `<CurrencyDisplay>`
Component untuk menampilkan mata uang.

```tsx
// Basic usage
<CurrencyDisplay value={1500000} />                    // "Rp 1.500.000"

// Compact mode
<CurrencyDisplay 
  value={1500000} 
  compact 
  className="text-2xl font-bold"
/>                                                      // "Rp 1,5 jt"

// Custom threshold
<CurrencyDisplay 
  value={5000} 
  compact 
  compactThreshold={10000}
/>                                                      // "Rp 5.000"
```

### `<StatusBadge>`
Component badge untuk status dengan styling otomatis.

```tsx
<StatusBadge status="pending" />                       // Badge kuning "Menunggu"
<StatusBadge status="completed" size="lg" />           // Badge hijau besar "Selesai"
<StatusBadge status="cancelled" variant="outline" />   // Badge merah outline
```

### `<StatCard>`
Card statistik reusable dengan formatting otomatis.

```tsx
import { Package } from 'lucide-react';

<StatCard 
  label="Total Pesanan"
  value={1234567}
  formatter="currency"
  compact
  icon={<Package />}
  trend={{ value: 12.5, isPositive: true }}
  colorized
/>
```

### `<PercentageDisplay>`
Component untuk menampilkan persentase.

```tsx
<PercentageDisplay value={0.25} />                     // "25,0%"
<PercentageDisplay 
  value={0.15} 
  decimals={2} 
  colorized 
  showSign 
/>                                                      // "+15,00%" dengan warna
```

## 🎯 Migration Guide

### Before (dengan duplikasi)

```typescript
// OrderStatistics.tsx
const formatCompactCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} jt`;
  }
  // ... duplicate logic
};

// PromoAnalytics.tsx  
const formatCompactCurrency = (value) => {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)} jt`;
  }
  // ... same duplicate logic
};
```

### After (dengan shared utilities)

```typescript
// OrderStatistics.tsx
import { formatCompactCurrency } from '@/lib/shared';

// Usage - no more duplicate functions!
const formattedRevenue = formatCompactCurrency(statistics.totalRevenue);

// PromoAnalytics.tsx
import { CurrencyDisplay } from '@/lib/shared';

// Even better - use component
<CurrencyDisplay value={totalRevenue} compact />
```

## 📈 Advanced Usage

### Custom Formatters dengan Components

```tsx
import { ColorizedValue, formatCompactCurrency } from '@/lib/shared';

<ColorizedValue 
  value={marginPercentage}
  formatter={(value) => `${value}% margin`}
  ranges={{
    excellent: 30,
    good: 15,
    warning: 5
  }}
/>
```

### Grouped Imports

```typescript
import { 
  CurrencyFormatter, 
  DateFormatter,
  FormattedDisplayComponents 
} from '@/lib/shared';

// Usage
const formattedPrice = CurrencyFormatter.compact(1500000);
const formattedDate = DateFormatter.relative(new Date());

// Components
const { Currency, Status, Card } = FormattedDisplayComponents;
```

## ✅ Best Practices

### 1. **Konsistensi Formatting**
```typescript
// ❌ Don't - different formats
const price1 = `Rp ${(1500000 / 1000000).toFixed(1)}M`;
const price2 = `Rp ${(1500000 / 1000).toFixed(1)}K`;

// ✅ Do - consistent format
const price1 = formatCompactCurrency(1500000);  // "Rp 1,5 jt"
const price2 = formatCompactCurrency(1500);     // "Rp 1,5 rb"
```

### 2. **Reusable Components**
```tsx
// ❌ Don't - duplicate JSX
<div className="text-2xl font-bold text-green-600">
  Rp 1,5 jt
</div>

// ✅ Do - reusable component
<CurrencyDisplay 
  value={1500000} 
  compact 
  className="text-2xl font-bold text-green-600"
/>
```

### 3. **Type Safety**
```typescript
import type { CurrencyDisplayProps } from '@/lib/shared';

const MyComponent: React.FC<{
  revenue: number;
  displayProps?: Partial<CurrencyDisplayProps>;
}> = ({ revenue, displayProps }) => (
  <CurrencyDisplay value={revenue} {...displayProps} />
);
```

## 🔧 Maintenance

### File Structure
```
src/lib/shared/
├── index.ts                 # Main exports
├── formatters.ts           # All formatting functions
├── components/
│   └── FormattedDisplay.tsx # React components
└── README.md               # This documentation
```

### Adding New Formatters
1. Add function to `formatters.ts`
2. Export in `index.ts`  
3. Update documentation
4. Add tests (optional)

### Adding New Components
1. Add component to `FormattedDisplay.tsx`
2. Export in component file and `index.ts`
3. Update documentation with examples

## 🎉 Benefits

### ✅ **Eliminated Duplications:**
- ❌ `formatCurrency` in 4 files → ✅ 1 shared function
- ❌ `formatCompactCurrency` in 2 components → ✅ 1 shared function + component
- ❌ `formatLargeNumber` in 3 files → ✅ 1 shared function

### ✅ **Improved Consistency:**
- Single source of truth untuk format mata uang Indonesia
- Consistent behavior di seluruh aplikasi
- Easier maintenance dan updates

### ✅ **Better DX (Developer Experience):**
- Easy imports: `import { currency } from '@/lib/shared'`
- TypeScript support dengan proper types
- Reusable components dengan props

### ✅ **Performance:**
- Reduced bundle size (no duplicate functions)
- Better tree-shaking
- Optimized imports

---

## 🚀 Next Steps

1. **Refactor Existing Components** - Update OrderStatistics, PromoAnalytics, dll untuk menggunakan shared utilities
2. **Add More Components** - TrendIndicator, ProgressBar, dll
3. **Add Tests** - Unit tests untuk semua formatters dan components
4. **Documentation** - JSDoc comments dan Storybook stories

Happy coding! 🎉