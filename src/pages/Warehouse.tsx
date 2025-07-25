import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, Package, AlertTriangle, Loader2
} from 'lucide-react';
import { BahanBaku, WarehouseContextType } from '@/components/warehouse/types/warehouse';
import { useBahanBaku } from '@/components/warehouse/context/BahanBakuContext';
import { toast } from 'sonner';

// Static imports for core components
import LowStockAlert from '@/components/warehouse/LowStockAlert';
import SelectionControls from '@/components/warehouse/SelectionControls';
import SearchAndFilters from '@/components/warehouse/SearchAndFilters';
import WarehouseTable from '@/components/warehouse/components/WarehouseTable';
import TablePagination from '@/components/warehouse/TablePagination';

// Dynamic imports for dialogs
const AddItemDialog = React.lazy(() => import('@/components/warehouse/AddItemDialog'));
const BulkDeleteDialog = React.lazy(() => import('@/components/warehouse/BulkDeleteDialog'));
const BahanBakuEditDialog = React.lazy(() => import('@/components/warehouse/BahanBakuEditDialog'));

// Loading fallback component
const DialogLoader: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
  </div>
);

// Error boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>, 
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
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
            <p className="text-red-600">Gagal memuat komponen</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2"
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
  // Get context values with proper fallbacks
  const contextValue = useBahanBaku();
  if (!contextValue) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600">Bahan Baku Context tidak tersedia. Pastikan komponen ini dibungkus dengan BahanBakuProvider.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    bahanBaku = [],
    addBahanBaku = () => Promise.resolve(false),
    updateBahanBaku = () => Promise.resolve(false),
    deleteBahanBaku = () => Promise.resolve(false),
    isLoading: appDataLoading = false,
    selectedItems = [],
    isSelectionMode = false,
    isBulkDeleting = false,
    toggleSelection = () => {},
    selectAll = () => {},
    clearSelection = () => {},
    toggleSelectionMode = () => {},
    isSelected = () => false,
    getSelectedItems = () => [],
    bulkDeleteBahanBaku = () => Promise.resolve(false),
  } = contextValue;

  // Local state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Memoized computed values
  const filteredItems = useMemo(() => {
    return Array.isArray(bahanBaku) 
      ? bahanBaku.filter(item =>
          item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.kategori && item.kategori.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : [];
  }, [bahanBaku, searchTerm]);

  const lowStockItems = useMemo(() => {
    return Array.isArray(bahanBaku) 
      ? bahanBaku.filter(item => item.stok <= item.minimum)
      : [];
  }, [bahanBaku]);

  // Calculate pagination variables
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const currentItems = useMemo(() => 
    filteredItems.slice(Math.max(0, indexOfFirstItem), indexOfLastItem), 
    [filteredItems, indexOfFirstItem, indexOfLastItem]
  );

  const selectedItemsData = useMemo(() => getSelectedItems() || [], [getSelectedItems]);

  // Selection state for current page
  const allCurrentSelected = useMemo(() => 
    currentItems.length > 0 && currentItems.every(item => isSelected(item.id)),
    [currentItems, isSelected]
  );

  const someCurrentSelected = useMemo(() => 
    currentItems.some(item => isSelected(item.id)) && !allCurrentSelected,
    [currentItems, isSelected, allCurrentSelected]
  );

  // Reset currentPage when filteredItems length or itemsPerPage changes
  useEffect(() => {
    const maxPage = Math.ceil(filteredItems.length / itemsPerPage);
    if (filteredItems.length === 0 || currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [filteredItems.length, itemsPerPage, currentPage]);

  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleEdit = (itemToEdit: BahanBaku) => {
    const fullItem = bahanBaku.find(b => b.id === itemToEdit.id);
    if (fullItem) {
      setEditingItem(fullItem);
    } else {
      toast.error('Gagal mengedit: Item tidak ditemukan.');
    }
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem && editingItem.id) {
      const updatedItemData = { ...updates, tanggalKadaluwarsa: updates.tanggalKadaluwarsa ? new Date(updates.tanggalKadaluwarsa) : null };
      await updateBahanBaku(editingItem.id, updatedItemData);
      setEditingItem(null);
      toast.success('Bahan baku berhasil diperbarui!');
    } else {
      toast.error('Gagal memperbarui bahan baku.');
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
      await deleteBahanBaku(id);
      toast.success(`"${nama}" berhasil dihapus.`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }

    const success = await bulkDeleteBahanBaku(selectedItems);
    if (success) {
      setShowBulkDeleteDialog(false);
    }
  };

  const handleSelectAllCurrent = () => {
    if (allCurrentSelected) {
      currentItems.forEach(item => toggleSelection(item.id));
    } else {
      currentItems.forEach(item => !isSelected(item.id) && toggleSelection(item.id));
    }
  };

  const handleBulkDeleteOpen = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleAddFormOpen = () => {
    setShowAddForm(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      {appDataLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3" role="alert" aria-label="Loading data">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <span className="text-gray-600 font-medium">Memuat data gudang...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-4 mb-4 lg:mb-0">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manajemen Gudang Bahan Baku</h1>
                <p className="text-sm opacity-90 mt-1">Kelola semua inventori bahan baku Anda dengan mudah.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                onClick={handleAddFormOpen}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
                aria-label="Tambah Bahan Baku"
              >
                <Plus className="h-5 w-5" />
                Tambah Bahan Baku
              </Button>
            </div>
          </header>

          {/* Low Stock Alert */}
          <LowStockAlert lowStockItems={lowStockItems} />

          {/* Selection Controls */}
          <SelectionControls
            isSelectionMode={isSelectionMode}
            selectedItems={selectedItems}
            isBulkDeleting={isBulkDeleting}
            totalItems={bahanBaku.length}
            onClearSelection={clearSelection}
            onSelectAll={selectAll}
            onBulkDelete={handleBulkDeleteOpen}
          />

          {/* Main Table Container */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
            {/* Search and Filters */}
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              isSelectionMode={isSelectionMode}
              onToggleSelectionMode={toggleSelectionMode}
            />

            {/* Table */}
            <WarehouseTable
              items={currentItems}
              isLoading={appDataLoading}
              isSelectionMode={isSelectionMode}
              searchTerm={searchTerm}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddFirst={handleAddFormOpen}
              selectedItems={selectedItems}
              onToggleSelection={toggleSelection}
              onSelectAllCurrent={handleSelectAllCurrent}
              isSelected={isSelected}
              allCurrentSelected={allCurrentSelected}
              someCurrentSelected={someCurrentSelected}
            />

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                selectedCount={selectedItems.length}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          {/* Lazy Loaded Dialogs */}
          <LazyComponentErrorBoundary>
            <Suspense fallback={<DialogLoader />}>
              {showBulkDeleteDialog && (
                <BulkDeleteDialog
                  isOpen={showBulkDeleteDialog}
                  onClose={() => setShowBulkDeleteDialog(false)}
                  onConfirm={handleBulkDelete}
                  selectedItems={selectedItems}
                  selectedItemsData={selectedItemsData}
                  isBulkDeleting={isBulkDeleting}
                />
              )}
            </Suspense>
          </LazyComponentErrorBoundary>

          <LazyComponentErrorBoundary>
            <Suspense fallback={<DialogLoader />}>
              {showAddForm && (
                <AddItemDialog
                  isOpen={showAddForm}
                  onClose={() => setShowAddForm(false)}
                  onAdd={addBahanBaku}
                />
              )}
            </Suspense>
          </LazyComponentErrorBoundary>

          <LazyComponentErrorBoundary>
            <Suspense fallback={<DialogLoader />}>
              {editingItem && (
                <BahanBakuEditDialog
                  item={editingItem}
                  onSave={handleEditSave}
                  onClose={() => setEditingItem(null)}
                  isOpen={!!editingItem}
                />
              )}
            </Suspense>
          </LazyComponentErrorBoundary>
        </>
      )}
    </div>
  );
};

export default WarehousePage;