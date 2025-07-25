import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckSquare, X, Filter, RotateCcw } from 'lucide-react';
import { usePurchaseTable } from '../../context/PurchaseTableContext';

interface PurchaseTableControlsProps {
  className?: string;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

const PurchaseTableControls: React.FC<PurchaseTableControlsProps> = ({
  className = '',
  showFilters = false,
  onToggleFilters,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    isSelectionMode,
    setIsSelectionMode,
    selectedPurchaseIds,
    resetSelection,
    resetPagination,
    searchStats,
  } = usePurchaseTable();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPagination();
  };

  const handlePageSizeChange = (value: string) => {
    setItemsPerPage(Number(value));
    resetPagination();
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      resetSelection();
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const hasActiveSearch = searchTerm.trim() !== '';
  const hasActiveFilters = searchStats?.hasActiveFilters || false;

  return (
    <div className={`p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50 ${className}`}>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Label htmlFor="show-entries" className="whitespace-nowrap font-medium">
              Show
            </Label>
            <Select value={String(itemsPerPage)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="font-medium">entries</span>
          </div>

          {/* Selection Mode Toggle */}
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className={isSelectionMode 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "border-blue-300 text-blue-600 hover:bg-blue-50"
            }
          >
            {isSelectionMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Keluar Mode Pilih
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Mode Pilih
              </>
            )}
          </Button>

          {/* Selected Count */}
          {selectedPurchaseIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <CheckSquare className="h-4 w-4" />
              {selectedPurchaseIds.length} dipilih
            </div>
          )}

          {/* Filter Toggle */}
          {onToggleFilters && (
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={onToggleFilters}
              className={showFilters 
                ? "bg-gray-600 hover:bg-gray-700" 
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {/* Search Results Info */}
          {searchStats && (hasActiveSearch || hasActiveFilters) && (
            <div className="text-sm text-gray-600 hidden sm:block">
              {searchStats.filtered} dari {searchStats.total} hasil
              {searchStats.hidden > 0 && (
                <span className="text-orange-600 font-medium">
                  ({searchStats.hidden} tersembunyi)
                </span>
              )}
            </div>
          )}

          {/* Clear Filters */}
          {(hasActiveSearch || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                resetPagination();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nama supplier..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
            {hasActiveSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  resetPagination();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Results */}
      {searchStats && (hasActiveSearch || hasActiveFilters) && (
        <div className="mt-3 text-sm text-gray-600 sm:hidden">
          Menampilkan {searchStats.filtered} dari {searchStats.total} hasil
          {searchStats.hidden > 0 && (
            <span className="text-orange-600 font-medium ml-1">
              ({searchStats.hidden} tersembunyi)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseTableControls;