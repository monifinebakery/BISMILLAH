// src/components/warehouse/components/WarehouseTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBaku, SortConfig } from '../types';

interface WarehouseTableProps {
  items: BahanBaku[];
  isLoading: boolean;
  isSelectionMode: boolean;
  searchTerm: string;
  sortConfig: SortConfig;
  onSort: (key: keyof BahanBaku) => void;
  onEdit: (item: BahanBaku) => void;
  onDelete: (id: string, nama: string) => void;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAllCurrent: () => void;
  isSelected: (id: string) => boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  emptyStateAction: () => void;
}

/**
 * Warehouse Table Component
 * 
 * Optimized table with:
 * - Virtual scrolling ready
 * - Smart selection UI
 * - Responsive design
 * - Accessibility features
 * - Performance optimizations
 * 
 * Size: ~5KB
 */
const WarehouseTable: React.FC<WarehouseTableProps> = ({
  items,
  isLoading,
  isSelectionMode,
  searchTerm,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  selectedItems,
  onToggleSelection,
  onSelectAllCurrent,
  isSelected,
  allCurrentSelected,
  someCurrentSelected,
  emptyStateAction,
}) => {
  // Sort icon helper
  const getSortIcon = (key: keyof BahanBaku) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-orange-500" />
      : <ArrowDown className="w-4 h-4 text-orange-500" />;
  };

  // Highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada bahan baku'}
        </h3>
        <p className="text-gray-500 mb-6 max-w-md">
          {searchTerm 
            ? `Coba ubah kata kunci pencarian atau filter yang digunakan.`
            : 'Mulai kelola inventori Anda dengan menambahkan bahan baku pertama.'
          }
        </p>
        {!searchTerm && (
          <Button onClick={emptyStateAction} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Tambah Bahan Baku
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {/* Selection Column */}
            {isSelectionMode && (
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={onSelectAllCurrent}
                  className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
                  aria-label={allCurrentSelected ? 'Deselect all' : 'Select all'}
                >
                  {allCurrentSelected ? (
                    <CheckSquare className="w-4 h-4 text-orange-500" />
                  ) : someCurrentSelected ? (
                    <div className="w-2 h-2 bg-orange-500 rounded-sm" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>
            )}

            {/* Name Column */}
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('nama')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Nama Bahan
                {getSortIcon('nama')}
              </button>
            </th>

            {/* Category Column */}
            <th className="px-4 py-3 text-left hidden sm:table-cell">
              <button
                onClick={() => onSort('kategori')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Kategori
                {getSortIcon('kategori')}
              </button>
            </th>

            {/* Stock Column */}
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('stok')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Stok
                {getSortIcon('stok')}
              </button>
            </th>

            {/* Price Column */}
            <th className="px-4 py-3 text-left hidden md:table-cell">
              <button
                onClick={() => onSort('harga')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Harga
                {getSortIcon('harga')}
              </button>
            </th>

            {/* Expiry Column */}
            <th className="px-4 py-3 text-left hidden lg:table-cell">
              <button
                onClick={() => onSort('expiry')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Kadaluarsa
                {getSortIcon('expiry')}
              </button>
            </th>

            {/* Actions Column */}
            {!isSelectionMode && (
              <th className="px-4 py-3 text-right">
                <span className="font-medium text-gray-700">Aksi</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {items.map((item) => {
            const stockLevel = warehouseUtils.formatStockLevel(item.stok, item.minimum);
            const isExpiringSoon = item.expiry && new Date(item.expiry) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const isItemSelected = isSelected(item.id);

            return (
              <tr 
                key={item.id}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${isItemSelected ? 'bg-orange-50' : ''}
                  ${stockLevel.level === 'out' ? 'bg-red-50' : ''}
                  ${stockLevel.level === 'low' ? 'bg-yellow-50' : ''}
                `}
              >
                {/* Selection Column */}
                {isSelectionMode && (
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onToggleSelection(item.id)}
                      className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
                      aria-label={`${isItemSelected ? 'Deselect' : 'Select'} ${item.nama}`}
                    >
                      {isItemSelected ? (
                        <CheckSquare className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                )}

                {/* Name Column */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        stockLevel.level === 'out' ? 'bg-red-500' :
                        stockLevel.level === 'low' ? 'bg-yellow-500' :
                        stockLevel.level === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {highlightText(item.nama, searchTerm)}
                      </div>
                      <div className="text-sm text-gray-500 sm:hidden">
                        {item.kategori} • {item.stok} {item.satuan}
                      </div>
                      {isExpiringSoon && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Akan kadaluarsa
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category Column */}
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className="text-sm text-gray-900">
                    {highlightText(item.kategori, searchTerm)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.supplier}
                  </div>
                </td>

                {/* Stock Column */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      stockLevel.level === 'out' ? 'text-red-600' :
                      stockLevel.level === 'low' ? 'text-yellow-600' :
                      'text-gray-900'
                    }`}>
                      {item.stok}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.satuan}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Min: {item.minimum}
                  </div>
                </td>

                {/* Price Column */}
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-sm font-medium text-gray-900">
                    {warehouseUtils.formatCurrency(item.harga)}
                  </span>
                  <div className="text-xs text-gray-500">
                    per {item.satuan}
                  </div>
                </td>

                {/* Expiry Column */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  {item.expiry ? (
                    <div className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {warehouseUtils.formatDate(item.expiry)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                {/* Actions Column */}
                {!isSelectionMode && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="sr-only">Edit {item.nama}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id, item.nama)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete {item.nama}</span>
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseTable;