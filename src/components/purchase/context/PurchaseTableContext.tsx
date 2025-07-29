// src/components/purchase/context/PurchaseTableContext.tsx

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Purchase, PurchaseStatus, PurchaseTableContextType } from '../types/purchase.types';
import { toast } from 'sonner';
import { usePurchase } from './PurchaseContext';
import {
  searchPurchases,
  filterPurchasesByStatus,
  sortPurchases,
} from '../utils/purchaseHelpers';

interface PurchaseTableProviderProps {
  children: ReactNode;
  purchases: Purchase[];
  suppliers?: Array<{ id: string; nama: string }>;
}

// Create context
const PurchaseTableContext = createContext<PurchaseTableContextType | undefined>(undefined);

// Provider component
export const PurchaseTableProvider: React.FC<PurchaseTableProviderProps> = ({
  children,
  purchases,
  suppliers = [],
}) => {
  // Local state for table functionality  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'tanggal' | 'totalNilai' | 'supplier' | 'status'>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Access purchase context for delete operations
  const { deletePurchase } = usePurchase();

  // Computed filtered and sorted purchases
  const filteredPurchases = useMemo(() => {
    let result = purchases;
    
    // Apply search filter
    if (searchQuery.trim()) {
      result = searchPurchases(result, searchQuery);
    }
    
    // Apply status filter
    result = filterPurchasesByStatus(result, statusFilter);
    
    // Apply sorting
    result = sortPurchases(result, sortField, sortOrder);
    
    return result;
  }, [purchases, searchQuery, statusFilter, sortField, sortOrder]);

  // Selection helpers
  const isAllSelected = useMemo(() => {
    return filteredPurchases.length > 0 && selectedItems.length === filteredPurchases.length;
  }, [filteredPurchases.length, selectedItems.length]);

  const selectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPurchases.map(p => p.id));
    }
  }, [isAllSelected, filteredPurchases]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(current => {
      if (current.includes(id)) {
        return current.filter(item => item !== id);
      } else {
        return [...current, id];
      }
    });
  }, []);

  // Bulk operations
  const bulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang akan dihapus');
      return;
    }

    setIsBulkDeleting(true);
    
    try {
      const deletePromises = selectedItems.map(id => deletePurchase(id));
      const results = await Promise.allSettled(deletePromises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast.success(`${successful} pembelian berhasil dihapus`);
        setSelectedItems([]);
        setShowBulkDeleteDialog(false);
      }
      
      if (failed > 0) {
        toast.error(`${failed} pembelian gagal dihapus`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Terjadi kesalahan saat menghapus pembelian');
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedItems, deletePurchase]);

  const bulkUpdateStatus = useCallback(async (newStatus: PurchaseStatus) => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang akan diubah statusnya');
      return;
    }

    // TODO: Implement bulk status update
    toast.info('Fitur bulk update status akan segera tersedia');
  }, [selectedItems]);

  // Sorting helpers
  const handleSort = useCallback((field: typeof sortField) => {
    if (field === sortField) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);

  // Get supplier name helper
  const getSupplierName = useCallback((supplierId: string): string => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.nama || supplierId;
  }, [suppliers]);

  // Context value
  const value: PurchaseTableContextType & {
    // Extended properties for table functionality
    filteredPurchases: Purchase[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: PurchaseStatus | 'all';
    setStatusFilter: (status: PurchaseStatus | 'all') => void;
    sortField: typeof sortField;
    sortOrder: typeof sortOrder;
    handleSort: (field: typeof sortField) => void;
    toggleSelectItem: (id: string) => void;
    bulkUpdateStatus: (status: PurchaseStatus) => Promise<void>;
    getSupplierName: (id: string) => string;
  } = {
    // Basic selection functionality
    selectedItems,
    setSelectedItems,
    selectAll,
    clearSelection,
    isAllSelected,
    bulkDelete,
    isBulkDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    
    // Extended functionality
    filteredPurchases,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    sortOrder,
    handleSort,
    toggleSelectItem,
    bulkUpdateStatus,
    getSupplierName,
  };

  return (
    <PurchaseTableContext.Provider value={value}>
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