# Auto-Sync Operational Costs Integration

## 🎯 Overview

Sistem telah disederhanakan dari **dual mode** menjadi **single auto-sync mode** untuk integrasi biaya operasional dengan recipe. Tidak ada lagi pilihan mode yang membingungkan - sistem otomatis menggunakan biaya operasional jika sudah dikonfigurasi.

## ✨ Fitur Utama

### 1. **Auto-Detection**
- Sistem otomatis mendeteksi apakah biaya operasional sudah dikonfigurasi
- Jika ada, otomatis gunakan untuk kalkulasi HPP
- Jika belum, fallback ke kalkulasi manual

### 2. **Single Mode Operation**
- **Sebelum**: Dual mode (Enhanced/Legacy) yang membingungkan
- **Sesudah**: Auto-sync mode tunggal yang simpel
- User tidak perlu pilih mode, sistem otomatis pilih yang terbaik

### 3. **Real-time Sync**
- Perubahan di biaya operasional otomatis tersinkron ke recipe
- Auto-recalculation dengan debounce untuk performance

## 🔧 Technical Changes

### New Components

#### `AutoSyncRecipeDisplay`
```tsx
// Simplified component yang mengganti RecipeHppIntegration
<AutoSyncRecipeDisplay
  recipeData={recipeDataForHpp}
  onResultChange={handleHppChange}
/>
```

#### `useAutoSyncRecipe` Hook
```tsx
// Hook yang mengganti useRecipeHppIntegration
const {
  result,
  hasOperationalCosts,
  isAutoSyncEnabled
} = useAutoSyncRecipe({
  bahanResep,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  marginKeuntunganPersen
});
```

### Updated RecipeContext

RecipeContext sekarang otomatis menggunakan operational costs:

```typescript
// Auto-detect operational costs
const settings = await getCurrentAppSettings();
const hasOperationalCosts = Boolean(
  (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0) || 
  (settings?.operasional_per_pcs && settings.operasional_per_pcs > 0)
);

if (hasOperationalCosts) {
  // Use enhanced calculation
  const enhancedResult = await calculateEnhancedHPP(...);
} else {
  // Fallback to legacy calculation
  const calculation = calculateHPP(...);
}
```

## 🚀 User Experience

### Flow Baru (Simplified)

1. **Setup Biaya Operasional**
   - User pergi ke Menu Biaya Operasional
   - Isi data dan hitung biaya produksi
   - Sistem otomatis menyimpan `overhead_per_pcs` dan `operasional_per_pcs`

2. **Auto-Sync ke Recipe**
   - Buat/edit recipe seperti biasa
   - Sistem otomatis deteksi biaya operasional
   - HPP dihitung otomatis menggunakan: `Bahan + Overhead + Operasional`
   - Status "✅ Aktif" tampil di calculator

3. **Tanpa Setup**
   - Jika belum setup biaya operasional
   - Status "⚪ Siap Setup" tampil
   - HPP menggunakan input manual seperti sebelumnya

## 💡 Benefits

### For Users
- **Tidak ada kebingungan mode** - sistem otomatis
- **Setup sekali, sync everywhere** - biaya operasional langsung tersinkron
- **Real-time updates** - perubahan biaya operasional otomatis update recipe
- **Visual feedback** jelas dengan status badges

### For Developers
- **Less complexity** - single mode, less state management
- **Better maintainability** - simplified component structure
- **Consistent behavior** - auto-detection logic consistent

## 🔍 Status Indicators

| Status | Badge | Meaning |
|--------|-------|---------|
| ✅ Aktif | Green | Biaya operasional tersinkron, auto-sync active |
| ⚪ Siap Setup | Gray | Belum ada biaya operasional, siap untuk setup |

## 🎨 UI Improvements

- **No more mode toggles** - simplified interface
- **Clear status indicators** - user tahu status dengan jelas  
- **Better messaging** - instruksi setup yang jelas
- **Auto-refresh** - otomatis update ketika operational costs berubah

## 🧪 Migration Path

Existing recipes will automatically benefit from this system:
1. Old recipes continue to work with manual calculation
2. When operational costs are configured, they automatically start using enhanced calculation
3. No data migration required - backward compatible

## 📊 Formula

**New Simplified Formula:**
```
HPP = Bahan (WAC) + Biaya Operasional (Overhead + Operasional)
```

Where:
- `Bahan (WAC)`: Material costs using Weighted Average Cost
- `Overhead`: Production overhead costs (includes TKL)
- `Operasional`: Operational costs

**Auto-detection Logic:**
```typescript
hasOperationalCosts = (overhead_per_pcs > 0) || (operasional_per_pcs > 0)
```

This simplified system eliminates confusion while maintaining all the power of the enhanced calculation system.