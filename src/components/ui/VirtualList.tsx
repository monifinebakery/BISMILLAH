import React from 'react';
import { cn } from '@/lib/utils';
import { useVirtualScrolling, useInfiniteVirtualScrolling } from '@/hooks/useVirtualScrolling';

interface VirtualListProps<T> {
  data: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  // Infinite scrolling props
  hasNextPage?: boolean;
  loadMore?: () => void;
  isLoadingMore?: boolean;
}

const VirtualList = <T,>({
  data,
  itemHeight,
  containerHeight,
  overscan = 5,
  className,
  renderItem,
  loading = false,
  emptyMessage = 'Tidak ada data',
  loadingMessage = 'Memuat...',
  hasNextPage = false,
  loadMore,
  isLoadingMore = false
}: VirtualListProps<T>) => {
  const virtualScrolling = hasNextPage && loadMore
    ? useInfiniteVirtualScrolling({
        itemHeight,
        containerHeight,
        overscan,
        data,
        hasNextPage,
        loadMore
      })
    : useVirtualScrolling({
        itemHeight,
        containerHeight,
        overscan,
        data
      });

  const {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    scrollElementRef,
    isScrolling
  } = virtualScrolling;

  if (loading) {
    return (
      <div 
        className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}
        style={{ height: containerHeight }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            {loadingMessage}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}
        style={{ height: containerHeight }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((item, virtualIndex) => {
              const actualIndex = startIndex + virtualIndex;
              
              return (
                <div
                  key={actualIndex}
                  className={cn(
                    'transition-opacity',
                    isScrolling && 'pointer-events-none'
                  )}
                  style={{ height: itemHeight }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
            
            {/* Loading indicator for infinite scrolling */}
            {hasNextPage && isLoadingMore && (
              <div 
                className="flex items-center justify-center py-4 text-gray-500"
                style={{ height: itemHeight }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  Memuat lebih banyak...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with item count */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
        Menampilkan {startIndex + 1}-{Math.min(endIndex + 1, data.length)} dari {data.length} item
        {hasNextPage && (
          <span className="ml-2 text-blue-600">
            (scroll untuk memuat lebih banyak)
          </span>
        )}
      </div>
    </div>
  );
};

export default VirtualList;

// Komponen VirtualGrid untuk layout grid
interface VirtualGridProps<T> {
  data: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  gap?: number;
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export const VirtualGrid = <T,>({
  data,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  gap = 8,
  overscan = 5,
  className,
  renderItem,
  loading = false,
  emptyMessage = 'Tidak ada data'
}: VirtualGridProps<T>) => {
  // Calculate items per row
  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(data.length / itemsPerRow);

  const virtualScrolling = useVirtualScrolling({
    itemHeight: rowHeight,
    containerHeight,
    overscan,
    data: Array.from({ length: totalRows }, (_, rowIndex) => {
      const startIndex = rowIndex * itemsPerRow;
      const endIndex = Math.min(startIndex + itemsPerRow, data.length);
      return data.slice(startIndex, endIndex);
    })
  });

  const {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    scrollElementRef,
    isScrolling
  } = virtualScrolling;

  if (loading) {
    return (
      <div 
        className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}
        style={{ height: containerHeight }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Memuat...
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}
        style={{ height: containerHeight }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((rowItems, virtualRowIndex) => {
              const actualRowIndex = startIndex + virtualRowIndex;
              
              return (
                <div
                  key={actualRowIndex}
                  className={cn(
                    'flex transition-opacity',
                    isScrolling && 'pointer-events-none'
                  )}
                  style={{ 
                    height: itemHeight,
                    gap: `${gap}px`,
                    marginBottom: `${gap}px`
                  }}
                >
                  {rowItems.map((item: T, itemIndex: number) => {
                    const actualIndex = actualRowIndex * itemsPerRow + itemIndex;
                    
                    return (
                      <div
                        key={actualIndex}
                        style={{ 
                          width: itemWidth,
                          height: itemHeight,
                          flexShrink: 0
                        }}
                      >
                        {renderItem(item, actualIndex)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Footer with item count */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
        Menampilkan {data.length} item dalam {totalRows} baris
      </div>
    </div>
  );
};