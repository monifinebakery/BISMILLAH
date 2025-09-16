// src/components/ui/VirtualTable.tsx - Advanced Virtual Scrolling Table
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { safePerformance } from '@/utils/browserApiSafeWrappers';


export interface VirtualTableColumn<T> {
  key: string;
  header: string | React.ReactNode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  render: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean; // Hide this column on mobile devices
  mobileWidth?: number; // Custom width for mobile
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (selectedItems: Set<string>) => void;
  getItemId?: (item: T, index: number) => string;
}

const VirtualTable = <T,>({
  data,
  columns,
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  className,
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'Tidak ada data',
  stickyHeader = true,
  striped = true,
  hoverable = true,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  getItemId = (item: T, index: number) => index.toString(),
}: VirtualTableProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Filter columns based on mobile state
  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns;
    
    return columns.filter(column => !column.hideOnMobile);
  }, [columns, isMobile]);

  // Calculate virtual items
  const virtualItems = useMemo(() => {
    if (data.length === 0) return { startIndex: 0, endIndex: 0, visibleItems: [], totalHeight: 0, offsetY: 0 };

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(data.length - 1, startIndex + visibleCount + overscan * 2);
    const visibleItems = data.slice(startIndex, endIndex + 1);
    const totalHeight = data.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
    };
  }, [data, containerHeight, itemHeight, scrollTop, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle column sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = sortKey === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  }, [onSort, sortKey, sortDirection]);

  // Handle row selection
  const handleRowSelection = useCallback((item: T, index: number) => {
    if (!selectable || !onSelectionChange) return;
    
    const itemId = getItemId(item, index);
    const newSelection = new Set(selectedItems);
    
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    
    onSelectionChange(newSelection);
  }, [selectable, onSelectionChange, selectedItems, getItemId]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!selectable || !onSelectionChange) return;
    
    const allSelected = data.every((item, index) => selectedItems.has(getItemId(item, index)));
    
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const allIds = new Set(data.map((item, index) => getItemId(item, index)));
      onSelectionChange(allIds);
    }
  }, [selectable, onSelectionChange, data, selectedItems, getItemId]);

  // Calculate column widths based on visible columns
  const totalFixedWidth = visibleColumns.reduce((sum, col) => {
    const width = isMobile && col.mobileWidth ? col.mobileWidth : (col.width || 0);
    return sum + width;
  }, 0);
  const flexColumns = visibleColumns.filter(col => !col.width);
  const remainingWidth = Math.max(0, 100 - (totalFixedWidth / 8)); // Assuming 8px = 1%
  const flexWidth = flexColumns.length > 0 ? remainingWidth / flexColumns.length : 0;

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            {selectable && (
              <div className="w-12 p-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            )}
            {visibleColumns.map((column, index) => (
              <div
                key={column.key}
                className="p-3 flex-1"
                style={{ width: column.width ? `${column.width}px` : `${flexWidth}%` }}
              >
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: containerHeight }} className="overflow-hidden">
          {Array.from({ length: Math.ceil(containerHeight / itemHeight) }, (_, i) => (
            <div key={i} className="flex border-b border-gray-100" style={{ height: itemHeight }}>
              {selectable && (
                <div className="w-12 p-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              )}
              {visibleColumns.map((column) => (
                <div
                  key={column.key}
                  className="p-3 flex-1"
                  style={{ width: column.width ? `${column.width}px` : `${flexWidth}%` }}
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            {selectable && (
              <div className="w-12 p-3">
                <input type="checkbox" disabled className="rounded" />
              </div>
            )}
            {visibleColumns.map((column) => (
              <div
                key={column.key}
                className={cn(
                  'p-3 font-medium text-gray-700 flex-1',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width ? `${column.width}px` : `${flexWidth}%` }}
              >
                {column.header}
              </div>
            ))}
          </div>
        </div>
        <div 
          className="flex items-center justify-center text-gray-500 text-sm"
          style={{ height: containerHeight }}
        >
          {emptyMessage}
        </div>
      </div>
    );
  }

  const allSelected = data.length > 0 && data.every((item, index) => selectedItems.has(getItemId(item, index)));
  const someSelected = data.some((item, index) => selectedItems.has(getItemId(item, index)));

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className={cn('bg-gray-50 border-b border-gray-200', stickyHeader && 'sticky top-0 z-10')}>
        <div className="flex">
          {selectable && (
            <div className="w-12 p-3 flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          )}
          {visibleColumns.map((column) => (
            <div
              key={column.key}
              className={cn(
                'p-3 font-medium text-gray-700 flex-1 flex items-center gap-2',
                column.align === 'center' && 'justify-center',
                column.align === 'right' && 'justify-end',
                column.sortable && 'cursor-pointer hover:bg-gray-100 transition-colors'
              )}
              style={{ 
                width: isMobile && column.mobileWidth ? `${column.mobileWidth}px` : 
                       column.width ? `${column.width}px` : `${flexWidth}%` 
              }}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <span className="truncate">{column.header}</span>
              {column.sortable && renderSortIcon(column.key)}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: virtualItems.totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${virtualItems.offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {virtualItems.visibleItems.map((item, virtualIndex) => {
              const actualIndex = virtualItems.startIndex + virtualIndex;
              const itemId = getItemId(item, actualIndex);
              const isSelected = selectedItems.has(itemId);
              
              return (
                <div
                  key={itemId}
                  className={cn(
                    'flex border-b border-gray-100 transition-colors',
                    striped && actualIndex % 2 === 0 && 'bg-gray-50/50',
                    hoverable && 'hover:bg-blue-50',
                    isSelected && 'bg-blue-100',
                    onRowClick && 'cursor-pointer',
                    isScrolling && 'pointer-events-none' // Disable interactions while scrolling
                  )}
                  style={{ height: itemHeight }}
                  onClick={() => onRowClick?.(item, actualIndex)}
                >
                  {selectable && (
                    <div className="w-12 p-3 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelection(item, actualIndex);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  {visibleColumns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        'p-3 flex items-center flex-1 min-w-0',
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end'
                      )}
                      style={{ 
                        width: isMobile && column.mobileWidth ? `${column.mobileWidth}px` : 
                               column.width ? `${column.width}px` : `${flexWidth}%` 
                      }}
                    >
                      {column.render(item, actualIndex)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with item count */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
        Menampilkan {virtualItems.startIndex + 1}-{Math.min(virtualItems.endIndex + 1, data.length)} dari {data.length} item
        {selectedItems.size > 0 && (
          <span className="ml-2 text-blue-600 font-medium">
            ({selectedItems.size} dipilih)
          </span>
        )}
      </div>
    </div>
  );
};

export default VirtualTable;

// Hook for virtual table state management
export const useVirtualTable = <T,>(initialData: T[] = []) => {
  const [data, setData] = useState<T[]>(initialData);
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedItems(newSelection);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(data.map((_, index) => index.toString()));
    setSelectedItems(allIds);
  }, [data]);

  return {
    data,
    setData,
    sortKey,
    sortDirection,
    selectedItems,
    loading,
    setLoading,
    handleSort,
    handleSelectionChange,
    clearSelection,
    selectAll,
  };
};

// Performance monitoring hook for virtual table
export const useVirtualTablePerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollEvents: 0,
    visibleItems: 0,
    totalItems: 0,
  });

  const trackRender = useCallback((startTime: number, visibleItems: number, totalItems: number) => {
    const renderTime = safePerformance.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      renderTime,
      visibleItems,
      totalItems,
    }));
  }, []);

  const trackScroll = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      scrollEvents: prev.scrollEvents + 1,
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      scrollEvents: 0,
      visibleItems: 0,
      totalItems: 0,
    });
  }, []);

  return {
    metrics,
    trackRender,
    trackScroll,
    resetMetrics,
  };
};