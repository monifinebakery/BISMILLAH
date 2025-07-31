// src/components/supplier/hooks/useSupplierTable.ts
// Custom hook for table state management

import { useState, useMemo } from 'react';
import type { Supplier } from '@/types/supplier';

export const useSupplierTable = (suppliers: Supplier[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const filteredSuppliers = useMemo(() => 
    suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.kontak.toLowerCase().includes(searchTerm.toLowerCase())
    ), [suppliers, searchTerm]
  );

  const currentSuppliers = useMemo(() => {
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(firstItemIndex, firstItemIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  return {
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    selectedSupplierIds,
    setSelectedSupplierIds,
    isSelectionMode,
    setIsSelectionMode,
    filteredSuppliers,
    currentSuppliers,
    totalPages
  };
};