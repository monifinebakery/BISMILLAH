import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Package, Edit, Trash2, AlertTriangle, Loader2, MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BahanBaku } from '../types/warehouse';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { cn } from '@/lib/utils';

interface WarehouseTableProps {
  items: BahanBaku[];
  isLoading: boolean;
  isSelectionMode: boolean;
  searchTerm: string;
  onEdit: (item: BahanBaku) => void;
  onDelete: (id: string, name: string) => void;
  onAddFirst: () => void;
  // Selection props
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAllCurrent: () => void;
  isSelected: (id: string) => boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
}

const WarehouseTable: React.FC<WarehouseTableProps> = ({
  items,
  isLoading,
  isSelectionMode,
  searchTerm,
  onEdit,
  onDelete,
  onAddFirst,
  selectedItems,
  onToggleSelection,
  onSelectAllCurrent,
  isSelected,
  allCurrentSelected,
  someCurrentSelected
}) => {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-sm text-left text-gray-700">
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="w-12 p-4">
              {isSelectionMode && (
                <Checkbox
                  checked={allCurrentSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someCurrentSelected;
                  }}
                  onCheckedChange={onSelectAllCurrent}
                  className="border-gray-400"
                  aria-label="Pilih Semua Item Saat Ini"
                />
              )}
            </TableHead>
            <TableHead className="font-semibold text-gray-700">Nama Bahan</TableHead>
            <TableHead className="font-semibold text-gray-700">Kategori</TableHead>
            <TableHead className="font-semibold text-gray-700">Stok</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Harga Satuan</TableHead>
            <TableHead className="font-semibold text-gray-700">Minimum</TableHead>
            <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
            <TableHead className="font-semibold text-gray-700">Kadaluwarsa</TableHead>
            <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12">
                <div className="flex flex-col items-center gap-3" role="alert" aria-label="Loading data">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="text-gray-500 font-medium">Memuat bahan baku...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Package className="h-16 w-16 text-gray-300" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      {searchTerm ? 'Tidak ada bahan baku yang cocok dengan pencarian' : 'Belum ada bahan baku di gudang'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan bahan baku pertama'}
                    </p>
                  </div>
                  {!searchTerm && (
                    <Button
                      onClick={onAddFirst}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200"
                      aria-label="Tambah Bahan Pertama"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Bahan Pertama
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow 
                key={item.id} 
                className={cn(
                  "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
                  isSelected(item.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                )}
              >
                <TableCell className="p-4">
                  {isSelectionMode && (
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => onToggleSelection(item.id)}
                      className="border-gray-400"
                      aria-label={`Pilih ${item.nama}`}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium text-gray-900 p-4">
                  <div className="flex flex-col">
                    <span>{item.nama}</span>
                    <span className="text-xs text-gray-500">{item.satuan}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">
                    {item.kategori}
                  </Badge>
                </TableCell>
                <TableCell className="p-4">
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-bold text-lg",
                      item.stok <= item.minimum 
                        ? 'text-red-600' 
                        : item.stok <= item.minimum * 1.5 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                    )}>
                      {item.stok}
                    </span>
                    {item.stok <= item.minimum && (
                      <div className="flex items-center text-xs text-red-500 mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Stok Rendah
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right p-4">
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-green-600 text-base">
                      {formatCurrency(item.hargaSatuan)}
                    </span>
                    <span className="text-xs text-gray-500">per {item.satuan}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 p-4">
                  <span className="font-medium">{item.minimum}</span>
                  <span className="text-xs text-gray-500 ml-1">{item.satuan}</span>
                </TableCell>
                <TableCell className="text-gray-600 p-4">{item.supplier || '-'}</TableCell>
                <TableCell className="text-gray-600 p-4">
                  {item.tanggalKadaluwarsa ? formatDateForDisplay(item.tanggalKadaluwarsa) : '-'}
                </TableCell>
                <TableCell className="text-center p-4">
                  {!isSelectionMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(item.id, item.nama)} 
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default WarehouseTable;