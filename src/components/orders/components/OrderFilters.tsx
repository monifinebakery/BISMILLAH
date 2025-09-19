// Orders Filter Components using Shared Filter System
import React, { useMemo } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// ✅ USING SHARED FILTER COMPONENTS
import { SearchInput, StatusFilter, DateRangeFilter } from '@/components/shared/filters';
import type { FilterOption, DateRange as SharedDateRange } from '@/components/shared/filters/types';
import type { UseOrderUIReturn } from '../types';
import { ORDER_STATUSES, getStatusText, TABLE_PAGE_SIZES } from '../constants';

interface OrderFiltersProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
}

// Order status options for shared StatusFilter
const ORDER_STATUS_OPTIONS: FilterOption[] = ORDER_STATUSES.map(status => ({
  label: getStatusText(status),
  value: status
}));

// Items per page options for shared StatusFilter
const ITEMS_PER_PAGE_OPTIONS: FilterOption[] = TABLE_PAGE_SIZES.map(size => ({
  label: size.toString(),
  value: size.toString()
}));

// Main Filters Component using Shared Filter Components
const OrderFilters: React.FC<OrderFiltersProps> = ({ uiState, loading }) => {
  // Convert legacy date filter format to shared DateRange format
  const sharedDateRange: SharedDateRange = useMemo(() => {
    if (uiState.filters.dateFrom && uiState.filters.dateTo) {
      return {
        start: uiState.filters.dateFrom.toISOString().split('T')[0],
        end: uiState.filters.dateTo.toISOString().split('T')[0]
      };
    }
    return {};
  }, [uiState.filters.dateFrom, uiState.filters.dateTo]);

  // Handle shared date range change
  const handleSharedDateRangeChange = (range: SharedDateRange) => {
    if (range.start && range.end) {
      uiState.updateFilters({
        dateFrom: new Date(range.start),
        dateTo: new Date(range.end)
      });
    } else {
      uiState.updateFilters({ dateFrom: null, dateTo: null });
    }
  };

  const activeFilterCount = Object.values(uiState.filters).filter(value => {
    if (value === null || value === undefined || value === '' || value === 'all') {
      return false;
    }
    return true;
  }).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Pesanan
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          
          {uiState.hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={uiState.clearFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <SearchInput
            value={uiState.filters.search}
            onChange={(search) => uiState.updateFilters({ search })}
            placeholder="Cari pesanan, pelanggan, telepon..."
            disabled={loading}
          />
        </div>
        
        {/* Status and Items Per Page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status Order</label>
            <StatusFilter
              value={uiState.filters.status === 'all' ? '' : uiState.filters.status || ''}
              onChange={(status) => uiState.updateFilters({ status: status === '' ? 'all' : status })}
              options={ORDER_STATUS_OPTIONS}
              placeholder="Semua Status"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Items per Page</label>
            <StatusFilter
              value={uiState.itemsPerPage.toString()}
              onChange={(value) => uiState.setItemsPerPage(parseInt(value))}
              options={ITEMS_PER_PAGE_OPTIONS}
              placeholder="Jumlah item"
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Date Range */}
        <div className="border-t pt-4">
          <DateRangeFilter
            value={sharedDateRange}
            onChange={handleSharedDateRangeChange}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderFilters;
