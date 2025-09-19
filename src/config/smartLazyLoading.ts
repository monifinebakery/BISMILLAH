// src/config/smartLazyLoading.ts
// Smart lazy loading - only for truly heavy components

import React from 'react';
// Simple loader component inline
const MinimalLoader: React.FC<{ className?: string }> = ({ className }) => (
  React.createElement('div', { className: `flex items-center justify-center p-4 ${className || ''}` },
    React.createElement('div', { className: 'w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin' })
  )
);

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

const QuickFallback = () => <MinimalLoader className="h-32" />;

// ✅ Smart wrapper - only wrap heavy components
export const withSmartLazy = <P extends object>(
  Component: React.ComponentType<P>,
  name: string
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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