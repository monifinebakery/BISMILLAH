import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePurchaseTable } from '../../context/PurchaseTableContext';
import { cn } from '@/lib/utils';

interface PaginationFooterProps {
  className?: string;
}

const PaginationFooter: React.FC<PaginationFooterProps> = ({ className = '' }) => {
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    filteredPurchases,
    currentItems,
    selectedPurchaseIds,
  } = usePurchaseTable();

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredPurchases.length);
  const totalItems = filteredPurchases.length;

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const maxVisible = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic
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

  const pageNumbers = generatePageNumbers();

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPage = (page: number) => setCurrentPage(page);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50 ${className}`}>
      {/* Info Section */}
      <div className="text-sm text-gray-600 mb-4 sm:mb-0">
        <span>
          Showing <span className="font-semibold">{startItem}</span> to{' '}
          <span className="font-semibold">{endItem}</span> of{' '}
          <span className="font-semibold">{totalItems}</span> entries
        </span>
        {selectedPurchaseIds.length > 0 && (
          <span className="ml-2 text-blue-600 font-medium">
            ({selectedPurchaseIds.length} selected)
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={goToFirstPage}
          disabled={isFirstPage}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-500 text-sm"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isCurrent = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                onClick={() => goToPage(pageNumber)}
                className={cn(
                  "h-9 w-9 text-sm",
                  isCurrent
                    ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                    : "hover:bg-gray-100"
                )}
                variant={isCurrent ? "default" : "ghost"}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={goToNextPage}
          disabled={isLastPage}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={goToLastPage}
          disabled={isLastPage}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Page Indicator */}
      <div className="sm:hidden mt-2 text-xs text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default PaginationFooter;