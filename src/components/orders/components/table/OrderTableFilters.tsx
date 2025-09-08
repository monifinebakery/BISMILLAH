// src/components/orders/components/table/OrderTableFilters.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Trash2, Square, CheckSquare } from 'lucide-react';
import { getStatusText } from '../../constants';

interface OrderTableFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  filteredCount: number;
  selectedItemsCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onResetFilters: () => void;
  onToggleSelectionMode?: () => void;
  isSelectionMode?: boolean;
}

export const OrderTableFilters: React.FC<OrderTableFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  itemsPerPage,
  setItemsPerPage,
  filteredCount,
  selectedItemsCount,
  onClearSelection,
  onBulkDelete,
  onResetFilters,
  onToggleSelectionMode,
  isSelectionMode = false
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari nomor pesanan, pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusText(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={itemsPerPage.toString()} 
          onValueChange={(value) => {
            console.log('🔄 OrderTableFilters: Items per page changed:', { from: itemsPerPage, to: parseInt(value) });
            setItemsPerPage(Number(value));
          }}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TABLE_PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} per halaman
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selection Mode Toggle */}
        {onToggleSelectionMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSelectionMode}
            className="flex items-center gap-2"
          >
            {isSelectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isSelectionMode ? 'Mode Pilih' : 'Pilih Item'}
            </span>
            <span className="sm:hidden">
              {isSelectionMode ? 'Pilih' : 'Pilih'}
            </span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {selectedItemsCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedItemsCount} dipilih
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="h-8"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {filteredCount} hasil
          </div>
        )}

        {(searchQuery || statusFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
