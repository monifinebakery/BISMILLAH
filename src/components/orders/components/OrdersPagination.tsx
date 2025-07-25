// src/components/orders/OrdersPagination.tsx
// 📄 ORDERS PAGINATION COMPONENT - Pagination controls and info

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { generatePageNumbers } from '@/components/purchase/components/table/PaginationFooter';

export interface OrdersPaginationProps {
  // Pagination State
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Pagination Actions
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  
  // Display Info
  paginationInfo: {
    start: number;
    end: number;
    total: number;
    currentPage: number;
    totalPages: number;
  };
  
  // Optional Props
  selectedCount?: number;
  loading?: boolean;
  className?: string;
  compact?: boolean;
  showItemsPerPage?: boolean;
  showJumpToFirst?: boolean;
  maxVisiblePages?: number;
}

// 📊 Items Per Page Selector
const ItemsPerPageSelector: React.FC<{
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  loading?: boolean;
  compact?: boolean;
}> = ({ itemsPerPage, onItemsPerPageChange, loading, compact }) => {
  const itemOptions = [5, 10, 20, 25, 50, 100];
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Label htmlFor="items-per-page" className="whitespace-nowrap font-medium">
        {compact ? 'Show' : 'Tampilkan'}
      </Label>
      <Select 
        value={String(itemsPerPage)} 
        onValueChange={(value) => onItemsPerPageChange(Number(value))}
        disabled={loading}
      >
        <SelectTrigger className="w-20 border-gray-300 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {itemOptions.map(option => (
            <SelectItem key={option} value={String(option)}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="font-medium whitespace-nowrap">
        {compact ? 'entries' : 'item per halaman'}
      </span>
    </div>
  );
};

// 📋 Pagination Info Display
const PaginationInfo: React.FC<{
  paginationInfo: {
    start: number;
    end: number;
    total: number;
  };
  selectedCount?: number;
  compact?: boolean;
}> = ({ paginationInfo, selectedCount, compact }) => {
  const { start, end, total } = paginationInfo;
  
  return (
    <div className="text-sm text-gray-600">
      <span>
        {compact ? 'Showing' : 'Menampilkan'}{' '}
        <span className="font-semibold">{start}</span> - <span className="font-semibold">{end}</span>{' '}
        {compact ? 'of' : 'dari'} <span className="font-semibold">{total}</span>{' '}
        {compact ? 'entries' : 'data'}
      </span>
      {selectedCount && selectedCount > 0 && (
        <span className="ml-2 text-blue-600 font-medium">
          ({selectedCount} dipilih)
        </span>
      )}
    </div>
  );
};

// 🔢 Page Number Buttons
const PageNumbers: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  loading?: boolean;
}> = ({ currentPage, totalPages, onPageChange, maxVisible = 5, loading }) => {
  const pageNumbers = generatePageNumbers(currentPage, totalPages, maxVisible);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center gap-1">
      {pageNumbers.map(page => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={loading}
          className={cn(
            "h-9 w-9 text-sm",
            currentPage === page
              ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
              : "hover:bg-gray-100 border-gray-200"
          )}
          variant={currentPage === page ? "default" : "outline"}
        >
          {page}
        </Button>
      ))}
    </div>
  );
};

// 🎯 Navigation Controls
const NavigationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
  showJumpToFirst?: boolean;
  loading?: boolean;
  compact?: boolean;
}> = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  showJumpToFirst = true,
  loading,
  compact
}) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center gap-1">
      {/* First Page */}
      {showJumpToFirst && totalPages > 5 && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={onFirstPage}
          disabled={!hasPreviousPage || loading}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* Previous Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-gray-100"
        onClick={onPreviousPage}
        disabled={!hasPreviousPage || loading}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Next Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-gray-100"
        onClick={onNextPage}
        disabled={!hasNextPage || loading}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Last Page */}
      {showJumpToFirst && totalPages > 5 && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 hover:bg-gray-100"
          onClick={onLastPage}
          disabled={!hasNextPage || loading}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// 📄 Main OrdersPagination Component
export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  setCurrentPage,
  setItemsPerPage,
  goToFirstPage,
  goToLastPage,
  goToPreviousPage,
  goToNextPage,
  paginationInfo,
  selectedCount,
  loading = false,
  className,
  compact = false,
  showItemsPerPage = true,
  showJumpToFirst = true,
  maxVisiblePages = 5
}) => {
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  
  // Don't render if no items
  if (totalItems === 0) {
    return null;
  }
  
  return (
    <div className={cn("bg-white rounded-xl shadow-lg border border-gray-200", className)}>
      {/* Top Controls Section */}
      {showItemsPerPage && (
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ItemsPerPageSelector
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              loading={loading}
              compact={compact}
            />
            
            {/* Current Page Info for Mobile */}
            <div className="sm:hidden text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Pagination Section */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Pagination Info */}
          <div className="order-2 lg:order-1">
            <PaginationInfo
              paginationInfo={paginationInfo}
              selectedCount={selectedCount}
              compact={compact}
            />
          </div>
          
          {/* Pagination Controls */}
          <div className="order-1 lg:order-2 flex items-center gap-3">
            {/* Navigation Controls */}
            <NavigationControls
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onFirstPage={goToFirstPage}
              onPreviousPage={goToPreviousPage}
              onNextPage={goToNextPage}
              onLastPage={goToLastPage}
              showJumpToFirst={showJumpToFirst}
              loading={loading}
              compact={compact}
            />
            
            {/* Page Numbers */}
            <PageNumbers
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              maxVisible={maxVisiblePages}
              loading={loading}
            />
          </div>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
            <span className="text-sm">Memuat...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPagination;