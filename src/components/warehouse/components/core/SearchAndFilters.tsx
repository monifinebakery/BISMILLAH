// src/components/warehouse/components/core/SearchAndFilters.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Calendar,
  Package,
  AlertTriangle,
  Clock,
  Grid3X3,
  List,
  Settings2,
} from 'lucide-react';
import { FilterOptions } from '../../types/warehouse';
import { cn } from '@/lib/utils';
import { ITEMS_PER_PAGE_OPTIONS } from '../../hooks/useWarehousePagination';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOptions;
  onFiltersChange?: (filters: Partial<FilterOptions>) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  availableCategories?: string[];
  availableSuppliers?: string[];
  onResetFilters?: () => void;
  activeFiltersCount?: number;
  className?: string;
  showAdvancedFilters?: boolean;
  viewMode?: 'table' | 'card' | 'list';
  onViewModeChange?: (mode: 'table' | 'card' | 'list') => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  itemsPerPage,
  onItemsPerPageChange,
  isSelectionMode = false,
  onToggleSelectionMode,
  availableCategories = [],
  availableSuppliers = [],
  onResetFilters,
  activeFiltersCount = 0,
  className,
  showAdvancedFilters = true,
  viewMode = 'table',
  onViewModeChange,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    if (onFiltersChange) {
      onFiltersChange({ [key]: value });
    }
  };

  const handleMultiSelectFilter = (key: 'kategori' | 'supplier', value: string, checked: boolean) => {
    if (!filters || !onFiltersChange) return;
    
    const currentValues = filters[key] || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFiltersChange({ [key]: newValues });
  };

  const clearAllFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    }
  };

  // Advanced Filters Component
  const AdvancedFilters = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Kategori
        </Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {availableCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters?.kategori?.includes(category) || false}
                onCheckedChange={(checked) => 
                  handleMultiSelectFilter('kategori', category, checked as boolean)
                }
              />
              <Label 
                htmlFor={`category-${category}`}
                className="text-sm cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Supplier
        </Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {availableSuppliers.map((supplier) => (
            <div key={supplier} className="flex items-center space-x-2">
              <Checkbox
                id={`supplier-${supplier}`}
                checked={filters?.supplier?.includes(supplier) || false}
                onCheckedChange={(checked) => 
                  handleMultiSelectFilter('supplier', supplier, checked as boolean)
                }
              />
              <Label 
                htmlFor={`supplier-${supplier}`}
                className="text-sm cursor-pointer"
              >
                {supplier}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status Filter</Label>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="low-stock"
            checked={filters?.stokRendah || false}
            onCheckedChange={(checked) => 
              handleFilterChange('stokRendah', checked as boolean)
            }
          />
          <Label htmlFor="low-stock" className="text-sm cursor-pointer flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            Stok Rendah
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="expiring-soon"
            checked={filters?.hampirExpired || false}
            onCheckedChange={(checked) => 
              handleFilterChange('hampirExpired', checked as boolean)
            }
          />
          <Label htmlFor="expiring-soon" className="text-sm cursor-pointer flex items-center gap-2">
            <Clock className="h-3 w-3 text-red-500" />
            Hampir Expired
          </Label>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Rentang Tanggal Expired
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="date-start" className="text-xs text-gray-500">Dari</Label>
            <Input
              id="date-start"
              type="date"
              value={filters?.dateRange?.start ? 
                new Date(filters.dateRange.start).toISOString().split('T')[0] : 
                ''
              }
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters?.dateRange,
                start: e.target.value ? new Date(e.target.value) : null
              })}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="date-end" className="text-xs text-gray-500">Sampai</Label>
            <Input
              id="date-end"
              type="date"
              value={filters?.dateRange?.end ? 
                new Date(filters.dateRange.end).toISOString().split('T')[0] : 
                ''
              }
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters?.dateRange,
                end: e.target.value ? new Date(e.target.value) : null
              })}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("bg-white border-b border-gray-200 p-4", className)}>
      {/* Main Controls Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Left side - Search and Filters */}
        <div className="flex flex-1 items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama, kategori, atau supplier..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Advanced Filters - Desktop */}
          {showAdvancedFilters && !isMobile && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Filter Data</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Reset Semua
                    </Button>
                  )}
                </div>
                <AdvancedFilters />
              </PopoverContent>
            </Popover>
          )}

          {/* Advanced Filters - Mobile */}
          {showAdvancedFilters && isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Mode Toggle */}
          {onViewModeChange && isMobile && (
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('table')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('card')}
                className="rounded-none"
              >
                <Package className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Items per page */}
          {itemsPerPage && onItemsPerPageChange && !isMobile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
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

          {/* Selection Mode Toggle */}
          {onToggleSelectionMode && (
            <Button
              variant={isSelectionMode ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleSelectionMode}
              className={cn(
                "flex items-center gap-2",
                isSelectionMode && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              <Settings2 className="h-4 w-4" />
              {isSelectionMode ? 'Exit Select' : 'Select'}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters */}
      {showAdvancedFilters && isMobile && showMobileFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Filter Data</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Reset Semua
              </Button>
            )}
          </div>
          <AdvancedFilters />
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-600">Filter aktif:</span>
          
          {filters?.kategori?.map((category) => (
            <Badge key={`kategori-${category}`} variant="secondary" className="text-xs">
              Kategori: {category}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMultiSelectFilter('kategori', category, false)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}

          {filters?.supplier?.map((supplier) => (
            <Badge key={`supplier-${supplier}`} variant="secondary" className="text-xs">
              Supplier: {supplier}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMultiSelectFilter('supplier', supplier, false)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}

          {filters?.stokRendah && (
            <Badge variant="secondary" className="text-xs">
              Stok Rendah
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('stokRendah', false)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters?.hampirExpired && (
            <Badge variant="secondary" className="text-xs">
              Hampir Expired
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('hampirExpired', false)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {(filters?.dateRange?.start || filters?.dateRange?.end) && (
            <Badge variant="secondary" className="text-xs">
              Rentang Tanggal
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('dateRange', { start: null, end: null })}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Hapus Semua
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;