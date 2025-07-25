// src/components/orders/components/PaginationControls.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  selectedCount?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  selectedCount = 0,
  onPageChange,
  disabled = false
}) => {
  if (totalItems === 0) {
    return null;
  }

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(indexOfFirstItem + itemsPerPage, totalItems);

  const handlePrevPage = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (!disabled) {
      onPageChange(page);
    }
  };

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
      {/* Info text */}
      <div className="text-sm text-gray-600 mb-4 sm:mb-0">
        Showing <span className="font-semibold">{Math.max(1, indexOfFirstItem + 1)}</span> to{' '}
        <span className="font-semibold">{indexOfLastItem}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> entries
        {selectedCount > 0 && (
          <span className="ml-2 text-blue-600 font-medium">
            ({selectedCount} selected)
          </span>
        )}
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100 disabled:opacity-50"
          onClick={handlePrevPage}
          disabled={currentPage === 1 || disabled}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {totalPages <= 7 ? (
          // Show all pages if total pages <= 7
          Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={disabled}
              className={cn(
                "h-9 w-9",
                currentPage === page
                  ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                  : "hover:bg-gray-100"
              )}
              variant={currentPage === page ? "default" : "ghost"}
              aria-label={`Page ${page}`}
            >
              {page}
            </Button>
          ))
        ) : (
          // Show pages with ellipses for more than 7 pages
          getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="h-9 w-9 flex items-center justify-center text-gray-400">
                  ...
                </span>
              ) : (
                <Button
                  onClick={() => handlePageClick(page as number)}
                  disabled={disabled}
                  className={cn(
                    "h-9 w-9",
                    currentPage === page
                      ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                      : "hover:bg-gray-100"
                  )}
                  variant={currentPage === page ? "default" : "ghost"}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))
        )}

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100 disabled:opacity-50"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0 || disabled}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;