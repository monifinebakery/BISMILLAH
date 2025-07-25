// components/PaginationControls.tsx - Pagination Component

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { PaginationControlsProps, PaginationState } from '../types';

interface PaginationControlsComponent extends React.FC<PaginationControlsProps> {
  PageButton: React.FC<PageButtonProps>;
  ItemsPerPageSelect: React.FC<ItemsPerPageSelectProps>;
  PaginationInfo: React.FC<PaginationInfoProps>;
  NavigationButtons: React.FC<NavigationButtonsProps>;
}

interface PageButtonProps {
  page: number;
  isActive: boolean;
  onClick: (page: number) => void;
  disabled?: boolean;
}

interface ItemsPerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  disabled?: boolean;
}

interface PaginationInfoProps {
  pagination: PaginationState;
  className?: string;
}

interface NavigationButtonsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

// 🔢 Page Button Component
const PageButton: React.FC<PageButtonProps> = ({
  page,
  isActive,
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={() => onClick(page)}
      disabled={disabled}
      className={`
        relative inline-flex items-center px-3 py-2 text-sm font-medium border transition-colors duration-200
        ${isActive
          ? 'z-10 bg-orange-600 border-orange-600 text-white'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        }
        ${disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer'
        }
        first:rounded-l-lg last:rounded-r-lg
      `}
    >
      {page}
    </button>
  );
};

// 📊 Items Per Page Select Component
const ItemsPerPageSelect: React.FC<ItemsPerPageSelectProps> = ({
  value,
  onChange,
  options = [5, 10, 20, 50],
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Tampilkan:</span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={100}>Semua</option>
      </select>
      <span className="text-sm text-gray-700">per halaman</span>
    </div>
  );
};

// ℹ️ Pagination Info Component
const PaginationInfo: React.FC<PaginationInfoProps> = ({
  pagination,
  className = ""
}) => {
  const { currentPage, itemsPerPage, totalItems } = pagination;
  
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`text-sm text-gray-700 ${className}`}>
      {totalItems === 0 ? (
        <span>Tidak ada data</span>
      ) : (
        <span>
          Menampilkan <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> dari{' '}
          <span className="font-medium">{totalItems.toLocaleString('id-ID')}</span> item
        </span>
      )}
    </div>
  );
};

// 🧭 Navigation Buttons Component
const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  pagination,
  onPageChange,
  disabled = false
}) => {
  const { currentPage, totalPages } = pagination;
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex items-center gap-1">
      {/* First Page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={disabled || !canGoPrevious}
        className="relative inline-flex items-center p-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-l-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Halaman pertama"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* Previous Page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || !canGoPrevious}
        className="relative inline-flex items-center p-2 border-t border-b border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Halaman sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Next Page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || !canGoNext}
        className="relative inline-flex items-center p-2 border-t border-b border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Halaman selanjutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Last Page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={disabled || !canGoNext}
        className="relative inline-flex items-center p-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-r-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Halaman terakhir"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
};

// 🎯 Main Pagination Controls Component
const PaginationControls: PaginationControlsComponent = ({
  pagination,
  onPageChange,
  disabled = false
}) => {
  const { currentPage, totalPages } = pagination;

  // Calculate which page numbers to show
  const pageRange = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate start and end of the range
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    // Adjust start and end to show more pages if we're near the beginning or end
    if (currentPage - delta <= 1) {
      end = Math.min(totalPages, end + (delta - (currentPage - 1)));
    }
    if (currentPage + delta >= totalPages) {
      start = Math.max(1, start - (delta - (totalPages - currentPage)));
    }

    // Create the range array
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if necessary
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the main range
    rangeWithDots.push(...range);

    // Add last page and dots if necessary
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between py-3">
        <PaginationInfo pagination={pagination} />
        <div className="text-sm text-gray-500">
          Hanya 1 halaman
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3">
      {/* Left side - Info and Items per page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <PaginationInfo pagination={pagination} />
        <ItemsPerPageSelect
          value={pagination.itemsPerPage}
          onChange={(newItemsPerPage) => {
            // Calculate what the current page should be with new items per page
            const currentFirstItem = (currentPage - 1) * pagination.itemsPerPage + 1;
            const newPage = Math.ceil(currentFirstItem / newItemsPerPage);
            onPageChange(newPage);
          }}
          disabled={disabled}
        />
      </div>

      {/* Right side - Navigation */}
      <div className="flex items-center gap-4">
        {/* Page numbers */}
        <div className="flex items-center">
          {pageRange.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            return (
              <PageButton
                key={page}
                page={page as number}
                isActive={currentPage === page}
                onClick={onPageChange}
                disabled={disabled}
              />
            );
          })}
        </div>

        {/* Navigation buttons */}
        <NavigationButtons
          pagination={pagination}
          onPageChange={onPageChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// 🎯 Compact Pagination Component (for mobile)
export const CompactPaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  disabled = false
}) => {
  const { currentPage, totalPages } = pagination;
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Info */}
      <PaginationInfo pagination={pagination} className="text-center" />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || !canGoPrevious}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </button>

        <span className="text-sm text-gray-700">
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || !canGoNext}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Selanjutnya
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Jump to page */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-700">Ke halaman:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              onPageChange(page);
            }
          }}
          disabled={disabled}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
};

// 📊 Pagination Summary Component
export const PaginationSummary: React.FC<{
  pagination: PaginationState;
  label?: string;
  className?: string;
}> = ({
  pagination,
  label = "item",
  className = ""
}) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  
  if (totalItems === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Tidak ada {label}
      </div>
    );
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const progressPercent = totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">
          {startItem}-{endItem} dari {totalItems.toLocaleString('id-ID')} {label}
        </span>
        <span className="text-gray-500">
          Halaman {currentPage}/{totalPages}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-orange-600 h-1 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
};

// Attach sub-components
PaginationControls.PageButton = PageButton;
PaginationControls.ItemsPerPageSelect = ItemsPerPageSelect;
PaginationControls.PaginationInfo = PaginationInfo;
PaginationControls.NavigationButtons = NavigationButtons;

export default PaginationControls;