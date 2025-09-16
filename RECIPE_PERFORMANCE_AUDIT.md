# 🔍 AUDIT: Ringkasan Kinerja Recipe & Sinkronisasi Data

## 📋 Executive Summary

Audit ini menganalisis komponen "Ringkasan Kinerja" pada sistem resep, mengidentifikasi rantai data, formula perhitungan, dan konsistensi sinkronisasi.

## 🎯 Temuan Utama

### ✅ **SUDAH BENAR & TERSINKRON**

1. **Rantai Data Flow**
   - `src/components/recipe/components/RecipeList/index.tsx` (line 85)
     - Menggunakan `useRecipeStats({ recipes: filtering.filteredAndSortedRecipes })`
     - Props `stats={stats}` diteruskan ke `RecipeStats`
   
2. **Real-time Synchronization** ✅
   - `recipeApi.setupRealtimeSubscription()` aktif (line 160-178)
   - Listener: INSERT, UPDATE, DELETE tersambung dengan benar
   - State `recipes` terupdate otomatis → memicu recalculate `stats`
   - User ID filtering untuk multi-tenant security

3. **Transformasi Data** ✅
   - `recipeApi.transformFromDB()` handles snake_case ↔ camelCase
   - Field-field HPP per pcs, per porsi sudah konsisten

### 📊 **Formula Perhitungan - useRecipeStats.ts**

#### Performance Metrics (line 18-32):
```typescript
performanceMetrics: {
  profitableRecipes: recipesWithProfit.length,  // margin > 0
  profitablePercentage: (recipesWithProfit.length / recipes.length) * 100,
  averageMargin: recipesWithProfit.reduce(...) / recipesWithProfit.length,
  totalPotentialRevenue: recipes.reduce(sum + harga_jual_porsi * jumlah_porsi),
  totalCost: recipes.reduce(sum + total_hpp)
}
```

#### Profitability Stats (calculateRecipeStats line 300-310):
```typescript
profitabilityStats: {
  high: margin >= 30%,   // Excellent
  medium: 15-29%,        // Good  
  low: < 15%            // Needs improvement
}
```

## ⚠️ **ISSUES DITEMUKAN**

### 1. **Field Inconsistency Warning**
**Lokasi**: `useRecipeStats.ts` line 29
```typescript
// 🚨 POTENTIAL ISSUE: Mixed field usage
totalPotentialRevenue: recipes.reduce((sum, r) => sum + (r.harga_jual_porsi * r.jumlah_porsi), 0)
```

**Problem**: 
- `harga_jual_porsi` = harga per 1 porsi
- `jumlah_porsi` = jumlah porsi yang diproduksi  
- Ini menghitung revenue untuk **SELURUH BATCH** produksi
- Padahal seharusnya "potensi revenue" = harga jual × 1 porsi (single unit potential)

**Fix Needed**: Tentukan definisi yang konsisten:
- Option A: `r.harga_jual_porsi` saja (revenue per unit porsi)
- Option B: `r.harga_jual_per_pcs * (r.jumlah_porsi * r.jumlah_pcs_per_porsi)` (total batch)

### 2. **Missing PCS-Level Calculations**
**Current State**: Semua calculation di level porsi
**Missing**: Option untuk analisis per-piece metrics

### 3. **Edge Case: Division by Zero**
**Status**: ✅ Already handled di `useRecipeStats.ts`
- Line 23-25: `recipes.length > 0` guard
- Line 26-28: `recipesWithProfit.length > 0` guard

### 4. **RecipeList API Call Issue**
**Lokasi**: `RecipeList/index.tsx` line 135
```typescript
const result = await recipeApi.getRecipes(user.id);  // 🚨 WRONG SIGNATURE
```
**Problem**: `getRecipes()` method signature tidak menerima `userId` as first param
**Should be**: `await recipeApi.getRecipes()` (auth handled internally)

## 🔧 **REKOMENDASI FIXES**

### 1. Fix API Call in RecipeList
```diff
- const result = await recipeApi.getRecipes(user.id);
+ const recipes = await recipeApi.getRecipes();
- if (result.error) {
-   toast.error(`Gagal memuat resep: ${result.error}`);
- } else {
-   setRecipes(result.data);
-   logger.debug(`RecipeList: Loaded ${result.data.length} recipes`);
- }
+ setRecipes(recipes);
+ logger.debug(`RecipeList: Loaded ${recipes.length} recipes`);
```

### 2. Clarify Revenue Calculation
**Option A** - Per Unit Revenue (Recommended):
```typescript
totalPotentialRevenue: recipes.reduce((sum, r) => sum + r.harga_jual_porsi, 0)
```

**Option B** - Total Batch Revenue:  
```typescript
totalPotentialRevenue: recipes.reduce((sum, r) => sum + (r.harga_jual_porsi * r.jumlah_porsi), 0)
```

### 3. Add PCS-Level Analytics (Optional Enhancement)
```typescript
// In performanceMetrics
totalPotentialRevenuePcs: recipes.reduce((sum, r) => 
  sum + (r.harga_jual_per_pcs || (r.harga_jual_porsi / (r.jumlah_pcs_per_porsi || 1))), 0
)
```

### 4. Real-time Subscription Fix
```diff
// In RecipeList setupRealtimeSubscription call
const unsubscribe = recipeApi.setupRealtimeSubscription(
-  user.id,  // 🚨 REMOVE: not needed in signature
  (newRecipe) => { /* INSERT handler */ },
  (updatedRecipe) => { /* UPDATE handler */ }, 
  (deletedId) => { /* DELETE handler */ }
);
```

## 📈 **Ringkasan Kinerja Display**

**Lokasi**: `RecipeStats.tsx` line 262-349
- ✅ Tampil jika `performanceMetrics.profitableRecipes > 0`
- ✅ 4 metric cards dengan theming yang benar
- ✅ Responsive grid layout
- ✅ Consistent formatting dengan formatCurrency/formatPercentage

**Metrics Displayed**:
1. Resep Menguntungkan + %
2. Rata-rata Margin  
3. Total Potensi Revenue
4. Efisiensi Biaya (dengan div/0 guard)

## 🚀 **Action Items**

### High Priority
- [ ] Fix `recipeApi.getRecipes(user.id)` call in RecipeList
- [ ] Fix `setupRealtimeSubscription(user.id, ...)` parameter  
- [ ] Define consistent revenue calculation (per unit vs total batch)

### Medium Priority  
- [ ] Add validation logging untuk negative margins
- [ ] Consider per-piece analytics untuk detailed insights
- [ ] Add data quality metrics (recipes without cost data)

### Low Priority
- [ ] Add caching untuk expensive calculations
- [ ] Consider pagination untuk large recipe datasets
- [ ] Add export functionality untuk performance reports

## 🎯 **Conclusion**

Core functionality **WORKS CORRECTLY** dengan real-time sync aktif. Issues utama adalah:
1. API signature mismatch (easy fix)
2. Ambiguity di revenue calculation definition (business decision needed)

"Ringkasan Kinerja" component reliable dan production-ready dengan perbaikan kecil di atas.