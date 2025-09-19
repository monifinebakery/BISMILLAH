// src/components/shared/filters/OrderFilters.tsx - Shared Order Filters
import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from './SearchInput';
import { StatusFilter } from './StatusFilter';
import { DateRangeFilter } from './DateRangeFilter';
import type { OrderFiltersState, FilterOption } from './types';

interface OrderFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  statusOptions?: FilterOption[];
  customerOptions?: FilterOption[];
  paymentStatusOptions?: FilterOption[];
  isLoading?: boolean;
}

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'ready', label: 'Siap' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' }
];

const DEFAULT_PAYMENT_OPTIONS: FilterOption[] = [
  { value: 'pending', label: 'Belum Bayar' },
  { value: 'partial', label: 'Bayar Sebagian' },
  { value: 'paid', label: 'Lunas' },
  { value: 'refunded', label: 'Dikembalikan' }
];

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFiltersChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  customerOptions = [],
  paymentStatusOptions = DEFAULT_PAYMENT_OPTIONS,
  isLoading = false
}) => {
  const handleFilterChange = (key: keyof OrderFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '' && v !== undefined);
    }
    return false;
  }).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Pesanan
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
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
            value={filters.search || ''}
            onChange={(value) => handleFilterChange('search', value)}
            placeholder="Cari nomor order, customer, atau item..."
            disabled={isLoading}
          />
        </div>
        
        {/* Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status Order</label>
            <StatusFilter
              value={filters.status || ''}
              onChange={(value) => handleFilterChange('status', value)}
              options={statusOptions}
              placeholder="Semua Status"
              disabled={isLoading}
            />
          </div>
          
          {customerOptions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <StatusFilter
                value={filters.customer || ''}
                onChange={(value) => handleFilterChange('customer', value)}
                options={customerOptions}
                placeholder="Semua Customer"
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status Pembayaran</label>
            <StatusFilter
              value={filters.paymentStatus || ''}
              onChange={(value) => handleFilterChange('paymentStatus', value)}
              options={paymentStatusOptions}
              placeholder="Semua Status"
              disabled={isLoading}
            />
          </div>
        </div>
        
        {/* Date Range */}
        <div className="border-t pt-4">
          <DateRangeFilter
            value={filters.dateRange || {}}
            onChange={(range) => handleFilterChange('dateRange', range)}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};