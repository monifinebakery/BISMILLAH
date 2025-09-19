// src/config/smartLazyLoading.ts
// Smart lazy loading - only for truly heavy components

import React from 'react';
import { MinimalLoader } from '@/components/ui/SimpleSkeleton';

// ❌ DON'T lazy load these (< 10KB components):
// - Small dialogs
// - Simple forms  
// - Basic tables
// - Control components

// ✅ DO lazy load these (> 50KB components):
// - Complex charts
// - Heavy forms with many fields
// - Large data tables
// - PDF generators
// - Analytics dashboards

export const HeavyComponents = {
  // Only the heaviest components
  ProfitAnalysisDashboard: React.lazy(() => 
    import('@/components/profitAnalysis/components/ImprovedProfitDashboard')
  ),
  
  InvoicePage: React.lazy(() => 
    import('@/components/invoice/InvoicePage')
  ),
  
  RecipeFormRefactored: React.lazy(() => 
    import('@/components/EnhancedRecipeFormRefactored')
  ),
  
  // Large data tables only
  WarehouseTable: React.lazy(() => 
    import('@/components/warehouse/components/WarehouseTable')
  )
};

// ✅ Lightweight fallback - no heavy skeleton
const QuickFallback = () => <MinimalLoader className="h-32" />;

// ✅ Smart wrapper - only wrap heavy components
export const withSmartLazy = <P extends object>(
  Component: React.ComponentType<P>,
  name: string
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <React.Suspense fallback={<QuickFallback />}>
      <Component {...props} ref={ref} />
    </React.Suspense>
  ));
};

// ✅ Bundle size thresholds
export const LAZY_LOAD_THRESHOLDS = {
  NEVER: 10, // < 10KB - never lazy load
  CONSIDER: 25, // 10-25KB - consider lazy load
  ALWAYS: 50, // > 50KB - always lazy load
} as const;