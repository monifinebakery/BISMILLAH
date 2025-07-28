// src/components/warehouse/pages/WarehousePage.tsx
import React, { useState, useMemo, Suspense, lazy, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  Loader2,
  Download,
  Upload,
  Settings,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Context and Types
import { useBahanBaku } from '../context/BahanBakuContext';
// import { useSimpleBahanBaku as useBahanBaku } from '../context/SimpleBahanBakuContext'; // 🔧 Testing simple version
import { BahanBaku, MobileViewMode } from '../types/warehouse';

// Custom Hooks
import { useWarehouseSelection } from '../hooks/useWarehouseSelection';
import { useWarehousePagination } from '../hooks/useWarehousePagination';
import { useWarehouseFilters } from '../hooks/useWarehouseFilters';
import { useBulkOperations } from '../hooks/useBulkOperations';

// Static Components - pastikan path sesuai dengan struktur folder
import LowStockAlert from '../components/alerts/LowStockAlert';
import SearchAndFilters from '../components/core/SearchAndFilters';
import WarehouseTable from '../components/core/WarehouseTable';
import TablePagination from '../components/core/TablePagination';

// Dynamic Imports for better code splitting
const AddItemDialog = lazy(() => import('../components/dialogs/AddItemDialog'));
const BulkDeleteDialog = lazy(() => import('../components/dialogs/BulkDeleteDialog'));
const BulkEditDialog = lazy(() => import('../components/dialogs/BulkEditDialog'));
const EditItemDialog = lazy(() => import('../components/dialogs/EditItemDialog'));
const ExportDialog = lazy(() => import('../components/dialogs/ExportDialog'));
const ImportDialog = lazy(() => import('../components/dialogs/ImportDialog'));

// Loading Components
const DialogLoader: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
  </div>
);

