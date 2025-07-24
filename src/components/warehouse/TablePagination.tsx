import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  selectedCount: number;
  onPageChange: (page: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  selectedCount,
  onPageChange
}) => {
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
      <div className="text-sm text-gray-600 mb-4 sm:mb-0">
        Showing <span className="font-semibold">{Math.max(1, indexOfFirstItem + 1)}</span> to{' '}
        <span className="font-semibold">{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> entries
        {selectedCount > 0 && (
          <span className="ml-2 text-blue-600 font-medium">
            ({selectedCount} selected)
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
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
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;