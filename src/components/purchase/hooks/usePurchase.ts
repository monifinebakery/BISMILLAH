// src/components/purchase/hooks/usePurchase.ts

import { useContext } from 'react';
import { PurchaseContext } from '../context/PurchaseContext';
import { PurchaseContextType } from '../types/purchase.types';

/**
 * Hook to access Purchase context
 * This is a standalone version of the hook for better modularity
 */
export const usePurchase = (): PurchaseContextType => {
  const context = useContext(PurchaseContext);
  
  if (context === undefined) {
    console.error('usePurchase: context is undefined. Make sure the component is wrapped with PurchaseProvider.');
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  
  return context;
};
