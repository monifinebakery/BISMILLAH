// src/contexts/BulkOperationsContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useBulkOperations, BulkOperationsConfig, BulkOperationsResult, BulkEditData } from '@/hooks/useBulkOperations';
import { useTableSelection, TableSelectionResult, SelectableItem } from '@/hooks/useTableSelection';

/**
 * Generic interface untuk Bulk Operations Context
 */
export interface BulkOperationsContextType<T extends SelectableItem = SelectableItem> {
  // Selection functionality
  selection: TableSelectionResult<T>;
  
  // Bulk operations functionality
  bulkOps: BulkOperationsResult<BulkEditData>;
  
  // Combined utilities
  hasSelection: boolean;
  canPerformBulkOps: boolean;
}

/**
 * Props untuk BulkOperationsProvider
 */
export interface BulkOperationsProviderProps<T extends SelectableItem = SelectableItem> {
  children: ReactNode;
  config: BulkOperationsConfig<T>;
  items?: T[];
}

/**
 * Generic Bulk Operations Context
 */
const BulkOperationsContext = createContext<BulkOperationsContextType | null>(null);

/**
 * Generic Bulk Operations Provider
 * 
 * Provider yang menggabungkan table selection dan bulk operations
 * untuk memberikan API yang konsisten di semua modul.
 * 
 * @param props - Props untuk provider
 * @returns Provider component
 */
export function BulkOperationsProvider<T extends SelectableItem = SelectableItem>({
  children,
  config,
  items = []
}: BulkOperationsProviderProps<T>) {
  // Initialize table selection
  const selection = useTableSelection<T>(items);
  
  // Create bulk operations config with selection integration
  const bulkOpsConfig: BulkOperationsConfig<any> = {
    ...config,
    selectedItems: selection.selectedIds,
    clearSelection: selection.clearSelection
  };
  
  // Initialize bulk operations
  const bulkOps = useBulkOperations<BulkEditData>(bulkOpsConfig);
  
  // Combined utilities
  const hasSelection = selection.selectedCount > 0;
  const canPerformBulkOps = hasSelection && !bulkOps.isProcessing;
  
  const contextValue: BulkOperationsContextType<T> = {
    selection,
    bulkOps,
    hasSelection,
    canPerformBulkOps
  };
  
  return (
    <BulkOperationsContext.Provider value={contextValue as any}>
      {children}
    </BulkOperationsContext.Provider>
  );
}

/**
 * Hook untuk menggunakan Bulk Operations Context
 * 
 * @returns Context value dengan type safety
 */
export function useBulkOperationsContext<T extends SelectableItem = SelectableItem>(): BulkOperationsContextType<T> {
  const context = useContext(BulkOperationsContext);
  
  if (!context) {
    throw new Error('useBulkOperationsContext must be used within a BulkOperationsProvider');
  }
  
  return context as unknown as BulkOperationsContextType<T>;
}

/**
 * Higher-order component untuk wrapping komponen dengan BulkOperationsProvider
 * 
 * @param Component - Komponen yang akan di-wrap
 * @param config - Konfigurasi bulk operations
 * @returns Wrapped component
 */
export function withBulkOperations<T extends SelectableItem = SelectableItem>(
  Component: React.ComponentType<any>,
  config: BulkOperationsConfig<T>
) {
  return function WrappedComponent(props: any) {
    return (
      <BulkOperationsProvider<T> config={config} items={props.items}>
        <Component {...props} />
      </BulkOperationsProvider>
    );
  };
}

export default BulkOperationsContext;