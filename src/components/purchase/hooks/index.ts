// src/components/purchase/hooks/index.ts

// Hook exports
export { usePurchaseStats } from './usePurchaseStats';
export { usePurchaseForm } from './usePurchaseForm';

// Re-export context hooks for convenience
export { usePurchase } from '../context/PurchaseContext';
export { usePurchaseTable } from '../context/PurchaseTableContext';

// Type exports
export type {
  UsePurchaseReturn,
  UsePurchaseStatsReturn,
  UsePurchaseTableReturn,
} from '../types/purchase.types';