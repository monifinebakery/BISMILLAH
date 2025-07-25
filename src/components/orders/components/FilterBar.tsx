// src/components/orders/components/FilterBar.tsx - MOBILE FRIENDLY VERSION
import React, { useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderFilters, DateRange } from '../types/order';
import { orderStatusList } from '../constants/orderConstants';
import { formatDateRange } from '@/utils/unifiedDateUtils';
import { useIsMobile } from '@/hooks/use-mobile';  // ← Import hook yang sudah ada
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
  
  // 🔧 FIX: Add mobile detection using your existing hook
  const isMobile = useIsMobile(); // Uses default 768px breakpoint

  // 🔧 FIX: Safe handlers with proper error handling
  const handleSearchChange = useCallback((value: string) => {
    try {
      if (typeof onFiltersChange !== 'function') {
        console.error('FilterBar: onFiltersChange is not a function');
        return;
      }
      
      onFiltersChange({ searchTerm: value });
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('FilterBar: Error in search change:', error);
    }
  }, [onFiltersChange, onPageChange]);

  const handleStatusChange = useCallback((value: string) => {
    try {
      if (typeof onFiltersChange !== 'function') {
        console.error('FilterBar: onFiltersChange is not a function');
        return;
      }
      
      onFiltersChange({ statusFilter: value });
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('FilterBar: Error in status change:', error);
    }
  }, [onFiltersChange, onPageChange]);

  // 🔧 FIX: Enhanced date range change handler
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    try {
      console.log('FilterBar: Date range change:', range);
      
      if (typeof onFiltersChange !== 'function') {
        console.error('FilterBar: onFiltersChange is not a function');
        return;
      }
      
      onFiltersChange({ dateRange: range });
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('FilterBar: Error in date range change:', error);
    }
  }, [onFiltersChange, onPageChange]);

  const handleClearAll = useCallback(() => {
    try {
      if (onClearFilters && typeof onClearFilters === 'function') {
        onClearFilters();
      } else if (onFiltersChange && typeof onFiltersChange === 'function') {
        onFiltersChange({
          searchTerm: '',
          statusFilter: 'all',
          dateRange: undefined
        });
      }
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(1);
      }
    } catch (error) {
      console.error('FilterBar: Error clearing filters:', error);
    }
  }, [onClearFilters, onFiltersChange, onPageChange]);

  // 🔧 FIX: Memoize date range formatting with enhanced safety
  const safeDateRangeText = useMemo(() => {
    if (!dateRange) return null;
    
    try {
      const formatted = formatDateRange(dateRange);
      
      // Enhanced safety checks
      if (!formatted || 
          formatted.includes('tidak valid') || 
          formatted.includes('Error') ||
          formatted === 'Pilih rentang tanggal') {
        return 'Rentang tanggal';
      }
      
      return formatted;
    } catch (error) {
      console.warn('FilterBar: Date range formatting error:', error, dateRange);
      return 'Rentang tanggal';
    }
  }, [dateRange]);

  // 🔧 FIX: Safe status label lookup with fallback
  const selectedStatusLabel = useMemo(() => {
    if (!statusFilter || statusFilter === 'all') return null;
    
    try {
      const statusOption = orderStatusList.find(s => s.key === statusFilter);
      return statusOption?.label || statusFilter;
    } catch (error) {
      console.warn('FilterBar: Status label lookup error:', error);
      return statusFilter;
    }
  }, [statusFilter]);

  // 🔧 FIX: Safe active filters check
  const hasActiveFilters = useMemo(() => {
    try {
      return !!(
        (searchTerm && searchTerm.trim()) || 
        (statusFilter && statusFilter !== 'all') || 
        dateRange
      );
    } catch (error) {
      console.warn('FilterBar: Active filters check error:', error);
      return false;
    }
  }, [searchTerm, statusFilter, dateRange]);

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
              value={searchTerm || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={disabled}
              className="pl-10 h-11 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors"
            />
          </div>

          {/* Date Range Picker - 🔧 FIXED: Now mobile-friendly! */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onPageChange={onPageChange}
            placeholder="Pilih rentang tanggal"
            disabled={disabled}
            isMobile={isMobile}  // ← ADD: Mobile detection prop
            className={disabled ? 'opacity-50 pointer-events-none' : ''}
          />

          {/* Status Filter */}
          <Select
            value={statusFilter || 'all'}
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
                      className={`w-2 h-2 rounded-full ${statusOption.bgColor || 'bg-gray-300'}`}
                    />
                    {statusOption.label || statusOption.key}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter Summary - 🔧 FIXED: Enhanced safety */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-orange-800">Filter aktif:</span>
              
              {/* Search Term Badge */}
              {searchTerm && searchTerm.trim() && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Pencarian: "{searchTerm.trim()}"
                </Badge>
              )}
              
              {/* Status Badge */}
              {statusFilter && statusFilter !== 'all' && selectedStatusLabel && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Status: {selectedStatusLabel}
                </Badge>
              )}
              
              {/* Date Range Badge - 🔧 FIXED: Safe rendering */}
              {dateRange && safeDateRangeText && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Tanggal: {safeDateRangeText}
                </Badge>
              )}
              
              {/* Clear All Button */}
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