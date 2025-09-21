# File Debounce Checklist - BISMILLAH Project

## ✅ Sudah Diperbaiki (Fixed)

### 1. Shared Components (High Priority - Banyak Digunakan)
- ✅ **SearchInput** (`/src/components/shared/filters/SearchInput.tsx`) 
  - Menambahkan debounce dengan prop `debounceMs` (default 300ms)
  - Menggunakan `helpers.debounce` dari promoCalculator utils
  - Component ini digunakan di banyak tempat, jadi impact besar

- ✅ **CurrencyInput** (`/src/components/ui/CurrencyInput.tsx`)
  - Menambahkan debounce untuk input saat typing 
  - Menambahkan prop `debounceMs` (default 300ms)
  - Tetap instant saat blur/focus untuk UX yang baik

### 2. Filter Components  
- ✅ **RecipeFilters** (`/src/components/recipe/components/RecipeList/RecipeFilters.tsx`)
  - Diganti pakai shared SearchInput yang sudah ada debounce
  - Menghapus custom search input yang lama

## ❌ Masih Perlu Diperbaiki (Todo)

### 1. Form Components dengan Price/Number Inputs
- ❌ **BogoForm** (`/src/components/promoCalculator/calculator/forms/BogoForm.tsx`)
  - Search input di recipe selector (line 157)
  - Form inputs untuk minimal qty, tanggal, dll

- ❌ **DiscountForm** (`/src/components/promoCalculator/calculator/forms/DiscountForm.tsx`) 
  - Search input di recipe selector (line 132)
  - Price inputs untuk nilai diskon, minimal pembelian, dll

- ❌ **BundleForm** (`/src/components/promoCalculator/calculator/forms/BundleForm.tsx`)
  - Multiple search inputs dan price inputs

- ❌ **CostForm** (`/src/components/operational-costs/components/CostForm.tsx`)
  - Number inputs yang trigger calculations

- ❌ **AssetFormFields** (`/src/components/assets/components/AssetFormFields.tsx`)
  - Price inputs untuk asset values

### 2. Supplier & Purchase Forms
- ❌ **SupplierForm** (`/src/components/supplier/SupplierForm.tsx`)
  - Text inputs untuk nama, alamat, kontak (lines 55, 71, 87, 103, 118, 132)

- ❌ **SupplierFormNew** (`/src/components/supplier/SupplierFormNew.tsx`) 
  - Similar inputs seperti SupplierForm

- ❌ **PurchaseAddEditPage** (`/src/components/purchase/PurchaseAddEditPage.tsx`)
  - Form inputs yang bisa trigger API calls

### 3. Warehouse & Inventory Forms  
- ❌ **WarehouseAddEditPage** (`/src/components/warehouse/components/WarehouseAddEditPage.tsx`)
  - Multiple form inputs (lines 400, 518, 553, 571, 596)

- ❌ **EditBahanBaku** (`/src/components/warehouse/pages/EditBahanBaku.tsx`)
  - Form inputs untuk editing bahan baku (lines 136, 243, 255, 278, etc)

- ❌ **AddEditDialog** (`/src/components/warehouse/dialogs/AddEditDialog.tsx`)
  - Form inputs dalam dialog (lines 403, 513, 531, 542, 563)

### 4. Auth Forms (Lower Priority)
- ❌ **OTPForm** (`/src/components/auth/OTPForm.tsx`)
  - OTP input yang mungkin perlu debounce untuk validation

- ❌ **EmailAuthPage** (`/src/components/EmailAuthPage.tsx`)
  - Email/password inputs yang trigger validation

## 📋 Rekomendasi Prioritas

### High Priority (Segera):
1. **Form components dengan calculations** - BogoForm, DiscountForm, BundleForm
2. **Supplier forms** - banyak text inputs yang bisa performance impact  
3. **Warehouse forms** - inventory updates perlu smooth

### Medium Priority:
1. **Search inputs di forms** - ganti dengan shared SearchInput
2. **Price inputs** - ganti dengan CurrencyInput yang sudah ada debounce

### Low Priority:  
1. **Auth forms** - sudah jarang digunakan setelah login
2. **Settings forms** - tidak sering diakses

## 🛠️ Tools Yang Tersedia

### Debounce Utilities:
1. `helpers.debounce` - dari `/src/components/promoCalculator/utils/helpers.js` (line 156)
2. `debounce` - dari `/src/utils/index.ts` (line 87) 
3. `useDebounce` hook - dari `/src/hooks/index.ts` (line 161)

### Shared Components:
1. `SearchInput` - sudah ada debounce built-in
2. `CurrencyInput` - sudah ada debounce built-in

## 💡 Pattern Yang Sudah Terbukti

```typescript
// Pattern 1: Menggunakan helpers.debounce
import { helpers } from '@/components/promoCalculator/utils/helpers';

const debouncedOnChange = useMemo(
  () => helpers.debounce(onChange, 300),
  [onChange]
);

// Pattern 2: Menggunakan shared components
import { SearchInput } from '@/components/shared/filters';

<SearchInput
  value={searchTerm}
  onChange={onSearchChange} 
  debounceMs={300}
/>

// Pattern 3: Menggunakan CurrencyInput
import { CurrencyInput } from '@/components/ui/CurrencyInput';

<CurrencyInput
  value={price}
  onChange={onPriceChange}
  debounceMs={300}
/>
```

---

**Status**: 3/20+ files fixed (15% complete)
**Impact**: High - shared components akan fix banyak tempat sekaligus
**Next**: Focus on promo calculator forms dan supplier forms