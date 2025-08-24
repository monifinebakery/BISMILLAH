// src/components/purchase/context/PurchaseTableContext.tsx

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Purchase, PurchaseStatus, PurchaseTableContextType } from '../types/purchase.types';
import { toast } from 'sonner';
import { usePurchase } from '../hooks/usePurchase';
import { usePurchaseTable as useTableLogic } from '../hooks/usePurchaseTable';

interface PurchaseTableProviderProps {
  children: ReactNode;
  purchases: Purchase[];
  suppliers?: Array<{ id: string; nama: string }>;
}

// Create context
const PurchaseTableContext = createContext<ReturnType<typeof useTableLogic> | undefined>(undefined);

// Provider component
export const PurchaseTableProvider: React.FC<PurchaseTableProviderProps> = ({
  children,
  purchases,
  suppliers = [],
}) => {
  // Use the table logic hook
  const tableState = useTableLogic({ purchases, suppliers });

  return (
    <PurchaseTableContext.Provider value={tableState}>
      {children}
    </PurchaseTableContext.Provider>
  );
};

// Custom hook
export const usePurchaseTable = () => {
  const context = useContext(PurchaseTableContext);
  if (context === undefined) {
    throw new Error('usePurchaseTable must be used within a PurchaseTableProvider');
  }
  return context;
};