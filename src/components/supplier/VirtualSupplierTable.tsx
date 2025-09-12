// 🎯 VirtualSupplierTable.tsx - Virtual Scrolling Implementation for Suppliers
import React, { useMemo } from 'react';
import { MoreHorizontal, Edit, Trash2, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VirtualTable, { VirtualTableColumn } from '@/components/ui/VirtualTable';
import { cn } from '@/lib/utils';
import type { Supplier } from '@/types/supplier';

interface VirtualSupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isSelectionMode: boolean;
  filteredCount: number;
  onAddFirst: () => void;
  searchTerm: string;
}

// Supplier Row Actions Component
const SupplierRowActions: React.FC<{
  supplier: Supplier;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}> = ({ supplier, onEdit, onDelete, disabled = false }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          disabled={disabled}
        >
          <span className="sr-only">Buka menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Supplier
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Supplier
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  searchTerm: string;
  onAddFirst: () => void;
}> = ({ searchTerm, onAddFirst }) => {
  return (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {searchTerm ? 'Tidak ada supplier yang cocok dengan pencarian' : 'Belum ada data supplier'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm 
          ? 'Coba ubah kata kunci pencarian Anda'
          : 'Mulai dengan menambahkan supplier pertama'
        }
      </p>
      <div className="mt-6">
        {!searchTerm && (
          <Button onClick={onAddFirst} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Supplier Pertama
          </Button>
        )}
      </div>
    </div>
  );
};

const VirtualSupplierTable: React.FC<VirtualSupplierTableProps> = ({
  suppliers,
  isLoading,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  isSelectionMode,
  filteredCount,
  onAddFirst,
  searchTerm
}) => {
  // Handle selection changes
  const handleSelectionChange = (supplierId: string) => {
    const isSelected = selectedIds.includes(supplierId);
    if (isSelected) {
      onSelectionChange(selectedIds.filter(id => id !== supplierId));
    } else {
      onSelectionChange([...selectedIds, supplierId]);
    }
  };

  const handleSelectAll = () => {
    const allCurrentSelected = suppliers.length > 0 && suppliers.every(s => selectedIds.includes(s.id));
    if (allCurrentSelected) {
      // Deselect all current suppliers
      onSelectionChange(selectedIds.filter(id => !suppliers.some(s => s.id === id)));
    } else {
      // Select all current suppliers
      onSelectionChange([...new Set([...selectedIds, ...suppliers.map(s => s.id)])]);
    }
  };

  const isAllSelected = suppliers.length > 0 && suppliers.every(s => selectedIds.includes(s.id));

  // Define columns for virtual table
  const columns: VirtualTableColumn<Supplier>[] = useMemo(() => {
    const baseColumns: VirtualTableColumn<Supplier>[] = [
      {
        key: 'nama',
        header: 'Nama Supplier',
        width: 200,
        render: (supplier: Supplier) => (
          <div className="font-medium text-gray-900">
            {supplier.nama}
          </div>
        )
      },
      {
        key: 'kontak',
        header: 'Kontak',
        width: 150,
        render: (supplier: Supplier) => (
          <div className="text-sm text-gray-700">
            {supplier.kontak}
          </div>
        )
      },
      {
        key: 'email',
        header: 'Email',
        width: 200,
        render: (supplier: Supplier) => (
          <div className="text-sm">
            {supplier.email ? (
              <span className="text-blue-600 hover:text-blue-800">
                {supplier.email}
              </span>
            ) : (
              <span className="text-gray-400 italic">Tidak ada email</span>
            )}
          </div>
        )
      },
      {
        key: 'telepon',
        header: 'Telepon',
        width: 150,
        render: (supplier: Supplier) => (
          <div className="text-sm text-gray-700">
            {supplier.telepon || '-'}
          </div>
        )
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 80,
        align: 'center' as const,
        render: (supplier: Supplier) => (
          !isSelectionMode ? (
            <SupplierRowActions
              supplier={supplier}
              onEdit={() => onEdit(supplier)}
              onDelete={() => onDelete(supplier.id)}
            />
          ) : null
        )
      }
    ];

    // Add selection column if in selection mode
    if (isSelectionMode) {
      return [
        {
          key: 'selection',
          header: (
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
          ) as any,
          width: 50,
          render: (supplier: Supplier) => (
            <Checkbox
              checked={selectedIds.includes(supplier.id)}
              onCheckedChange={() => handleSelectionChange(supplier.id)}
              className="h-4 w-4"
            />
          )
        },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [isSelectionMode, selectedIds, isAllSelected, onEdit, onDelete]);

  // Handle row click
  const handleRowClick = (supplier: Supplier) => {
    if (isSelectionMode) {
      handleSelectionChange(supplier.id);
    }
  };

  if (filteredCount === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <EmptyState
          searchTerm={searchTerm}
          onAddFirst={onAddFirst}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <VirtualTable
        data={suppliers}
        columns={columns}
        loading={isLoading}
        itemHeight={60}
        containerHeight={600}
        onRowClick={handleRowClick}
        className="w-full"
        emptyMessage="Tidak ada supplier"
        hoverable={true}
        striped={true}
        getItemId={(supplier) => supplier.id}
      />
      
      {/* Selection Summary */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="text-sm text-blue-700">
            <span className="font-medium">{selectedIds.length}</span> supplier dipilih
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualSupplierTable;