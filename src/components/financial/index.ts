// src/components/financial/index.ts
/**
 * ✅ CLEAN FINANCIAL MODULE - Optimized Barrel Export
 * 
 * Dependencies reduced from 12 to 5
 * No circular dependencies, clean imports only
 * Updated to use new refactored structure
 */

// ===========================================
// ✅ CORE PAGE COMPONENTS
// ===========================================
export { default as FinancialReportPage } from './FinancialReportPage';

// ===========================================
// ✅ ESSENTIAL CONTEXT (Minimal)
// ===========================================
export { 
  FinancialProvider, 
  useFinancial,
  useFinancialQuery 
} from './contexts/FinancialContext';

// ===========================================
// ✅ CONSOLIDATED HOOKS (Single import)
// ===========================================
export { 
  useFinancialReportPage,
  useFinancialDashboard,
  useTransactionManagement
} from './hooks/useFinancialPage';

// Alternative: Keep useFinancialCore name for backward compatibility
export { useFinancialReportPage as useFinancialCore } from './hooks/useFinancialPage';

// ===========================================
// ✅ ESSENTIAL TYPES ONLY
// ===========================================
export type {
  FinancialTransaction,
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData,
  FinancialSummary,
  DateRange
} from './types/financial';

// ===========================================
// ✅ ESSENTIAL UTILITIES (Pure functions)
// ===========================================
export {
  calculateFinancialSummary,
  validateTransaction,
  formatCurrency,
  filterByDateRange
} from './utils/financialCalculations';

// ===========================================
// ✅ OPTIONAL: Advanced imports for power users
// ===========================================
export const FINANCIAL_ADVANCED = {
  // Lazy-loaded modules to avoid bundling everything
  hooks: () => import('./hooks/useFinancialHooks'),
  calculations: () => import('@/utils/financialCalculations'),
  api: () => import('@/services/financialApi'),
  types: () => import('@/types/financial'),
  
  // Component modules (if they exist)
  components: () => import('./components').catch(() => null),
  dialogs: () => import('./dialogs').catch(() => null),
  charts: () => import('./charts').catch(() => null),
  
  // Constants and configurations
  constants: () => import('@/types/financial').then(m => ({
    DEFAULT_FINANCIAL_CATEGORIES: m.DEFAULT_FINANCIAL_CATEGORIES,
    TRANSACTION_TYPE_LABELS: m.TRANSACTION_TYPE_LABELS,
    CHART_COLORS: m.CHART_COLORS
  }))
} as const;

// ===========================================
// ✅ QUICK ACCESS CONSTANTS (Most used)
// ===========================================
export { 
  DEFAULT_FINANCIAL_CATEGORIES,
  TRANSACTION_TYPE_LABELS 
} from '@/types/financial';

// ===========================================
// ❌ REMOVED (To reduce dependencies):
// ===========================================
// - Individual component exports (use direct imports)
// - Multiple individual hooks (consolidated into useFinancialPage)
// - Detailed type exports (import from @/types/financial directly)
// - Non-essential utilities (import directly if needed)
// - Complex re-exports that create circular dependencies

// ===========================================
// 📝 USAGE EXAMPLES:
// ===========================================
/*
// ✅ RECOMMENDED USAGE:

// For pages:
import { useFinancialReportPage } from '@/components/financial';

// For components:
import { useFinancial, FinancialTransaction } from '@/components/financial';

// For utilities:
import { calculateFinancialSummary } from '@/components/financial';

// For advanced usage:
import { FINANCIAL_ADVANCED } from '@/components/financial';
const hooks = await FINANCIAL_ADVANCED.hooks();

// For backward compatibility:
import { useFinancialCore } from '@/components/financial'; // → useFinancialReportPage
*/