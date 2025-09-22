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
import { EmptyState } from '@/components/ui/empty-state';
import type { BahanBakuFrontend, SortConfig } from '../types';
import { logger } from '@/utils/logger';
import WarehouseTableRow from './WarehouseTableRow';
import { useWarehouseSelection } from '../hooks/useWarehouseSelection';
import { warehouseUtils } from '../services/warehouseUtils';
import { LoadingStates } from '@/components/ui/loading-spinner';

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

// ✅ OPTIMIZED with React.memo, useMemo, useCallback
const WarehouseTable: React.FC<WarehouseTableProps> = React.memo(({
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

  const lowStockItems = warehouseUtils.getLowStockItems(items || []);

  useEffect(() => {
    if (import.meta.env.DEV && items && items.length > 0) {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LoadingStates.Table />
      </div>
    );
  }

  if (!isLoading && (!items || items.length === 0)) {
    logger.component('WarehouseTable', 'Displaying empty state', { hasSearchTerm: !!searchTerm });
    return (
      <EmptyState
        icon={Package}
        title={searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada pembelian bahan baku'}
        description={searchTerm
          ? 'Coba ubah kata kunci pencarian atau filter yang digunakan.'
          : 'Tambahkan pembelian bahan baku pertama untuk mulai mengelola stok.'}
        actions={[
          ...((!searchTerm) ? [{
            label: 'Tambah Pembelian',
            onClick: emptyStateAction,
            icon: Package,
            variant: 'default' as const,
          }] : []),
          ...(onRefresh ? [{
            label: selectionState.isRefreshing ? 'Refreshing...' : 'Refresh Data',
            onClick: selectionState.handleRefresh,
            icon: RefreshCw,
            variant: 'outline' as const,
            disabled: selectionState.isRefreshing,
          }] : []),
        ]}
        showLastUpdated={lastUpdated}
      />
    );
  }


  logger.component('WarehouseTable', 'Rendering table with items:', {
    count: items?.length || 0,
    isSelectionMode,
  });

  const MobileCardView = () => (
    <div 
      className="md:hidden space-y-4 p-4"
      role="table"
      aria-label="Warehouse items list"
    >
      <div className="flex justify-between items-center mb-6 py-3 px-4 border-b border-gray-200 bg-gray-50 rounded-lg" role="row">
        <div role="cell">
          <span className="text-sm font-medium text-gray-700">{items?.length || 0} item</span>
          {lastUpdated && (
            <div className="text-xs text-gray-500 mt-1">
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
            className="flex items-center gap-2 h-11 px-4 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Refresh warehouse data"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${selectionState.isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="text-sm">{selectionState.isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        )}
      </div>

      {isSelectionMode && (
        <div 
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200"
          role="row"
          aria-label="Bulk selection controls"
        >
          <button
            onClick={selectionState.selectAllCurrent}
            className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-orange-500 active:bg-orange-50 transition-colors"
            aria-label={selectionState.allCurrentSelected ? 'Deselect all items' : 'Select all items'}
            title={selectionState.allCurrentSelected ? 'Deselect all items' : 'Select all items'}
          >
            {selectionState.allCurrentSelected ? (
              <CheckSquare className="w-6 h-6 text-orange-500" aria-hidden="true" />
            ) : selectionState.someCurrentSelected ? (
              <div className="w-4 h-4 bg-orange-500 rounded-sm" aria-hidden="true" />
            ) : (
              <Square className="w-6 h-6 text-gray-400" aria-hidden="true" />
            )}
          </button>
          <div>
            <span className="text-base font-medium text-gray-700">
              {selectionState.selectedItems.length > 0
                ? `${selectionState.selectedItems.length} item dipilih`
                : 'Pilih semua item'}
            </span>
          </div>
        </div>
      )}

      {(items || []).map(item => (
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
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50" role="row">
        <div role="cell">
          <span className="text-sm font-medium text-gray-700">{items?.length || 0} item tersimpan</span>
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
            aria-label="Refresh warehouse data"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${selectionState.isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {selectionState.isRefreshing ? (
              <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : 'Refresh'}
          </Button>
        )}
      </div>

      <table 
        className="w-full"
        role="table"
        aria-label="Warehouse items table"
      >
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr role="row">
            {isSelectionMode && (
              <th className="w-12 px-4 py-3 text-left" role="columnheader" scope="col">
                <button
                  onClick={selectionState.selectAllCurrent}
                  className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
                  aria-label={selectionState.allCurrentSelected ? 'Deselect all items' : 'Select all items'}
                  title={selectionState.allCurrentSelected ? 'Deselect all items' : 'Select all items'}
                >
                  {selectionState.allCurrentSelected ? (
                    <CheckSquare className="w-4 h-4 text-orange-500" aria-hidden="true" />
                  ) : selectionState.someCurrentSelected ? (
                    <div className="w-3 h-3 bg-orange-500 rounded-sm" aria-hidden="true" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </th>
            )}
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('nama')}
              role="columnheader"
              scope="col"
              aria-sort={sortConfig.key === 'nama' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center gap-2 w-full text-left hover:text-orange-600 py-2 px-3 rounded-md hover:bg-orange-50 active:bg-orange-100 transition-colors">
                <span>Nama</span>
                {getSortIcon('nama')}
              </button>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('kategori')}
              role="columnheader"
              scope="col"
              aria-sort={sortConfig.key === 'kategori' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center gap-1 w-full text-left hover:text-orange-600">
                <span>Kategori</span>
                {getSortIcon('kategori')}
              </button>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('stok')}
              role="columnheader"
              scope="col"
              aria-sort={sortConfig.key === 'stok' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center gap-1 w-full text-left hover:text-orange-600">
                <span>Stok</span>
                {getSortIcon('stok')}
              </button>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('harga')}
              role="columnheader"
              scope="col"
              aria-sort={sortConfig.key === 'harga' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center gap-1 w-full text-left hover:text-orange-600">
                <span>Harga</span>
                {getSortIcon('harga')}
              </button>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('expiry')}
              role="columnheader"
              scope="col"
              aria-sort={sortConfig.key === 'expiry' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center gap-1 w-full text-left hover:text-orange-600">
                <span>Kadaluarsa</span>
                {getSortIcon('expiry')}
              </button>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('updatedAt')}
              role="columnheader"
              scope="col"
              aria-sort={sortConfig.key === 'updatedAt' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center gap-1 w-full text-left hover:text-orange-600">
                <span>Terakhir Diperbarui</span>
                {getSortIcon('updatedAt')}
              </button>
            </th>
            {!isSelectionMode && <th className="w-24" role="columnheader" scope="col">Aksi</th>}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {(items || []).map(item => (
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
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {lowStockItems.length} item stok hampir habis
        </div>
      )}
      <MobileCardView />
      <DesktopTableView />
    </div>
  );
});

WarehouseTable.displayName = 'WarehouseTable';

export default WarehouseTable;

