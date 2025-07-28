import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_PAGINATION, PAGINATION_OPTIONS } from '../../shared/constants';

interface UseRecipePaginationProps {
  totalItems: number;
  initialItemsPerPage?: number;
}

export const useRecipePagination = ({ 
  totalItems, 
  initialItemsPerPage = DEFAULT_PAGINATION.ITEMS_PER_PAGE 
}: UseRecipePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGINATION.CURRENT_PAGE);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage, totalItems);
  }, [startIndex, itemsPerPage, totalItems]);

  const canGoNext = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const canGoPrevious = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentPage(current => current + 1);
    }
  }, [canGoNext]);

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentPage(current => current - 1);
    }
  }, [canGoPrevious]);

  const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Reset to first page when total items change significantly
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    canGoNext,
    canGoPrevious,
    goToPage,
    goToNext,
    goToPrevious,
    changeItemsPerPage,
    resetPagination,
    paginationOptions: PAGINATION_OPTIONS,
    paginationInfo: {
      showing: `${startIndex + 1}-${endIndex}`,
      total: totalItems,
      page: `${currentPage} / ${totalPages}`
    }
  };
};