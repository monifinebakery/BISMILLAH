// src/components/purchase/components/table/TableFilters.tsx
// Extracted filters and search section from PurchaseTable

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Trash2 } from 'lucide-react';
import { PurchaseStatus } from '../../types/purchase.types';
import { getStatusDisplayText } from '../../utils/purchaseHelpers';

// Constants
const STATUS_OPTIONS: { value: PurchaseStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200' },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' }
];

interface TableFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PurchaseStatus | 'all';
  setStatusFilter: (status: PurchaseStatus | 'all') => void;
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
  onResetFilters,
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari supplier, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: PurchaseStatus | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results info */}
      {(searchQuery || statusFilter !== 'all') && (
        <div className="mt-3 text-sm text-gray-600">
          Menampilkan {filteredCount} hasil
          {searchQuery && ` untuk "${searchQuery}"`}
          {statusFilter !== 'all' && ` dengan status "${getStatusDisplayText(statusFilter)}"`}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItemsCount > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedItemsCount} item dipilih
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onClearSelection}>
                Batal Pilih
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={onBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Terpilih
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
