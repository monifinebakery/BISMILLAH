// 🎯 150 lines - All filters consolidated
import React from 'react';
import { Filter, Search, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { safeParseDate } from '@/utils/unifiedDateUtils';
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
        
        <div className="border-t border-gray-200 my-1" />
        
        {ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <div className={`
                w-2 h-2 rounded-full
                ${status === 'pending' ? 'bg-yellow-400' : ''}
                ${status === 'confirmed' ? 'bg-blue-400' : ''}
                ${status === 'processing' ? 'bg-purple-400' : ''}
                ${status === 'shipped' ? 'bg-indigo-400' : ''}
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

// Date Range Filter Component (consolidated)
const DateRangeFilter: React.FC<{
  dateFrom: Date | null;
  dateTo: Date | null;
  onChange: (dateFrom: Date | null, dateTo: Date | null) => void;
  disabled?: boolean;
}> = ({ dateFrom, dateTo, onChange, disabled = false }) => {
  const [isFromOpen, setIsFromOpen] = React.useState(false);
  const [isToOpen, setIsToOpen] = React.useState(false);

  const handleFromSelect = (date: Date | undefined) => {
    onChange(date || null, dateTo);
    setIsFromOpen(false);
  };

  const handleToSelect = (date: Date | undefined) => {
    onChange(dateFrom, date || null);
    setIsToOpen(false);
  };

  const handleClear = () => {
    onChange(null, null);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Date From */}
      <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`justify-start text-left font-normal ${!dateFrom && "text-muted-foreground"}`}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: id }) : "Dari tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={dateFrom || undefined}
            onSelect={handleFromSelect}
            disabled={(date) => date > (safeParseDate(new Date()) || new Date()) || date < (safeParseDate("1900-01-01") || new Date("1900-01-01"))}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover open={isToOpen} onOpenChange={setIsToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`justify-start text-left font-normal ${!dateTo && "text-muted-foreground"}`}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: id }) : "Sampai tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={dateTo || undefined}
            onSelect={handleToSelect}
            disabled={(date) => date > (safeParseDate(new Date()) || new Date()) || date < (safeParseDate("1900-01-01") || new Date("1900-01-01"))}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear button */}
      {(dateFrom || dateTo) && (
        <div className="col-span-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="w-full text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3 mr-1" />
            Hapus Filter Tanggal
          </Button>
        </div>
      )}
    </div>
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
    <div className="bg-white rounded-lg border border-gray-300 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Filter Pesanan</h3>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {activeFilterCount} aktif
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Filter */}
        <SearchFilter
          value={uiState.filters.search}
          onChange={(search) => uiState.updateFilters({ search })}
          disabled={loading}
        />

        {/* Status Filter */}
        <StatusFilter
          value={uiState.filters.status || 'all'}
          onChange={(status) => uiState.updateFilters({ status: status === 'all' ? 'all' : status })}
          disabled={loading}
        />

        {/* Date Range Filter */}
        <DateRangeFilter
          dateFrom={uiState.filters.dateFrom}
          dateTo={uiState.filters.dateTo}
          onChange={(dateFrom, dateTo) => uiState.updateFilters({ dateFrom, dateTo })}
          disabled={loading}
        />

        {/* Clear All Filters */}
        {uiState.hasActiveFilters && (
          <Button
            variant="outline"
            onClick={uiState.clearFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Hapus Semua Filter
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;