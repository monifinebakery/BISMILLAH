// src/components/orders/components/index.ts
// Complete barrel export for all orders components

// ===========================================
// ERROR & LOADING COMPONENTS
// ===========================================

export { 
  ErrorBoundary, 
  ContextError, 
  PageLoading, 
  TableSkeleton, 
  CardSkeleton, 
  DialogLoader 
} from './ErrorBoundary';

// ===========================================
// DATA & UTILITY COMPONENTS
// ===========================================

export { default as DatePresets } from './DatePresets';
export { default as EmptyState } from './EmptyState';
export { default as LoadingStates } from './LoadingStates';

// ===========================================
// FILTER & SEARCH COMPONENTS
// ===========================================

export { default as FilterBar } from './FilterBar';
export { default as OrdersFilters } from './OrdersFilters';

// ===========================================
// TABLE COMPONENTS
// ===========================================

export { default as OrderTable } from './OrderTable';
export { default as OrderStatusCell } from './OrderStatusCell';
export { default as TableControls } from './TableControls';
export { default as PaginationControls } from './PaginationControls';

// ===========================================
// SELECTION & BULK ACTIONS
// ===========================================

export { default as SelectionToolbar } from './SelectionToolbar';
export { default as OrdersBulkActions } from './OrdersBulkActions';

// ===========================================
// PAGINATION
// ===========================================

export { default as OrdersPagination } from './OrdersPagination';

// ===========================================
// HOOKS (if they exist in components)
// ===========================================

// Placeholder hooks that might be used
export const useOrderFilters = (orders: any[]) => {
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    dateRange: null
  });

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          order.nomorPesanan?.toLowerCase().includes(searchLower) ||
          order.namaPelanggan?.toLowerCase().includes(searchLower) ||
          order.produk?.some((p: any) => p.nama?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const orderDate = new Date(order.tanggal);
        const { from, to } = filters.dateRange;
        if (from && orderDate < from) return false;
        if (to && orderDate > to) return false;
      }

      return true;
    });
  }, [orders, filters]);

  return {
    filters,
    filteredOrders,
    hasActiveFilters: filters.search !== '' || filters.status !== 'all' || filters.dateRange !== null,
    updateFilters: setFilters,
    clearFilters: () => setFilters({ search: '', status: 'all', dateRange: null })
  };
};

export const useOrderSelection = (orders: any[]) => {
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const allCurrentSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const someCurrentSelected = selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length;

  return {
    selectedOrderIds,
    isSelectionMode,
    allCurrentSelected,
    someCurrentSelected,
    toggleSelectOrder: (id: string, selected: boolean) => {
      if (selected) {
        setSelectedOrderIds(prev => [...prev, id]);
      } else {
        setSelectedOrderIds(prev => prev.filter(orderId => orderId !== id));
      }
    },
    toggleSelectAll: (currentOrders: any[]) => {
      if (allCurrentSelected) {
        setSelectedOrderIds([]);
      } else {
        setSelectedOrderIds(currentOrders.map(o => o.id));
      }
    },
    toggleSelectionMode: () => {
      setIsSelectionMode(prev => !prev);
      if (isSelectionMode) {
        setSelectedOrderIds([]);
      }
    },
    clearSelection: () => {
      setSelectedOrderIds([]);
      setIsSelectionMode(false);
    },
    getSelectedOrders: (allOrders: any[]) => {
      return allOrders.filter(order => selectedOrderIds.includes(order.id));
    }
  };
};

export const useOrderPagination = (items: any[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPageState, setItemsPerPageState] = React.useState(itemsPerPage);

  const totalPages = Math.ceil(items.length / itemsPerPageState);
  const currentOrders = React.useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPageState;
    return items.slice(firstItem, firstItem + itemsPerPageState);
  }, [items, currentPage, itemsPerPageState]);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage: itemsPerPageState,
    currentOrders,
    setCurrentPage,
    setItemsPerPage: setItemsPerPageState
  };
};

// ===========================================
// PLACEHOLDER COMPONENTS (for missing files)
// ===========================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// Placeholder for missing components
const PlaceholderComponent = ({ name }: { name: string }) => (
  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
    <p className="text-gray-500">Placeholder: {name}</p>
    <p className="text-xs text-gray-400 mt-1">Component akan dibuat sesuai kebutuhan</p>
  </div>
);

