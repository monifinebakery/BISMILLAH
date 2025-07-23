// src/hooks/useOrdersPagination.tsx
// 📄 ORDERS PAGINATION HOOK - Manages pagination logic and state

import { useState, useMemo, useEffect } from 'react';
import type { Order } from '@/types/order';

export interface UseOrdersPaginationReturn {
  // Pagination States
  currentPage: number;
  itemsPerPage: number;
  
  // Pagination Actions
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  
  // Computed Values
  totalPages: number;
  totalItems: number;
  currentItems: Order[];
  indexOfFirstItem: number;
  indexOfLastItem: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Display Info
  paginationInfo: {
    start: number;
    end: number;
    total: number;
    currentPage: number;
    totalPages: number;
  };
  
  // Page Numbers for UI
  pageNumbers: number[];
}

interface PaginationOptions {
  defaultItemsPerPage?: number;
  maxItemsPerPage?: number;
  autoResetOnFilterChange?: boolean;
  maxVisiblePages?: number;
  persistInUrl?: boolean;
}

export const useOrdersPagination = (
  items: Order[] = [], 
  options: PaginationOptions = {}
): UseOrdersPaginationReturn => {
  
  const {
    defaultItemsPerPage = 10,
    maxItemsPerPage = 100,
    autoResetOnFilterChange = true,
    maxVisiblePages = 5,
    persistInUrl = false
  } = options;

  // 📄 Initialize from URL if persistence enabled
  const getInitialPage = () => {
    if (persistInUrl && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      return pageParam ? parseInt(pageParam, 10) : 1;
    }
    return 1;
  };

  const getInitialItemsPerPage = () => {
    if (persistInUrl && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const itemsParam = urlParams.get('items');
      return itemsParam ? parseInt(itemsParam, 10) : defaultItemsPerPage;
    }
    return defaultItemsPerPage;
  };

  // 📄 Pagination States
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage);

  // 📊 Computed Values
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // 📝 Calculate Current Items
  const { currentItems, indexOfFirstItem, indexOfLastItem } = useMemo(() => {
    const firstIndex = (currentPage - 1) * itemsPerPage;
    const lastIndex = firstIndex + itemsPerPage;
    
    return {
      currentItems: items.slice(firstIndex, lastIndex),
      indexOfFirstItem: firstIndex,
      indexOfLastItem: Math.min(lastIndex, totalItems)
    };
  }, [items, currentPage, itemsPerPage, totalItems]);

  // 🔍 Navigation Helpers
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // 📋 Pagination Info for Display
  const paginationInfo = useMemo(() => ({
    start: totalItems === 0 ? 0 : indexOfFirstItem + 1,
    end: indexOfLastItem,
    total: totalItems,
    currentPage,
    totalPages
  }), [indexOfFirstItem, indexOfLastItem, totalItems, currentPage, totalPages]);

  // 🔢 Generate Page Numbers for UI
  const pageNumbers = useMemo(() => {
    return generatePageNumbers(currentPage, totalPages, maxVisiblePages);
  }, [currentPage, totalPages, maxVisiblePages]);

  // 🔧 Enhanced Actions with Validation
  const handleSetCurrentPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      
      // Update URL if persistence enabled
      if (persistInUrl && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        window.history.replaceState({}, '', url.toString());
      }
    } else if (totalPages > 0) {
      // Auto-correct to valid page
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    }
  };

  const handleSetItemsPerPage = (items: number) => {
    const validItems = Math.max(1, Math.min(items, maxItemsPerPage));
    setItemsPerPage(validItems);
    
    // Reset to first page when changing items per page
    setCurrentPage(1);
    
    // Update URL if persistence enabled
    if (persistInUrl && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('items', validItems.toString());
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // 🎯 Navigation Actions
  const goToFirstPage = () => handleSetCurrentPage(1);
  const goToLastPage = () => handleSetCurrentPage(totalPages);
  const goToPreviousPage = () => handleSetCurrentPage(currentPage - 1);
  const goToNextPage = () => handleSetCurrentPage(currentPage + 1);

  // 🔄 Auto-reset to valid page when items change
  useEffect(() => {
    if (autoResetOnFilterChange && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, autoResetOnFilterChange]);

  // 🔄 Reset to first page when items per page changes dramatically
  useEffect(() => {
    const maxPossiblePage = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > maxPossiblePage && maxPossiblePage > 0) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, totalItems, currentPage]);

  return {
    // States
    currentPage,
    itemsPerPage,
    
    // Actions
    setCurrentPage: handleSetCurrentPage,
    setItemsPerPage: handleSetItemsPerPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,
    
    // Computed
    totalPages,
    totalItems,
    currentItems,
    indexOfFirstItem,
    indexOfLastItem,
    hasNextPage,
    hasPreviousPage,
    paginationInfo,
    pageNumbers,
  };
};

// 🎯 Helper function to generate page numbers for pagination UI
export const generatePageNumbers = (
  currentPage: number, 
  totalPages: number, 
  maxVisible: number = 5
): number[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(currentPage - half, 1);
  let end = Math.min(start + maxVisible - 1, totalPages);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(end - maxVisible + 1, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

// 🎯 Helper function to get pagination statistics
export const getPaginationStatistics = (paginationReturn: UseOrdersPaginationReturn) => {
  const { totalItems, currentItems, currentPage, totalPages, itemsPerPage } = paginationReturn;
  
  return {
    totalItems,
    currentItemsCount: currentItems.length,
    currentPage,
    totalPages,
    itemsPerPage,
    progressPercentage: totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    remainingItems: Math.max(0, totalItems - (currentPage * itemsPerPage))
  };
};

// 🎯 Helper function for keyboard navigation
export const usePaginationKeyboard = (paginationHook: UseOrdersPaginationReturn) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not in input field
      if ((event.target as HTMLElement)?.tagName.toLowerCase() === 'input') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (event.ctrlKey && paginationHook.hasPreviousPage) {
            event.preventDefault();
            paginationHook.goToPreviousPage();
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey && paginationHook.hasNextPage) {
            event.preventDefault();
            paginationHook.goToNextPage();
          }
          break;
        case 'Home':
          if (event.ctrlKey) {
            event.preventDefault();
            paginationHook.goToFirstPage();
          }
          break;
        case 'End':
          if (event.ctrlKey) {
            event.preventDefault();
            paginationHook.goToLastPage();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginationHook]);
};

export default useOrdersPagination;