const TableLoader: React.FC = () => (
  <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="h-10 bg-gray-200 rounded-md w-1/3 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-md w-24 animate-pulse" />
      </div>
    </div>
    <div className="p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/8 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

// Error Boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>, 
  { hasError: boolean; error?: Error }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyComponent Error:', error, errorInfo);
    toast.error('Terjadi kesalahan saat memuat komponen');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-2">Gagal memuat komponen</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => this.setState({ hasError: false })}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

const WarehousePage: React.FC = () => {
  // 🐛 DEBUG: Performance tracking
  const initStartTime = useRef<number>(Date.now());
  const componentId = useRef<string>(`WarehousePage-${Math.random().toString(36).substr(2, 9)}`);
  const renderCountRef = useRef<number>(0);
  
  const perfTimers = useRef<{
    [key: string]: number;
  }>({});
  
  const startTimer = useCallback((operation: string) => {
    perfTimers.current[operation] = Date.now();
    logger.debug(`[${componentId.current}] PERF START: ${operation}`);
  }, []);
  
  const endTimer = useCallback((operation: string, extraData?: any) => {
    const startTime = perfTimers.current[operation];
    if (startTime) {
      const duration = Date.now() - startTime;
      logger.debug(`[${componentId.current}] PERF END: ${operation} took ${duration}ms`, extraData);
      delete perfTimers.current[operation];
      return duration;
    }
    return 0;
  }, []);

  renderCountRef.current += 1;
  logger.debug(`[${componentId.current}] 🎨 WarehousePage render #${renderCountRef.current} started`);

  // Context
  startTimer('context-access');
  const contextValue = useBahanBaku();
  endTimer('context-access', { hasContext: !!contextValue });
  
  if (!contextValue) {
    logger.error(`[${componentId.current}] ❌ BahanBaku Context tidak tersedia`);
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600">BahanBaku Context tidak tersedia.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    bahanBaku,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    bulkDeleteBahanBaku,
    loading: contextLoading,
    isConnected,
  } = contextValue;

  // 🐛 DEBUG: Context data tracking
  useEffect(() => {
    logger.debug(`[${componentId.current}] 📊 Context data changed:`, {
      itemCount: bahanBaku.length,
      loading: contextLoading,
      connected: isConnected,
      renderCount: renderCountRef.current
    });
  }, [bahanBaku.length, contextLoading, isConnected]);

  // Local State
  startTimer('local-state-init');
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [viewMode, setViewMode] = useState<MobileViewMode>({
    view: 'table',
    showFilters: false,
    showActions: false,
  });

  // Dialog States
  const [dialogs, setDialogs] = useState({
    addItem: false,
    bulkDelete: false,
    bulkEdit: false,
    export: false,
    import: false,
  });
  endTimer('local-state-init');

  // 🐛 DEBUG: Dialog state tracking
  useEffect(() => {
    const activeDialogs = Object.entries(dialogs).filter(([_, isOpen]) => isOpen).map(([name]) => name);
    if (activeDialogs.length > 0) {
      logger.debug(`[${componentId.current}] 📱 Active dialogs:`, activeDialogs);
    }
  }, [dialogs]);

  // Custom Hooks
  startTimer('hooks-init');
  const selection = useWarehouseSelection();
  const filters = useWarehouseFilters({ items: bahanBaku });
  const pagination = useWarehousePagination({ 
    totalItems: filters.filteredItems.length,
    initialItemsPerPage: 10,
  });

  const bulkOps = useBulkOperations({
    updateBahanBaku,
    bulkDeleteBahanBaku,
    selectedItems: selection.selectedItems,
    clearSelection: selection.clearSelection,
  });
  endTimer('hooks-init', {
    selectionReady: !!selection,
    filtersReady: !!filters,
    paginationReady: !!pagination,
    bulkOpsReady: !!bulkOps
  });

  // 🐛 DEBUG: Hook state tracking
  useEffect(() => {
    logger.debug(`[${componentId.current}] 🔧 Hooks state:`, {
      selectedCount: selection.selectedCount,
      isSelectionMode: selection.isSelectionMode,
      filteredCount: filters.filteredItems.length,
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      searchTerm: filters.searchTerm,
      activeFilters: filters.activeFiltersCount
    });
  }, [
    selection.selectedCount, 
    selection.isSelectionMode, 
    filters.filteredItems.length, 
    pagination.page, 
    pagination.totalPages,
    filters.searchTerm,
    filters.activeFiltersCount
  ]);

  // Memoized calculations
  startTimer('memoized-calculations');
  const currentPageItems = useMemo(() => {
    startTimer('current-page-items-calc');
    const startIndex = pagination.startIndex;
    const endIndex = pagination.endIndex;
    const result = filters.filteredItems.slice(startIndex, endIndex);
    endTimer('current-page-items-calc', { 
      itemCount: result.length, 
      startIndex, 
      endIndex,
      totalFiltered: filters.filteredItems.length 
    });
    return result;
  }, [filters.filteredItems, pagination.startIndex, pagination.endIndex]);

  const lowStockItems = useMemo(() => {
    startTimer('low-stock-calc');
    const result = bahanBaku.filter(item => item.stok <= item.minimum);
    endTimer('low-stock-calc', { lowStockCount: result.length, totalItems: bahanBaku.length });
    return result;
  }, [bahanBaku]);

  const selectedItemsData = useMemo(() => {
    startTimer('selected-items-calc');
    const result = selection.getSelectedItems(bahanBaku);
    endTimer('selected-items-calc', { selectedCount: result.length });
    return result;
  }, [selection.selectedItems, bahanBaku, selection.getSelectedItems]);
  endTimer('memoized-calculations');

  // Event Handlers
  const handleEdit = useCallback((item: BahanBaku) => {
    logger.debug(`[${componentId.current}] ✏️ Edit triggered for item:`, item.nama);
    setEditingItem(item);
  }, []);

  const handleEditSave = useCallback(async (updates: Partial<BahanBaku>) => {
    if (!editingItem) return;
    
    const operationId = Math.random().toString(36).substr(2, 9);
    startTimer(`edit-save-${operationId}`);
    
    logger.debug(`[${componentId.current}] 💾 Saving edit (${operationId}):`, { 
      itemName: editingItem.nama, 
      updates 
    });
    
    const success = await updateBahanBaku(editingItem.id, updates);
    if (success) {
      setEditingItem(null);
      toast.success('Item berhasil diperbarui!');
      logger.debug(`[${componentId.current}] ✅ Edit saved successfully (${operationId})`);
    } else {
      logger.warn(`[${componentId.current}] ❌ Edit save failed (${operationId})`);
    }
    
    endTimer(`edit-save-${operationId}`, { success });
  }, [editingItem, updateBahanBaku]);

  const handleDelete = useCallback(async (id: string, nama: string) => {
    const operationId = Math.random().toString(36).substr(2, 9);
    
    logger.debug(`[${componentId.current}] 🗑️ Delete confirmation for (${operationId}):`, { id, nama });
    
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
      startTimer(`delete-${operationId}`);
      logger.debug(`[${componentId.current}] 🗑️ Executing delete (${operationId})`);
      
      const success = await deleteBahanBaku(id);
      if (success) {
        toast.success(`"${nama}" berhasil dihapus.`);
        logger.debug(`[${componentId.current}] ✅ Delete successful (${operationId})`);
      } else {
        logger.warn(`[${componentId.current}] ❌ Delete failed (${operationId})`);
      }
      
      endTimer(`delete-${operationId}`, { success });
    } else {
      logger.debug(`[${componentId.current}] ⏭️ Delete cancelled by user (${operationId})`);
    }
  }, [deleteBahanBaku]);

  const handleSort = useCallback((key: keyof BahanBaku) => {
    startTimer('sort-operation');
    logger.debug(`[${componentId.current}] 🔄 Sort triggered:`, { 
      key, 
      currentDirection: filters.sortConfig.direction 
    });
    
    const newDirection = filters.sortConfig.key === key && filters.sortConfig.direction === 'asc' 
      ? 'desc' 
      : 'asc';
    filters.setSortConfig({ key, direction: newDirection });
    
    endTimer('sort-operation', { key, newDirection });
  }, [filters.sortConfig, filters.setSortConfig]);

  const toggleDialog = useCallback((dialog: keyof typeof dialogs, open?: boolean) => {
    const newState = open ?? !dialogs[dialog];
    logger.debug(`[${componentId.current}] 📱 Dialog toggle:`, { dialog, newState });
    
    setDialogs(prev => ({
      ...prev,
      [dialog]: newState
    }));
  }, [dialogs]);

  // Reset pagination when filters change
  useEffect(() => {
    startTimer('pagination-reset-effect');
    logger.debug(`[${componentId.current}] 📄 Pagination reset triggered:`, {
      filteredCount: filters.filteredItems.length,
      searchTerm: filters.searchTerm,
      activeFilters: filters.activeFiltersCount,
      currentPage: pagination.page
    });
    
    pagination.resetToFirstPage();
    endTimer('pagination-reset-effect');
  }, [filters.filteredItems.length, filters.searchTerm, filters.activeFiltersCount, pagination]);

  // 🐛 DEBUG: Loading state tracking
  const isLoading = contextLoading;
  useEffect(() => {
    logger.debug(`[${componentId.current}] ⏳ Loading state changed:`, { 
      isLoading, 
      contextLoading,
      renderCount: renderCountRef.current 
    });
  }, [isLoading, contextLoading]);

  // 🐛 DEBUG: Connection status tracking
  useEffect(() => {
    logger.debug(`[${componentId.current}] 🔌 Connection status:`, { 
      isConnected,
      timestamp: Date.now()
    });
  }, [isConnected]);

  // 🐛 DEBUG: Render performance tracking
  useEffect(() => {
    const renderTime = Date.now() - initStartTime.current;
    logger.debug(`[${componentId.current}] 🎨 Render completed:`, {
      renderNumber: renderCountRef.current,
      renderTime,
      isLoading,
      itemCount: bahanBaku.length,
      filteredCount: filters.filteredItems.length,
      selectedCount: selection.selectedCount,
      currentPageItems: currentPageItems.length,
      lowStockCount: lowStockItems.length
    });
  });

  // 🐛 DEBUG: Component lifecycle
  useEffect(() => {
    logger.debug(`[${componentId.current}] 🚀 WarehousePage mounted`);
    
    return () => {
      const totalLifetime = Date.now() - initStartTime.current;
      logger.debug(`[${componentId.current}] 💀 WarehousePage unmounting:`, {
        totalLifetime,
        totalRenders: renderCountRef.current,
        avgRenderTime: totalLifetime / renderCountRef.current
      });
    };
  }, []);

  logger.debug(`[${componentId.current}] 🎯 About to render JSX:`, {
    renderNumber: renderCountRef.current,
    isLoading,
    hasItems: bahanBaku.length > 0,
    hasLowStock: lowStockItems.length > 0,
    hasSelection: selection.selectedCount > 0,
    isConnected
  });

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      {/* Connection Status Alert */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Koneksi tidak stabil. Data mungkin tidak ter-update secara real-time.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <Package className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Manajemen Gudang</h1>
            <p className="text-sm opacity-90 mt-1">
              {bahanBaku.length} item • {selection.selectedCount > 0 && `${selection.selectedCount} dipilih`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button
            onClick={() => toggleDialog('addItem', true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Item</span>
          </Button>
          
          <Button
            onClick={() => toggleDialog('import', true)}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          
          <Button
            onClick={() => toggleDialog('export', true)}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </header>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <LowStockAlert lowStockItems={lowStockItems} />
      )}

      {/* Bulk Action Bar */}
      {selection.selectedCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-orange-900">
                {selection.selectedCount} item dipilih
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => toggleDialog('bulkEdit', true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={bulkOps.isBulkEditing}
              >
                <Settings className="h-4 w-4" />
                Edit Bulk
              </Button>
              <Button
                onClick={() => toggleDialog('bulkDelete', true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                disabled={bulkOps.isBulkDeleting}
              >
                <AlertTriangle className="h-4 w-4" />
                Hapus
              </Button>
              <Button
                onClick={selection.clearSelection}
                variant="ghost"
                size="sm"
                className="text-gray-600"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <>
          {logger.debug(`[${componentId.current}] 📊 Rendering TableLoader`)}
          <TableLoader />
        </>
      ) : (
        <>
          {logger.debug(`[${componentId.current}] 📊 Rendering main content with ${currentPageItems.length} items`)}
          <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
            {/* Search and Filters */}
            <SearchAndFilters
              searchTerm={filters.searchTerm}
              onSearchChange={filters.setSearchTerm}
              filters={filters.filters}
              onFiltersChange={filters.setFilters}
              itemsPerPage={pagination.itemsPerPage}
              onItemsPerPageChange={pagination.setItemsPerPage}
              isSelectionMode={selection.isSelectionMode}
              onToggleSelectionMode={selection.toggleSelectionMode}
              availableCategories={filters.availableCategories}
              availableSuppliers={filters.availableSuppliers}
              onResetFilters={filters.resetFilters}
              activeFiltersCount={filters.activeFiltersCount}
              viewMode={viewMode.view}
              onViewModeChange={(mode) => setViewMode(prev => ({ ...prev, view: mode }))}
            />

            {/* Table */}
            <WarehouseTable
              items={currentPageItems}
              isLoading={isLoading}
              isSelectionMode={selection.isSelectionMode}
              searchTerm={filters.searchTerm}
              sortConfig={filters.sortConfig}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectedItems={selection.selectedItems}
              onToggleSelection={selection.toggleSelection}
              onSelectAllCurrent={() => selection.selectPage(currentPageItems)}
              isSelected={selection.isSelected}
              allCurrentSelected={selection.isPageSelected(currentPageItems)}
              someCurrentSelected={selection.isPagePartiallySelected(currentPageItems)}
              emptyStateAction={() => toggleDialog('addItem', true)}
            />

            {/* Pagination */}
            {filters.filteredItems.length > 0 && (
              <TablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                selectedCount={selection.selectedCount}
                onPageChange={pagination.setPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
              />
            )}
          </div>
        </>
      )}

      {/* Lazy Loaded Dialogs */}
      <LazyComponentErrorBoundary>
        <Suspense fallback={<DialogLoader />}>
          {dialogs.addItem && (
            <>
              {logger.debug(`[${componentId.current}] 📱 Rendering AddItemDialog`)}
              <AddItemDialog
                isOpen={dialogs.addItem}
                onClose={() => toggleDialog('addItem', false)}
                onAdd={addBahanBaku}
              />
            </>
          )}
        </Suspense>
      </LazyComponentErrorBoundary>

      <LazyComponentErrorBoundary>
        <Suspense fallback={<DialogLoader />}>
          {dialogs.bulkEdit && (
            <>
              {logger.debug(`[${componentId.current}] 📱 Rendering BulkEditDialog`)}
              <BulkEditDialog
                isOpen={dialogs.bulkEdit}
                onClose={() => toggleDialog('bulkEdit', false)}
                onConfirm={bulkOps.handleBulkEdit}
                selectedItems={selection.selectedItems}
                selectedItemsData={selectedItemsData}
                isBulkEditing={bulkOps.isBulkEditing}
                bulkEditData={bulkOps.bulkEditData}
                setBulkEditData={bulkOps.setBulkEditData}
                resetBulkEditData={bulkOps.resetBulkEditData}
                validateBulkEditData={bulkOps.validateBulkEditData}
                availableCategories={filters.availableCategories}
                availableSuppliers={filters.availableSuppliers}
              />
            </>
          )}
        </Suspense>
      </LazyComponentErrorBoundary>

      <LazyComponentErrorBoundary>
        <Suspense fallback={<DialogLoader />}>
          {dialogs.bulkDelete && (
            <>
              {logger.debug(`[${componentId.current}] 📱 Rendering BulkDeleteDialog`)}
              <BulkDeleteDialog
                isOpen={dialogs.bulkDelete}
                onClose={() => toggleDialog('bulkDelete', false)}
                onConfirm={bulkOps.handleBulkDelete}
                selectedItems={selection.selectedItems}
                selectedItemsData={selectedItemsData}
                isBulkDeleting={bulkOps.isBulkDeleting}
              />
            </>
          )}
        </Suspense>
      </LazyComponentErrorBoundary>

      <LazyComponentErrorBoundary>
        <Suspense fallback={<DialogLoader />}>
          {editingItem && (
            <>
              {logger.debug(`[${componentId.current}] 📱 Rendering EditItemDialog for:`, editingItem.nama)}
              <EditItemDialog
                item={editingItem}
                onSave={handleEditSave}
                onClose={() => setEditingItem(null)}
                isOpen={!!editingItem}
              />
            </>
          )}
        </Suspense>
      </LazyComponentErrorBoundary>

      <LazyComponentErrorBoundary>
        <Suspense fallback={<DialogLoader />}>
          {dialogs.export && (
            <>
              {logger.debug(`[${componentId.current}] 📱 Rendering ExportDialog`)}
              <ExportDialog
                isOpen={dialogs.export}
                onClose={() => toggleDialog('export', false)}
                data={filters.filteredItems}
                selectedData={selectedItemsData}
              />
            </>
          )}
        </Suspense>
      </LazyComponentErrorBoundary>

      <LazyComponentErrorBoundary>
        <Suspense fallback={<DialogLoader />}>
          {dialogs.import && (
            <>
              {logger.debug(`[${componentId.current}] 📱 Rendering ImportDialog`)}
              <ImportDialog
                isOpen={dialogs.import}
                onClose={() => toggleDialog('import', false)}
                onImport={addBahanBaku}
              />
            </>
          )}
        </Suspense>
      </LazyComponentErrorBoundary>
    </div>
  );
};

export default WarehousePage;