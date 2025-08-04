// src/components/warehouse/components/DesktopWarehouseTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Trash2, 
  AlertTriangle,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock
} from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBakuFrontend, SortConfig } from '../types';

interface DesktopWarehouseTableProps {
  items: BahanBakuFrontend[];
  isSelectionMode: boolean;
  searchTerm: string;
  sortConfig: SortConfig;
  onSort: (key: keyof BahanBakuFrontend) => void;
  onEdit: (item: BahanBakuFrontend) => void;
  onDelete: (id: string, nama: string) => void;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAllCurrent: () => void;
  isSelected: (id: string) => boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
}

/**
 * Desktop Table Component for Warehouse Items
 * 
 * Features:
 * - Sortable columns
 * - Row selection
 * - Stock level indicators
 * - Last update timestamp
 * - Inline actions
 * - Responsive design
 * 
 * Size: ~4KB
 */
const DesktopWarehouseTable: React.FC<DesktopWarehouseTableProps> = ({
  items,
  isSelectionMode,
  searchTerm,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  onToggleSelection,
  onSelectAllCurrent,
  isSelected,
  allCurrentSelected,
  someCurrentSelected,
}) => {

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

  // Sort icon helper
  const getSortIcon = (key: keyof BahanBakuFrontend) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-orange-500" />
      : <ArrowDown className="w-4 h-4 text-orange-500" />;
  };

  // Enhanced stock level calculation
  const getStockLevel = (item: BahanBakuFrontend) => {
    const stok = Number(item.stok) || 0;
    const minimum = Number(item.minimum) || 0;
    
    return warehouseUtils.formatStockLevel(stok, minimum);
  };

  // Check if item is expiring soon
  const isExpiringItem = (item: BahanBakuFrontend): boolean => {
    if (!item.expiry) return false;
    const expiryDate = new Date(item.expiry);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7); // 7 days warning
    return expiryDate <= threshold && expiryDate > new Date();
  };

  // Check if item has low stock
  const isLowStockItem = (item: BahanBakuFrontend): boolean => {
    const stok = Number(item.stok) || 0;
    const minimum = Number(item.minimum) || 0;
    return stok <= minimum && stok > 0;
  };

  // Check if item is out of stock
  const isOutOfStockItem = (item: BahanBakuFrontend): boolean => {
    const stok = Number(item.stok) || 0;
    return stok <= 0;
  };

  // Format last update time
  const formatLastUpdate = (timestamp?: string | Date) => {
    if (!timestamp) return 'Tidak diketahui';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days}d`;
    } else {
      return warehouseUtils.formatDate(timestamp);
    }
  };

  return (
    <div className="hidden md:block overflow-x-auto">
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
            <th className="px-4 py-3 text-left">
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
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('harga')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Harga
                {getSortIcon('harga')}
              </button>
            </th>

            {/* Expiry Column */}
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('expiry')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Kadaluarsa
                {getSortIcon('expiry')}
              </button>
            </th>

            {/* Last Update Column */}
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('updatedAt')}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Update
                {getSortIcon('updatedAt')}
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
            const stockLevel = getStockLevel(item);
            const isExpiringSoon = isExpiringItem(item);
            const isLowStock = isLowStockItem(item);
            const isOutOfStock = isOutOfStockItem(item);
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
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          stockLevel.level === 'out' ? 'bg-red-500' :
                          stockLevel.level === 'low' ? 'bg-yellow-500' :
                          stockLevel.level === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                        }`} 
                        title={`Stock Level: ${stockLevel.level}`}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {highlightText(item.nama, searchTerm)}
                      </div>
                      
                      {/* Alert Indicators */}
                      <div className="flex flex-col gap-1 mt-1">
                        {isExpiringSoon && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            Akan kadaluarsa
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            Stok habis
                          </div>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertTriangle className="w-3 h-3" />
                            Stok hampir habis
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Category Column */}
                <td className="px-4 py-4">
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
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {warehouseUtils.formatCurrency(Number(item.harga) || 0)}
                  </span>
                  <div className="text-xs text-gray-500">
                    per {item.satuan}
                  </div>
                </td>

                {/* Expiry Column */}
                <td className="px-4 py-4">
                  {item.expiry ? (
                    <div className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {warehouseUtils.formatDate(item.expiry)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                {/* Last Update Column */}
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-500">
                    {formatLastUpdate(item.updatedAt || item.createdAt)}
                  </div>
                </td>

                {/* Actions Column */}
                {!isSelectionMode && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
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

export default DesktopWarehouseTable;blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="sr-only">Edit {item.nama}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id, item.nama)}
                        className="text-