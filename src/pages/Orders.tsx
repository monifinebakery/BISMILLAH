// src/pages/OrdersPage.tsx
// 🏠 SIMPLIFIED ORDERS PAGE - Using Modular Components & Hooks

import React, { useState, Component } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// 🎯 Order Components & Hooks
import {
  OrdersHeader,
  OrdersFilters, 
  OrdersBulkActions,
  useOrdersFilters,
  useOrdersPagination,
  useOrdersBulkActions,
  type OrderStats
} from '@/components/orders';

// 🧩 Remaining Components (to be created in next steps)
import OrdersTable from '@/components/orders/OrdersTable';
import OrdersPagination from '@/components/orders/OrdersPagination';
import BulkDeleteDialog from '@/components/dialogs/BulkDeleteDialog';
import BulkEditDialog from '@/components/dialogs/BulkEditDialog';

// 🎨 UI Components
import OrderForm from '@/components/OrderForm';
import FollowUpTemplateManager from '@/components/FollowUpTemplateManager';

// 🔧 Context & Types
import { useOrder } from '@/contexts/OrderContext';
import type { Order, NewOrder } from '@/types/order';

// 🛡️ Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('OrdersPage ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Terjadi Kesalahan</h2>
              <p className="text-gray-600 mb-4">
                Halaman tidak dapat dimuat dengan benar. Silakan refresh halaman.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Refresh Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 🏠 Main OrdersPage Component
