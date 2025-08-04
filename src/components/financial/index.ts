// src/components/financial/index.ts - Optimized Dependencies (12 → 5)
/**
 * Financial Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 12 to 5
 */

// ✅ CORE EXPORTS ONLY
export { default as FinancialReportPage } from './FinancialReportPage';

// ✅ ESSENTIAL CONTEXT
export { FinancialProvider, useFinancial } from './contexts/FinancialContext';

// ✅ CONSOLIDATED HOOK (Single import instead of multiple)
export { useFinancialCore } from './hooks/useFinancialCore'; // New consolidated hook

// ✅ ESSENTIAL TYPES ONLY
export type {
  FinancialTransaction,
  FinancialContextType
} from './types/financial';

// ✅ UTILITY FUNCTIONS (Essential only)
export {
  calculateFinancialSummary,
  validateTransaction
} from './utils/financialUtils';

// ❌ REMOVED - Reduce dependencies:
// - Individual components (use direct imports if needed)
// - Individual hooks (consolidated into useFinancialCore)
// - Detailed types (import from ./types if needed)
// - Constants (import directly)
// - Non-essential utilities

// ✅ OPTIONAL: Advanced imports for power users
export const FINANCIAL_ADVANCED = {
  components: () => import('./components'),
  dialogs: () => import('./dialogs'),
  hooks: () => import('./hooks'),
  types: () => import('./types/financial'),
  utils: () => import('./utils/financialUtils'),
  constants: () => import('./constants')
} as const;