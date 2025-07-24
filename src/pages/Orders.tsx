// src/components/orders/OrdersPage.tsx
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Context imports
import { useOrder } from '@/contexts/OrderContext';

// Types
import { Order, NewOrder, OrderContextType } from '@/types';

// Hooks
import { useOrderFilters, useOrderSelection, useOrderPagination } from './hooks';

// Core components (always loaded)
import {
  ErrorBoundary,
  ContextError,
  PageLoading,
  FilterBar,
  SelectionToolbar,
  TableControls,
  OrderTable,
  PaginationControls
} from '@/components/orders';

// Lazy loaded components (code split)
const OrderForm = lazy(() => import('@/components/OrderForm'));
const FollowUpTemplateManager = lazy(() => import('@/components/FollowUpTemplateManager'));
const BulkDeleteDialog = lazy(() => import('@/components/dialogs/BulkDeleteDialog'));
const BulkEditDialog = lazy(() => import('@/components/dialogs/BulkEditDialog'));

// Dialog loading fallback
const DialogLoader: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
  </div>
);

const OrdersPage: React.FC = () => {
  // Get context values with proper fallbacks
  const contextValue = useOrder() as OrderContextType | null;

  // Early return for missing context
  if (!contextValue) {
    return <ContextError />;
  }

  const {
    orders = [],
    loading = false,
    addOrder = () => Promise.resolve(false),
    updateOrder = () => Promise.resolve(false),
    deleteOrder = () => Promise.resolve(false)
  } = contextValue;

  // Loading state
  if (loading) {
    return <PageLoading />;
  }

  return (
    <ErrorBoundary>
      <OrdersPageContent
        orders={orders}
        addOrder={addOrder}
        updateOrder={updateOrder}
        deleteOrder={deleteOrder}
        loading={loading}
      />
    </ErrorBoundary>
  );
};

// Separate content component to avoid re-renders
interface OrdersPageContentProps {
  orders: Order[];
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  loading: boolean;
}

