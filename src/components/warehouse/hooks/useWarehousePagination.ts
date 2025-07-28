// src/components/warehouse/hooks/useWarehousePagination.ts
import { useState, useMemo, useCallback, useEffect } from 'react';
import { PaginationConfig } from '../types/warehouse';

interface UseWarehousePaginationProps {
  totalItems: number;
  initialItemsPerPage?: number;
  initialPage?: number;
}

interface UseWarehousePaginationReturn extends PaginationConfig {
  setPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  startIndex: number;
  endIndex: number;
  pageRange: number[];
  resetToFirstPage: () => void;
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

export const useWarehousePagination = ({
  totalItems,
  initialItemsPerPage = 10,
  initialPage = 1,
}: UseWarehousePaginationProps): UseWarehousePaginationReturn => {
  const [page, setPageState] = useState(initialPage);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  // Calculate derived values
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (page - 1) * itemsPerPage;
  }, [page, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage, totalItems);
  }, [startIndex, itemsPerPage, totalItems]);

  const canGoNext = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  const canGoPrev = useMemo(() => {
    return page > 1;
  }, [page]);

  // Generate page range for pagination controls
  const pageRange = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push(-1); // -1 represents dots
      }
    }

    // Add the main range
    rangeWithDots.push(...range);

    // Add last page and dots if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push(-1); // -1 represents dots
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [page, totalPages]);

  // Reset to first page when total items change significantly
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPageState(1);
    }
  }, [totalPages, page]);

  // Handlers
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPageState(validPage);
  }, [totalPages]);

  const setItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPageState(newItemsPerPage);
    setPageState(1); // Reset to first page when changing items per page
  }, []);

  const nextPage = useCallback(() => {
    if (canGoNext) {
      setPageState(prev => prev + 1);
    }
  }, [canGoNext]);

  const prevPage = useCallback(() => {
    if (canGoPrev) {
      setPageState(prev => prev - 1);
    }
  }, [canGoPrev]);

  const goToFirstPage = useCallback(() => {
    setPageState(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setPageState(totalPages);
  }, [totalPages]);

  const resetToFirstPage = useCallback(() => {
    setPageState(1);
  }, []);

  return {
    page,
    itemsPerPage,
    totalItems,
    totalPages,
    setPage,
    setItemsPerPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    pageRange,
    resetToFirstPage,
  };
};

export { ITEMS_PER_PAGE_OPTIONS };