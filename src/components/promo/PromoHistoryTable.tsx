// components/PromoHistoryTable.tsx - History Table with Bulk Actions

import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCheck,
  X,
  Search,
  Filter,
  Download,
  Copy
} from 'lucide-react';
import { PromoHistoryTableProps, PromoEstimation, SelectionState } from '@/types';
import { formatCurrency, formatDate, formatPromoType, formatPromoDetails } from '@/utils/';
import { useSearch, useToggle } from '@/hooks';

interface PromoHistoryTableComponent extends React.FC<PromoHistoryTableProps> {
  TableHeader: React.FC<TableHeaderProps>;
  TableRow: React.FC<TableRowProps>;
  BulkActions: React.FC<BulkActionsProps>;
  EmptyState: React.FC<EmptyStateProps>;
  SearchBar: React.FC<SearchBarProps>;
}

interface TableHeaderProps {
  selectedItems: SelectionState<string>;
  allItems: PromoEstimation[];
  onSelectionChange: (selection: SelectionState<string>) => void;
  sortField?: keyof PromoEstimation;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: keyof PromoEstimation) => void;
}

interface TableRowProps {
  estimation: PromoEstimation;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit?: (estimation: PromoEstimation) => void;
  onView?: (estimation: PromoEstimation) => void;
  onDelete?: (estimation: PromoEstimation) => void;
}

interface BulkActionsProps {
  selectedCount: number;
  onDelete: (ids: string[]) => void;
  onClear: () => void;
  selectedIds: string[];
  isDeleting?: boolean;
}

interface EmptyStateProps {
  searchQuery?: string;
  onReset?: () => void;
}

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
}

// 🔍 Search Bar Component
const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  placeholder = "Cari nama promo..."
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
      />
      {query && (
        <button
          onClick={() => onQueryChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
};

// 📊 Table Header Component
const TableHeader: React.FC<TableHeaderProps> = ({
  selectedItems,
  allItems,
  onSelectionChange,
  sortField,
  sortDirection,
  onSort
}) => {
  const isAllSelected = allItems.length > 0 && selectedItems.selectedItems.size === allItems.length;
  const isIndeterminate = selectedItems.selectedItems.size > 0 && selectedItems.selectedItems.size < allItems.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange({
        selectedItems: new Set(),
        isAllSelected: false,
        selectedCount: 0
      });
    } else {
      const allIds = new Set(allItems.map(item => item.id));
      onSelectionChange({
        selectedItems: allIds,
        isAllSelected: true,
        selectedCount: allItems.length
      });
    }
  };

  const getSortIcon = (field: keyof PromoEstimation) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleSort = (field: keyof PromoEstimation) => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="w-12 px-6 py-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
          </div>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('promo_name')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Nama Promo
            <span className="text-xs">{getSortIcon('promo_name')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('base_recipe_name')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Produk
            <span className="text-xs">{getSortIcon('base_recipe_name')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('promo_type')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Jenis Promo
            <span className="text-xs">{getSortIcon('promo_type')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('original_price')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Harga Asli
            <span className="text-xs">{getSortIcon('original_price')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('promo_price_effective')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Harga Promo
            <span className="text-xs">{getSortIcon('promo_price_effective')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('estimated_margin_percent')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Margin
            <span className="text-xs">{getSortIcon('estimated_margin_percent')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => handleSort('created_at')}
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Tanggal
            <span className="text-xs">{getSortIcon('created_at')}</span>
          </button>
        </th>
        
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Aksi
        </th>
      </tr>
    </thead>
  );
};

// 📄 Table Row Component
const TableRow: React.FC<TableRowProps> = ({
  estimation,
  isSelected,
  onToggleSelect,
  onEdit,
  onView,
  onDelete
}) => {
  const [showActions, setShowActions] = useToggle(false);
  
  const getMarginColor = (marginPercent: number) => {
    if (marginPercent < 0) return 'text-red-600 bg-red-50';
    if (marginPercent < 0.1) return 'text-orange-600 bg-orange-50';
    if (marginPercent < 0.2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getMarginIcon = (marginPercent: number) => {
    if (marginPercent < 0) return <TrendingDown className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  const discountAmount = estimation.original_price - estimation.promo_price_effective;
  const discountPercent = estimation.original_price > 0 
    ? (discountAmount / estimation.original_price) * 100 
    : 0;

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-orange-50' : ''}`}>
      <td className="w-12 px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(estimation.id)}
          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        />
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {estimation.promo_name}
        </div>
        <div className="text-xs text-gray-500">
          {formatPromoDetails(estimation.promo_type, estimation.promo_details)}
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900">
        {estimation.base_recipe_name}
      </td>
      
      <td className="px-6 py-4">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {formatPromoType(estimation.promo_type)}
        </span>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900">
        {formatCurrency(estimation.original_price)}
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(estimation.promo_price_effective)}
        </div>
        <div className="text-xs text-gray-500">
          Hemat {formatCurrency(discountAmount)} ({discountPercent.toFixed(1)}%)
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMarginColor(estimation.estimated_margin_percent)}`}>
            {getMarginIcon(estimation.estimated_margin_percent)}
            <span>{(estimation.estimated_margin_percent * 100).toFixed(1)}%</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatCurrency(estimation.estimated_margin_rp)}
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(estimation.created_at)}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={setShowActions.toggle}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {showActions.value && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {onView && (
                  <button
                    onClick={() => {
                      onView(estimation);
                      setShowActions.setFalse();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Detail
                  </button>
                )}
                
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(estimation);
                      setShowActions.setFalse();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Promo
                  </button>
                )}
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(estimation, null, 2));
                    setShowActions.setFalse();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy Data
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(estimation);
                      setShowActions.setFalse();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Promo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// 🔨 Bulk Actions Component
const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onDelete,
  onClear,
  selectedIds,
  isDeleting = false
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => {
    onDelete(selectedIds);
    setShowConfirmDelete(false);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckAll className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">
            {selectedCount} promo dipilih
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirmDelete(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Hapus Terpilih</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Batal
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Konfirmasi Hapus
                </h3>
                <p className="text-sm text-gray-600">
                  Yakin ingin menghapus {selectedCount} promo?
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 🚫 Empty State Component
const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, onReset }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {searchQuery ? (
          <Search className="h-8 w-8 text-gray-400" />
        ) : (
          <Calendar className="h-8 w-8 text-gray-400" />
        )}
      </div>
      
      {searchQuery ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada hasil pencarian
          </h3>
          <p className="text-gray-500 mb-4">
            Tidak ditemukan promo dengan kata kunci "{searchQuery}"
          </p>
          {onReset && (
            <button
              onClick={onReset}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Reset pencarian
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada riwayat promo
          </h3>
          <p className="text-gray-500">
            Buat promo pertama untuk melihat riwayat di sini
          </p>
        </>
      )}
    </div>
  );
};

// 🎯 Main Promo History Table Component
const PromoHistoryTable: PromoHistoryTableComponent = ({
  estimations,
  selectedItems,
  onSelectionChange,
  onDelete,
  loading = false
}) => {
  const [sortField, setSortField] = useState<keyof PromoEstimation>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);

  // Search functionality
  const { query, setQuery, filteredItems } = useSearch(estimations, 'promo_name');

  // Sorting functionality
  const sortedEstimations = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortDirection]);

  const handleSort = (field: keyof PromoEstimation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelectedItems = new Set(selectedItems.selectedItems);
    
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }

    onSelectionChange({
      selectedItems: newSelectedItems,
      isAllSelected: newSelectedItems.size === estimations.length,
      selectedCount: newSelectedItems.size
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    setIsDeleting(true);
    try {
      await onDelete(ids);
      // Clear selection after successful delete
      onSelectionChange({
        selectedItems: new Set(),
        isAllSelected: false,
        selectedCount: 0
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearSelection = () => {
    onSelectionChange({
      selectedItems: new Set(),
      isAllSelected: false,
      selectedCount: 0
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="border border-gray-200 rounded-lg">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="p-4 border-b border-gray-200 last:border-b-0">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Riwayat Promo
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredItems.length} dari {estimations.length} promo
          </p>
        </div>

        <div className="w-80">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Cari nama promo atau produk..."
          />
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedItems.selectedCount}
        onDelete={handleBulkDelete}
        onClear={handleClearSelection}
        selectedIds={Array.from(selectedItems.selectedItems)}
        isDeleting={isDeleting}
      />

      {/* Table */}
      {sortedEstimations.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader
                selectedItems={selectedItems}
                allItems={sortedEstimations}
                onSelectionChange={onSelectionChange}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEstimations.map((estimation) => (
                  <TableRow
                    key={estimation.id}
                    estimation={estimation}
                    isSelected={selectedItems.selectedItems.has(estimation.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          searchQuery={query}
          onReset={() => setQuery('')}
        />
      )}
    </div>
  );
};

// Attach sub-components
PromoHistoryTable.TableHeader = TableHeader;
PromoHistoryTable.TableRow = TableRow;
PromoHistoryTable.BulkActions = BulkActions;
PromoHistoryTable.EmptyState = EmptyState;
PromoHistoryTable.SearchBar = SearchBar;

export default PromoHistoryTable;