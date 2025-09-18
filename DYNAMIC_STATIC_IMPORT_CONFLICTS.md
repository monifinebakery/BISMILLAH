# Dynamic Import and Static Import Conflicts

## Overview
During the build process, Vite reported several files that are both dynamically imported and statically imported. This can prevent proper code splitting and result in larger bundle sizes than expected.

## Files with Both Dynamic and Static Imports

### 1. Supabase Client (`src/integrations/supabase/client.ts`)
- **Dynamically imported by:**
  - `src/components/layout/AppLayout.tsx`
  - `src/components/supplier/SupplierManagement.tsx`
- **Statically imported by:** 50+ files including:
  - `src/components/MandatoryUpgradeModal.tsx`
  - `src/components/financial/contexts/FinancialContext.tsx`
  - `src/components/operational-costs/context/OperationalCostContext.tsx`
  - `src/components/profitAnalysis/components/ImprovedProfitDashboard.tsx`
  - And many more...

### 2. Auth Context (`src/contexts/AuthContext.tsx`)
- **Dynamically imported by:**
  - `src/utils/safariUtils.ts`
- **Statically imported by:** 30+ files including:
  - `src/components/AppSidebar.tsx`
  - `src/components/AuthGuard.tsx`
  - `src/components/financial/contexts/FinancialContext.tsx`
  - `src/components/warehouse/context/WarehouseContext.tsx`
  - And many more...

### 3. Warehouse Context (`src/components/warehouse/context/WarehouseContext.tsx`)
- **Dynamically imported by:**
  - `src/config/codeSplitting.ts` (multiple times)
- **Statically imported by:**
  - `src/components/AppSidebar.tsx`
  - `src/components/MobileExportButton.tsx`
  - `src/components/purchase/context/PurchaseContext.tsx`
  - `src/contexts/AppProviders.tsx`
  - And others...

### 4. Financial Context (`src/components/financial/contexts/FinancialContext.tsx`)
- **Dynamically imported by:**
  - `src/contexts/AppProviders.tsx`
- **Statically imported by:**
  - `src/components/AppSidebar.tsx`
  - `src/components/MobileExportButton.tsx`
  - `src/components/financial/hooks/useFinancialCore.ts`
  - `src/contexts/AppProviders.tsx`
  - And others...

### 5. Order Events (`src/components/orders/utils/orderEvents.ts`)
- **Dynamically imported by:**
  - `src/components/orders/services/orderService.ts` (multiple times)
- **Statically imported by:**
  - `src/components/orders/context/OrderProvider.tsx`

### 6. Profit Analysis Context (`src/components/profitAnalysis/contexts/ProfitAnalysisContext.tsx`)
- **Dynamically imported by:**
  - `src/contexts/AppProviders.tsx`
- **Statically imported by:**
  - `src/components/profitAnalysis/contexts/index.ts`

### 7. Profit Dashboard (`src/components/profitAnalysis/components/ImprovedProfitDashboard.tsx`)
- **Dynamically imported by:**
  - `src/config/codeSplitting.ts` (multiple times)
  - `src/routes/profit-analysis.tsx`
- **Statically imported by:**
  - `src/components/profitAnalysis/index.ts`

### 8. App Component (`src/App.tsx`)
- **Dynamically imported by:**
  - `src/utils/safariUtils.ts`
- **Statically imported by:**
  - `src/main.tsx`

## Impact
These conflicts prevent Vite from properly code-splitting these modules, which can lead to:
1. Larger bundle sizes than expected
2. Reduced performance due to unnecessary code loading
3. Suboptimal caching strategies

## Recommendations
1. **Standardize import patterns** - Choose either dynamic or static imports for each module
2. **Refactor code splitting configuration** to be consistent with actual usage patterns
3. **Consider creating dedicated utility functions** for modules that are used in both contexts
4. **Review the need for dynamic imports** in cases where static imports would be more appropriate