// src/components/supplier/SupplierTable.tsx
// Table component with pagination and selection

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  Loader2, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Supplier } from '@/types/supplier';

interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isSelectionMode: boolean;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onAddFirst: () => void;
  searchTerm: string;
}

const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  isLoading,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  isSelectionMode,
  filteredCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onAddFirst,
  searchTerm
}) => {
  const allCurrentSelected = suppliers.length > 0 && suppliers.every(s => selectedIds.includes(s.id));
  const someCurrentSelected = suppliers.some(s => selectedIds.includes(s.id)) && !allCurrentSelected;

  const toggleSelectAllCurrent = (checked: boolean) => {
    if (checked) {
      onSelectionChange([...new Set([...selectedIds, ...suppliers.map(s => s.id)])]);
    } else {
      onSelectionChange(selectedIds.filter(id => !suppliers.some(s => s.id === id)));
    }
  };

  const toggleSelectSupplier = (supplierId: string, checked: boolean) => {
    onSelectionChange(
      checked 
        ? [...selectedIds, supplierId] 
        : selectedIds.filter(id => id !== supplierId)
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm text-left text-gray-700">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-500">
              <TableHead className="w-12 p-4"></TableHead>
              <TableHead className="font-semibold text-gray-700">Nama Supplier</TableHead>
              <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="text-gray-500 font-medium">Memuat data supplier...</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (filteredCount === 0) {
    return (
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm text-left text-gray-700">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-500">
              <TableHead className="w-12 p-4"></TableHead>
              <TableHead className="font-semibold text-gray-700">Nama Supplier</TableHead>
              <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Users className="h-16 w-16 text-gray-500" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      {searchTerm ? 'Tidak ada supplier yang cocok dengan pencarian' : 'Belum ada data supplier'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan supplier pertama'}
                    </p>
                  </div>
                  {!searchTerm && (
                    <Button
                      onClick={onAddFirst}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg border transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Supplier Pertama
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm text-left text-gray-700">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-500">
              <TableHead className="w-12 p-4">
                {isSelectionMode && (
                  <Checkbox
                    checked={allCurrentSelected}
                    ref={(el) => { 
                      if (el) el.indeterminate = someCurrentSelected; 
                    }}
                    onCheckedChange={toggleSelectAllCurrent}
                    className="border-gray-400"
                  />
                )}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Nama Supplier</TableHead>
              <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier, index) => (
              <TableRow
                key={supplier.id}
                className={cn(
                  "hover:bg-orange-50/50 transition-colors border-b border-gray-400",
                  selectedIds.includes(supplier.id) && "bg-blue-50 border-l border-l-blue-500",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                )}
              >
                <TableCell className="p-4">
                  {isSelectionMode && (
                    <Checkbox
                      checked={selectedIds.includes(supplier.id)}
                      onCheckedChange={(checked) => toggleSelectSupplier(supplier.id, !!checked)}
                      className="border-gray-400"
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium text-gray-900 p-4">
                  {supplier.nama}
                </TableCell>
                <TableCell className="p-4">{supplier.kontak}</TableCell>
                <TableCell className="p-4">
                  {supplier.email ? (
                    <span className="text-blue-600 hover:text-blue-800">
                      {supplier.email}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Tidak ada email</span>
                  )}
                </TableCell>
                <TableCell className="p-4">{supplier.telepon || '-'}</TableCell>
                <TableCell className="text-center p-4">
                  {!isSelectionMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => onEdit(supplier)} 
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(supplier.id)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {filteredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-500 bg-gray-50/50">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredCount)}</span> of{' '}
            <span className="font-semibold">{filteredCount}</span> entries
            {selectedIds.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedIds.length} selected)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-400"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-9 w-9",
                  currentPage === page
                    ? "bg-orange-500 text-white border hover:bg-orange-600"
                    : "hover:bg-gray-400"
                )}
                variant={currentPage === page ? "default" : "ghost"}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-400"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierTable;