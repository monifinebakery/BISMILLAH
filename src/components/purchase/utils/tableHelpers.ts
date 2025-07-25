import { Purchase } from '@/types/supplier';
import { TableSortConfig, PaginationConfig } from './types/index';

/**
 * Sort purchases based on configuration
 */
export const sortPurchases = (purchases: Purchase[], sortConfig: TableSortConfig | null): Purchase[] => {
  if (!sortConfig) return purchases;

  return [...purchases].sort((a, b) => {
    const aValue = a[sortConfig.field];
    const bValue = b[sortConfig.field];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

    // Handle different data types
    let comparison = 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      // Fallback to string comparison
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Paginate purchases array
 */
export const paginatePurchases = (
  purchases: Purchase[], 
  page: number, 
  pageSize: number
): { items: Purchase[]; totalPages: number; hasMore: boolean } => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = purchases.slice(startIndex, endIndex);
  const totalPages = Math.ceil(purchases.length / pageSize);
  const hasMore = page < totalPages;

  return { items, totalPages, hasMore };
};

/**
 * Calculate pagination info
 */
export const calculatePaginationInfo = (
  currentPage: number,
  pageSize: number,
  totalItems: number
) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return {
    totalPages,
    startItem,
    endItem,
    hasPrevious,
    hasNext,
    showingText: totalItems > 0 
      ? `Showing ${startItem} to ${endItem} of ${totalItems} entries`
      : 'No entries to show'
  };
};

/**
 * Generate page numbers for pagination
 */
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const half = Math.floor(maxVisible / 2);

  if (currentPage <= half + 1) {
    // Show first pages + ... + last
    for (let i = 1; i <= maxVisible - 1; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - half) {
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
    for (let i = currentPage - half + 1; i <= currentPage + half - 1; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Handle table selection
 */
export class TableSelectionManager {
  private selectedIds: Set<string>;

  constructor(initialSelected: string[] = []) {
    this.selectedIds = new Set(initialSelected);
  }

  /**
   * Toggle single item selection
   */
  toggle(id: string): string[] {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    return Array.from(this.selectedIds);
  }

  /**
   * Select all items on current page
   */
  selectPage(pageItems: Purchase[]): string[] {
    pageItems.forEach(item => this.selectedIds.add(item.id));
    return Array.from(this.selectedIds);
  }

  /**
   * Deselect all items on current page
   */
  deselectPage(pageItems: Purchase[]): string[] {
    pageItems.forEach(item => this.selectedIds.delete(item.id));
    return Array.from(this.selectedIds);
  }

  /**
   * Select all items
   */
  selectAll(allItems: Purchase[]): string[] {
    allItems.forEach(item => this.selectedIds.add(item.id));
    return Array.from(this.selectedIds);
  }

  /**
   * Clear all selections
   */
  clear(): string[] {
    this.selectedIds.clear();
    return [];
  }

  /**
   * Check if item is selected
   */
  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * Get all selected IDs
   */
  getSelected(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * Get selection count
   */
  getCount(): number {
    return this.selectedIds.size;
  }

  /**
   * Check if all page items are selected
   */
  isPageFullySelected(pageItems: Purchase[]): boolean {
    return pageItems.length > 0 && pageItems.every(item => this.selectedIds.has(item.id));
  }

  /**
   * Check if some page items are selected
   */
  isPagePartiallySelected(pageItems: Purchase[]): boolean {
    return pageItems.some(item => this.selectedIds.has(item.id)) && 
           !this.isPageFullySelected(pageItems);
  }
}

/**
 * Create table column configuration
 */
export const createTableColumns = (options: {
  showSupplier?: boolean;
  showDate?: boolean;
  showAmount?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
  suppliers?: any[];
  onEdit?: (purchase: Purchase) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}) => {
  const columns = [];

  if (options.showDate !== false) {
    columns.push({
      key: 'tanggal',
      label: 'Tanggal',
      sortable: true,
      width: '120px',
    });
  }

  if (options.showSupplier !== false) {
    columns.push({
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      filterable: true,
    });
  }

  if (options.showAmount !== false) {
    columns.push({
      key: 'totalNilai',
      label: 'Total Nilai',
      sortable: true,
      align: 'right' as const,
      width: '140px',
    });
  }

  if (options.showStatus !== false) {
    columns.push({
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      width: '120px',
    });
  }

  if (options.showActions !== false) {
    columns.push({
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'center' as const,
      width: '80px',
    });
  }

  return columns;
};

/**
 * Create default pagination config
 */
export const createDefaultPaginationConfig = (): PaginationConfig => ({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: false,
  pageSizeOptions: ['5', '10', '20', '50', '100'],
});

/**
 * Update pagination config
 */
export const updatePaginationConfig = (
  current: PaginationConfig,
  updates: Partial<PaginationConfig>
): PaginationConfig => ({
  ...current,
  ...updates,
});

/**
 * Calculate visible page range
 */
export const calculateVisiblePageRange = (
  currentPage: number,
  totalPages: number,
  visibleRange: number = 5
) => {
  const halfRange = Math.floor(visibleRange / 2);
  let startPage = Math.max(1, currentPage - halfRange);
  let endPage = Math.min(totalPages, currentPage + halfRange);

  // Adjust if we're near the beginning or end
  if (endPage - startPage + 1 < visibleRange) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + visibleRange - 1);
    } else {
      startPage = Math.max(1, endPage - visibleRange + 1);
    }
  }

  return { startPage, endPage };
};

/**
 * Format table cell data
 */
export const formatTableCell = (
  value: any,
  type: 'text' | 'number' | 'date' | 'currency' | 'status'
): string => {
  if (value == null) return '-';

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    
    case 'currency':
      return typeof value === 'number' 
        ? new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR' 
          }).format(value)
        : String(value);
    
    case 'date':
      return value instanceof Date 
        ? value.toLocaleDateString('id-ID')
        : new Date(value).toLocaleDateString('id-ID');
    
    case 'status':
      const statusMap: { [key: string]: string } = {
        'pending': 'Menunggu',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
      };
      return statusMap[value] || String(value);
    
    case 'text':
    default:
      return String(value);
  }
};