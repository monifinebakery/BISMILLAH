// src/components/warehouse/components/WarehouseTable.tsx
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Package,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { BahanBakuFrontend, SortConfig } from '../types';
import { logger } from '@/utils/logger';
import WarehouseTableRow from './WarehouseTableRow';
import { useWarehouseSelection } from '../hooks/useWarehouseSelection';
import { warehouseUtils } from '../services/warehouseUtils';

interface WarehouseTableProps {
  items: BahanBakuFrontend[];
  isLoading: boolean;
  isSelectionMode: boolean;
  searchTerm: string;
  sortConfig: SortConfig;
  onSort: (key: keyof BahanBakuFrontend) => void;
  onEdit: (item: BahanBakuFrontend) => void;
  onDelete: (id: string, nama: string) => void;
  emptyStateAction: () => void;
  onRefresh?: () => Promise<void>;
  lastUpdated?: Date;
  // ✅ ADDED: Selection props from core
  selectedItems?: string[];
  onToggleSelection?: (id: string) => void;
  onSelectPage?: () => void;
  isSelected?: (id: string) => boolean;
  isPageSelected?: boolean;
  isPagePartiallySelected?: boolean;
}

const WarehouseTable: React.FC<WarehouseTableProps> = ({
  items,
  isLoading,
  isSelectionMode,
  searchTerm,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  emptyStateAction,
  onRefresh,
  lastUpdated,
  // ✅ ADDED: Selection props from core
  selectedItems = [],
  onToggleSelection,
  onSelectPage,
  isSelected,
  isPageSelected = false,
  isPagePartiallySelected = false,
}) => {
  // ✅ FIXED: Use selection from props if available, otherwise fallback to internal hook
  const fallbackSelection = useWarehouseSelection(items, isSelectionMode, onRefresh);
  
  // Use props if provided, otherwise fallback to internal state
  const selectionState = {
    selectedItems: selectedItems,
    toggleSelection: onToggleSelection || fallbackSelection.toggleSelection,
    selectAllCurrent: onSelectPage || fallbackSelection.selectAllCurrent,
    isSelected: isSelected || fallbackSelection.isSelected,
    allCurrentSelected: isPageSelected,
    someCurrentSelected: isPagePartiallySelected,
    isRefreshing: fallbackSelection.isRefreshing,
    handleRefresh: fallbackSelection.handleRefresh,
  };

  const lowStockItems = warehouseUtils.getLowStockItems(items);

  useEffect(() => {
    if (import.meta.env.DEV && items.length > 0) {
      console.debug(
        '[WAC check]',
        items.slice(0, 3).map(i => ({
          nama: i.nama,
          hargaRataRata: i.hargaRataRata,
          harga: i.harga,
        }))
      );
    }
  }, [items]);

  const getSortIcon = (key: keyof BahanBakuFrontend) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-orange-500" />
      : <ArrowDown className="w-4 h-4 text-orange-500" />;
  };

  if (!isLoading && items.length === 0) {
    logger.component('WarehouseTable', 'Displaying empty state', { hasSearchTerm: !!searchTerm });
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
        <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-4" />
        <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
          {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada pembelian bahan baku'}
        </h3>
        <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md px-4">
          {searchTerm
            ? 'Coba ubah kata kunci pencarian atau filter yang digunakan.'
            : 'Tambahkan pembelian bahan baku pertama untuk mulai mengelola stok.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {!searchTerm && (
            <Button onClick={emptyStateAction} className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tambah Pembelian
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              onClick={selectionState.handleRefresh}
              disabled={selectionState.isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${selectionState.isRefreshing ? 'animate-spin' : ''}`} />
              {selectionState.isRefreshing ? 'Memuat...' : 'Refresh Data'}
            </Button>
          )}
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-4">
            Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        )}
      </div>
    );
  }

  if (isLoading) {
    logger.component('WarehouseTable', 'Displaying loading state', { lastUpdated: lastUpdated?.toISOString() });
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Memuat data warehouse...</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">
              Data terakhir: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>
      </div>
    );
  }

  logger.component('WarehouseTable', 'Rendering table with items:', {
    count: items.length,
    isSelectionMode,
  });

  const MobileCardView = () => (
    <div className="md:hidden space-y-3 p-4">
      <div className="flex justify-between items-center mb-4 py-2 border-b border-gray-200">
        <div>
          <span className="text-sm font-medium text-gray-700">{items.length} item</span>
          {lastUpdated && (
            <div className="text-xs text-gray-400 mt-1">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </div>
          )}
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectionState.handleRefresh}
            disabled={selectionState.isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${selectionState.isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {isSelectionMode && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <button
            onClick={selectionState.selectAllCurrent}
            className="flex items-center justify-center w-6 h-6 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
            aria-label={selectionState.allCurrentSelected ? 'Deselect all' : 'Select all'}
          >
            {selectionState.allCurrentSelected ? (
              <CheckSquare className="w-5 h-5 text-orange-500" />
            ) : selectionState.someCurrentSelected ? (
              <div className="w-3 h-3 bg-orange-500 rounded-sm" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <span className="text-sm font-medium text-gray-700">
            {selectionState.selectedItems.length > 0
              ? `${selectionState.selectedItems.length} item dipilih`
              : 'Pilih semua item'}
          </span>
        </div>
      )}

      {items.map(item => (
        <WarehouseTableRow
          key={item.id}
          variant="mobile"
          item={item}
          isSelectionMode={isSelectionMode}
          isSelected={selectionState.isSelected(item.id)}
          onToggleSelection={selectionState.toggleSelection}
          searchTerm={searchTerm}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );

  const DesktopTableView = () => (
    <div className="hidden md:block overflow-x-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <span className="text-sm font-medium text-gray-700">{items.length} item tersimpan</span>
          {lastUpdated && (
            <div className="text-xs text-gray-400 mt-1">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </div>
          )}
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectionState.handleRefresh}
            disabled={selectionState.isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${selectionState.isRefreshing ? 'animate-spin' : ''}`} />
            {selectionState.isRefreshing ? 'Memuat...' : 'Refresh'}
          </Button>
        )}
      </div>

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {isSelectionMode && (
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={selectionState.selectAllCurrent}
                  className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
                  aria-label={selectionState.allCurrentSelected ? 'Deselect all' : 'Select all'}
                >
                  {selectionState.allCurrentSelected ? (
                    <CheckSquare className="w-4 h-4 text-orange-500" />
                  ) : selectionState.someCurrentSelected ? (
                    <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>
            )}
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => onSort('nama')}
            >
              <div className="flex items-center gap-1">Nama {getSortIcon('nama')}</div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => onSort('kategori')}
            >
              <div className="flex items-center gap-1">Kategori {getSortIcon('kategori')}</div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => onSort('stok')}
            >
              <div className="flex items-center gap-1">Stok {getSortIcon('stok')}</div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => onSort('harga')}
            >
              <div className="flex items-center gap-1">Harga {getSortIcon('harga')}</div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => onSort('expiry')}
            >
              <div className="flex items-center gap-1">Kadaluarsa {getSortIcon('expiry')}</div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => onSort('updatedAt')}
            >
              <div className="flex items-center gap-1">Terakhir Diperbarui {getSortIcon('updatedAt')}</div>
            </th>
            {!isSelectionMode && <th className="w-24" />}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <WarehouseTableRow
              key={item.id}
              variant="desktop"
              item={item}
              isSelectionMode={isSelectionMode}
              isSelected={selectionState.isSelected(item.id)}
              onToggleSelection={selectionState.toggleSelection}
              searchTerm={searchTerm}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {lowStockItems.length > 0 && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {lowStockItems.length} item stok hampir habis
        </div>
      )}
      <MobileCardView />
      <DesktopTableView />
    </div>
  );
};

export default WarehouseTable;

