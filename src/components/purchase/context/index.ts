// src/components/purchase/context/index.ts

// Context exports
export { PurchaseProvider } from './PurchaseContext';
// ✅ REMOVED: usePurchase export - use ../hooks/usePurchase.ts instead
export { PurchaseTableProvider, usePurchaseTable } from './PurchaseTableContext';

// Type exports
export type {
  PurchaseContextType,
  PurchaseTableContextType,
} from '../types/purchase.types';