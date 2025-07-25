// src/components/orders/OrdersFilters.tsx
// 🔍 ORDERS FILTERS COMPONENT - Search, date, and status filters

import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import DateRangePicker from '@/components/ui/DateRangePicker';
import FilterSummary, { createCommonFilters } from '@/components/ui/FilterSummary';
import { orderStatusList } from '../constants/orderConstants';

export interface OrdersFiltersProps {
  // Filter Values
  searchTerm: string;
  dateRange: DateRange | undefined;
  statusFilter: string;
  
  // Filter Actions
  onSearchChange: (term: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
  
  // Display Props
  className?: string;
  loading?: boolean;
  activeFiltersCount?: number;
  filterSummary?: {
    searchTerm?: string;
    statusLabel?: string;
    dateRangeText?: string;
  };
  
  // Layout Options
  variant?: 'default' | 'compact' | 'sidebar';
  showFilterSummary?: boolean;
  showClearButton?: boolean;
  
  // Page Control
  onPageReset?: () => void;
}

// 🔎 Search Filter Component
const SearchFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onPageReset?: () => void;
  loading?: boolean;
  placeholder?: string;
  variant?: 'default' | 'compact';
}> = ({ 
  value, 
  onChange, 
  onPageReset, 
  loading, 
  placeholder = "Cari nomor pesanan, nama pelanggan, atau telepon...",
  variant = 'default' 
}) => {
  const inputHeight = variant === 'compact' ? 'h-9' : 'h-11';
  
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (onPageReset) onPageReset();
        }}
        disabled={loading}
        className={cn(
          "pl-10 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors",
          inputHeight
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100"
          onClick={() => {
            onChange('');
            if (onPageReset) onPageReset();
          }}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

// 📊 Status Filter Component
const StatusFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onPageReset?: () => void;
  loading?: boolean;
  variant?: 'default' | 'compact';
}> = ({ value, onChange, onPageReset, loading, variant = 'default' }) => {
  const triggerHeight = variant === 'compact' ? 'h-9' : 'h-11';
  
  return (
    <div className="space-y-2">
      {variant === 'default' && (
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Status Pesanan
        </Label>
      )}
      <Select
        value={value}
        onValueChange={(newValue) => {
          onChange(newValue);
          if (onPageReset) onPageReset();
        }}
        disabled={loading}
      >
        <SelectTrigger className={cn(
          "border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors",
          triggerHeight
        )}>
          <SelectValue placeholder="Pilih Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              Semua Status
            </div>
          </SelectItem>
          {orderStatusList.map((statusOption) => (
            <SelectItem key={statusOption.key} value={statusOption.key}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  // Add status color mapping here
                  statusOption.key === 'pending' && "bg-yellow-400",
                  statusOption.key === 'confirmed' && "bg-blue-400", 
                  statusOption.key === 'processing' && "bg-orange-400",
                  statusOption.key === 'shipped' && "bg-purple-400",
                  statusOption.key === 'delivered' && "bg-green-400",
                  statusOption.key === 'completed' && "bg-green-600",
                  statusOption.key === 'cancelled' && "bg-red-400",
                  statusOption.key === 'refunded' && "bg-gray-400"
                )}></div>
                {statusOption.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// 📅 Date Range Filter Component
const DateRangeFilter: React.FC<{
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  onPageReset?: () => void;
  loading?: boolean;
  variant?: 'default' | 'compact';
}> = ({ value, onChange, onPageReset, loading, variant = 'default' }) => {
  const handleDateRangeChange = (range: DateRange | undefined) => {
    onChange(range);
    if (onPageReset) onPageReset();
  };

  return (
    <div className="space-y-2">
      {variant === 'default' && (
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Rentang Tanggal
        </Label>
      )}
      <DateRangePicker
        value={value}
        onChange={handleDateRangeChange}
        placeholder="Pilih rentang tanggal"
        showPresets={true}
        autoClose={false}
        disabled={loading}
        className={variant === 'compact' ? 'h-9' : 'h-11'}
      />
    </div>
  );
};

// 🧹 Quick Actions Component
const QuickActions: React.FC<{
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  loading?: boolean;
  variant?: 'default' | 'compact';
}> = ({ onClearFilters, hasActiveFilters, loading, variant = 'default' }) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="flex items-end">
      <Button
        variant="outline"
        size={variant === 'compact' ? 'sm' : 'default'}
        onClick={onClearFilters}
        disabled={loading}
        className="border-orange-300 text-orange-600 hover:bg-orange-50"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Filter
      </Button>
    </div>
  );
};

// 🔍 Main OrdersFilters Component
export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  searchTerm,
  dateRange,
  statusFilter,
  onSearchChange,
  onDateRangeChange,
  onStatusFilterChange,
  onClearFilters,
  className,
  loading = false,
  activeFiltersCount = 0,
  filterSummary,
  variant = 'default',
  showFilterSummary = true,
  showClearButton = true,
  onPageReset
}) => {
  // 🏷️ Create filter items for FilterSummary
  const activeFilters = React.useMemo(() => {
    if (!filterSummary || !showFilterSummary) return [];
    
    return createCommonFilters({
      searchTerm: filterSummary.searchTerm,
      statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
      statusLabel: filterSummary.statusLabel,
      dateRangeText: filterSummary.dateRangeText
    });
  }, [filterSummary, statusFilter, showFilterSummary]);

  // 🎯 Handle individual filter removal
  const handleRemoveFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'search':
        onSearchChange('');
        break;
      case 'status':
        onStatusFilterChange('all');
        break;
      case 'date':
        onDateRangeChange(undefined);
        break;
    }
    if (onPageReset) onPageReset();
  };

  // 🎯 Handle clear all filters
  const handleClearAllFilters = () => {
    onClearFilters();
    if (onPageReset) onPageReset();
  };

  // 🎨 Layout variants
  const getLayoutConfig = () => {
    switch (variant) {
      case 'compact':
        return {
          gridCols: 'grid-cols-1 md:grid-cols-4',
          spacing: 'gap-3',
          cardPadding: 'p-4',
          showTitle: false
        };
      case 'sidebar':
        return {
          gridCols: 'grid-cols-1',
          spacing: 'gap-4',
          cardPadding: 'p-4',
          showTitle: true
        };
      default:
        return {
          gridCols: 'grid-cols-1 lg:grid-cols-3',
          spacing: 'gap-4',
          cardPadding: 'p-6',
          showTitle: true
        };
    }
  };

  const layout = getLayoutConfig();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Filters Card */}
      <Card className="shadow-lg border-0 bg-white">
        {layout.showTitle && (
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-500" />
                Filter & Pencarian
              </CardTitle>
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {activeFiltersCount} filter aktif
                  </span>
                  {showClearButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllFilters}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        )}
        
        <CardContent className={layout.cardPadding}>
          <div className={cn("grid", layout.gridCols, layout.spacing)}>
            {/* Search Input */}
            <div className={variant === 'sidebar' ? 'space-y-2' : ''}>
              {variant === 'sidebar' && (
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Pencarian
                </Label>
              )}
              <SearchFilter
                value={searchTerm}
                onChange={onSearchChange}
                onPageReset={onPageReset}
                loading={loading}
                variant={variant === 'compact' ? 'compact' : 'default'}
                placeholder={
                  variant === 'compact' 
                    ? "Cari pesanan..." 
                    : "Cari nomor pesanan, nama pelanggan, atau telepon..."
                }
              />
            </div>

            {/* Date Range Picker */}
            <DateRangeFilter
              value={dateRange}
              onChange={onDateRangeChange}
              onPageReset={onPageReset}
              loading={loading}
              variant={variant === 'compact' ? 'compact' : 'default'}
            />

            {/* Status Filter */}
            <StatusFilter
              value={statusFilter}
              onChange={onStatusFilterChange}
              onPageReset={onPageReset}
              loading={loading}
              variant={variant === 'compact' ? 'compact' : 'default'}
            />

            {/* Quick Actions */}
            {variant === 'compact' && showClearButton && (
              <QuickActions
                onClearFilters={handleClearAllFilters}
                hasActiveFilters={activeFiltersCount > 0}
                loading={loading}
                variant="compact"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {showFilterSummary && activeFilters.length > 0 && (
        <FilterSummary
          filters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          color="orange"
          variant={variant === 'compact' ? 'compact' : 'default'}
          showIcon={true}
          showClearAll={showClearButton}
        />
      )}

      {/* Loading State Overlay */}
      {loading && (
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
              <span className="text-sm">Memuat filter...</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Statistics - Only for default variant */}
      {variant === 'default' && activeFiltersCount > 0 && !loading && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-700">
              🔍 Filter aktif membantu mempersempit pencarian Anda
            </span>
            <span className="text-orange-600 font-medium">
              {activeFiltersCount} filter digunakan
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersFilters;