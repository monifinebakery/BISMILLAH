// ===== 1. UPDATE WarehouseTable.tsx =====
// src/components/warehouse/components/WarehouseTable.tsx
import React, { useState, useEffect } from 'react';
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
  ArrowDown,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBakuFrontend, SortConfig } from '../types';
import { logger } from '@/utils/logger';

interface WarehouseTableProps {
  items: BahanBakuFrontend[];
  isLoading: boolean;
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
  emptyStateAction: () => void;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

/**
 * Mobile Responsive Warehouse Table Component
 * ✅ ENHANCED: Added useQuery integration support
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
  onRefresh,
  lastUpdated,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showMobileActions, setShowMobileActions] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ TAMBAH: Debug log untuk verifikasi WAC
  useEffect(() => {
    if (import.meta.env.DEV && items.length > 0) {
      console.debug('[WAC check]', items.slice(0,3).map(i => ({
        nama: i.nama,
        hargaRataRata: i.hargaRataRata,
        harga: i.harga
      })));
    }
  }, [items]);

  const handleRefresh = async () => {
    if (onRefresh) {
      logger.component('WarehouseTable', 'Refreshing data...');
      setIsRefreshing(true);
      try {
        await onRefresh();
        logger.success('Warehouse data refreshed');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
    logger.component('WarehouseTable', `Item ${itemId} ${newExpanded.has(itemId) ? 'expanded' : 'collapsed'}`);
  };

  const getSortIcon = (key: keyof BahanBakuFrontend) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-orange-500" />
      : <ArrowDown className="w-4 h-4 text-orange-500" />;
  };

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

  const getStockLevel = (item: BahanBakuFrontend) => {
    const stok = Number(item.stok) || 0;
    const minimum = Number(item.minimum) || 0;
    
    return warehouseUtils.formatStockLevel(stok, minimum);
  };

  const isExpiringItem = (item: BahanBakuFrontend): boolean => {
    if (!item.expiry) return false;
    const expiryDate = new Date(item.expiry);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);
    return expiryDate <= threshold && expiryDate > new Date();
  };

  const isLowStockItem = (item: BahanBakuFrontend): boolean => {
    const stok = Number(item.stok) || 0;
    const minimum = Number(item.minimum) || 0;
    return stok <= minimum && stok > 0;
  };

  const isOutOfStockItem = (item: BahanBakuFrontend): boolean => {
    const stok = Number(item.stok) || 0;
    return stok <= 0;
  };

  const debugItem = (item: BahanBakuFrontend) => {
    if (import.meta.env.DEV && item.nama.includes('Daging')) {
      logger.debug('WAREHOUSE TABLE DEBUG:', {
        item: item.nama,
        stok: item.stok,
        stokType: typeof item.stok,
        minimum: item.minimum,
        minimumType: typeof item.minimum,
        harga: item.harga,
        hargaType: typeof item.harga,
        hargaRataRata: item.hargaRataRata,
        stockLevel: getStockLevel(item),
        isLowStock: isLowStockItem(item),
        isOutOfStock: isOutOfStockItem(item),
        conditionCheck: Number(item.stok) <= Number(item.minimum)
      });
    }
  };

  if (!isLoading && items.length === 0) {
    logger.component('WarehouseTable', 'Displaying empty state', { hasSearchTerm: !!searchTerm });
    
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
        <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-4" />
        <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
          {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada bahan baku'}
        </h3>
        <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md px-4">
          {searchTerm 
            ? `Coba ubah kata kunci pencarian atau filter yang digunakan.`
            : 'Mulai kelola inventori Anda dengan menambahkan bahan baku pertama.'
          }
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!searchTerm && (
            <Button onClick={emptyStateAction} className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tambah Bahan Baku
            </Button>
          )}
          
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Memuat...' : 'Refresh Data'}
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

  logger.component('WarehouseTable', 'Rendering table with items:', { count: items.length, isSelectionMode });

  // Mobile Card View
  const MobileCardView = () => (
    <div className="md:hidden space-y-3 p-4">
      <div className="flex justify-between items-center mb-4 py-2 border-b border-gray-200">
        <div>
          <span className="text-sm font-medium text-gray-700">
            {items.length} item
          </span>
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {isSelectionMode && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <button
            onClick={onSelectAllCurrent}
            className="flex items-center justify-center w-6 h-6 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
            aria-label={allCurrentSelected ? 'Deselect all' : 'Select all'}
          >
            {allCurrentSelected ? (
              <CheckSquare className="w-5 h-5 text-orange-500" />
            ) : someCurrentSelected ? (
              <div className="w-3 h-3 bg-orange-500 rounded-sm" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <span className="text-sm font-medium text-gray-700">
            {selectedItems.length > 0 
              ? `${selectedItems.length} item dipilih`
              : 'Pilih semua item'
            }
          </span>
        </div>
      )}

      {items.map((item) => {
        debugItem(item);

        const stockLevel = getStockLevel(item);
        const isExpiringSoon = isExpiringItem(item);
        const isLowStock = isLowStockItem(item);
        const isOutOfStock = isOutOfStockItem(item);
        const isItemSelected = isSelected(item.id);
        const isExpanded = expandedItems.has(item.id);

        return (
          <div 
            key={item.id}
            className={`
              border rounded-lg overflow-hidden transition-all duration-200
              ${isItemSelected ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}
              ${stockLevel.level === 'out' ? 'border-red-200 bg-red-50' : ''}
              ${stockLevel.level === 'low' ? 'border-yellow-200 bg-yellow-50' : ''}
            `}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {isSelectionMode && (
                    <button
                      onClick={() => {
                        onToggleSelection(item.id);
                        logger.component('WarehouseTable', 'Item selection toggled:', { itemId: item.id, selected: !isItemSelected });
                      }}
                      className="flex items-center justify-center w-6 h-6 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors mt-1 flex-shrink-0"
                      aria-label={`${isItemSelected ? 'Deselect' : 'Select'} ${item.nama}`}
                    >
                      {isItemSelected ? (
                        <CheckSquare className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  )}

                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                    stockLevel.level === 'out' ? 'bg-red-500' :
                    stockLevel.level === 'low' ? 'bg-yellow-500' :
                    stockLevel.level === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                  }`} 
                  title={`Stock Level: ${stockLevel.level}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {highlightText(item.nama, searchTerm)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {highlightText(item.kategori, searchTerm)} • {item.stok} {item.satuan}
                        </p>
                        
                        <div className="flex flex-col gap-1 mt-2">
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

                      {!isSelectionMode && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const newState = showMobileActions === item.id ? null : item.id;
                              setShowMobileActions(newState);
                              logger.component('WarehouseTable', 'Mobile actions toggled:', { itemId: item.id, show: !!newState });
                            }}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Show actions"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className={`font-medium ${
                            stockLevel.level === 'out' ? 'text-red-600' :
                            stockLevel.level === 'low' ? 'text-yellow-600' :
                            'text-gray-900'
                          }`}>
                            {item.stok}
                          </span>
                          <span className="text-gray-500 ml-1">{item.satuan}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {/* ✅ UPDATE: Gunakan harga efektif */}
                          {warehouseUtils.formatCurrency(warehouseUtils.getEffectiveUnitPrice(item))}
                        </div>
                        {/* ✅ ADD: WAC indicator */}
                        {item.hargaRataRata != null && (
                          <div className="text-xs text-gray-500">
                            rata-rata
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {showMobileActions === item.id && !isSelectionMode && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logger.component('WarehouseTable', 'Edit item clicked:', item.id);
                        onEdit(item);
                        setShowMobileActions(null);
                      }}
                      className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logger.component('WarehouseTable', 'Delete item clicked:', { id: item.id, nama: item.nama });
                        onDelete(item.id, item.nama);
                        setShowMobileActions(null);
                      }}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Supplier:</span>
                    <div className="font-medium text-gray-900">{item.supplier}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Stok Minimum:</span>
                    <div className="font-medium text-gray-900">{item.minimum} {item.satuan}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Harga per {item.satuan}:</span>
                    <div className="font-medium text-gray-900">
                      {/* ✅ UPDATE: Gunakan harga efektif */}
                      {warehouseUtils.formatCurrency(warehouseUtils.getEffectiveUnitPrice(item))}
                    </div>
                    {/* ✅ ADD: WAC indicator */}
                    {item.hargaRataRata != null && (
                      <div className="text-xs text-gray-500 mt-1">
                        rata-rata
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Kadaluarsa:</span>
                    <div className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.expiry ? warehouseUtils.formatDate(item.expiry) : '-'}
                    </div>
                  </div>
                  {item.jumlahBeliKemasan && (
                    <>
                      <div>
                        <span className="text-gray-500">Jumlah Kemasan:</span>
                        <div className="font-medium text-gray-900">
                          {item.jumlahBeliKemasan} {item.satuanKemasan || 'unit'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Harga Kemasan:</span>
                        <div className="font-medium text-gray-900">
                          {item.hargaTotalBeliKemasan ? warehouseUtils.formatCurrency(item.hargaTotalBeliKemasan) : '-'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <div className="hidden md:block overflow-x-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <span className="text-sm font-medium text-gray-700">
            {items.length} item tersimpan
          </span>
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </Button>
        )}
      </div>

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {isSelectionMode && (
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={() => {
                    onSelectAllCurrent();
                    logger.component('WarehouseTable', 'Select all clicked:', { currentlyAllSelected: allCurrentSelected });
                  }}
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

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => {
                  onSort('nama');
                  logger.component('WarehouseTable', 'Sort by nama clicked');
                }}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Nama Bahan
                {getSortIcon('nama')}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => {
                  onSort('kategori');
                  logger.component('WarehouseTable', 'Sort by kategori clicked');
                }}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Kategori
                {getSortIcon('kategori')}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => {
                  onSort('stok');
                  logger.component('WarehouseTable', 'Sort by stok clicked');
                }}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Stok
                {getSortIcon('stok')}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => {
                  onSort('harga');
                  logger.component('WarehouseTable', 'Sort by harga clicked');
                }}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Harga
                {getSortIcon('harga')}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => {
                  onSort('expiry');
                  logger.component('WarehouseTable', 'Sort by expiry clicked');
                }}
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Kadaluarsa
                {getSortIcon('expiry')}
              </button>
            </th>

            {!isSelectionMode && (
              <th className="px-4 py-3 text-right">
                <span className="font-medium text-gray-700">Aksi</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {items.map((item) => {
            debugItem(item);

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
                {isSelectionMode && (
                  <td className="px-4 py-4">
                    <button
                      onClick={() => {
                        onToggleSelection(item.id);
                        logger.component('WarehouseTable', 'Desktop item selection toggled:', { itemId: item.id, selected: !isItemSelected });
                      }}
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

                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">
                    {highlightText(item.kategori, searchTerm)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.supplier}
                  </div>
                </td>

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

                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {/* ✅ UPDATE: Gunakan harga efektif */}
                    {warehouseUtils.formatCurrency(warehouseUtils.getEffectiveUnitPrice(item))}
                  </span>
                  <div className="text-xs text-gray-500">
                    per {item.satuan}
                  </div>
                  {/* ✅ ADD: WAC indicator */}
                  {item.hargaRataRata != null && (
                    <div className="text-xs text-gray-500">
                      rata-rata
                    </div>
                  )}
                </td>

                <td className="px-4 py-4">
                  {item.expiry ? (
                    <div className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {warehouseUtils.formatDate(item.expiry)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                {!isSelectionMode && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          logger.component('WarehouseTable', 'Desktop edit item clicked:', item.id);
                          onEdit(item);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="sr-only">Edit {item.nama}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          logger.component('WarehouseTable', 'Desktop delete item clicked:', { id: item.id, nama: item.nama });
                          onDelete(item.id, item.nama);
                        }}
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

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <MobileCardView />
      <DesktopTableView />
    </div>
  );
};

export default WarehouseTable;