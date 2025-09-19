import React, { useMemo } from 'react';
// ✅ USING SHARED FILTER COMPONENTS
import { SearchInput, StatusFilter, DateRangeFilter } from '@/components/shared/filters';
import type { FilterOption, DateRange as SharedDateRange } from '@/components/shared/filters/types';
import type { PurchaseFilters, PurchaseFiltersProps } from '../types/purchase.types';
import { getStatusDisplayText } from '../utils/purchaseHelpers';

// Define DateRange interface locally for backward compatibility
interface LegacyDateRange {
  from: Date;
  to: Date;
}

// Purchase status options
const PURCHASE_STATUS_OPTIONS: FilterOption[] = [
  { label: getStatusDisplayText('pending'), value: 'pending' },
  { label: getStatusDisplayText('completed'), value: 'completed' },
  { label: getStatusDisplayText('cancelled'), value: 'cancelled' }
];

const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
  filters,
  onChange,
  suppliers = [],
  className = '',
}) => {
  // Convert suppliers to FilterOption format
  const supplierOptions = useMemo(() => {
    return suppliers.map(s => ({
      label: s.nama,
      value: s.id
    }));
  }, [suppliers]);

  // Convert legacy DateRange to shared DateRange format
  const sharedDateRange: SharedDateRange = useMemo(() => {
    if (filters.dateRange) {
      return {
        start: filters.dateRange.from.toISOString().split('T')[0],
        end: filters.dateRange.to.toISOString().split('T')[0]
      };
    }
    return {};
  }, [filters.dateRange]);

  const handleSearchChange = (value: string) => {
    onChange({ ...filters, searchQuery: value });
  };

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      statusFilter: value === '' ? 'all' : value as PurchaseFilters['statusFilter'],
    });
  };

  const handleSupplierChange = (value: string) => {
    onChange({ ...filters, supplierFilter: value === '' ? undefined : value });
  };

  const handleSharedDateRangeChange = (range: SharedDateRange) => {
    if (range.start && range.end) {
      onChange({
        ...filters,
        dateRange: {
          from: new Date(range.start),
          to: new Date(range.end)
        }
      });
    } else {
      onChange({ ...filters, dateRange: undefined });
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 mb-6 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-4">Filter Pembelian</h3>
      
      <div className="space-y-4">
        {/* Search */}
        <SearchInput
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder="Cari supplier atau item..."
        />
        
        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <StatusFilter
              value={filters.statusFilter === 'all' ? '' : filters.statusFilter}
              onChange={handleStatusChange}
              options={PURCHASE_STATUS_OPTIONS}
              placeholder="Semua Status"
            />
          </div>
          
          {/* Supplier Filter */}
          {suppliers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Supplier</label>
              <StatusFilter
                value={filters.supplierFilter || ''}
                onChange={handleSupplierChange}
                options={supplierOptions}
                placeholder="Semua Supplier"
              />
            </div>
          )}
        </div>
        
        {/* Date Range */}
        <div className="border-t pt-4">
          <DateRangeFilter
            value={sharedDateRange}
            onChange={handleSharedDateRangeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseFilters;
