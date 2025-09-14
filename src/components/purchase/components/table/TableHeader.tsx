// src/components/purchase/components/table/TableHeader.tsx
// Extracted table header section from PurchaseTable

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Calendar,
  User,
  Receipt,
} from 'lucide-react';

type SortField = 'tanggal' | 'supplier' | 'total_nilai' | 'status';
type SortOrder = 'asc' | 'desc';

interface TableHeaderProps {
  isAllSelected: boolean;
  onSelectAll: () => void;
  sortField: SortField | null;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export const PurchaseTableHeader: React.FC<TableHeaderProps> = ({
  isAllSelected,
  onSelectAll,
  sortField,
  sortOrder,
  onSort,
}) => {
  // Sort icon renderer
  const renderSortIcon = useCallback((field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            aria-label="Select all purchases"
          />
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort('tanggal')}
            className="h-auto p-0 font-medium hover:bg-transparent"
            type="button"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Tanggal
            {renderSortIcon('tanggal')}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort('supplier')}
            className="h-auto p-0 font-medium hover:bg-transparent"
            type="button"
          >
            <User className="h-4 w-4 mr-2" />
            Supplier
            {renderSortIcon('supplier')}
          </Button>
        </TableHead>

        <TableHead>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </div>
        </TableHead>

        <TableHead className="text-right">
          <Button
            variant="ghost"
            onClick={() => onSort('total_nilai')}
            className="h-auto p-0 font-medium hover:bg-transparent"
            type="button"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Total Nilai
            {renderSortIcon('total_nilai')}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort('status')}
            className="h-auto p-0 font-medium hover:bg-transparent"
            type="button"
          >
            Status
            {renderSortIcon('status')}
          </Button>
        </TableHead>

        <TableHead className="w-[100px]">Aksi</TableHead>
      </TableRow>
    </TableHeader>
  );
};