const OrdersPage: React.FC = () => {
  // 🔧 Order Context
  const contextValue = useOrder();
  const {
    orders = [],
    loading = false,
    addOrder = () => Promise.resolve(false),
    updateOrder = () => Promise.resolve(false),
    deleteOrder = () => Promise.resolve(false)
  } = contextValue || {};

  // 🎣 Custom Hooks
  const filtersHook = useOrdersFilters(orders);
  const paginationHook = useOrdersPagination(filtersHook.filteredOrders, { 
    defaultItemsPerPage: 10,
    autoResetOnFilterChange: true 
  });
  const bulkActionsHook = useOrdersBulkActions({
    maxPreviewItems: 5,
    autoExitModeOnClear: true
  });

  // 🎯 Modal States
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedOrderForTemplate, setSelectedOrderForTemplate] = useState<Order | null>(null);

  // 🎯 Bulk Dialog States
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditStatus, setBulkEditStatus] = useState<string>('');

  // 📊 Calculate Stats (mocked for now - implement based on your data)
  const orderStats: OrderStats = React.useMemo(() => ({
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    todayOrders: orders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.tanggal || '').toDateString() === today;
    }).length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalPesanan || 0), 0),
    averageOrderValue: orders.length > 0 
      ? orders.reduce((sum, o) => sum + (o.totalPesanan || 0), 0) / orders.length 
      : 0
  }), [orders]);

  // 🎯 Event Handlers
  const handleNewOrder = () => {
    setEditingOrder(null);
    setShowOrderForm(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const handleSubmitOrder = async (data: Partial<Order> | Partial<NewOrder>) => {
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
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Remove from selection if selected
      if (bulkActionsHook.isOrderSelected(orderId)) {
        bulkActionsHook.deselectOrder(orderId);
      }
      
      const success = await deleteOrder(orderId);
      if (success) {
        toast.success('Pesanan berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
      console.error('Error deleting order:', error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
      if (success) {
        const order = orders.find(o => o.id === orderId);
        toast.success(`Status pesanan #${order?.nomorPesanan || orderId} diubah.`);
      }
    } catch (error) {
      toast.error('Gagal mengubah status pesanan');
      console.error('Error updating order status:', error);
    }
  };

  const handleFollowUpClick = (order: Order) => {
    setSelectedOrderForTemplate(order);
    setShowTemplateManager(true);
  };

  const handleTemplateManager = () => {
    setSelectedOrderForTemplate(null);
    setShowTemplateManager(true);
  };

  const handleSendWhatsApp = (message: string, order: Order) => {
    console.log('Sending WhatsApp message:', { message, order });
    toast.success('Pesan WhatsApp berhasil dikirim!');
  };

  // 🔧 Bulk Operations
  const handleBulkDelete = async () => {
    if (bulkActionsHook.selectedOrderIds.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }

    const deletePromises = bulkActionsHook.selectedOrderIds.map(id => deleteOrder(id));
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
    bulkActionsHook.clearSelectionAndExitMode();
  };

  const handleBulkEdit = async () => {
    if (bulkActionsHook.selectedOrderIds.length === 0 || !bulkEditStatus) {
      toast.warning('Pilih item dan status yang ingin diubah');
      return;
    }

    const updatePromises = bulkActionsHook.selectedOrderIds.map(id =>
      updateOrder(id, { status: bulkEditStatus as Order['status'] })
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
    setBulkEditStatus('');
    bulkActionsHook.clearSelectionAndExitMode();
  };

  // 🔒 Context Error Guard
  if (!contextValue) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
              <p className="text-gray-600">
                Order Context tidak tersedia. Pastikan komponen ini dibungkus dengan OrderProvider.
              </p>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // 🔄 Loading State
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
              <span className="text-gray-600 font-medium">Memuat data pesanan...</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-8 space-y-6">
        
        {/* 🎯 Header Section */}
        <OrdersHeader
          onNewOrder={handleNewOrder}
          onTemplateManager={handleTemplateManager}
          stats={orderStats}
          loading={loading}
          showStats={true}
        />

        {/* 🔧 Bulk Actions Toolbar */}
        <OrdersBulkActions
          isSelectionMode={bulkActionsHook.isSelectionMode}
          selectedOrderIds={bulkActionsHook.selectedOrderIds}
          totalFilteredItems={filtersHook.filteredOrders.length}
          onToggleSelectionMode={bulkActionsHook.toggleSelectionMode}
          onSelectAll={() => bulkActionsHook.selectAllFiltered(filtersHook.filteredOrders)}
          onClearSelection={bulkActionsHook.clearSelection}
          onBulkEdit={() => setShowBulkEditDialog(true)}
          onBulkDelete={() => setShowBulkDeleteDialog(true)}
          loading={loading}
        />

        {/* 🔍 Filters Section */}
        <OrdersFilters
          {...filtersHook}
          activeFiltersCount={filtersHook.activeFiltersCount}
          filterSummary={filtersHook.filterSummary}
          loading={loading}
          onPageReset={() => paginationHook.setCurrentPage(1)}
        />

        {/* 📊 Orders Table */}
        <OrdersTable
          orders={paginationHook.currentItems}
          loading={loading}
          isSelectionMode={bulkActionsHook.isSelectionMode}
          selectedOrderIds={bulkActionsHook.selectedOrderIds}
          onSelectionChange={bulkActionsHook.setSelectedOrderIds}
          onSelectAllCurrentPage={() => bulkActionsHook.selectAllCurrentPage(paginationHook.currentItems)}
          allCurrentPageSelected={bulkActionsHook.allCurrentPageSelected(paginationHook.currentItems)}
          someCurrentPageSelected={bulkActionsHook.someCurrentPageSelected(paginationHook.currentItems)}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onStatusChange={handleStatusChange}
          onFollowUpClick={handleFollowUpClick}
          hasActiveFilters={filtersHook.hasActiveFilters}
          onNewOrder={handleNewOrder}
        />

        {/* 📄 Pagination */}
        <OrdersPagination
          {...paginationHook}
          selectedCount={bulkActionsHook.selectedCount}
        />

        {/* 🎭 Modals & Dialogs */}
        <OrderForm
          open={showOrderForm}
          onOpenChange={setShowOrderForm}
          onSubmit={handleSubmitOrder}
          initialData={editingOrder}
        />

        <BulkDeleteDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          selectedOrderIds={bulkActionsHook.selectedOrderIds}
          selectedOrders={bulkActionsHook.getSelectedOrders(orders)}
        />

        <BulkEditDialog
          isOpen={showBulkEditDialog}
          onClose={() => setShowBulkEditDialog(false)}
          onConfirm={handleBulkEdit}
          selectedOrderIds={bulkActionsHook.selectedOrderIds}
          selectedOrders={bulkActionsHook.getSelectedOrders(orders)}
          bulkEditStatus={bulkEditStatus}
          onStatusChange={setBulkEditStatus}
        />

        <FollowUpTemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
          order={selectedOrderForTemplate}
          onSendWhatsApp={handleSendWhatsApp}
        />
      </div>
    </ErrorBoundary>
  );
};

export default OrdersPage;