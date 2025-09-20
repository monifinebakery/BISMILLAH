// src/components/financial/hooks/pagination/useFinancialPagination.ts
import { useState, useMemo, useCallback } from 'react';

interface PaginationData<T> {
  currentItems: T[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseFinancialPaginationReturn<T> extends PaginationData<T> {
  setCurrentPage: (page: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  resetPagination: () => void;
}

/**
 * Financial Pagination Hook
 * Handles pagination for financial transaction lists
 */
export const useFinancialPagination = <T>(
  items: T[],
  itemsPerPage: number = 10
): UseFinancialPaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const firstItem = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(firstItem, firstItem + itemsPerPage);

    return {
      currentItems,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems: items.length,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  }, [paginationData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPreviousPage]);

  // Reset page when items change
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    ...paginationData,
    setCurrentPage,
    goToPage,
    nextPage,
    previousPage,
    resetPagination
  };
};