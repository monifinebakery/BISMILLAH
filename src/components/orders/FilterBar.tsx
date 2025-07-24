// src/components/orders/components/FilterBar.tsx
import React from 'react';
import { Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderFilters, DateRange } from '@/types';
import { orderStatusList } from '@/constants/orderConstants';
import { formatDateRange } from '@/utils';
import DateRangePicker from '@/components/ui/DateRangePicker';

interface FilterBarProps {
  filters: OrderFilters;
  onFiltersChange: (filters: Partial<OrderFilters>) => void;
  onPageChange?: (page: number) => void;
  onClearFilters?: () => void;
  disabled?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  onPageChange,
  onClearFilters,
  disabled = false
}) => {
  const { searchTerm, statusFilter, dateRange } = filters;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ searchTerm: value });
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ statusFilter: value });
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({ dateRange: range });
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      onFiltersChange({
        searchTerm: '',
        statusFilter: 'all',
        dateRange: undefined
      });
    }
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange;

  return (
    <Card className="mb-6 shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          Filter & Pencarian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nomor pesanan atau nama pelanggan..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={disabled}
              className="pl-10 h-11 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors"
            />
          </div>

          {/* Date Range Picker */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onPageChange={onPageChange}
            className={disabled ? 'opacity-50 pointer-events-none' : ''}
          />

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-11 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {orderStatusList.map((statusOption) => (
                <SelectItem key={statusOption.key} value={statusOption.key}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${statusOption.bgColor.replace('bg-', 'bg-')}`}
                    />
                    {statusOption.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-orange-800">Filter aktif:</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Pencarian: "{searchTerm}"
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Status: {orderStatusList.find(s => s.key === statusFilter)?.label}
                </Badge>
              )}
              
              {dateRange && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Tanggal: {formatDateRange(dateRange)}
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={disabled}
                className="h-6 px-2 text-orange-700 hover:text-orange-900 hover:bg-orange-100"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterBar;