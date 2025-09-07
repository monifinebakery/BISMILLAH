// 🎯 150 lines - All filters consolidated
import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DateRangePicker from '@/components/ui/DateRangePicker';
import type { UseOrderUIReturn } from '../types';
import { ORDER_STATUSES, getStatusText } from '../constants';

interface OrderFiltersProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
}

// Search Filter Component (consolidated)
const SearchFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      
      <Input
        type="text"
        placeholder="Cari pesanan, pelanggan, telepon..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-10 pr-10"
      />
      
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Status Filter Component (consolidated)
const StatusFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Pilih status..." />
      </SelectTrigger>
      
      <SelectContent>
        <SelectItem value="all">
          <span className="font-medium">Semua Status</span>
        </SelectItem>
        
        <div className="border-t border-gray-100 my-1" />
        
        {ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <div className={`
                w-2 h-2 rounded-full
                ${status === 'pending' ? 'bg-yellow-400' : ''}
                ${status === 'confirmed' ? 'bg-blue-400' : ''}
                ${status === 'preparing' ? 'bg-purple-400' : ''}
                 ${status === 'ready' ? 'bg-indigo-400' : ''}
                 ${status === 'delivered' ? 'bg-green-400' : ''}
                ${status === 'cancelled' ? 'bg-red-400' : ''}
                ${status === 'completed' ? 'bg-emerald-400' : ''}
              `} />
              <span>{getStatusText(status)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Date Range Filter Component using unified DateRangePicker
const DateRangeFilter: React.FC<{
  dateFrom: Date | null;
  dateTo: Date | null;
  onChange: (dateFrom: Date | null, dateTo: Date | null) => void;
  disabled?: boolean;
}> = ({ dateFrom, dateTo, onChange, disabled = false }) => {
  // Convert separate dateFrom/dateTo to DateRange format
  const dateRange = React.useMemo(() => {
    if (dateFrom && dateTo) {
      return { from: dateFrom, to: dateTo };
    }
    return undefined;
  }, [dateFrom, dateTo]);

  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      onChange(range.from, range.to);
    } else {
      onChange(null, null);
    }
  };

  return (
    <DateRangePicker
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
      placeholder="Pilih rentang tanggal"
      disabled={disabled}
      className="w-full"
    />
  );
};

// Main Filters Component
const OrderFilters: React.FC<OrderFiltersProps> = ({ uiState, loading }) => {
  const activeFilterCount = Object.values(uiState.filters).filter(value => {
    if (value === null || value === undefined || value === '' || value === 'all') {
      return false;
    }
    return true;
  }).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Filter Pesanan</h3>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {activeFilterCount} aktif
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Row 1: Search and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchFilter
            value={uiState.filters.search}
            onChange={(search) => uiState.updateFilters({ search })}
            disabled={loading}
          />
          <StatusFilter
            value={uiState.filters.status || 'all'}
            onChange={(status) => uiState.updateFilters({ status: status === 'all' ? 'all' : status })}
            disabled={loading}
          />
        </div>

        {/* Row 2: Date Range Filter (Full Width) */}
        <div className="w-full">
          <DateRangeFilter
            dateFrom={uiState.filters.dateFrom}
            dateTo={uiState.filters.dateTo}
            onChange={(dateFrom, dateTo) => uiState.updateFilters({ dateFrom, dateTo })}
            disabled={loading}
          />
        </div>

        {/* Row 3: Clear All Filters */}
        {uiState.hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={uiState.clearFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Hapus Semua Filter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;