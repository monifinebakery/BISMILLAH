// src/components/orders/hooks/useOrdersPagination.ts
// Enhanced pagination utilities that work with your existing useOrderPagination hook

import { useState, useMemo, useCallback, useEffect } from 'react';

// Generate page numbers for pagination display (improved version with ellipsis)
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] => {
  const pages: (number | string)[] = [];

  if (totalPages <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Complex pagination logic with ellipsis
    const halfVisible = Math.floor(maxVisible / 2);

    if (currentPage <= halfVisible + 1) {
      // Show first pages + ... + last
      for (let i = 1; i <= maxVisible - 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - halfVisible) {
      // Show first + ... + last pages
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first + ... + middle + ... + last
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
  }

  return pages;
};

// Enhanced pagination hook that extends your existing useOrderPagination
export interface PaginationInfo {
  start: number;
  end: number;
  total: number;
  currentPage: number;
  totalPages: number;
}

// This extends your existing useOrderPagination result
export interface UseOrdersPaginationResult {
  // Basic pagination state (matches your existing hook)
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  currentOrders: any[];
  
  // Actions (matches your existing hook naming)
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  
  // Enhanced features for OrdersPagination component
  paginationInfo: PaginationInfo;
  goToPreviousPage: () => void; // Alias for goToPrevPage
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  canGoToFirst: boolean;
  canGoToLast: boolean;
}

// Enhanced wrapper that works with your existing useOrderPagination
export const useOrdersPagination = (
  orders: any[],
  initialItemsPerPage: number = 10
): UseOrdersPaginationResult => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset page when orders change or when current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Current page data
  const currentOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage, itemsPerPage]);

  // Pagination info for display
  const paginationInfo = useMemo((): PaginationInfo => {
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    
    return {
      start,
      end,
      total: totalItems,
      currentPage,
      totalPages
    };
  }, [currentPage, itemsPerPage, totalItems, totalPages]);

  // Navigation handlers (matching your existing hook)
  const handleSetCurrentPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const handleSetItemsPerPage = useCallback((items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    if (totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Alias for consistency with OrdersPagination component
  const goToPreviousPage = goToPrevPage;

  // Helper states
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const canGoToFirst = currentPage > 1;
  const canGoToLast = currentPage < totalPages;

  return {
    // Basic state (compatible with your existing hook)
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    currentOrders,
    
    // Actions (compatible with your existing hook)
    setCurrentPage: handleSetCurrentPage,
    setItemsPerPage: handleSetItemsPerPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    
    // Enhanced features
    paginationInfo,
    goToPreviousPage, // Alias
    hasNextPage,
    hasPreviousPage,
    canGoToFirst,
    canGoToLast
  };
};

// Utility function to create OrdersPagination props from your existing hook
export const createOrdersPaginationProps = (paginationResult: any) => {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    setCurrentPage,
    setItemsPerPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage
  } = paginationResult;

  // Create paginationInfo if not provided
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  
  const paginationInfo = {
    start,
    end,
    total: totalItems,
    currentPage,
    totalPages
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    setCurrentPage,
    setItemsPerPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage: goToPrevPage, // Map to expected prop name
    goToNextPage,
    paginationInfo
  };
};

export default useOrdersPagination;