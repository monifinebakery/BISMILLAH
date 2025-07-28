// 🎯 100 lines - Main page dengan semua event handlers asli
import React, { useState, useCallback, Suspense } from 'react';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOrder } from '../context/OrderContext';
import { useOrderUI } from '../hooks/useOrderUI';
import type { Order, NewOrder } from '../types';
import { PageLoading } from './shared/LoadingStates';

// Lazy load heavy components
const OrderTable = React.lazy(() => import('./OrderTable'));
const OrderFilters = React.lazy(() => import('./OrderFilters'));
const OrderControls = React.lazy(() => import('./OrderControls'));
const OrderDialogs = React.lazy(() => import('./OrderDialogs'));

const OrdersPage: React.FC = () => {
  // Get context data
  const contextValue = useOrder();
  const { orders, loading, addOrder, updateOrder, deleteOrder } = contextValue;

  // UI state management dengan logika asli
  const uiState = useOrderUI(orders, 10);

  // Dialog states dari kode asli
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedOrderForTemplate, setSelectedOrderForTemplate] = useState<Order | null>(null);

  // Event handlers dengan semua logika asli
  const handleNewOrder = useCallback(() => {
    try {
      setEditingOrder(null);
      setShowOrderForm(true);
    } catch (error) {
      console.error('Error opening new order form:', error);
      toast.error('Gagal membuka form pesanan baru');
    }
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    try {
      if (!order?.id) {
        toast.error('Data pesanan tidak valid');
        return;
      }
      setEditingOrder(order);
      setShowOrderForm(true);
    } catch (error) {
      console.error('Error opening edit form:', error);
      toast.error('Gagal membuka form edit pesanan');
    }
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    try {
      if (!orderId) {
        toast.error('ID pesanan tidak valid');
        return;
      }

      // Remove from selection jika dipilih - dari kode asli
      if (uiState.selectedOrderIds.includes(orderId)) {
        uiState.toggleSelectOrder(orderId, false);
      }

      const success = await deleteOrder(orderId);
      if (success) {
        toast.success('Pesanan berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
      console.error('Error deleting order:', error);
    }
  }, [deleteOrder, uiState]);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    try {
      if (!orderId || !newStatus) {
        toast.error('Parameter tidak valid');
        return;
      }

      const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
      if (success) {
        const order = orders.find(o => o.id === orderId);
        toast.success(`Status pesanan #${order?.nomorPesanan || orderId} berhasil diubah.`);
      }
    } catch (error) {
      toast.error('Gagal mengubah status pesanan');
      console.error('Error updating status:', error);
    }
  }, [updateOrder, orders]);

  const handleSubmitOrder = useCallback(async (data: Partial<Order> | Partial<NewOrder>) => {
    const isEditingMode = !!editingOrder;
    
    try {
      if (!data) {
        toast.error('Data pesanan tidak valid');
        return;
      }

      let success = false;
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

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header dengan design asli */}
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
            onClick={() => setShowTemplateManager(true)}
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

      {/* Main content dengan lazy loading */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded"></div>}>
        <OrderControls uiState={uiState} loading={loading} />
        <OrderFilters uiState={uiState} loading={loading} />
        <OrderTable
          uiState={uiState}
          loading={loading}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onStatusChange={handleStatusChange}
          onNewOrder={handleNewOrder}
        />
        <OrderDialogs
          showOrderForm={showOrderForm}
          editingOrder={editingOrder}
          showTemplateManager={showTemplateManager}
          selectedOrderForTemplate={selectedOrderForTemplate}
          onSubmitOrder={handleSubmitOrder}
          onCloseOrderForm={() => setShowOrderForm(false)}
          onCloseTemplateManager={() => setShowTemplateManager(false)}
        />
      </Suspense>
    </div>
  );
};

export default OrdersPage;