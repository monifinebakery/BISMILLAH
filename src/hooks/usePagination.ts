// hooks/usePagination.ts - Pagination Logic

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PaginationState, PaginationData, UsePaginationReturn } from '../types';
import { UI_CONFIG } from '../utils/constants';

interface UsePaginationOptions {
  initialPage?: number;
  initialItemsPerPage?: number;
  maxItemsPerPage?: number;
  enableUrlSync?: boolean;
  storageKey?: string;
}

// 🔄 URL synchronization utilities
const updateUrl = (page: number, itemsPerPage: number) => {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('limit', itemsPerPage.toString());
  
  window.history.replaceState({}, '', url.toString());
};

const getUrlParams = (): { page: number; itemsPerPage: number } => {
  if (typeof window === 'undefined') {
    return { page: 1, itemsPerPage: UI_CONFIG.ITEMS_PER_PAGE };
  }
  
  const url = new URL(window.location.href);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const itemsPerPage = Math.max(1, parseInt(url.searchParams.get('limit') || UI_CONFIG.ITEMS_PER_PAGE.toString()));
  
  return { page, itemsPerPage };
};

// 💾 Local storage utilities
const saveToStorage = (key: string, page: number, itemsPerPage: number) => {
  try {
    localStorage.setItem(key, JSON.stringify({ page, itemsPerPage }));
  } catch (error) {
    console.warn('Failed to save pagination state:', error);
  }
};

const loadFromStorage = (key: string): { page: number; itemsPerPage: number } | null => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        page: Math.max(1, parsed.page || 1),
        itemsPerPage: Math.max(1, parsed.itemsPerPage || UI_CONFIG.ITEMS_PER_PAGE)
      };
    }
  } catch (error) {
    console.warn('Failed to load pagination state:', error);
  }
  return null;
};