const OrdersPageContent: React.FC<OrdersPageContentProps> = ({
  orders,
  addOrder,
  updateOrder,
  deleteOrder,
  loading
}) => {
  // Custom hooks
  const filters = useOrderFilters(orders);
  const pagination = useOrderPagination(filters.filteredOrders, 10);
  const selection = useOrderSelection(pagination.currentOrders);

  // Local state for dialogs
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedOrderForTemplate, setSelectedOrderForTemplate] = useState<Order | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

  // Event handlers
  const handleNewOrder = useCallback(() => {
    setEditingOrder(null);
    setShowOrderForm(true);
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    setEditingOrder(order);
    setShowOrderForm(true);
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    try {
      selection.toggleSelectOrder(orderId, false); // Remove from selection
      const success = await deleteOrder(orderId);
      if (success) {
        toast.success('Pesanan berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
      console.error('Error deleting order:', error);
    }
  }, [deleteOrder, selection.toggleSelectOrder]);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    try {
      const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
      if (success) {
        const order = orders.find(o => o.id === orderId);
        toast.success(`Status pesanan #${order?.nomorPesanan || orderId} berhasil diubah.`);
      }
    } catch (error) {
      toast.error('Gagal mengubah status pesanan');
      console.error('Error updating order status:', error);
    }
  }, [updateOrder, orders]);

  const handleFollowUpClick = useCallback((order: Order) => {
    setSelectedOrderForTemplate(order);
    setShowTemplateManager(true);
  }, []);

  const handleTemplateManager = useCallback(() => {
    setSelectedOrderForTemplate(null);
    setShowTemplateManager(true);
  }, []);

  const handleViewDetail = useCallback((order: Order) => {
    // TODO: Implement order detail view
    console.log('View detail for order:', order.id);
    toast.info('Fitur detail pesanan akan segera tersedia');
  }, []);

  const handleSubmitOrder = useCallback(async (data: Partial<Order> | Partial<NewOrder>) => {
    const isEditingMode = !!editingOrder;
    let success = false;

    try {
      if (isEditingMode && editingOrder?.id) {
        success = await updateOrder(editingOrder.id, data);
      } else {
        success = await addOrder(data as NewOrder);
      }

      if (success) {
        toast.success(
          isEditingMode 
            ? 'Pesanan berhasil diperbarui.' 
            : 'Pesanan baru berhasil ditambahkan.'
        );
        setShowOrderForm(false);
        setEditingOrder(null);
      }
    } catch (error) {
      toast.error(
        isEditingMode 
          ? 'Gagal memperbarui pesanan' 
          : 'Gagal menambahkan pesanan'
      );
      console.error('Error submitting order:', error);
    }
  }, [editingOrder, updateOrder, addOrder]);

  const handleBulkDelete = useCallback(async () => {
    if (selection.selectedOrderIds.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }

    try {
      const deletePromises = selection.selectedOrderIds.map(id => deleteOrder(id));
      const results = await Promise.allSettled(deletePromises);
      
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} pesanan berhasil dihapus!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} pesanan gagal dihapus`);
      }

      setShowBulkDeleteDialog(false);
      selection.clearSelection();
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
      console.error('Error in bulk delete:', error);
    }
  }, [selection.selectedOrderIds, deleteOrder, selection.clearSelection]);

  const handleBulkEdit = useCallback(async (newStatus: string) => {
    if (selection.selectedOrderIds.length === 0 || !newStatus) {
      toast.warning('Pilih item dan status yang ingin diubah');
      return;
    }

    try {
      const updatePromises = selection.selectedOrderIds.map(id =>
        updateOrder(id, { status: newStatus as Order['status'] })
      );
      const results = await Promise.allSettled(updatePromises);
      
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} pesanan berhasil diubah statusnya!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} pesanan gagal diubah statusnya`);
      }

      setShowBulkEditDialog(false);
      selection.clearSelection();
    } catch (error) {
      toast.error('Gagal mengubah status pesanan');
      console.error('Error in bulk edit:', error);
    }
  }, [selection.selectedOrderIds, updateOrder, selection.clearSelection]);

  const handleSendWhatsApp = useCallback((message: string, order: Order) => {
    // TODO: Implement WhatsApp integration
    console.log('Sending WhatsApp message:', { message, order });
    toast.info('Fitur WhatsApp akan segera tersedia');
  }, []);

  // Selection event handlers
  const handleToggleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    selection.toggleSelectAll(pagination.currentOrders);
  }, [selection.toggleSelectAll, pagination.currentOrders]);

  const handleSelectAllFiltered = useCallback(() => {
    const allIds = filters.filteredOrders.map(o => o.id);
    if (selection.selectedOrderIds.length === allIds.length) {
      selection.clearSelection();
    } else {
      // Select all filtered orders
      allIds.forEach(id => {
        if (!selection.selectedOrderIds.includes(id)) {
          selection.toggleSelectOrder(id, true);
        }
      });
    }
  }, [filters.filteredOrders, selection]);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manajemen Pesanan</h1>
            <p className="text-sm opacity-90 mt-1">
              Kelola semua pesanan dari pelanggan Anda dengan mudah.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            onClick={handleTemplateManager}
            variant="outline"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-50 transition-all duration-200 hover:shadow-lg border-blue-300"
          >
            <MessageSquare className="h-5 w-5" />
            Kelola Template
          </Button>
          <Button
            onClick={handleNewOrder}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Pesanan Baru
          </Button>
        </div>
      </header>

      {/* Selection Toolbar */}
      <SelectionToolbar
        isSelectionMode={selection.isSelectionMode}
        selectedCount={selection.selectedOrderIds.length}
        totalCount={filters.filteredOrders.length}
        onToggleSelectionMode={selection.toggleSelectionMode}
        onClearSelection={selection.clearSelection}
        onSelectAll={handleSelectAllFiltered}
        onBulkEdit={() => setShowBulkEditDialog(true)}
        onBulkDelete={() => setShowBulkDeleteDialog(true)}
        disabled={loading}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters.filters}
        onFiltersChange={filters.updateFilters}
        onPageChange={pagination.setCurrentPage}
        onClearFilters={filters.clearFilters}
        disabled={loading}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* Table Controls */}
        <TableControls
          itemsPerPage={pagination.itemsPerPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
          onPageChange={pagination.setCurrentPage}
          isSelectionMode={selection.isSelectionMode}
          onToggleSelectionMode={selection.toggleSelectionMode}
          disabled={loading}
        />

        {/* Order Table */}
        <OrderTable
          orders={pagination.currentOrders}
          isLoading={loading}
          isSelectionMode={selection.isSelectionMode}
          selectedOrderIds={selection.selectedOrderIds}
          allCurrentSelected={selection.allCurrentSelected}
          someCurrentSelected={selection.someCurrentSelected}
          hasFilters={filters.hasActiveFilters}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectOrder={selection.toggleSelectOrder}
          onStatusChange={handleStatusChange}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onFollowUp={handleFollowUpClick}
          onViewDetail={handleViewDetail}
          onAddFirst={handleNewOrder}
          onClearFilters={filters.clearFilters}
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          selectedCount={selection.selectedOrderIds.length}
          onPageChange={pagination.setCurrentPage}
          disabled={loading}
        />
      </div>

      {/* Lazy Loaded Dialogs */}
      <Suspense fallback={<DialogLoader />}>
        {showBulkDeleteDialog && (
          <BulkDeleteDialog
            isOpen={showBulkDeleteDialog}
            onClose={() => setShowBulkDeleteDialog(false)}
            onConfirm={handleBulkDelete}
            selectedOrders={selection.getSelectedOrders(filters.filteredOrders)}
            selectedCount={selection.selectedOrderIds.length}
          />
        )}
      </Suspense>

      <Suspense fallback={<DialogLoader />}>
        {showBulkEditDialog && (
          <BulkEditDialog
            isOpen={showBulkEditDialog}
            onClose={() => setShowBulkEditDialog(false)}
            onConfirm={handleBulkEdit}
            selectedOrders={selection.getSelectedOrders(filters.filteredOrders)}
            selectedCount={selection.selectedOrderIds.length}
          />
        )}
      </Suspense>

      <Suspense fallback={<DialogLoader />}>
        {showOrderForm && (
          <OrderForm
            open={showOrderForm}
            onOpenChange={setShowOrderForm}
            onSubmit={handleSubmitOrder}
            initialData={editingOrder}
          />
        )}
      </Suspense>

      <Suspense fallback={<DialogLoader />}>
        {showTemplateManager && (
          <FollowUpTemplateManager
            isOpen={showTemplateManager}
            onClose={() => setShowTemplateManager(false)}
            order={selectedOrderForTemplate}
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}
      </Suspense>
    </div>
  );
};

export default OrdersPage;