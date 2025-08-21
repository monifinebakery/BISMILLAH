// src/components/purchase/components/table/TableFilters.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Trash2 } from 'lucide-react';
import { getStatusDisplayText } from '../../utils/purchaseHelpers';

interface TableFiltersProps {
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
}

export const TableFilters: React.FC<TableFiltersProps> = ({
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
  onResetFilters
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari supplier, item..."
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
            <SelectItem value="pending">
              {getStatusDisplayText('pending')}
            </SelectItem>
            <SelectItem value="completed">
              {getStatusDisplayText('completed')}
            </SelectItem>
            <SelectItem value="cancelled">
              {getStatusDisplayText('cancelled')}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per halaman</SelectItem>
            <SelectItem value="10">10 per halaman</SelectItem>
            <SelectItem value="20">20 per halaman</SelectItem>
            <SelectItem value="50">50 per halaman</SelectItem>
          </SelectContent>
        </Select>
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