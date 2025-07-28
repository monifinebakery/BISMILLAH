import { useState, useCallback, useMemo } from 'react';
import { BahanBaku } from '../types';

export interface UseWarehouseResult {
  // Filtering and search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredItems: BahanBaku[];
  
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  totalPages: number;
  currentItems: BahanBaku[];
  
  // Low stock items
  lowStockItems: BahanBaku[];
  
  // Utility functions
  resetPagination: () => void;
}

export const useWarehouse = (bahanBaku: BahanBaku[]): UseWarehouseResult => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredItems = useMemo(() => {
    return Array.isArray(bahanBaku) 
      ? bahanBaku.filter(item =>
          item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.kategori && item.kategori.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : [];
  }, [bahanBaku, searchTerm]);

  const lowStockItems = useMemo(() => {
    return Array.isArray(bahanBaku) 
      ? bahanBaku.filter(item => item.stok <= item.minimum)
      : [];
  }, [bahanBaku]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const currentItems = useMemo(() => 
    filteredItems.slice(Math.max(0, indexOfFirstItem), indexOfLastItem), 
    [filteredItems, indexOfFirstItem, indexOfLastItem]
  );

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleSetItemsPerPage = useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);

  return {
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    filteredItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage,
    totalPages,
    currentItems,
    lowStockItems,
    resetPagination,
  };
};