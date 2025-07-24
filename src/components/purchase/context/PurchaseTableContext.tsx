import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Purchase } from '@/types/supplier';

interface PurchaseTableState {
  // Search & Filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  
  // Selection
  selectedPurchaseIds: string[];
  setSelectedPurchaseIds: React.Dispatch<React.SetStateAction<string[]>>;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  
  // Bulk Actions
  showBulkDeleteDialog: boolean;
  setShowBulkDeleteDialog: (show: boolean) => void;
  
  // Computed values
  filteredPurchases: Purchase[];
  currentItems: Purchase[];
  totalPages: number;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  
  // Helper functions
  toggleSelectAllCurrent: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetSelection: () => void;
  resetPagination: () => void;
}

const PurchaseTableContext = createContext<PurchaseTableState | undefined>(undefined);

interface PurchaseTableProviderProps {
  children: ReactNode;
  purchases: Purchase[];
  suppliers: any[];
}

export const PurchaseTableProvider: React.FC<PurchaseTableProviderProps> = ({
  children,
  purchases,
  suppliers
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Computed values
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const supplierData = suppliers.find(s => s.id === p.supplier);
      return supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    });
  }, [purchases, suppliers, searchTerm]);

  const currentItems = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(firstItem, firstItem + itemsPerPage);
  }, [filteredPurchases, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const allCurrentSelected = currentItems.length > 0 && currentItems.every(p => selectedPurchaseIds.includes(p.id));
  const someCurrentSelected = currentItems.some(p => selectedPurchaseIds.includes(p.id)) && !allCurrentSelected;

  // Helper functions
  const toggleSelectAllCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPurchaseIds(prev => [...new Set([...prev, ...currentItems.map(p => p.id)])]);
    } else {
      setSelectedPurchaseIds(prev => prev.filter(id => !currentItems.some(p => p.id === id)));
    }
  };

  const resetSelection = () => {
    setSelectedPurchaseIds([]);
    setIsSelectionMode(false);
    setShowBulkDeleteDialog(false);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Auto-reset pagination when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const value: PurchaseTableState = {
    // State
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    selectedPurchaseIds,
    setSelectedPurchaseIds,
    isSelectionMode,
    setIsSelectionMode,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    
    // Computed
    filteredPurchases,
    currentItems,
    totalPages,
    allCurrentSelected,
    someCurrentSelected,
    
    // Helpers
    toggleSelectAllCurrent,
    resetSelection,
    resetPagination,
  };

  return (
    <PurchaseTableContext.Provider value={value}>
      {children}
    </PurchaseTableContext.Provider>
  );
};

export const usePurchaseTable = () => {
  const context = useContext(PurchaseTableContext);
  if (context === undefined) {
    throw new Error('usePurchaseTable must be used within a PurchaseTableProvider');
  }
  return context;
};