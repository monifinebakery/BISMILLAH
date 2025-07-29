// src/components/purchase/hooks/index.ts

// Primary hooks exports
export { usePurchaseStats } from './usePurchaseStats';
export { usePurchaseForm } from './usePurchaseForm';
export { usePurchaseTable } from './usePurchaseTable';
export { usePurchase } from './usePurchase';

// Re-export table context hook for convenience
export { usePurchaseTable as usePurchaseTableContext } from '../context/PurchaseTableContext';

// Type exports
export type {
  UsePurchaseReturn,
  UsePurchaseStatsReturn,
  UsePurchaseTableReturn,
} from '../types/purchase.types';