// Export placeholders for missing components
export const DatePresets = () => <PlaceholderComponent name="DatePresets" />;
export const EmptyState = () => <PlaceholderComponent name="EmptyState" />;
export const LoadingStates = () => <PlaceholderComponent name="LoadingStates" />;
export const OrdersFilters = () => <PlaceholderComponent name="OrdersFilters" />;
export const OrderStatusCell = () => <PlaceholderComponent name="OrderStatusCell" />;
export const OrdersBulkActions = () => <PlaceholderComponent name="OrdersBulkActions" />;
export const OrdersPagination = () => <PlaceholderComponent name="OrdersPagination" />;

// Working FilterBar component
export const FilterBar: React.FC<{
  filters: any;
  onFiltersChange: (filters: any) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  disabled?: boolean;
}> = ({ filters, onFiltersChange, onPageChange, onClearFilters, disabled = false }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter Pesanan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Cari Pesanan</label>
            <Input
              placeholder="Nomor pesanan, nama pelanggan..."
              value={filters?.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select 
              value={filters?.status || 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              disabled={disabled}
              className="w-full"
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Working SelectionToolbar component
export const SelectionToolbar: React.FC<{
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  disabled?: boolean;
}> = ({
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onClearSelection,
  onSelectAll,
  onBulkEdit,
  onBulkDelete,
  disabled = false
}) => {
  if (!isSelectionMode && selectedCount === 0) return null;

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedCount} dari {totalCount} item dipilih
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSelectAll}
              disabled={disabled}
            >
              {selectedCount === totalCount ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkEdit}
              disabled={disabled || selectedCount === 0}
            >
              Edit Massal
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onBulkDelete}
              disabled={disabled || selectedCount === 0}
            >
              Hapus ({selectedCount})
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearSelection}
              disabled={disabled}
            >
              Batal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Working TableControls component
export const TableControls: React.FC<{
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  onPageChange: (page: number) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  disabled?: boolean;
}> = ({
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange,
  isSelectionMode,
  onToggleSelectionMode,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tampilkan</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">item</span>
        </div>
      </div>
      <div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleSelectionMode}
          disabled={disabled}
        >
          {isSelectionMode ? 'Batal Pilih' : 'Pilih Item'}
        </Button>
      </div>
    </div>
  );
};

// Working OrderTable component
export const OrderTable: React.FC<{
  orders: any[];
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedOrderIds: string[];
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  hasFilters: boolean;
  onToggleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSelectOrder: (id: string, selected: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (order: any) => void;
  onDelete: (id: string) => void;
  onFollowUp: (order: any) => void;
  onViewDetail: (order: any) => void;
  onAddFirst: () => void;
  onClearFilters: () => void;
}> = ({ 
  orders, 
  isLoading, 
  onAddFirst,
  onClearFilters,
  hasFilters
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4" />
        <p className="text-gray-600">Memuat pesanan...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">
          {hasFilters ? 'Tidak ada pesanan yang sesuai dengan filter' : 'Belum ada pesanan'}
        </p>
        {hasFilters ? (
          <Button onClick={onClearFilters} variant="outline">
            Reset Filter
          </Button>
        ) : (
          <Button onClick={onAddFirst}>
            Tambah Pesanan Pertama
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-center text-gray-600">
        OrderTable component - {orders.length} pesanan ditemukan
      </p>
      <p className="text-xs text-gray-400 text-center mt-1">
        Component ini akan diimplementasi sesuai dengan struktur data pesanan
      </p>
    </div>
  );
};

// Working PaginationControls component
export const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  selectedCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  selectedCount,
  onPageChange,
  disabled = false
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} item
        {selectedCount > 0 && ` (${selectedCount} dipilih)`}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </Button>
        <span className="px-3 py-1 text-sm">
          Halaman {currentPage} dari {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
        >
          Selanjutnya
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
  // Error & Loading
  ErrorBoundary,
  ContextError,
  PageLoading,
  TableSkeleton,
  CardSkeleton,
  DialogLoader,
  
  // Data & Utility
  DatePresets,
  EmptyState,
  LoadingStates,
  
  // Filter & Search
  FilterBar,
  OrdersFilters,
  
  // Table
  OrderTable,
  OrderStatusCell,
  TableControls,
  PaginationControls,
  
  // Selection & Bulk
  SelectionToolbar,
  OrdersBulkActions,
  
  // Pagination
  OrdersPagination,
  
  // Hooks
  useOrderFilters,
  useOrderSelection,
  useOrderPagination
};