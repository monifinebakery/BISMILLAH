# Dynamic Import and Static Import Conflicts - Detailed Analysis

## Overview
During the build process, Vite reported several files that are both dynamically imported and statically imported. This prevents proper code splitting and can result in larger bundle sizes than expected.

## Detailed Analysis of Conflicts

### 1. Supabase Client (`src/integrations/supabase/client.ts`)
**Dynamic Imports:**
- `src/components/layout/AppLayout.tsx`
- `src/components/supplier/SupplierManagement.tsx`

**Static Imports (50+ files):**
- `src/components/MandatoryUpgradeModal.tsx`
- `src/components/financial/contexts/FinancialContext.tsx`
- `src/components/operational-costs/context/OperationalCostContext.tsx`
- `src/components/profitAnalysis/components/ImprovedProfitDashboard.tsx`
- And many more...

**Impact:** The supabase client is being loaded in multiple chunks, preventing optimal code splitting.

### 2. Auth Context (`src/contexts/AuthContext.tsx`)
**Dynamic Imports:**
- `src/utils/safariUtils.ts` (via `import.meta.glob`)

**Static Imports (30+ files):**
- `src/components/AppSidebar.tsx`
- `src/components/AuthGuard.tsx`
- `src/components/financial/contexts/FinancialContext.tsx`
- `src/components/warehouse/context/WarehouseContext.tsx`
- And many more...

**Impact:** AuthContext is loaded both as part of the main bundle and as a separate chunk.

### 3. Warehouse Context (`src/components/warehouse/context/WarehouseContext.tsx`)
**Dynamic Imports:**
- `src/config/codeSplitting.ts` (multiple times)
- `src/components/purchase/hooks/usePurchaseStatus.ts`

**Static Imports:**
- `src/components/AppSidebar.tsx`
- `src/components/MobileExportButton.tsx`
- `src/components/purchase/context/PurchaseContext.tsx`
- `src/contexts/AppProviders.tsx`
- And others...

**Impact:** WarehouseContext is loaded in multiple places, preventing optimal code splitting.

### 4. Financial Context (`src/components/financial/contexts/FinancialContext.tsx`)
**Dynamic Imports:**
- `src/contexts/AppProviders.tsx`

**Static Imports:**
- `src/components/AppSidebar.tsx`
- `src/components/MobileExportButton.tsx`
- `src/components/financial/hooks/useFinancialCore.ts`
- `src/contexts/AppProviders.tsx`
- And others...

**Impact:** FinancialContext is loaded both as part of the main bundle and as a separate chunk.

### 5. Order Events (`src/components/orders/utils/orderEvents.ts`)
**Dynamic Imports:**
- `src/components/orders/services/orderService.ts` (multiple times)

**Static Imports:**
- `src/components/orders/context/OrderProvider.tsx`

**Impact:** Order events utilities are loaded in multiple chunks.

### 6. Profit Analysis Context (`src/components/profitAnalysis/contexts/ProfitAnalysisContext.tsx`)
**Dynamic Imports:**
- `src/contexts/AppProviders.tsx`

**Static Imports:**
- `src/components/profitAnalysis/contexts/index.ts`

**Impact:** ProfitAnalysisContext is loaded both as part of the main bundle and as a separate chunk.

### 7. Profit Dashboard (`src/components/profitAnalysis/components/ImprovedProfitDashboard.tsx`)
**Dynamic Imports:**
- `src/config/codeSplitting.ts` (multiple times)
- `src/routes/profit-analysis.tsx`
- `src/utils/route-preloader.ts`

**Static Imports:**
- `src/components/profitAnalysis/index.ts`

**Impact:** Profit dashboard is loaded in multiple chunks, preventing optimal code splitting.

### 8. App Component (`src/App.tsx`)
**Dynamic Imports:**
- `src/utils/safariUtils.ts` (via `import.meta.glob`)

**Static Imports:**
- `src/main.tsx`

**Impact:** The main App component is loaded both as part of the main bundle and as a separate chunk.

## Root Causes

1. **Mixed Import Patterns**: Some modules are imported statically in many places but also dynamically in specific scenarios.
2. **Preloading Strategies**: Some files use `import.meta.glob` for preloading which creates dynamic imports.
3. **Code Splitting Configuration**: The code splitting configuration in `codeSplitting.ts` conflicts with static imports used throughout the application.
4. **Context Providers**: React context providers are often imported statically but also dynamically in lazy loading scenarios.

## Recommendations

### 1. Standardize Import Patterns
Choose either dynamic or static imports for each module and be consistent:
- For core modules used throughout the app (like AuthContext, Supabase client), use static imports
- For heavy or rarely used modules (like specific dashboard components), use dynamic imports

### 2. Refactor Code Splitting Configuration
Update `src/config/codeSplitting.ts` to align with actual usage patterns:
- Remove dynamic imports for modules that are used in many places statically
- Ensure dynamic imports are only used for truly optional or rarely used components

### 3. Fix Preloading Issues
In `src/utils/safariUtils.ts`, the `import.meta.glob` usage creates dynamic imports:
```typescript
const modules = import.meta.glob([
  '../App.tsx',  // This creates a dynamic import
  '../contexts/AuthContext.tsx'
]);
```

Consider alternative preloading strategies that don't conflict with static imports.

### 4. Optimize Context Providers
For context providers that are used both statically and dynamically:
- Create a unified loading strategy
- Consider using React.lazy with Suspense boundaries consistently
- Avoid importing the same context both statically and dynamically

### 5. Review Bundle Analysis
Regularly analyze bundle sizes to identify modules that are being loaded multiple times:
- Use tools like `vite-bundle-visualizer` to identify duplicate modules
- Set up monitoring to catch these issues early

## Implementation Plan

1. **Immediate Fixes**:
   - Remove conflicting dynamic imports from `safariUtils.ts`
   - Update `codeSplitting.ts` to remove conflicts with static imports
   - Standardize context provider imports

2. **Medium-term Improvements**:
   - Implement consistent lazy loading patterns
   - Create a unified module loading strategy
   - Establish coding guidelines for imports

3. **Long-term Monitoring**:
   - Set up automated bundle analysis
   - Create import linting rules to prevent conflicts
   - Regular performance audits

This will help improve code splitting, reduce bundle sizes, and enhance overall application performance.