// 🎯 Main pagination hook
export const usePagination = <T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> => {
  const {
    initialPage = 1,
    initialItemsPerPage = UI_CONFIG.ITEMS_PER_PAGE,
    maxItemsPerPage = 100,
    enableUrlSync = false,
    storageKey
  } = options;

  // 📊 Initialize state with various sources
  const initializePagination = useCallback(() => {
    // Priority: URL params > localStorage > defaults
    if (enableUrlSync) {
      const urlParams = getUrlParams();
      return {
        page: urlParams.page,
        itemsPerPage: Math.min(urlParams.itemsPerPage, maxItemsPerPage)
      };
    }
    
    if (storageKey) {
      const stored = loadFromStorage(storageKey);
      if (stored) {
        return {
          page: stored.page,
          itemsPerPage: Math.min(stored.itemsPerPage, maxItemsPerPage)
        };
      }
    }
    
    return {
      page: initialPage,
      itemsPerPage: Math.min(initialItemsPerPage, maxItemsPerPage)
    };
  }, [enableUrlSync, storageKey, initialPage, initialItemsPerPage, maxItemsPerPage]);

  const [currentPage, setCurrentPage] = useState(() => initializePagination().page);
  const [itemsPerPage, setItemsPerPage] = useState(() => initializePagination().itemsPerPage);

  // 📊 Calculate pagination state
  const paginationState = useMemo((): PaginationState => {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);

    return {
      currentPage: safePage,
      itemsPerPage,
      totalItems,
      totalPages
    };
  }, [items.length, currentPage, itemsPerPage]);

  // 📄 Calculate paginated data
  const paginatedData = useMemo((): PaginationData<T> => {
    const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
    const endIndex = startIndex + paginationState.itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pagination: paginationState,
      hasNext: paginationState.currentPage < paginationState.totalPages,
      hasPrev: paginationState.currentPage > 1
    };
  }, [items, paginationState]);

  // 🔄 Sync with external sources
  useEffect(() => {
    if (enableUrlSync) {
      updateUrl(paginationState.currentPage, paginationState.itemsPerPage);
    }
    
    if (storageKey) {
      saveToStorage(storageKey, paginationState.currentPage, paginationState.itemsPerPage);
    }
  }, [paginationState.currentPage, paginationState.itemsPerPage, enableUrlSync, storageKey]);

  // 🎯 Navigation functions
  const goToPage = useCallback((page: number) => {
    const safePage = Math.max(1, Math.min(page, paginationState.totalPages));
    setCurrentPage(safePage);
  }, [paginationState.totalPages]);

  const nextPage = useCallback(() => {
    if (paginatedData.hasNext) {
      goToPage(paginationState.currentPage + 1);
    }
  }, [paginatedData.hasNext, paginationState.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (paginatedData.hasPrev) {
      goToPage(paginationState.currentPage - 1);
    }
  }, [paginatedData.hasPrev, paginationState.currentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(paginationState.totalPages);
  }, [goToPage, paginationState.totalPages]);

  // 📏 Items per page management
  const updateItemsPerPage = useCallback((count: number) => {
    const safeCount = Math.max(1, Math.min(count, maxItemsPerPage));
    setItemsPerPage(safeCount);
    
    // Adjust current page to maintain data context
    const currentStartIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
    const newPage = Math.max(1, Math.ceil((currentStartIndex + 1) / safeCount));
    setCurrentPage(newPage);
  }, [maxItemsPerPage, paginationState.currentPage, paginationState.itemsPerPage]);

  // 📊 Page range calculation for UI
  const getPageRange = useCallback((visiblePages: number = 5) => {
    const { currentPage, totalPages } = paginationState;
    const halfVisible = Math.floor(visiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the boundaries
    if (endPage - startPage + 1 < visiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + visiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - visiblePages + 1);
      }
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return {
      pages,
      showFirstEllipsis: startPage > 2,
      showLastEllipsis: endPage < totalPages - 1,
      showFirst: startPage > 1,
      showLast: endPage < totalPages
    };
  }, [paginationState]);

  // 🔍 Search within paginated items
  const searchInCurrentPage = useCallback((searchTerm: string, searchKey?: keyof T) => {
    if (!searchTerm) return paginatedData.items;
    
    return paginatedData.items.filter(item => {
      if (searchKey) {
        const value = item[searchKey];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      // Search in all string properties
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [paginatedData.items]);

  // 📊 Pagination info
  const getPaginationInfo = useCallback(() => {
    const { currentPage, itemsPerPage, totalItems } = paginationState;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return {
      startItem,
      endItem,
      totalItems,
      showingCount: endItem - startItem + 1,
      showingText: `Menampilkan ${startItem}-${endItem} dari ${totalItems} item`
    };
  }, [paginationState]);

  // 🔄 Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(1);
    setItemsPerPage(initialItemsPerPage);
  }, [initialItemsPerPage]);

  // 📊 Pagination statistics
  const getStats = useCallback(() => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = paginationState;
    
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasData: totalItems > 0,
      isEmpty: totalItems === 0,
      isFirst: currentPage === 1,
      isLast: currentPage === totalPages,
      progressPercent: totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100
    };
  }, [paginationState]);

  // 🎯 Bulk navigation
  const jumpToItem = useCallback((itemIndex: number) => {
    const page = Math.ceil((itemIndex + 1) / paginationState.itemsPerPage);
    goToPage(page);
  }, [paginationState.itemsPerPage, goToPage]);

  const jumpToItemById = useCallback((itemId: any, idKey: keyof T = 'id' as keyof T) => {
    const itemIndex = items.findIndex(item => item[idKey] === itemId);
    if (itemIndex !== -1) {
      jumpToItem(itemIndex);
    }
  }, [items, jumpToItem]);

  return {
    // Data
    paginatedData,
    
    // Navigation
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    
    // Configuration
    setItemsPerPage: updateItemsPerPage,
    
    // Utilities
    getPageRange,
    searchInCurrentPage,
    getPaginationInfo,
    getStats,
    reset,
    jumpToItem,
    jumpToItemById
  };
};

// 🎯 Simplified pagination hook for basic use cases
export const useSimplePagination = <T>(
  items: T[],
  itemsPerPage: number = UI_CONFIG.ITEMS_PER_PAGE
) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: items.slice(startIndex, endIndex),
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }, [items, currentPage, itemsPerPage]);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
  }, [paginatedData.totalPages]);
  
  return {
    ...paginatedData,
    goToPage,
    nextPage: () => paginatedData.hasNext && goToPage(currentPage + 1),
    prevPage: () => paginatedData.hasPrev && goToPage(currentPage - 1)
  };
};