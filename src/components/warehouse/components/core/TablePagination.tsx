// src/components/warehouse/components/core/TablePagination.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITEMS_PER_PAGE_OPTIONS } from '../../hooks/useWarehousePagination';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  selectedCount?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
  showItemsPerPage?: boolean;
  showSelectedCount?: boolean;
  compact?: boolean;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  selectedCount = 0,
  onPageChange,
  onItemsPerPageChange,
  className,
  showItemsPerPage = true,
  showSelectedCount = true,
  compact = false,
}) => {
  // Calculate visible page range
  const generatePageNumbers = () => {
    const delta = compact ? 1 : 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    // Always include first page
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the main range
    for (let i = start; i <= end; i++) {
      rangeWithDots.push(i);
    }

    // Always include last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = generatePageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (totalPages <= 1 && !compact) return null;

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200",
      compact && "px-2 py-2",
      className
    )}>
      {/* Left side - Items info and per page selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
        {/* Items info */}
        <div className="flex items-center gap-2">
          <span>
            Menampilkan <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> dari <span className="font-medium">{totalItems}</span> item
          </span>
          {showSelectedCount && selectedCount > 0 && (
            <span className="text-orange-600 font-medium">
              ({selectedCount} dipilih)
            </span>
          )}
        </div>

        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange && !compact && (
          <div className="flex items-center gap-2">
            <span>Item per halaman:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right side - Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        {!compact && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className="h-8 w-8 p-0"
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNumber, index) => {
            if (pageNumber === '...') {
              return (
                <div key={`dots-${index}`} className="flex items-center justify-center h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }

            const isCurrentPage = pageNumber === currentPage;
            
            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageClick(pageNumber)}
                className={cn(
                  "h-8 w-8 p-0",
                  isCurrentPage && "bg-orange-500 hover:bg-orange-600 text-white"
                )}
                aria-label={`Halaman ${pageNumber}`}
                aria-current={isCurrentPage ? "page" : undefined}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
          aria-label="Halaman selanjutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        {!compact && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="h-8 w-8 p-0"
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TablePagination;